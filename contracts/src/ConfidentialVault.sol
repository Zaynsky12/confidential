// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ConfidentialCore.sol";

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

/// @title ConfidentialVault — USDC Liquidity Vault for the Confidential Perpetual DEX
/// @notice LPs deposit USDC and receive cVAULT shares. Trading profits/losses flow through this vault.
contract ConfidentialVault {
    // ──────────── State ────────────
    string public constant name = "Confidential Vault Share";
    string public constant symbol = "cVAULT";
    uint8 public constant decimals = 6; // Match USDC

    IERC20 public immutable usdc;
    ConfidentialCore public core;

    uint256 public constant MINIMUM_LIQUIDITY = 1000;

    // ERC-20 share tracking
    uint256 public totalShares;
    mapping(address => uint256) public shares;

    // Lockup tracking
    mapping(address => uint256) public depositTimestamp;
    uint256 public lockupPeriod = 3 days;

    // Vault accounting
    uint256 public totalAssets;       // Total USDC managed by vault
    uint256 public totalBacking;      // USDC currently backing trader positions
    uint256 public performanceFeeBps = 1000; // 10% of vault profit

    // ──────────── Events ────────────
    event Deposit(address indexed user, uint256 amount, uint256 sharesReceived);
    event Withdraw(address indexed user, uint256 amount, uint256 sharesBurned);
    event FeeReceived(uint256 amount);
    event ProfitPaid(address indexed trader, uint256 amount);
    event LossCaptured(address indexed trader, uint256 amount);

    // ──────────── Errors ────────────
    error ZeroAmount();
    error InsufficientShares();
    error LockupNotExpired();
    error InsufficientLiquidity();
    error OnlyTrading();
    error OnlyCore();

    modifier onlyTrading() {
        if (msg.sender != core.trading()) revert OnlyTrading();
        _;
    }

    constructor(address _usdc, address _core) {
        usdc = IERC20(_usdc);
        core = ConfidentialCore(_core);
    }

    // ──────────── LP Functions ────────────

    /// @notice Deposit USDC into the vault and receive cVAULT shares
    function deposit(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();

        // Calculate shares using current exchange rate
        uint256 sharesToMint;
        if (totalShares == 0 || totalAssets == 0) {
            sharesToMint = amount - MINIMUM_LIQUIDITY; 
            totalShares += MINIMUM_LIQUIDITY; // Permanent dead shares
        } else {
            sharesToMint = (amount * totalShares) / totalAssets;
        }

        // Transfer USDC from user
        usdc.transferFrom(msg.sender, address(this), amount);

        // Mint shares
        totalShares += sharesToMint;
        shares[msg.sender] += sharesToMint;
        totalAssets += amount;

        // Reset lockup timer
        depositTimestamp[msg.sender] = block.timestamp;

        emit Deposit(msg.sender, amount, sharesToMint);
    }

    /// @notice Withdraw USDC from the vault by burning cVAULT shares
    function withdraw(uint256 shareAmount) external {
        if (shareAmount == 0) revert ZeroAmount();
        if (shares[msg.sender] < shareAmount) revert InsufficientShares();
        if (block.timestamp < depositTimestamp[msg.sender] + lockupPeriod) revert LockupNotExpired();

        // Calculate USDC amount based on current share price
        uint256 usdcAmount = (shareAmount * totalAssets) / totalShares;

        // Check available liquidity (total - backing)
        uint256 available = totalAssets > totalBacking ? totalAssets - totalBacking : 0;
        if (usdcAmount > available) revert InsufficientLiquidity();

        // Burn shares
        totalShares -= shareAmount;
        shares[msg.sender] -= shareAmount;
        totalAssets -= usdcAmount;

        // Transfer USDC to user
        usdc.transfer(msg.sender, usdcAmount);

        emit Withdraw(msg.sender, usdcAmount, shareAmount);
    }

    // ──────────── Trading Functions (called by Trading contract) ────────────

    /// @notice Reserve USDC as backing for a new position
    function reserveBacking(uint256 amount) external onlyTrading {
        totalBacking += amount;
    }

    /// @notice Release USDC backing when a position is closed
    function releaseBacking(uint256 amount) external onlyTrading {
        totalBacking = totalBacking > amount ? totalBacking - amount : 0;
    }

    /// @notice Pay trader's profit from the vault
    function payProfit(address trader, uint256 amount) external onlyTrading {
        uint256 available = totalAssets > totalBacking ? totalAssets - totalBacking : 0;
        if (amount > available) revert InsufficientLiquidity();

        totalAssets -= amount;
        usdc.transfer(trader, amount);

        emit ProfitPaid(trader, amount);
    }

    /// @notice Capture trader's loss into the vault
    function captureLoss(uint256 amount) external onlyTrading {
        // Loss has already been transferred to the vault by the Trading contract
        totalAssets += amount;

        emit LossCaptured(msg.sender, amount);
    }

    /// @notice Receive trading fees
    function receiveFees(uint256 amount) external {
        // Fee USDC has been transferred to this contract already
        totalAssets += amount;
        emit FeeReceived(amount);
    }

    // ──────────── View Functions ────────────

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
        return block.timestamp >= depositTimestamp[user] + lockupPeriod;
    }
}
