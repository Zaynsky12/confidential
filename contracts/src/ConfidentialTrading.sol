// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IConfidentialCore {
    function validateOpenPosition(bytes32 pairId, address user, bool isLong, uint256 sizeUsd, uint256 leverage) external view;
    function calculateFee(uint256 sizeUsd) external view returns (uint256);
    function increaseOI(bytes32 pairId, address user, bool isLong, uint256 sizeUsd) external;
    function decreaseOI(bytes32 pairId, address user, bool isLong, uint256 sizeUsd) external;
    function getFeeSplit(uint256 totalFee) external view returns (uint256, uint256, uint256);
    function treasury() external view returns (address);
    function insuranceFund() external view returns (address);
    event FeeDistributed(uint256 toVault, uint256 toTreasury, uint256 toInsurance);
}

interface IConfidentialVault {
    function reserveBacking(uint256 amount) external;
    function releaseBacking(uint256 amount) external;
    function payProfit(address trader, uint256 amount) external;
    function captureLoss(uint256 amount) external;
    function receiveFees(uint256 amount) external;
}

interface IPythPriceOracle {
    function updatePriceFeeds(bytes[] calldata updateData) external payable;
    function getPrice(bytes32 feedId) external view returns (uint256 price, uint256 publishTime);
}

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
        uint8 orderType;        // 0=limit, 1=stop_market, 2=market_open, 3=market_close
        bool reduceOnly;
        bool isActive;
        uint256 createdAt;
        uint256 positionId;     // For market close
        uint256 feePaid;        // Pre-paid trading fee
        uint256 executionFee;   // Pre-paid keeper execution fee (msg.value)
    }

    // ──────────── State ────────────
    IConfidentialCore public core;
    IConfidentialVault public vault;
    IPythPriceOracle public oracle;
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
    uint256 public liquidationRewardBps = 100; // 1%

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
        core = IConfidentialCore(_core);
        vault = IConfidentialVault(_vault);
        oracle = IPythPriceOracle(_oracle);
    }

    // ──────────── Open Position Request (2-Step) ────────────

    /// @notice Request to open a market position (executed later by keeper)
    function createOpenRequest(
        bytes32 pairId,
        bool isLong,
        uint256 sizeUsd,
        uint256 leverage
    ) external payable returns (uint256 orderId) {
        if (sizeUsd == 0) revert InvalidSize();
        
        uint256 executionFee = msg.value;
        require(executionFee > 0, "Execution fee required");

        // Validate pair, leverage, OI limits
        core.validateOpenPosition(pairId, msg.sender, isLong, sizeUsd, leverage);

        // Calculate collateral required
        uint256 collateral = sizeUsd / leverage;
        if (collateral == 0) revert InsufficientCollateral();

        // Calculate fee
        uint256 fee = core.calculateFee(sizeUsd);
        uint256 totalRequired = collateral + fee;

        // Transfer USDC from trader
        usdc.transferFrom(msg.sender, address(this), totalRequired);

        orderId = nextOrderId++;
        PendingOrder storage newOrder = pendingOrders[orderId];
        newOrder.pairId = pairId;
        newOrder.trader = msg.sender;
        newOrder.isLong = isLong;
        newOrder.sizeUsd = sizeUsd;
        newOrder.collateral = collateral;
        newOrder.leverage = leverage;
        newOrder.triggerPrice = 0;
        newOrder.orderType = 2; // market_open
        newOrder.reduceOnly = false;
        newOrder.isActive = true;
        newOrder.createdAt = block.timestamp;
        newOrder.positionId = 0;
        newOrder.feePaid = fee;
        newOrder.executionFee = executionFee;

        emit OrderPlaced(orderId, msg.sender, pairId, 2, 0);
    }

    // ──────────── Close Position Request (2-Step) ────────────

    /// @notice Request to close an open position (executed later by keeper)
    function createCloseRequest(
        uint256 positionId
    ) external payable returns (uint256 orderId) {
        Position storage pos = positions[positionId];
        if (!pos.isOpen) revert PositionNotOpen();
        if (pos.trader != msg.sender) revert NotPositionOwner();

        uint256 executionFee = msg.value;
        require(executionFee > 0, "Execution fee required");

        uint256 fee = core.calculateFee(pos.sizeUsd);

        orderId = nextOrderId++;
        PendingOrder storage newOrder = pendingOrders[orderId];
        newOrder.pairId = pos.pairId;
        newOrder.trader = msg.sender;
        newOrder.isLong = pos.isLong;
        newOrder.sizeUsd = pos.sizeUsd;
        newOrder.collateral = 0; // Not used for close
        newOrder.leverage = pos.leverage;
        newOrder.triggerPrice = 0;
        newOrder.orderType = 3; // market_close
        newOrder.reduceOnly = true;
        newOrder.isActive = true;
        newOrder.createdAt = block.timestamp;
        newOrder.positionId = positionId;
        newOrder.feePaid = fee;
        newOrder.executionFee = executionFee;

        emit OrderPlaced(orderId, msg.sender, pos.pairId, 3, 0);
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
        bool reduceOnly
    ) external payable returns (uint256 orderId) {
        if (sizeUsd == 0) revert InvalidSize();
        
        uint256 executionFee = msg.value;
        require(executionFee > 0, "Execution fee required");

        // Pre-deposit collateral + fee
        uint256 collateral = sizeUsd / leverage;
        uint256 fee = core.calculateFee(sizeUsd);
        usdc.transferFrom(msg.sender, address(this), collateral + fee);

        orderId = nextOrderId++;
        PendingOrder storage newOrder = pendingOrders[orderId];
        newOrder.pairId = pairId;
        newOrder.trader = msg.sender;
        newOrder.isLong = isLong;
        newOrder.sizeUsd = sizeUsd;
        newOrder.collateral = collateral;
        newOrder.leverage = leverage;
        newOrder.triggerPrice = triggerPrice;
        newOrder.orderType = orderType;
        newOrder.reduceOnly = reduceOnly;
        newOrder.isActive = true;
        newOrder.createdAt = block.timestamp;
        newOrder.positionId = 0;
        newOrder.feePaid = fee;
        newOrder.executionFee = executionFee;

        emit OrderPlaced(orderId, msg.sender, pairId, orderType, triggerPrice);
    }

    /// @notice Cancel a pending order and refund collateral
    function cancelOrder(uint256 orderId) external {
        PendingOrder storage order = pendingOrders[orderId];
        if (!order.isActive) revert OrderNotActive();
        if (order.trader != msg.sender) revert NotOrderOwner();

        order.isActive = false;

        // Refund collateral + fee
        if (order.orderType != 3) { // Market close doesn't deposit collateral upfront
            usdc.transfer(msg.sender, order.collateral + order.feePaid);
        }
        
        // Refund execution fee
        if (order.executionFee > 0) {
            (bool success, ) = msg.sender.call{value: order.executionFee}("");
            require(success, "Fee refund failed");
        }

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
        if (order.orderType == 0 || order.orderType == 1) {
            bool triggered;
            if (order.orderType == 0) {
                triggered = order.isLong ? (currentPrice <= order.triggerPrice) : (currentPrice >= order.triggerPrice);
            } else {
                triggered = order.isLong ? (currentPrice >= order.triggerPrice) : (currentPrice <= order.triggerPrice);
            }
            require(triggered, "Order not triggered");
            _executeOpen(order, currentPrice, orderId);
        } else if (order.orderType == 2) {
            _executeOpen(order, currentPrice, orderId);
        } else if (order.orderType == 3) {
            _executeClose(order, currentPrice, orderId);
        }

        order.isActive = false;

        // Pay execution fee to keeper
        if (order.executionFee > 0) {
            (bool success, ) = msg.sender.call{value: order.executionFee}("");
            require(success, "Fee transfer failed");
        }
    }

    function _executeOpen(PendingOrder storage order, uint256 currentPrice, uint256 orderId) internal {
        core.validateOpenPosition(order.pairId, order.trader, order.isLong, order.sizeUsd, order.leverage);

        _distributeFee(order.feePaid);
        vault.reserveBacking(order.collateral);

        uint256 liqPrice = _calcLiqPrice(currentPrice, order.leverage, order.isLong);

        uint256 positionId = nextPositionId++;
        Position storage newPos = positions[positionId];
        newPos.pairId = order.pairId;
        newPos.trader = order.trader;
        newPos.isLong = order.isLong;
        newPos.sizeUsd = order.sizeUsd;
        newPos.collateral = order.collateral;
        newPos.entryPrice = currentPrice;
        newPos.leverage = order.leverage;
        newPos.liquidationPrice = liqPrice;
        newPos.openedAt = block.timestamp;
        newPos.isOpen = true;

        userPositions[order.trader].push(positionId);
        core.increaseOI(order.pairId, order.trader, order.isLong, order.sizeUsd);

        emit OrderExecuted(orderId, positionId);
        emit PositionOpened(positionId, order.trader, order.pairId, order.isLong, order.sizeUsd, currentPrice, order.leverage);
    }

    function _executeClose(PendingOrder storage order, uint256 currentPrice, uint256 orderId) internal {
        Position storage pos = positions[order.positionId];
        require(pos.isOpen, "Position not open");

        int256 pnl = _calcPnl(pos, currentPrice);
        uint256 closeFee = order.feePaid;

        vault.releaseBacking(pos.collateral);

        if (pnl > 0) {
            uint256 profit = uint256(pnl);
            vault.payProfit(address(this), profit);

            if (profit > closeFee) {
                profit -= closeFee;
            } else {
                closeFee = profit;
                profit = 0;
            }
            
            usdc.transfer(pos.trader, pos.collateral);
            if (profit > 0) {
                usdc.transfer(pos.trader, profit);
            }
            _distributeFee(closeFee);
        } else {
            uint256 loss = uint256(-pnl);
            
            if (loss >= pos.collateral) {
                usdc.transfer(address(vault), pos.collateral);
                vault.captureLoss(pos.collateral);
            } else {
                uint256 remaining = pos.collateral - loss;
                if (remaining >= closeFee) {
                    remaining -= closeFee;
                    usdc.transfer(address(vault), loss);
                    vault.captureLoss(loss);
                    if (remaining > 0) usdc.transfer(pos.trader, remaining);
                    _distributeFee(closeFee);
                } else {
                    usdc.transfer(address(vault), loss);
                    vault.captureLoss(loss);
                    if (remaining > 0) _distributeFee(remaining);
                }
            }
        }

        core.decreaseOI(pos.pairId, pos.trader, pos.isLong, pos.sizeUsd);
        pos.isOpen = false;

        emit OrderExecuted(orderId, order.positionId);
        emit PositionClosed(order.positionId, pos.trader, currentPrice, pnl);
    }

    // ──────────── Liquidation ────────────

    /// @notice Liquidate an undercollateralized position (anyone can call)
    function liquidate(uint256 positionId, bytes[] calldata updateData) external payable {
        if (updateData.length > 0) {
            oracle.updatePriceFeeds{value: msg.value}(updateData);
        }

        Position storage pos = positions[positionId];
        if (!pos.isOpen) revert PositionNotOpen();

        (uint256 currentPrice, ) = oracle.getPrice(pos.pairId);

        bool shouldLiquidate;
        if (pos.isLong) {
            shouldLiquidate = currentPrice <= pos.liquidationPrice;
        } else {
            shouldLiquidate = currentPrice >= pos.liquidationPrice;
        }
        if (!shouldLiquidate) revert NotLiquidatable();

        uint256 reward = (pos.collateral * liquidationRewardBps) / 10000;
        uint256 maxReward = 50 * 1e6; // 50 USDC max MEV reward limit
        if (reward > maxReward) reward = maxReward;
        
        uint256 remaining = pos.collateral > reward ? pos.collateral - reward : 0;

        vault.releaseBacking(pos.collateral);

        if (remaining > 0) {
            usdc.transfer(address(vault), remaining);
            vault.captureLoss(remaining);
        }

        if (reward > 0) {
            usdc.transfer(msg.sender, reward);
        }

        core.decreaseOI(pos.pairId, pos.trader, pos.isLong, pos.sizeUsd);
        pos.isOpen = false;

        emit PositionLiquidated(positionId, msg.sender, reward);
    }

    // ──────────── Internal Helpers ────────────

    function _calcPnl(Position memory pos, uint256 currentPrice) internal pure returns (int256) {
        if (pos.isLong) {
            if (currentPrice >= pos.entryPrice) {
                return int256((pos.sizeUsd * (currentPrice - pos.entryPrice)) / pos.entryPrice);
            } else {
                return -int256((pos.sizeUsd * (pos.entryPrice - currentPrice)) / pos.entryPrice);
            }
        } else {
            if (pos.entryPrice >= currentPrice) {
                return int256((pos.sizeUsd * (pos.entryPrice - currentPrice)) / pos.entryPrice);
            } else {
                return -int256((pos.sizeUsd * (currentPrice - pos.entryPrice)) / pos.entryPrice);
            }
        }
    }

    function _calcLiqPrice(uint256 entryPrice, uint256 leverage, bool isLong) internal pure returns (uint256) {
        uint256 movePercent = (9000) / leverage; 
        
        if (isLong) {
            return entryPrice - (entryPrice * movePercent) / 10000;
        } else {
            return entryPrice + (entryPrice * movePercent) / 10000;
        }
    }

    function _distributeFee(uint256 fee) internal {
        if (fee == 0) return;

        (uint256 toVault, uint256 toTreasury, uint256 toInsurance) = core.getFeeSplit(fee);

        if (toVault > 0) {
            usdc.transfer(address(vault), toVault);
            vault.receiveFees(toVault);
        }

        if (toTreasury > 0) {
            usdc.transfer(core.treasury(), toTreasury);
        }

        if (toInsurance > 0) {
            usdc.transfer(core.insuranceFund(), toInsurance);
        }

        emit IConfidentialCore.FeeDistributed(toVault, toTreasury, toInsurance);
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
