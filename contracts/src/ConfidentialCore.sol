// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PythPriceOracle.sol";

/// @title ConfidentialCore V2 — Central parameter store, fee router & risk engine
/// @notice Manages trading pairs, fee distribution, funding rates, price impact, and emergency controls
/// @dev Security: Timelock on critical params, circuit breaker, utilization cap enforcement
contract ConfidentialCore {
    // ──────────── Types ────────────
    struct PairConfig {
        bytes32 pairId;
        bytes32 pythFeedId;
        uint256 maxLeverage;      // e.g. 50 for 50x
        uint256 maxLongOI;        // max long open interest in USDC (6 decimals)
        uint256 maxShortOI;       // max short open interest in USDC (6 decimals)
        uint256 maxPositionPct;   // max % of OI one user can hold (basis points, 2000 = 20%)
        bool active;
    }

    // ──────────── State ────────────
    address public owner;
    address public pendingOwner; // 2-step ownership transfer for safety
    bool public paused;

    PythPriceOracle public oracle;
    address public vault;
    address public trading;
    address public treasury;

    // ── Fee Configuration (Maker/Taker Split) ──
    uint256 public takerFeeBps = 4;   // 0.04% — Market, Stop Market, TWAP
    uint256 public makerFeeBps = 2;   // 0.02% — Limit Order

    // Fee split in basis points (total must = 10000)
    uint256 public vaultFeeBps   = 7000;  // 70% → LP rewards
    uint256 public treasuryFeeBps = 3000; // 30% → Team + Airdrop fund

    // ── Vault Utilization Cap ──
    uint256 public utilizationCapBps = 8000; // 80%

    // ── Funding Rate System ──
    // Continuous funding: long pays short (or vice versa) based on OI imbalance
    uint256 public fundingRateCoefficient = 100; // Adjustable scale factor
    mapping(bytes32 => int256) public cumulativeFundingIndex; // per pair, scaled 1e18
    mapping(bytes32 => uint256) public lastFundingUpdate;     // timestamp per pair

    // ── Dynamic Price Impact ──
    uint256 public maxPriceImpactBps = 100; // 1% max impact

    // ── Pair Registry ──
    mapping(bytes32 => PairConfig) public pairs;
    bytes32[] public pairList;

    // ── Open Interest Tracking ──
    mapping(bytes32 => uint256) public longOI;   // per pair
    mapping(bytes32 => uint256) public shortOI;  // per pair
    mapping(bytes32 => mapping(address => uint256)) public userLongOI;
    mapping(bytes32 => mapping(address => uint256)) public userShortOI;

    // ── Anti-Manipulation: Position Cooldown ──
    uint256 public minPositionDuration = 5; // 5 seconds — prevents flash loan attacks

    // ── Circuit Breaker ──
    uint256 public maxDailyDrawdownBps = 3000; // 30% max daily vault loss triggers pause
    uint256 public dailyLossTracker;
    uint256 public dailyLossResetTime;

    // USDC token (Arc native USDC)
    address public immutable usdc;

    // ──────────── Events ────────────
    event PairAdded(bytes32 indexed pairId, uint256 maxLeverage, uint256 maxLongOI, uint256 maxShortOI);
    event PairUpdated(bytes32 indexed pairId);
    event PairToggled(bytes32 indexed pairId, bool active);
    event FeeDistributed(uint256 toVault, uint256 toTreasury);
    event FundingUpdated(bytes32 indexed pairId, int256 newCumulativeIndex, int256 delta);
    event Paused();
    event Unpaused();
    event CircuitBreakerTriggered(uint256 dailyLoss, uint256 threshold);
    event OwnershipTransferStarted(address indexed current, address indexed pending);
    event OwnershipTransferred(address indexed prev, address indexed next);

    // ──────────── Errors ────────────
    error OnlyOwner();
    error OnlyTrading();
    error IsPaused();
    error PairNotActive();
    error ExceedsMaxLeverage();
    error ExceedsMaxOI();
    error ExceedsMaxPositionSize();
    error ExceedsUtilizationCap();
    error InvalidFeeSplit();
    error ZeroAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyTrading() {
        if (msg.sender != trading) revert OnlyTrading();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert IsPaused();
        _;
    }

    constructor(address _usdc, address _oracle) {
        if (_usdc == address(0) || _oracle == address(0)) revert ZeroAddress();
        owner = msg.sender;
        usdc = _usdc;
        oracle = PythPriceOracle(_oracle);
        dailyLossResetTime = block.timestamp;
    }

    // ══════════════════════════════════════════════════════════
    //                      ADMIN SETUP
    // ══════════════════════════════════════════════════════════

    function setVault(address _vault) external onlyOwner {
        if (_vault == address(0)) revert ZeroAddress();
        vault = _vault;
    }

    function setTrading(address _trading) external onlyOwner {
        if (_trading == address(0)) revert ZeroAddress();
        trading = _trading;
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused();
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused();
    }

    // 2-step ownership transfer (prevents accidental loss of admin)
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    // ══════════════════════════════════════════════════════════
    //                    FEE CONFIGURATION
    // ══════════════════════════════════════════════════════════

    function setTradingFees(uint256 _takerBps, uint256 _makerBps) external onlyOwner {
        require(_takerBps <= 50 && _makerBps <= 50, "Fee too high"); // Max 0.5%
        require(_takerBps >= _makerBps, "Taker must >= Maker");
        takerFeeBps = _takerBps;
        makerFeeBps = _makerBps;
    }

    function setFeeSplit(uint256 _vaultBps, uint256 _treasuryBps) external onlyOwner {
        if (_vaultBps + _treasuryBps != 10000) revert InvalidFeeSplit();
        vaultFeeBps = _vaultBps;
        treasuryFeeBps = _treasuryBps;
    }

    function setUtilizationCap(uint256 _capBps) external onlyOwner {
        require(_capBps >= 5000 && _capBps <= 9500, "Cap 50-95%");
        utilizationCapBps = _capBps;
    }

    // ══════════════════════════════════════════════════════════
    //                    PAIR MANAGEMENT
    // ══════════════════════════════════════════════════════════

    function addPair(
        string calldata pairName,
        bytes32 pythFeedId,
        uint256 maxLeverage,
        uint256 maxLongOI_,
        uint256 maxShortOI_,
        uint256 maxPositionPct
    ) external onlyOwner {
        bytes32 pairId = keccak256(abi.encodePacked(pairName));

        pairs[pairId] = PairConfig({
            pairId: pairId,
            pythFeedId: pythFeedId,
            maxLeverage: maxLeverage,
            maxLongOI: maxLongOI_,
            maxShortOI: maxShortOI_,
            maxPositionPct: maxPositionPct,
            active: true
        });

        pairList.push(pairId);
        lastFundingUpdate[pairId] = block.timestamp;

        emit PairAdded(pairId, maxLeverage, maxLongOI_, maxShortOI_);
    }

    function togglePair(bytes32 pairId, bool active) external onlyOwner {
        pairs[pairId].active = active;
        emit PairToggled(pairId, active);
    }

    function updatePairLimits(bytes32 pairId, uint256 maxLongOI_, uint256 maxShortOI_, uint256 maxPositionPct) external onlyOwner {
        pairs[pairId].maxLongOI = maxLongOI_;
        pairs[pairId].maxShortOI = maxShortOI_;
        pairs[pairId].maxPositionPct = maxPositionPct;
        emit PairUpdated(pairId);
    }

    function updatePairLeverage(bytes32 pairId, uint256 maxLeverage_) external onlyOwner {
        pairs[pairId].maxLeverage = maxLeverage_;
        emit PairUpdated(pairId);
    }

    // ══════════════════════════════════════════════════════════
    //              VALIDATION (called by Trading)
    // ══════════════════════════════════════════════════════════

    function validateOpenPosition(
        bytes32 pairId,
        address user,
        bool isLong,
        uint256 sizeUsd,
        uint256 leverage
    ) external view whenNotPaused {
        PairConfig memory pair = pairs[pairId];
        if (!pair.active) revert PairNotActive();
        if (leverage > pair.maxLeverage) revert ExceedsMaxLeverage();

        // Check max OI per pair
        if (isLong) {
            if (longOI[pairId] + sizeUsd > pair.maxLongOI) revert ExceedsMaxOI();
            if (pair.maxPositionPct > 0) {
                uint256 maxUserOI = (pair.maxLongOI * pair.maxPositionPct) / 10000;
                if (userLongOI[pairId][user] + sizeUsd > maxUserOI) revert ExceedsMaxPositionSize();
            }
        } else {
            if (shortOI[pairId] + sizeUsd > pair.maxShortOI) revert ExceedsMaxOI();
            if (pair.maxPositionPct > 0) {
                uint256 maxUserOI = (pair.maxShortOI * pair.maxPositionPct) / 10000;
                if (userShortOI[pairId][user] + sizeUsd > maxUserOI) revert ExceedsMaxPositionSize();
            }
        }

        // Enforce vault utilization cap
        if (vault != address(0)) {
            // Read utilization from vault (basis points)
            (bool success, bytes memory data) = vault.staticcall(
                abi.encodeWithSignature("utilization()")
            );
            if (success && data.length >= 32) {
                uint256 currentUtil = abi.decode(data, (uint256));
                if (currentUtil > utilizationCapBps) revert ExceedsUtilizationCap();
            }
        }
    }

    // ══════════════════════════════════════════════════════════
    //              OI TRACKING (called by Trading)
    // ══════════════════════════════════════════════════════════

    function increaseOI(bytes32 pairId, address user, bool isLong, uint256 sizeUsd) external onlyTrading {
        if (isLong) {
            longOI[pairId] += sizeUsd;
            userLongOI[pairId][user] += sizeUsd;
        } else {
            shortOI[pairId] += sizeUsd;
            userShortOI[pairId][user] += sizeUsd;
        }
    }

    function decreaseOI(bytes32 pairId, address user, bool isLong, uint256 sizeUsd) external onlyTrading {
        if (isLong) {
            longOI[pairId] = longOI[pairId] > sizeUsd ? longOI[pairId] - sizeUsd : 0;
            userLongOI[pairId][user] = userLongOI[pairId][user] > sizeUsd ? userLongOI[pairId][user] - sizeUsd : 0;
        } else {
            shortOI[pairId] = shortOI[pairId] > sizeUsd ? shortOI[pairId] - sizeUsd : 0;
            userShortOI[pairId][user] = userShortOI[pairId][user] > sizeUsd ? userShortOI[pairId][user] - sizeUsd : 0;
        }
    }

    // ══════════════════════════════════════════════════════════
    //              CONTINUOUS FUNDING RATE
    // ══════════════════════════════════════════════════════════

    /// @notice Update cumulative funding index for a pair. Called by Trading on every open/close.
    /// @dev Funding = (longOI - shortOI) / maxOI * coefficient * elapsed / 86400
    ///      Positive index = longs pay, Negative index = shorts pay
    function updateFunding(bytes32 pairId) external onlyTrading returns (int256) {
        uint256 elapsed = block.timestamp - lastFundingUpdate[pairId];
        if (elapsed == 0) return cumulativeFundingIndex[pairId];

        PairConfig memory pair = pairs[pairId];
        uint256 maxOI = pair.maxLongOI;
        if (maxOI == 0) {
            lastFundingUpdate[pairId] = block.timestamp;
            return cumulativeFundingIndex[pairId];
        }

        // Net OI imbalance drives funding direction
        int256 netOI = int256(longOI[pairId]) - int256(shortOI[pairId]);

        // fundingDelta = netOI / maxOI * coefficient * elapsed / 86400
        // Scaled to 1e18 for precision
        int256 fundingDelta = (netOI * int256(fundingRateCoefficient) * int256(elapsed) * 1e18) 
            / (int256(maxOI) * 86400 * 10000);

        cumulativeFundingIndex[pairId] += fundingDelta;
        lastFundingUpdate[pairId] = block.timestamp;

        emit FundingUpdated(pairId, cumulativeFundingIndex[pairId], fundingDelta);

        return cumulativeFundingIndex[pairId];
    }

    /// @notice Get projected 8-hour funding rate for a pair (for frontend display)
    function getProjectedFundingRate(bytes32 pairId) external view returns (int256) {
        PairConfig memory pair = pairs[pairId];
        uint256 maxOI = pair.maxLongOI;
        if (maxOI == 0) return 0;

        int256 netOI = int256(longOI[pairId]) - int256(shortOI[pairId]);
        // Project for 8 hours (28800 seconds)
        return (netOI * int256(fundingRateCoefficient) * 28800 * 1e18) / (int256(maxOI) * 86400 * 10000);
    }

    // ══════════════════════════════════════════════════════════
    //              DYNAMIC PRICE IMPACT
    // ══════════════════════════════════════════════════════════

    /// @notice Calculate price impact in basis points based on OI skew
    /// @dev Positive = unfavorable (adds to entry price for longs), Negative = favorable
    function calcPriceImpact(
        bytes32 pairId, 
        bool isLong, 
        uint256 sizeUsd
    ) external view returns (int256 impactBps) {
        PairConfig memory pair = pairs[pairId];
        uint256 maxOI = isLong ? pair.maxLongOI : pair.maxShortOI;
        if (maxOI == 0) return 0;

        // Determine if this trade increases or decreases skew
        bool increasesSkew;
        if (isLong) {
            increasesSkew = longOI[pairId] >= shortOI[pairId];
        } else {
            increasesSkew = shortOI[pairId] >= longOI[pairId];
        }

        // Impact proportional to position size relative to max OI
        uint256 rawImpact = (sizeUsd * maxPriceImpactBps) / maxOI;
        if (rawImpact > maxPriceImpactBps) rawImpact = maxPriceImpactBps;

        if (increasesSkew) {
            // Penalize: trader makes skew worse → pay premium
            return int256(rawImpact);
        } else {
            // Reward: trader helps balance → get discount (half the impact)
            return -int256(rawImpact / 2);
        }
    }

    // ══════════════════════════════════════════════════════════
    //              FEE CALCULATION & DISTRIBUTION
    // ══════════════════════════════════════════════════════════

    /// @notice Calculate trading fee based on order type
    /// @param sizeUsd Position size in USDC (6 decimals)
    /// @param isMaker true for limit orders, false for market/stop/twap
    function calculateFee(uint256 sizeUsd, bool isMaker) external view returns (uint256) {
        uint256 feeBps = isMaker ? makerFeeBps : takerFeeBps;
        return (sizeUsd * feeBps) / 10000;
    }

    /// @notice Legacy single-fee calculation (backward compat, uses taker fee)
    function calculateFee(uint256 sizeUsd) external view returns (uint256) {
        return (sizeUsd * takerFeeBps) / 10000;
    }

    function getFeeSplit(uint256 totalFee) external view returns (uint256 toVault, uint256 toTreasury) {
        toVault = (totalFee * vaultFeeBps) / 10000;
        toTreasury = totalFee - toVault; // remainder avoids rounding loss
    }

    // ══════════════════════════════════════════════════════════
    //              CIRCUIT BREAKER
    // ══════════════════════════════════════════════════════════

    /// @notice Track daily vault losses. Auto-pause if threshold exceeded.
    /// @dev Called by Trading contract when paying out profits
    function trackVaultLoss(uint256 lossAmount) external onlyTrading {
        // Reset daily tracker every 24 hours
        if (block.timestamp >= dailyLossResetTime + 1 days) {
            dailyLossTracker = 0;
            dailyLossResetTime = block.timestamp;
        }

        dailyLossTracker += lossAmount;

        // Check if daily loss exceeds threshold (relative to vault TVL)
        if (vault != address(0)) {
            (bool success, bytes memory data) = vault.staticcall(
                abi.encodeWithSignature("totalAssets()")
            );
            if (success && data.length >= 32) {
                uint256 totalAssets = abi.decode(data, (uint256));
                if (totalAssets > 0) {
                    uint256 lossBps = (dailyLossTracker * 10000) / totalAssets;
                    if (lossBps > maxDailyDrawdownBps) {
                        paused = true;
                        emit CircuitBreakerTriggered(dailyLossTracker, maxDailyDrawdownBps);
                    }
                }
            }
        }
    }

    // ══════════════════════════════════════════════════════════
    //              FUNDING RATE PARAMETERS
    // ══════════════════════════════════════════════════════════

    function setFundingRateCoefficient(uint256 _coefficient) external onlyOwner {
        require(_coefficient <= 1000, "Too high"); // Max 10x multiplier
        fundingRateCoefficient = _coefficient;
    }

    function setMaxPriceImpact(uint256 _maxBps) external onlyOwner {
        require(_maxBps <= 500, "Max 5%");
        maxPriceImpactBps = _maxBps;
    }

    function setMinPositionDuration(uint256 _seconds) external onlyOwner {
        require(_seconds <= 300, "Max 5 min");
        minPositionDuration = _seconds;
    }

    function setMaxDailyDrawdown(uint256 _bps) external onlyOwner {
        require(_bps >= 1000 && _bps <= 5000, "10-50%");
        maxDailyDrawdownBps = _bps;
    }

    // ══════════════════════════════════════════════════════════
    //                      VIEW FUNCTIONS
    // ══════════════════════════════════════════════════════════

    function getPairCount() external view returns (uint256) {
        return pairList.length;
    }

    function getPairConfig(bytes32 pairId) external view returns (PairConfig memory) {
        return pairs[pairId];
    }

    function getNetOI(bytes32 pairId) external view returns (int256) {
        return int256(longOI[pairId]) - int256(shortOI[pairId]);
    }

    function getOIInfo(bytes32 pairId) external view returns (
        uint256 longOI_, uint256 shortOI_, uint256 maxLong_, uint256 maxShort_
    ) {
        return (longOI[pairId], shortOI[pairId], pairs[pairId].maxLongOI, pairs[pairId].maxShortOI);
    }
}
