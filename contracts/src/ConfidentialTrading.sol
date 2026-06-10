// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ConfidentialCore.sol";
import "./ConfidentialVault.sol";
import "./PythPriceOracle.sol";

/// @title IERC20Transfer — Minimal interface for USDC transfers
interface IERC20Transfer {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title ConfidentialTrading — Trading engine for the Confidential Perpetual DEX
/// @notice Handles opening, closing, and liquidating perpetual positions
contract ConfidentialTrading {
    // ──────────── Types ────────────
    struct Position {
        bytes32 pairId;
        address trader;
        bool isLong;
        uint256 sizeUsd;        // Position size in USDC (6 decimals)
        uint256 collateral;     // Margin deposited (6 decimals)
        uint256 entryPrice;     // Entry price (18 decimals)
        uint256 leverage;
        uint256 liquidationPrice; // (18 decimals)
        uint256 openedAt;
        bool isOpen;
    }

    struct PendingOrder {
        bytes32 pairId;
        address trader;
        bool isLong;
        uint256 sizeUsd;
        uint256 collateral;
        uint256 leverage;
        uint256 triggerPrice;   // For limit & stop orders (18 decimals)
        uint8 orderType;        // 0=limit, 1=stop_market
        bool reduceOnly;
        bool isActive;
        uint256 createdAt;
    }

    // ──────────── State ────────────
    ConfidentialCore public core;
    ConfidentialVault public vault;
    PythPriceOracle public oracle;
    IERC20Transfer public immutable usdc;

    // Position storage
    mapping(uint256 => Position) public positions;
    uint256 public nextPositionId;

    // User position tracking
    mapping(address => uint256[]) public userPositions;

    // Pending orders
    mapping(uint256 => PendingOrder) public pendingOrders;
    uint256 public nextOrderId;

    // Liquidation reward (basis points of collateral)
    uint256 public liquidationRewardBps = 500; // 5%

    // ──────────── Events ────────────
    event PositionOpened(uint256 indexed positionId, address indexed trader, bytes32 pairId, bool isLong, uint256 sizeUsd, uint256 entryPrice, uint256 leverage);
    event PositionClosed(uint256 indexed positionId, address indexed trader, uint256 exitPrice, int256 pnl);
    event PositionLiquidated(uint256 indexed positionId, address indexed liquidator, uint256 reward);
    event OrderPlaced(uint256 indexed orderId, address indexed trader, bytes32 pairId, uint8 orderType, uint256 triggerPrice);
    event OrderCancelled(uint256 indexed orderId);
    event OrderExecuted(uint256 indexed orderId, uint256 indexed positionId);

    // ──────────── Errors ────────────
    error InvalidSize();
    error InsufficientCollateral();
    error PositionNotOpen();
    error NotPositionOwner();
    error NotLiquidatable();
    error OrderNotActive();
    error NotOrderOwner();
    error ReduceOnlyViolation();

    constructor(address _usdc, address _core, address _vault, address _oracle) {
        usdc = IERC20Transfer(_usdc);
        core = ConfidentialCore(_core);
        vault = ConfidentialVault(_vault);
        oracle = PythPriceOracle(_oracle);
    }

    // ──────────── Open Position (Market Order) ────────────

    /// @notice Open a new perpetual position at the current oracle price
    function openPosition(
        bytes32 pairId,
        bool isLong,
        uint256 sizeUsd,
        uint256 leverage,
        bytes[] calldata updateData
    ) external payable returns (uint256 positionId) {
        if (updateData.length > 0) {
            oracle.updatePriceFeeds{value: msg.value}(updateData);
        }

        if (sizeUsd == 0) revert InvalidSize();

        // Validate pair, leverage, OI limits
        core.validateOpenPosition(pairId, msg.sender, isLong, sizeUsd, leverage);

        // Get current price from oracle
        (uint256 currentPrice, ) = oracle.getPrice(pairId);

        // Calculate collateral required
        uint256 collateral = sizeUsd / leverage;
        if (collateral == 0) revert InsufficientCollateral();

        // Calculate fee
        uint256 fee = core.calculateFee(sizeUsd);
        uint256 totalRequired = collateral + fee;

        // Transfer USDC from trader
        usdc.transferFrom(msg.sender, address(this), totalRequired);

        // Distribute fee
        _distributeFee(fee);

        // Trading contract holds the collateral
        vault.reserveBacking(collateral);

        // Calculate liquidation price
        uint256 liqPrice = _calcLiqPrice(currentPrice, leverage, isLong);

        // Create position
        positionId = nextPositionId++;
        positions[positionId] = Position({
            pairId: pairId,
            trader: msg.sender,
            isLong: isLong,
            sizeUsd: sizeUsd,
            collateral: collateral,
            entryPrice: currentPrice,
            leverage: leverage,
            liquidationPrice: liqPrice,
            openedAt: block.timestamp,
            isOpen: true
        });

        userPositions[msg.sender].push(positionId);

        // Update OI
        core.increaseOI(pairId, msg.sender, isLong, sizeUsd);

        emit PositionOpened(positionId, msg.sender, pairId, isLong, sizeUsd, currentPrice, leverage);
    }

    // ──────────── Close Position ────────────

    /// @notice Close an open position at the current oracle price
    function closePosition(uint256 positionId, bytes[] calldata updateData) external payable {
        if (updateData.length > 0) {
            oracle.updatePriceFeeds{value: msg.value}(updateData);
        }

        Position storage pos = positions[positionId];
        if (!pos.isOpen) revert PositionNotOpen();
        if (pos.trader != msg.sender) revert NotPositionOwner();

        _closePosition(positionId, pos);
    }

    function _closePosition(uint256 positionId, Position storage pos) internal {
        // Get current price
        (uint256 currentPrice, ) = oracle.getPrice(pos.pairId);

        // Calculate PnL
        int256 pnl = _calcPnl(pos, currentPrice);

        // Calculate closing fee
        uint256 closeFee = core.calculateFee(pos.sizeUsd);

        // Release vault backing
        vault.releaseBacking(pos.collateral);

        // Settle PnL
        if (pnl > 0) {
            // Trader won: vault pays entire profit to Trading contract first
            uint256 profit = uint256(pnl);
            vault.payProfit(address(this), profit);

            if (profit > closeFee) {
                profit -= closeFee;
            } else {
                closeFee = profit;
                profit = 0;
            }
            
            // Return collateral to trader
            usdc.transfer(pos.trader, pos.collateral);
            // Return net profit to trader
            if (profit > 0) {
                usdc.transfer(pos.trader, profit);
            }
            // Distribute the closing fee
            _distributeFee(closeFee);
        } else {
            // Trader lost: loss goes to vault
            uint256 loss = uint256(-pnl);
            
            if (loss >= pos.collateral) {
                // Total loss — vault keeps all collateral
                usdc.transfer(address(vault), pos.collateral);
                vault.captureLoss(pos.collateral);
            } else {
                // Partial loss — return remaining collateral minus fee
                uint256 remaining = pos.collateral - loss;
                if (remaining > closeFee) {
                    remaining -= closeFee;
                    usdc.transfer(address(vault), loss);
                    vault.captureLoss(loss);
                    usdc.transfer(pos.trader, remaining);
                    _distributeFee(closeFee);
                } else {
                    usdc.transfer(address(vault), pos.collateral);
                    vault.captureLoss(pos.collateral);
                }
            }
        }

        // Update OI
        core.decreaseOI(pos.pairId, pos.trader, pos.isLong, pos.sizeUsd);

        // Mark position as closed
        pos.isOpen = false;

        emit PositionClosed(positionId, pos.trader, currentPrice, pnl);
    }

    // ──────────── Liquidation ────────────

    /// @notice Liquidate an undercollateralized position (anyone can call)
    function liquidate(uint256 positionId, bytes[] calldata updateData) external payable {
        if (updateData.length > 0) {
            oracle.updatePriceFeeds{value: msg.value}(updateData);
        }

        Position storage pos = positions[positionId];
        if (!pos.isOpen) revert PositionNotOpen();

        // Get current price
        (uint256 currentPrice, ) = oracle.getPrice(pos.pairId);

        // Check if liquidatable
        bool shouldLiquidate;
        if (pos.isLong) {
            shouldLiquidate = currentPrice <= pos.liquidationPrice;
        } else {
            shouldLiquidate = currentPrice >= pos.liquidationPrice;
        }
        if (!shouldLiquidate) revert NotLiquidatable();

        // Calculate liquidation reward for the caller
        uint256 reward = (pos.collateral * liquidationRewardBps) / 10000;
        uint256 remaining = pos.collateral > reward ? pos.collateral - reward : 0;

        // Release vault backing
        vault.releaseBacking(pos.collateral);

        // Vault captures remaining collateral
        if (remaining > 0) {
            usdc.transfer(address(vault), remaining);
            vault.captureLoss(remaining);
        }

        // Pay reward to liquidator from collateral
        if (reward > 0) {
            usdc.transfer(msg.sender, reward);
        }

        // Update OI
        core.decreaseOI(pos.pairId, pos.trader, pos.isLong, pos.sizeUsd);

        // Mark position as closed
        pos.isOpen = false;

        emit PositionLiquidated(positionId, msg.sender, reward);
    }

    // ──────────── Pending Orders (Limit / Stop) ────────────

    /// @notice Place a pending order (limit or stop market)
    function placeOrder(
        bytes32 pairId,
        bool isLong,
        uint256 sizeUsd,
        uint256 leverage,
        uint256 triggerPrice,
        uint8 orderType,
        bool reduceOnly,
        bytes[] calldata updateData
    ) external payable returns (uint256 orderId) {
        if (updateData.length > 0) {
            oracle.updatePriceFeeds{value: msg.value}(updateData);
        }

        if (sizeUsd == 0) revert InvalidSize();

        // Pre-deposit collateral + fee
        uint256 collateral = sizeUsd / leverage;
        uint256 fee = core.calculateFee(sizeUsd);
        usdc.transferFrom(msg.sender, address(this), collateral + fee);

        orderId = nextOrderId++;
        pendingOrders[orderId] = PendingOrder({
            pairId: pairId,
            trader: msg.sender,
            isLong: isLong,
            sizeUsd: sizeUsd,
            collateral: collateral,
            leverage: leverage,
            triggerPrice: triggerPrice,
            orderType: orderType,
            reduceOnly: reduceOnly,
            isActive: true,
            createdAt: block.timestamp
        });

        emit OrderPlaced(orderId, msg.sender, pairId, orderType, triggerPrice);
    }

    /// @notice Cancel a pending order and refund collateral
    function cancelOrder(uint256 orderId) external {
        PendingOrder storage order = pendingOrders[orderId];
        if (!order.isActive) revert OrderNotActive();
        if (order.trader != msg.sender) revert NotOrderOwner();

        order.isActive = false;

        // Refund collateral + fee
        uint256 fee = core.calculateFee(order.sizeUsd);
        usdc.transfer(msg.sender, order.collateral + fee);

        emit OrderCancelled(orderId);
    }

    /// @notice Execute a pending order (called by keeper/bot)
    function executeOrder(uint256 orderId, bytes[] calldata updateData) external payable {
        if (updateData.length > 0) {
            oracle.updatePriceFeeds{value: msg.value}(updateData);
        }

        PendingOrder storage order = pendingOrders[orderId];
        if (!order.isActive) revert OrderNotActive();

        (uint256 currentPrice, ) = oracle.getPrice(order.pairId);

        // Check trigger conditions
        bool triggered;
        if (order.orderType == 0) {
            // Limit order
            if (order.isLong) {
                triggered = currentPrice <= order.triggerPrice;
            } else {
                triggered = currentPrice >= order.triggerPrice;
            }
        } else {
            // Stop market
            if (order.isLong) {
                triggered = currentPrice >= order.triggerPrice;
            } else {
                triggered = currentPrice <= order.triggerPrice;
            }
        }

        require(triggered, "Order not triggered");

        // Validate
        core.validateOpenPosition(order.pairId, order.trader, order.isLong, order.sizeUsd, order.leverage);

        // Fee already collected — distribute it
        uint256 fee = core.calculateFee(order.sizeUsd);
        _distributeFee(fee);

        // Trading contract holds collateral
        vault.reserveBacking(order.collateral);

        // Calculate liquidation price
        uint256 liqPrice = _calcLiqPrice(currentPrice, order.leverage, order.isLong);

        // Create position
        uint256 positionId = nextPositionId++;
        positions[positionId] = Position({
            pairId: order.pairId,
            trader: order.trader,
            isLong: order.isLong,
            sizeUsd: order.sizeUsd,
            collateral: order.collateral,
            entryPrice: currentPrice,
            leverage: order.leverage,
            liquidationPrice: liqPrice,
            openedAt: block.timestamp,
            isOpen: true
        });

        userPositions[order.trader].push(positionId);

        // Update OI
        core.increaseOI(order.pairId, order.trader, order.isLong, order.sizeUsd);

        // Mark order as executed
        order.isActive = false;

        emit OrderExecuted(orderId, positionId);
        emit PositionOpened(positionId, order.trader, order.pairId, order.isLong, order.sizeUsd, currentPrice, order.leverage);
    }

    // ──────────── Internal Helpers ────────────

    function _calcPnl(Position memory pos, uint256 currentPrice) internal pure returns (int256) {
        if (pos.isLong) {
            // Long PnL = sizeUsd * (currentPrice - entryPrice) / entryPrice
            if (currentPrice >= pos.entryPrice) {
                return int256((pos.sizeUsd * (currentPrice - pos.entryPrice)) / pos.entryPrice);
            } else {
                return -int256((pos.sizeUsd * (pos.entryPrice - currentPrice)) / pos.entryPrice);
            }
        } else {
            // Short PnL = sizeUsd * (entryPrice - currentPrice) / entryPrice
            if (pos.entryPrice >= currentPrice) {
                return int256((pos.sizeUsd * (pos.entryPrice - currentPrice)) / pos.entryPrice);
            } else {
                return -int256((pos.sizeUsd * (currentPrice - pos.entryPrice)) / pos.entryPrice);
            }
        }
    }

    function _calcLiqPrice(uint256 entryPrice, uint256 leverage, bool isLong) internal pure returns (uint256) {
        // Liquidation at 90% collateral loss
        // Long:  liqPrice = entryPrice * (1 - 0.9/leverage)
        // Short: liqPrice = entryPrice * (1 + 0.9/leverage)
        uint256 movePercent = (9000) / leverage; // basis points of price move
        
        if (isLong) {
            return entryPrice - (entryPrice * movePercent) / 10000;
        } else {
            return entryPrice + (entryPrice * movePercent) / 10000;
        }
    }

    function _distributeFee(uint256 fee) internal {
        if (fee == 0) return;

        (uint256 toVault, uint256 toTreasury, uint256 toInsurance) = core.getFeeSplit(fee);

        // Send to vault
        if (toVault > 0) {
            usdc.transfer(address(vault), toVault);
            vault.receiveFees(toVault);
        }

        // Send to treasury
        if (toTreasury > 0) {
            usdc.transfer(core.treasury(), toTreasury);
        }

        // Send to insurance fund
        if (toInsurance > 0) {
            usdc.transfer(core.insuranceFund(), toInsurance);
        }

        emit ConfidentialCore.FeeDistributed(toVault, toTreasury, toInsurance);
    }

    // ──────────── View Functions ────────────

    function getPosition(uint256 positionId) external view returns (Position memory) {
        return positions[positionId];
    }

    function getUserPositionCount(address user) external view returns (uint256) {
        return userPositions[user].length;
    }

    function getUserPositionIds(address user) external view returns (uint256[] memory) {
        return userPositions[user];
    }

    function getPositionPnl(uint256 positionId) external view returns (int256) {
        Position memory pos = positions[positionId];
        if (!pos.isOpen) return 0;
        (uint256 currentPrice, ) = oracle.getPrice(pos.pairId);
        return _calcPnl(pos, currentPrice);
    }
}
