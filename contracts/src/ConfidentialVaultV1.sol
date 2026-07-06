// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ConfidentialCoreV1.sol";
import "./ReentrancyGuard.sol";

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

/// @title ConfidentialVault V1 — Dual Tranche with Epoch Bankruptcy Protection
/// @notice LPs deposit USDC into either Degen (Junior) or Prime (Senior) vault.
contract ConfidentialVaultV1 is ReentrancyGuard {
    // ──────────── State ────────────
    string public constant name = "Confidential Vault Share";
    string public constant symbol = "cVAULT";
    uint8 public constant decimals = 6;

    IERC20 public immutable usdc;
    ConfidentialCoreV1 public core;

    uint256 public constant MINIMUM_LIQUIDITY = 1000;

    // ── Degen Tranche (First Loss, 3x Profit) ──
    uint256 public degenEpoch;
    uint256 public totalDegenShares;
    mapping(uint256 => mapping(address => uint256)) public degenShares;
    uint256 public totalDegenAssets;

    // ── Prime Tranche (Protected, 1x Profit) ──
    uint256 public primeEpoch;
    uint256 public totalPrimeShares;
    mapping(uint256 => mapping(address => uint256)) public primeShares;
    uint256 public totalPrimeAssets;

    // ── Shared Accounting ──
    mapping(address => uint256) public degenDepositTimestamp;
    mapping(address => uint256) public primeDepositTimestamp;
    uint256 public degenLockupPeriod = 2 days;
    uint256 public primeLockupPeriod = 5 days;
    uint256 public totalBacking; 

    // ── Security Caps ──
    uint256 public maxDepositPerUser = 1_000_000 * 1e6;
    uint256 public maxDegenDeposits = 15_000_000 * 1e6; // $15M
    uint256 public maxPrimeDeposits = 35_000_000 * 1e6; // $35M
    uint256 public primeProtectionBps = 7000; // 70% capital protected
    bool public depositsEnabled = true;

    // ──────────── Events ────────────
    event Deposit(address indexed user, uint256 amount, uint256 sharesReceived, bool isDegen);
    event Withdraw(address indexed user, uint256 amount, uint256 sharesBurned, bool isDegen);
    event FeeReceived(uint256 amount);
    event PositionSettled(address indexed trader, int256 netPnl, uint256 collateral);
    event LiquidationSettled(address indexed trader, address indexed liquidator, uint256 collateral, uint256 reward);
    event ProfitCapped(address indexed trader, uint256 requestedProfit, uint256 cappedProfit);
    event AccruedFeesSettled(uint256 amount);
    event CollateralReturned(address indexed trader, uint256 amount);
    event EpochReset(bool isDegen, uint256 newEpoch); // Emitted when a tranche is wiped out

    // ──────────── Errors ────────────
    error ZeroAmount();
    error InsufficientShares();
    error LockupNotExpired();
    error InsufficientLiquidity();
    error OnlyTrading();
    error OnlyOwner();
    error DepositsDisabled();
    error ExceedsDepositCap();
    error ExceedsTVLCap();

    modifier onlyTrading() {
        if (msg.sender != core.trading()) revert OnlyTrading();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != core.owner()) revert OnlyOwner();
        _;
    }

    constructor(address _usdc, address _core) {
        usdc = IERC20(_usdc);
        core = ConfidentialCoreV1(_core);
    }

    // ══════════════════════════════════════════════════════════
    //                      LP FUNCTIONS
    // ══════════════════════════════════════════════════════════

    function deposit(uint256 amount, bool isDegen) external nonReentrant {
        require(!core.paused(), "Protocol paused");
        if (amount == 0) revert ZeroAmount();
        if (!depositsEnabled) revert DepositsDisabled();
        if (isDegen) {
            if (totalDegenAssets + amount > maxDegenDeposits) revert ExceedsTVLCap();
        } else {
            if (totalPrimeAssets + amount > maxPrimeDeposits) revert ExceedsTVLCap();
        }

        uint256 sharesToMint;
        uint256 _totalShares = isDegen ? totalDegenShares : totalPrimeShares;
        uint256 _totalAssets = isDegen ? totalDegenAssets : totalPrimeAssets;
        uint256 currentEpoch = isDegen ? degenEpoch : primeEpoch;

        if (_totalShares == 0 || _totalAssets == 0) {
            require(amount > MINIMUM_LIQUIDITY, "First deposit too small");
            sharesToMint = amount - MINIMUM_LIQUIDITY;
            if (isDegen) totalDegenShares += MINIMUM_LIQUIDITY;
            else totalPrimeShares += MINIMUM_LIQUIDITY;
        } else {
            sharesToMint = (amount * _totalShares) / _totalAssets;
        }

        require(sharesToMint > 0, "Shares would be zero");

        uint256 userCurrentValue = 0;
        if (_totalShares > 0) {
            uint256 uShares = isDegen ? degenShares[currentEpoch][msg.sender] : primeShares[currentEpoch][msg.sender];
            userCurrentValue = (uShares * _totalAssets) / _totalShares;
        }
        if (userCurrentValue + amount > maxDepositPerUser) revert ExceedsDepositCap();

        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        if (isDegen) {
            totalDegenShares += sharesToMint;
            degenShares[degenEpoch][msg.sender] += sharesToMint;
            totalDegenAssets += amount;
        } else {
            totalPrimeShares += sharesToMint;
            primeShares[primeEpoch][msg.sender] += sharesToMint;
            totalPrimeAssets += amount;
        }

        if (isDegen) {
            uint256 oldTs = degenDepositTimestamp[msg.sender];
            if (oldTs == 0 || userCurrentValue == 0) {
                degenDepositTimestamp[msg.sender] = block.timestamp;
            } else {
                degenDepositTimestamp[msg.sender] = ((oldTs * userCurrentValue) + (block.timestamp * amount)) / (userCurrentValue + amount);
            }
        } else {
            uint256 oldTs = primeDepositTimestamp[msg.sender];
            if (oldTs == 0 || userCurrentValue == 0) {
                primeDepositTimestamp[msg.sender] = block.timestamp;
            } else {
                primeDepositTimestamp[msg.sender] = ((oldTs * userCurrentValue) + (block.timestamp * amount)) / (userCurrentValue + amount);
            }
            core.recordPrimeDeposit(amount);
        }
        emit Deposit(msg.sender, amount, sharesToMint, isDegen);
    }

    function withdraw(uint256 shareAmount, bool isDegen, uint256 minUsdcOut) external nonReentrant {
        require(!core.paused(), "Protocol paused");
        if (shareAmount == 0) revert ZeroAmount();
        
        uint256 currentEpoch = isDegen ? degenEpoch : primeEpoch;
        uint256 uShares = isDegen ? degenShares[currentEpoch][msg.sender] : primeShares[currentEpoch][msg.sender];
        if (uShares < shareAmount) revert InsufficientShares();
        
        uint256 requiredLockup = isDegen ? degenLockupPeriod : primeLockupPeriod;
        uint256 depTime = isDegen ? degenDepositTimestamp[msg.sender] : primeDepositTimestamp[msg.sender];
        if (block.timestamp < depTime + requiredLockup) revert LockupNotExpired();

        uint256 _totalShares = isDegen ? totalDegenShares : totalPrimeShares;
        uint256 _totalAssets = isDegen ? totalDegenAssets : totalPrimeAssets;

        uint256 usdcAmount = (shareAmount * _totalAssets) / _totalShares;
        
        uint256 availLiq = availableLiquidity();
        uint256 balance = usdc.balanceOf(address(this));
        uint256 maxAvail = availLiq < balance ? availLiq : balance;

        if (usdcAmount > maxAvail) {
            usdcAmount = maxAvail;
            if (usdcAmount == 0) revert InsufficientLiquidity();
            shareAmount = (usdcAmount * _totalShares + _totalAssets - 1) / _totalAssets;
        }

        if (isDegen) {
            totalDegenShares -= shareAmount;
            degenShares[degenEpoch][msg.sender] -= shareAmount;
            totalDegenAssets -= usdcAmount;
        } else {
            totalPrimeShares -= shareAmount;
            primeShares[primeEpoch][msg.sender] -= shareAmount;
            totalPrimeAssets -= usdcAmount;
            core.recordPrimeWithdrawal(usdcAmount);
        }

        require(usdcAmount >= minUsdcOut, "Slippage exceeded");
        require(usdc.transfer(msg.sender, usdcAmount), "Transfer failed");
        emit Withdraw(msg.sender, usdcAmount, shareAmount, isDegen);
    }

    // ══════════════════════════════════════════════════════════
    //          INTERNAL PROFIT DISTRIBUTION (3x MULTIPLIER)
    // ══════════════════════════════════════════════════════════

    function _distributeProfit(uint256 amount) internal {
        if (amount == 0) return;
        uint256 degenWeight = totalDegenAssets * 3;
        uint256 primeWeight = totalPrimeAssets * 1;
        uint256 totalWeight = degenWeight + primeWeight;

        if (totalWeight > 0) {
            uint256 degenProfit = (amount * degenWeight) / totalWeight;
            uint256 primeProfit = amount - degenProfit;
            totalDegenAssets += degenProfit;
            totalPrimeAssets += primeProfit;
        } else {
            // If both are bankrupt, favor Degen for recovery
            totalDegenAssets += amount;
        }
    }

    // ══════════════════════════════════════════════════════════
    //          TRADING FUNCTIONS (called by Trading contract)
    // ══════════════════════════════════════════════════════════

    function reserveBacking(uint256 amount) external onlyTrading {
        totalBacking += amount;
    }

    function releaseBacking(uint256 amount) external onlyTrading {
        totalBacking = totalBacking > amount ? totalBacking - amount : 0;
    }

    function returnCollateral(address trader, uint256 amount) external onlyTrading {
        require(usdc.transfer(trader, amount), "Transfer failed");
        emit CollateralReturned(trader, amount);
    }

    function settleAccruedFees(uint256 amount) external onlyTrading {
        if (amount == 0) return;
        totalBacking = totalBacking > amount ? totalBacking - amount : 0;
        _distributeProfit(amount);
        emit AccruedFeesSettled(amount);
    }

    function settlePosition(address trader, uint256 collateral, int256 netPnl) external onlyTrading {
        totalBacking = totalBacking > collateral ? totalBacking - collateral : 0;

        if (netPnl >= 0) {
            uint256 profit = uint256(netPnl);
            
            uint256 maxPrimeLiability = (totalPrimeAssets * (10000 - primeProtectionBps)) / 10000;
            uint256 totalAvailable = totalDegenAssets + maxPrimeLiability;

            if (profit > totalAvailable) {
                emit ProfitCapped(trader, profit, totalAvailable);
                profit = totalAvailable;
            }

            // First-Loss hits Degen
            if (profit <= totalDegenAssets) {
                totalDegenAssets -= profit;
                if (totalDegenAssets == 0) {
                    degenEpoch++;
                    totalDegenShares = 0;
                    emit EpochReset(true, degenEpoch);
                }
            } else {
                uint256 remainingLoss = profit - totalDegenAssets;
                totalDegenAssets = 0;
                degenEpoch++;
                totalDegenShares = 0;
                emit EpochReset(true, degenEpoch);
                
                totalPrimeAssets = totalPrimeAssets > remainingLoss ? totalPrimeAssets - remainingLoss : 0;
                if (totalPrimeAssets == 0) {
                    primeEpoch++;
                    totalPrimeShares = 0;
                    emit EpochReset(false, primeEpoch);
                }
                
                // Track loss hitting Prime Vault for Circuit Breaker
                core.trackVaultLoss(remainingLoss);
            }

            // FIX EXPLOIT-2: Solvency safety — ensure Vault has enough USDC
            uint256 payout = collateral + profit;
            uint256 vaultBalance = usdc.balanceOf(address(this));
            if (payout > vaultBalance) {
                payout = vaultBalance; // Emergency cap to prevent revert
            }
            require(usdc.transfer(trader, payout), "Transfer failed");
        } else {
            uint256 loss = uint256(-netPnl);
            uint256 vaultReceives = 0;

            if (loss >= collateral) {
                vaultReceives = collateral;
            } else {
                vaultReceives = loss;
                require(usdc.transfer(trader, collateral - loss), "Transfer failed");
            }

            _distributeProfit(vaultReceives);
        }

        emit PositionSettled(trader, netPnl, collateral);
    }

    function settleLiquidation(
        address trader,
        address liquidator,
        uint256 collateral,
        uint256 reward
    ) external onlyTrading {
        totalBacking = totalBacking > collateral ? totalBacking - collateral : 0;

        // MED-3: Defensive check — reward cannot exceed collateral
        if (reward > collateral) reward = collateral;

        uint256 vaultReceives = collateral - reward;
        _distributeProfit(vaultReceives);

        if (reward > 0) {
            require(usdc.transfer(liquidator, reward), "Transfer failed");
        }

        emit LiquidationSettled(trader, liquidator, collateral, reward);
    }

    /// @notice CRIT-1 FIX: Closing fee is already deducted from netPnl in settlePosition.
    /// This function only handles the treasury split WITHOUT double-deducting totalAssets.
    /// The vault portion is already implicitly absorbed. We must deduct the treasury portion
    /// from totalAssets because we are transferring it out.
    function distributeClosingFee(uint256 totalFee) external onlyTrading {
        (, uint256 toTreasury) = core.getFeeSplit(totalFee);

        // Treasury portion: deduct from accounting and transfer out
        if (toTreasury > 0) {
            _deductProfit(toTreasury);
            require(usdc.transfer(core.treasury(), toTreasury), "Transfer failed");
        }

        emit FeeReceived(totalFee);
    }

    function _deductProfit(uint256 amount) internal {
        if (amount == 0) return;
        uint256 degenWeight = totalDegenAssets * 3;
        uint256 primeWeight = totalPrimeAssets * 1;
        uint256 totalWeight = degenWeight + primeWeight;

        if (totalWeight > 0) {
            uint256 degenDeduct = (amount * degenWeight) / totalWeight;
            uint256 primeDeduct = amount - degenDeduct;
            
            if (totalDegenAssets > degenDeduct) {
                totalDegenAssets -= degenDeduct;
            } else {
                totalDegenAssets = 0;
                degenEpoch++;
                totalDegenShares = 0;
                emit EpochReset(true, degenEpoch);
            }
            
            if (totalPrimeAssets > primeDeduct) {
                totalPrimeAssets -= primeDeduct;
            } else {
                totalPrimeAssets = 0;
                primeEpoch++;
                totalPrimeShares = 0;
                emit EpochReset(false, primeEpoch);
            }
        } else {
            if (totalDegenAssets > amount) {
                totalDegenAssets -= amount;
            } else {
                totalDegenAssets = 0;
                degenEpoch++;
                totalDegenShares = 0;
                emit EpochReset(true, degenEpoch);
            }
        }
    }

    function receiveFees(uint256 amount) external onlyTrading {
        _distributeProfit(amount);
        emit FeeReceived(amount);
    }

    /// @notice CRIT-2 FIX: Pay funding reward to a position by increasing vault backing.
    /// @dev Called by Trading contract when a trader earns negative funding.
    ///      Vault pays the reward from LP assets (loss to LPs, gain to trader).
    function payFundingReward(uint256 amount) external onlyTrading returns (uint256) {
        if (amount == 0) return 0;
        
        uint256 maxPrimeLiability = (totalPrimeAssets * (10000 - primeProtectionBps)) / 10000;
        uint256 totalAvailable = totalDegenAssets + maxPrimeLiability;
        
        if (amount > totalAvailable) {
            emit ProfitCapped(msg.sender, amount, totalAvailable);
            amount = totalAvailable;
        }

        // Deduct from LP assets using first-loss waterfall (same as trader profit)
        if (amount <= totalDegenAssets) {
            totalDegenAssets -= amount;
        } else {
            uint256 remainingLoss = amount - totalDegenAssets;
            totalDegenAssets = 0;
            degenEpoch++;
            totalDegenShares = 0;
            emit EpochReset(true, degenEpoch);
            
            totalPrimeAssets = totalPrimeAssets > remainingLoss ? totalPrimeAssets - remainingLoss : 0;
            core.trackVaultLoss(remainingLoss);

            if (totalPrimeAssets == 0) {
                primeEpoch++;
                totalPrimeShares = 0;
                emit EpochReset(false, primeEpoch);
            }
        }
        
        // Increase backing to account for the reward now owed to the position
        totalBacking += amount;
        return amount;
    }

    // ══════════════════════════════════════════════════════════
    //                  ADMIN CONTROLS
    // ══════════════════════════════════════════════════════════

    function toggleDeposits(bool _enabled) external onlyOwner {
        depositsEnabled = _enabled;
    }

    function setDepositCaps(uint256 _perUser, uint256 _degenTotal, uint256 _primeTotal) external onlyOwner {
        maxDepositPerUser = _perUser;
        maxDegenDeposits = _degenTotal;
        maxPrimeDeposits = _primeTotal;
    }

    function setPrimeProtection(uint256 _bps) external onlyOwner {
        require(_bps <= 10000, "Max 100%");
        primeProtectionBps = _bps;
    }

    function setTieredLockups(uint256 _degenSeconds, uint256 _primeSeconds) external onlyOwner {
        require(_degenSeconds <= 30 days && _primeSeconds <= 30 days, "Max 30 days");
        degenLockupPeriod = _degenSeconds;
        primeLockupPeriod = _primeSeconds;
    }

    // ══════════════════════════════════════════════════════════
    //                    VIEW FUNCTIONS
    // ══════════════════════════════════════════════════════════

    function degenSharePrice() external view returns (uint256) {
        if (totalDegenShares == 0) return 1e6;
        return (totalDegenAssets * 1e6) / totalDegenShares;
    }

    function primeSharePrice() external view returns (uint256) {
        if (totalPrimeShares == 0) return 1e6;
        return (totalPrimeAssets * 1e6) / totalPrimeShares;
    }

    function totalAssets() external view returns (uint256) {
        return totalDegenAssets + totalPrimeAssets;
    }

    function availableLiquidity() public view returns (uint256) {
        uint256 _totalAssets = totalDegenAssets + totalPrimeAssets;
        return _totalAssets > totalBacking ? _totalAssets - totalBacking : 0;
    }

    function utilization() external view returns (uint256) {
        uint256 _totalAssets = totalDegenAssets + totalPrimeAssets;
        if (_totalAssets == 0) return 0;
        return (totalBacking * 10000) / _totalAssets;
    }

    function sharesOf(address user, bool isDegen) external view returns (uint256) {
        if (isDegen) {
            return degenShares[degenEpoch][user];
        } else {
            return primeShares[primeEpoch][user];
        }
    }

    function balanceOfUnderlying(address user, bool isDegen) external view returns (uint256) {
        if (isDegen) {
            if (totalDegenShares == 0) return 0;
            return (degenShares[degenEpoch][user] * totalDegenAssets) / totalDegenShares;
        } else {
            if (totalPrimeShares == 0) return 0;
            return (primeShares[primeEpoch][user] * totalPrimeAssets) / totalPrimeShares;
        }
    }

    function canWithdraw(address user, bool isDegen) external view returns (bool) {
        uint256 requiredLockup = isDegen ? degenLockupPeriod : primeLockupPeriod;
        uint256 depTime = isDegen ? degenDepositTimestamp[user] : primeDepositTimestamp[user];
        return block.timestamp >= depTime + requiredLockup;
    }
}
