// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PythPriceOracle.sol";

/// @title ConfidentialCore — Central parameter store & fee router
/// @notice Manages trading pairs, fee distribution, and emergency controls
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
    bool public paused;

    PythPriceOracle public oracle;
    address public vault;
    address public trading;
    address public treasury;
    address public insuranceFund;

    // Fee split in basis points (total must = 10000)
    uint256 public vaultFeeBps   = 6000;  // 60%
    uint256 public treasuryFeeBps = 2500; // 25%
    uint256 public insuranceFeeBps = 1500; // 15%

    // Trading fee: 0.04% = 4 bps
    uint256 public tradingFeeBps = 4;

    // Vault utilization cap (basis points, 8000 = 80%)
    uint256 public utilizationCapBps = 8000;

    // Pair registry
    mapping(bytes32 => PairConfig) public pairs;
    bytes32[] public pairList;

    // Current open interest tracking
    mapping(bytes32 => uint256) public longOI;   // per pair
    mapping(bytes32 => uint256) public shortOI;  // per pair
    mapping(bytes32 => mapping(address => uint256)) public userLongOI;  // per pair per user
    mapping(bytes32 => mapping(address => uint256)) public userShortOI; // per pair per user

    // USDC token (Arc native USDC)
    address public immutable usdc;

    // ──────────── Events ────────────
    event PairAdded(bytes32 indexed pairId, uint256 maxLeverage, uint256 maxLongOI, uint256 maxShortOI);
    event PairUpdated(bytes32 indexed pairId);
    event PairToggled(bytes32 indexed pairId, bool active);
    event FeeDistributed(uint256 toVault, uint256 toTreasury, uint256 toInsurance);
    event Paused();
    event Unpaused();
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
        owner = msg.sender;
        usdc = _usdc;
        oracle = PythPriceOracle(_oracle);
    }

    // ──────────── Admin Setup ────────────

    function setVault(address _vault) external onlyOwner { vault = _vault; }
    function setTrading(address _trading) external onlyOwner { trading = _trading; }
    function setTreasury(address _treasury) external onlyOwner { treasury = _treasury; }
    function setInsuranceFund(address _insuranceFund) external onlyOwner { insuranceFund = _insuranceFund; }

    function pause() external onlyOwner {
        paused = true;
        emit Paused();
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused();
    }

    function transferOwnership(address newOwner) external onlyOwner {
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ──────────── Pair Management ────────────

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

    // ──────────── Validation (called by Trading contract) ────────────

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
            // Check max position per user (20% default)
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
    }

    // ──────────── OI Tracking (called by Trading contract) ────────────

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

    // ──────────── Fee Distribution ────────────

    function calculateFee(uint256 positionSize) external view returns (uint256) {
        return (positionSize * tradingFeeBps) / 10000;
    }

    function getFeeSplit(uint256 totalFee) external view returns (uint256 toVault, uint256 toTreasury, uint256 toInsurance) {
        toVault = (totalFee * vaultFeeBps) / 10000;
        toTreasury = (totalFee * treasuryFeeBps) / 10000;
        toInsurance = totalFee - toVault - toTreasury; // remainder to insurance to avoid rounding loss
    }

    // ──────────── View ────────────

    function getPairCount() external view returns (uint256) {
        return pairList.length;
    }

    function getPairConfig(bytes32 pairId) external view returns (PairConfig memory) {
        return pairs[pairId];
    }
}
