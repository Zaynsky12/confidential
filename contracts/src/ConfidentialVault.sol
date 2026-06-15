// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ConfidentialCore.sol";
import "./ReentrancyGuard.sol";

/// @title IERC20 — Minimal ERC-20 interface
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

/// @title ConfidentialVault V2 — USDC Liquidity Vault for the Confidential Perpetual DEX
/// @notice LPs deposit USDC and receive cVAULT shares. Trading profits/losses flow through this vault.
/// @dev Security: Access control on all state-changing functions, deposit caps, share manipulation protection
contract ConfidentialVault is ReentrancyGuard {
    // ──────────── State ────────────
    string public constant name = "Confidential Vault Share";
    string public constant symbol = "cVAULT";
    uint8 public constant decimals = 6; // Match USDC

    IERC20 public immutable usdc;
    ConfidentialCore public core;

    uint256 public constant MINIMUM_LIQUIDITY = 1000; // Dead shares to prevent share price manipulation

    // ERC-20 share tracking
    uint256 public totalShares;
    mapping(address => uint256) public shares;

    // Lockup tracking
    mapping(address => uint256) public depositTimestamp;
    uint256 public lockupPeriod = 7 days;

    // Vault accounting
    uint256 public totalAssets;       // Total USDC managed by vault
    uint256 public totalBacking;      // USDC currently backing trader positions


    // ── Security: Deposit Caps ──
    uint256 public maxDepositPerUser = 1_000_000 * 1e6; // 1M USDC max per user
    uint256 public maxTotalDeposits = 50_000_000 * 1e6;  // 50M USDC max TVL

    // ── Emergency Controls ──
    bool public emergencyMode;    // Allows instant withdrawal without lockup
    bool public depositsEnabled = true;

    // ──────────── Events ────────────
    event Deposit(address indexed user, uint256 amount, uint256 sharesReceived);
    event Withdraw(address indexed user, uint256 amount, uint256 sharesBurned);
    event FeeReceived(uint256 amount);
    event PositionSettled(address indexed trader, int256 netPnl, uint256 collateral);
    event LiquidationSettled(address indexed trader, address indexed liquidator, uint256 collateral, uint256 reward);
    event EmergencyModeActivated();
    event EmergencyModeDeactivated();

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
        core = ConfidentialCore(_core);
    }

    // ══════════════════════════════════════════════════════════
    //                      LP FUNCTIONS
    // ══════════════════════════════════════════════════════════

    /// @notice Deposit USDC into the vault and receive cVAULT shares
    /// @dev First depositor gets shares minus MINIMUM_LIQUIDITY (anti-manipulation)
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (!depositsEnabled) revert DepositsDisabled();
        if (totalAssets + amount > maxTotalDeposits) revert ExceedsTVLCap();

        // Calculate shares using current exchange rate
        uint256 sharesToMint;
        if (totalShares == 0 || totalAssets == 0) {
            // First deposit: lock MINIMUM_LIQUIDITY shares permanently
            // This prevents share price manipulation via donation attacks
            require(amount > MINIMUM_LIQUIDITY, "First deposit too small");
            sharesToMint = amount - MINIMUM_LIQUIDITY;
            totalShares += MINIMUM_LIQUIDITY; // Permanent dead shares
        } else {
            sharesToMint = (amount * totalShares) / totalAssets;
        }

        require(sharesToMint > 0, "Shares would be zero");

        // Check per-user deposit cap
        uint256 userCurrentValue = totalShares > 0 ? (shares[msg.sender] * totalAssets) / totalShares : 0;
        if (userCurrentValue + amount > maxDepositPerUser) revert ExceedsDepositCap();

        // Transfer USDC from user — check return value
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Mint shares
        totalShares += sharesToMint;
        shares[msg.sender] += sharesToMint;
        totalAssets += amount;

        // Reset lockup timer
        depositTimestamp[msg.sender] = block.timestamp;

        emit Deposit(msg.sender, amount, sharesToMint);
    }

    /// @notice Withdraw USDC from the vault by burning cVAULT shares
    function withdraw(uint256 shareAmount) external nonReentrant {
        if (shareAmount == 0) revert ZeroAmount();
        if (shares[msg.sender] < shareAmount) revert InsufficientShares();

        // Allow instant withdrawal in emergency mode
        if (!emergencyMode) {
            if (block.timestamp < depositTimestamp[msg.sender] + lockupPeriod) revert LockupNotExpired();
        }

        // Calculate USDC amount based on current share price
        uint256 usdcAmount = (shareAmount * totalAssets) / totalShares;

        // Check available liquidity (total - backing)
        uint256 available = totalAssets > totalBacking ? totalAssets - totalBacking : 0;
        if (usdcAmount > available) revert InsufficientLiquidity();

        // Burn shares (Effects before Interactions — CEI pattern)
        totalShares -= shareAmount;
        shares[msg.sender] -= shareAmount;
        totalAssets -= usdcAmount;

        // Transfer USDC to user
        require(usdc.transfer(msg.sender, usdcAmount), "Transfer failed");

        emit Withdraw(msg.sender, usdcAmount, shareAmount);
    }

    // ══════════════════════════════════════════════════════════
    //          TRADING FUNCTIONS (called by Trading contract)
    // ══════════════════════════════════════════════════════════

    /// @notice Reserve USDC as backing for a new position
    function reserveBacking(uint256 amount) external onlyTrading {
        totalBacking += amount;
    }

    /// @notice Settle a closed position — handles profit, loss, and collateral return
    /// @dev Replaces the old payProfit + captureLoss + releaseBacking pattern.
    ///      Collateral is held in escrow (totalBacking) and is NOT part of totalAssets.
    ///      Only actual profit/loss affects totalAssets (LP pool).
    /// @param trader Address of the trader
    /// @param collateral Original collateral amount (held in escrow)
    /// @param netPnl Net PnL after all fees (positive = trader profit, negative = trader loss)
    function settlePosition(address trader, uint256 collateral, int256 netPnl) external onlyTrading {
        // Release collateral from escrow
        totalBacking = totalBacking > collateral ? totalBacking - collateral : 0;

        if (netPnl >= 0) {
            // Trader profits — LP pool pays the profit
            uint256 profit = uint256(netPnl);
            uint256 available = totalAssets > totalBacking ? totalAssets - totalBacking : 0;
            if (profit > available) revert InsufficientLiquidity();

            // Effects (CEI): only subtract profit from LP pool
            totalAssets -= profit;

            // Return collateral + profit to trader
            require(usdc.transfer(trader, collateral + profit), "Transfer failed");
        } else {
            uint256 loss = uint256(-netPnl);

            if (loss >= collateral) {
                // Full loss: all collateral absorbed into LP pool
                totalAssets += collateral;
            } else {
                // Partial loss: loss goes to LP pool, remaining collateral returned
                totalAssets += loss;
                require(usdc.transfer(trader, collateral - loss), "Transfer failed");
            }
        }

        emit PositionSettled(trader, netPnl, collateral);
    }

    /// @notice Settle a liquidation — collateral split between LP pool and liquidator
    /// @param trader Address of the liquidated trader
    /// @param liquidator Address of the liquidator receiving reward
    /// @param collateral Original collateral amount
    /// @param reward Liquidator's reward (percentage of collateral)
    function settleLiquidation(
        address trader,
        address liquidator,
        uint256 collateral,
        uint256 reward
    ) external onlyTrading {
        // Release collateral from escrow
        totalBacking = totalBacking > collateral ? totalBacking - collateral : 0;

        // LP pool receives collateral minus liquidator reward
        uint256 vaultReceives = collateral - reward;
        totalAssets += vaultReceives;

        // Pay liquidator reward directly from collateral
        if (reward > 0) {
            require(usdc.transfer(liquidator, reward), "Transfer failed");
        }

        emit LiquidationSettled(trader, liquidator, collateral, reward);
    }

    /// @notice Distribute closing fee — GMX-style explicit split
    /// @dev After settlePosition, the fee USDC is implicitly in vault (trader paid less/received less).
    ///      Vault's share stays in totalAssets. Treasury/insurance shares are sent out.
    /// @param totalFee Total closing fee to distribute
    function distributeClosingFee(uint256 totalFee) external onlyTrading {
        (uint256 toVault, uint256 toTreasury) = core.getFeeSplit(totalFee);

        // Vault's share: already implicitly in totalAssets, no action needed
        // (settlePosition subtracted netPnl which had fees deducted, so fee stayed in totalAssets)

        // Treasury share: send out from vault
        if (toTreasury > 0) {
            totalAssets -= toTreasury;
            require(usdc.transfer(core.treasury(), toTreasury), "Transfer failed");
        }

        emit FeeReceived(totalFee);
    }

    /// @notice Receive opening trading fees — called by Trading contract
    function receiveFees(uint256 amount) external onlyTrading {
        // Fee USDC has been transferred to this contract by Trading
        totalAssets += amount;
        emit FeeReceived(amount);
    }

    // ══════════════════════════════════════════════════════════
    //                  EMERGENCY CONTROLS
    // ══════════════════════════════════════════════════════════

    /// @notice Enable emergency mode — allows instant withdrawals without lockup
    function enableEmergencyMode() external onlyOwner {
        emergencyMode = true;
        depositsEnabled = false; // Prevent new deposits during emergency
        emit EmergencyModeActivated();
    }

    /// @notice Disable emergency mode — returns to normal operation
    function disableEmergencyMode() external onlyOwner {
        emergencyMode = false;
        depositsEnabled = true;
        emit EmergencyModeDeactivated();
    }

    /// @notice Toggle deposits on/off
    function setDepositsEnabled(bool _enabled) external onlyOwner {
        depositsEnabled = _enabled;
    }

    /// @notice Set deposit caps
    function setDepositCaps(uint256 _perUser, uint256 _total) external onlyOwner {
        maxDepositPerUser = _perUser;
        maxTotalDeposits = _total;
    }

    /// @notice Set lockup period
    function setLockupPeriod(uint256 _seconds) external onlyOwner {
        require(_seconds <= 30 days, "Max 30 days");
        lockupPeriod = _seconds;
    }

    // ══════════════════════════════════════════════════════════
    //                    VIEW FUNCTIONS
    // ══════════════════════════════════════════════════════════

    /// @notice Get the current share price (USDC per share, 6 decimals)
    function sharePrice() external view returns (uint256) {
        if (totalShares == 0) return 1e6; // 1 USDC
        return (totalAssets * 1e6) / totalShares;
    }

    /// @notice Get available liquidity (not backing positions)
    function availableLiquidity() external view returns (uint256) {
        return totalAssets > totalBacking ? totalAssets - totalBacking : 0;
    }

    /// @notice Get vault utilization (basis points)
    function utilization() external view returns (uint256) {
        if (totalAssets == 0) return 0;
        return (totalBacking * 10000) / totalAssets;
    }

    /// @notice Get user's USDC balance based on shares
    function balanceOfUnderlying(address user) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shares[user] * totalAssets) / totalShares;
    }

    /// @notice Check if user can withdraw (lockup expired)
    function canWithdraw(address user) external view returns (bool) {
        if (emergencyMode) return true;
        return block.timestamp >= depositTimestamp[user] + lockupPeriod;
    }
}
