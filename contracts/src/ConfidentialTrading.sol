// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ConfidentialCore.sol";
import "./ConfidentialVault.sol";
import "./PythPriceOracle.sol";
import "./ReentrancyGuard.sol";

/// @title ConfidentialTrading V2 — Main trading engine
/// @notice Handles order placement, execution (via keepers), and liquidation.
/// @dev Security: CEI pattern used throughout, TWAP support, TP/SL, Continuous Funding, safe ERC20 transfers.
contract ConfidentialTrading is ReentrancyGuard {
    // ──────────── Types ────────────
    struct Position {
        bytes32 pairId;
        address trader;
        bool isLong;
        uint256 sizeUsd;
        uint256 collateral;
        uint256 entryPrice;
        uint256 leverage;
        uint256 liquidationPrice;
        uint256 openedAt;
        bool isOpen;
        uint256 tpPrice;
        uint256 slPrice;
        int256 entryFundingIndex;
        uint256 lastRolloverSettled;
    }

    struct PendingOrder {
        bytes32 pairId;
        address trader;
        bool isLong;
        uint256 sizeUsd;
        uint256 collateral;
        uint256 leverage;
        uint256 triggerPrice;
        uint8 orderType; // 0=limit, 1=stop_market, 2=market_open, 3=market_close, 4=twap
        bool isActive;
        uint256 createdAt;
        uint256 positionId;
        uint256 feePaid;
        uint256 executionFee;
        uint256 tpPrice;
        uint256 slPrice;
        uint256 twapSlices;
        uint256 twapInterval;
        uint256 twapExecuted;
        uint256 twapLastExec;
    }

    // ──────────── State ────────────
    ConfidentialCore public core;
    ConfidentialVault public vault;
    PythPriceOracle public oracle;
    IERC20 public usdc;
    uint256 public nextPositionId = 1;
    uint256 public nextOrderId = 1;

    mapping(uint256 => Position) public positions;
    mapping(uint256 => PendingOrder) public pendingOrders;
    mapping(address => uint256[]) public userPositions;
    mapping(address => uint256[]) public userOrders;

    uint256 public rolloverFeePerHour = 0; // 0% per hour (Zero Borrow Fee like Reya)
    
    // Limits
    uint256 public constant MIN_POSITION_SIZE = 1 * 1e6; // $1 min size
    uint256 public constant MIN_COLLATERAL = 1 * 1e6; // $1 min collateral

    // Liquidation reward: 1% of collateral goes to liquidator
    uint256 public liquidationRewardBps = 100; // 1% in basis points

    // Order expiry
    uint256 public maxOrderAge = 7 days;
    uint256 public executionBufferBps = 30; // 0.3% buffer for Keeper latency

    // Duplicate close request prevention
    mapping(uint256 => bool) public hasActiveCloseRequest;

    // ──────────── Events ────────────
    event OrderPlaced(uint256 indexed orderId, address indexed trader, bytes32 pairId, uint8 orderType, uint256 triggerPrice);
    event OrderCancelled(uint256 indexed orderId);
    event OrderExecuted(uint256 indexed orderId, uint256 indexed positionId);
    event PositionOpened(uint256 indexed positionId, address indexed trader, bytes32 pairId, bool isLong, uint256 sizeUsd, uint256 entryPrice, uint256 leverage);
    event PositionClosed(uint256 indexed positionId, address indexed trader, uint256 exitPrice, int256 pnl);
    event PositionLiquidated(uint256 indexed positionId, address indexed trader, uint256 executionPrice, address indexed liquidator, uint256 reward);
    event TWAPSliceExecuted(uint256 indexed orderId, uint256 sliceNumber, uint256 sizeUsd);
    event TPSLTriggered(uint256 indexed positionId, bool isTakeProfit, uint256 executionPrice);
    event CollateralAdded(uint256 indexed positionId, address indexed trader, uint256 amount, uint256 newLiquidationPrice);
    event CollateralRemoved(uint256 indexed positionId, address indexed trader, uint256 amount, uint256 newLiquidationPrice);
    event PositionIncreased(uint256 indexed positionId, address indexed trader, uint256 additionalSizeUsd, uint256 newEntryPrice, uint256 newLiquidationPrice);
    event PositionPartialClose(uint256 indexed positionId, address indexed trader, uint256 closeSizeUsd, uint256 exitPrice, int256 pnl);

    constructor(address _usdc, address _core, address _vault, address _oracle) {
        usdc = IERC20(_usdc);
        core = ConfidentialCore(_core);
        vault = ConfidentialVault(_vault);
        oracle = PythPriceOracle(_oracle);
    }

    /// @notice Allow the contract to receive ETH (Arc native tokens) for Pyth Oracle refunds
    receive() external payable {}

    // ──────────── Internal Helpers ────────────
    function _safeTransfer(address to, uint256 amount) internal {
        require(usdc.transfer(to, amount), "Transfer failed");
    }

    function _safeTransferFrom(address from, address to, uint256 amount) internal {
        require(usdc.transferFrom(from, to, amount), "TransferFrom failed");
    }

    // ══════════════════════════════════════════════════════════
    //                      ORDER PLACEMENT
    // ══════════════════════════════════════════════════════════

    /// @notice Place a standard order (Market, Limit, Stop Market)
    function placeOrder(
        bytes32 pairId,
        bool isLong,
        uint256 sizeUsd,
        uint256 leverage,
        uint256 triggerPrice,
        uint8 orderType,
        uint256 tpPrice,
        uint256 slPrice
    ) external payable nonReentrant returns (uint256 orderId) {
        require(sizeUsd >= MIN_POSITION_SIZE, "Size too small");
        require(orderType <= 2, "Invalid orderType"); // 0=limit, 1=stop, 2=market

        // Validate TP/SL prices if set
        if (tpPrice > 0) {
            require(isLong ? tpPrice > triggerPrice || orderType == 2 : tpPrice < triggerPrice || orderType == 2, "Invalid TP price");
        }
        if (slPrice > 0) {
            require(isLong ? slPrice < triggerPrice || orderType == 2 : slPrice > triggerPrice || orderType == 2, "Invalid SL price");
        }

        core.validateOpenPosition(pairId, msg.sender, isLong, sizeUsd, leverage);

        bool isMaker = (orderType == 0);
        uint256 fee = core.calculateFee(sizeUsd, isMaker);
        uint256 collateral = sizeUsd / leverage;

        // Take USDC from trader
        _safeTransferFrom(msg.sender, address(this), collateral + fee);

        orderId = nextOrderId++;
        PendingOrder storage o = pendingOrders[orderId];
        o.pairId = pairId;
        o.trader = msg.sender;
        o.isLong = isLong;
        o.sizeUsd = sizeUsd;
        o.collateral = collateral;
        o.leverage = leverage;
        o.triggerPrice = triggerPrice;
        o.orderType = orderType;
        o.isActive = true;
        o.createdAt = block.timestamp;
        o.feePaid = fee;
        o.executionFee = msg.value;
        o.tpPrice = tpPrice;
        o.slPrice = slPrice;

        userOrders[msg.sender].push(orderId);

        emit OrderPlaced(orderId, msg.sender, pairId, orderType, triggerPrice);
    }

    /// @notice Place a Market Order with instant execution using frontend-injected Pyth data
    function placeMarketOrder(
        bytes32 pairId,
        bool isLong,
        uint256 sizeUsd,
        uint256 leverage,
        uint256 tpPrice,
        uint256 slPrice,
        uint256 acceptablePrice,
        bytes[] calldata updateData
    ) external payable nonReentrant returns (uint256 posId) {
        require(sizeUsd >= MIN_POSITION_SIZE, "Size too small");

        if (updateData.length > 0) {
            oracle.updatePriceFeeds{value: msg.value}(updateData);
        }

        // Validate TP/SL prices if set (using current Pyth price instead of trigger)
        (uint256 currentPrice, ) = oracle.getPrice(pairId);
        
        // Slippage Check
        if (acceptablePrice > 0) {
            if (isLong) {
                require(currentPrice <= acceptablePrice, "Slippage exceeded");
            } else {
                require(currentPrice >= acceptablePrice, "Slippage exceeded");
            }
        }

        if (tpPrice > 0) {
            require(isLong ? tpPrice > currentPrice : tpPrice < currentPrice, "Invalid TP price");
        }
        if (slPrice > 0) {
            require(isLong ? slPrice < currentPrice : slPrice > currentPrice, "Invalid SL price");
        }

        core.validateOpenPosition(pairId, msg.sender, isLong, sizeUsd, leverage);

        uint256 fee = core.calculateFee(sizeUsd, false);
        uint256 collateral = sizeUsd / leverage;

        _safeTransferFrom(msg.sender, address(this), collateral + fee);

        // Dummy order struct for _executeOpen
        PendingOrder memory o;
        o.pairId = pairId;
        o.trader = msg.sender;
        o.isLong = isLong;
        o.sizeUsd = sizeUsd;
        o.collateral = collateral;
        o.leverage = leverage;
        o.orderType = 2; // market
        o.isActive = true;
        o.feePaid = fee;
        o.tpPrice = tpPrice;
        o.slPrice = slPrice;

        _executeOpen(o, currentPrice);
        return nextPositionId - 1;
    }

    /// @notice Close a position instantly using frontend-injected Pyth data
    function closePositionInstantly(uint256 positionId, bytes[] calldata updateData) external payable nonReentrant {
        Position storage pos = positions[positionId];
        require(pos.isOpen, "Not open");
        require(pos.trader == msg.sender, "Not owner");
        
        // Cooldown check to prevent flash loan manipulation
        require(block.timestamp >= pos.openedAt + core.minPositionDuration(), "Cooldown active");

        if (updateData.length > 0) {
            oracle.updatePriceFeeds{value: msg.value}(updateData);
        }

        (uint256 currentPrice, ) = oracle.getPrice(pos.pairId);
        
        _executeClose(positionId, currentPrice);
    }

    /// @notice Create a TWAP Order
    function createTwapOrder(
        bytes32 pairId,
        bool isLong,
        uint256 totalSizeUsd,
        uint256 leverage,
        uint256 slices,
        uint256 intervalSec,
        uint256 tpPrice,
        uint256 slPrice
    ) external payable nonReentrant returns (uint256 orderId) {
        require(slices >= 2 && slices <= 100, "Invalid slices");
        require(intervalSec >= 60, "Min 60s interval");
        require(totalSizeUsd >= MIN_POSITION_SIZE * slices, "Slice size too small");
        
        core.validateOpenPosition(pairId, msg.sender, isLong, totalSizeUsd, leverage);

        uint256 collateral = totalSizeUsd / leverage;
        uint256 fee = core.calculateFee(totalSizeUsd, false); // Taker fee
        
        _safeTransferFrom(msg.sender, address(this), collateral + fee);

        orderId = nextOrderId++;
        PendingOrder storage o = pendingOrders[orderId];
        o.pairId = pairId;
        o.trader = msg.sender;
        o.isLong = isLong;
        o.sizeUsd = totalSizeUsd;
        o.collateral = collateral;
        o.leverage = leverage;
        o.orderType = 4; // TWAP
        o.isActive = true;
        o.createdAt = block.timestamp;
        o.feePaid = fee;
        o.executionFee = msg.value;
        o.tpPrice = tpPrice;
        o.slPrice = slPrice;
        o.twapSlices = slices;
        o.twapInterval = intervalSec;

        userOrders[msg.sender].push(orderId);

        emit OrderPlaced(orderId, msg.sender, pairId, 4, 0);
    }

    function createCloseRequest(uint256 positionId) external payable nonReentrant returns (uint256 orderId) {
        Position storage pos = positions[positionId];
        require(pos.isOpen, "Position not open");
        require(pos.trader == msg.sender, "Not owner");
        require(!hasActiveCloseRequest[positionId], "Close request exists");
        
        // Cooldown check to prevent flash loan manipulation
        require(block.timestamp >= pos.openedAt + core.minPositionDuration(), "Cooldown active");

        hasActiveCloseRequest[positionId] = true;

        orderId = nextOrderId++;
        PendingOrder storage o = pendingOrders[orderId];
        o.trader = msg.sender;
        o.orderType = 3; // market_close
        o.isActive = true;
        o.createdAt = block.timestamp;
        o.positionId = positionId;
        o.executionFee = msg.value;

        emit OrderPlaced(orderId, msg.sender, pos.pairId, 3, 0);
    }

    function cancelOrder(uint256 orderId) external nonReentrant {
        PendingOrder storage order = pendingOrders[orderId];
        require(order.isActive, "Not active");
        require(order.trader == msg.sender, "Not owner");

        order.isActive = false;

        // FIX LOW-1: Reset close request flag so trader can create a new one
        if (order.orderType == 3) {
            hasActiveCloseRequest[order.positionId] = false;
        }

        // Refund collateral + fee + execution fee
        if (order.orderType != 3) {
            uint256 remainingCollateral = order.collateral;
            uint256 remainingFee = order.feePaid;
            
            // If TWAP partially executed, refund exact remainder to prevent rounding loss
            if (order.orderType == 4 && order.twapExecuted > 0) {
                uint256 perSliceCol = order.collateral / order.twapSlices;
                uint256 perSliceFee = order.feePaid / order.twapSlices;
                remainingCollateral = order.collateral - (perSliceCol * order.twapExecuted);
                remainingFee = order.feePaid - (perSliceFee * order.twapExecuted);
            }

            if (remainingCollateral + remainingFee > 0) {
                _safeTransfer(msg.sender, remainingCollateral + remainingFee);
            }
        }

        uint256 refundExecutionFee = order.executionFee;
        if (order.orderType == 4 && order.twapExecuted > 0) {
            uint256 perSliceExecFee = order.executionFee / order.twapSlices;
            refundExecutionFee = order.executionFee - (perSliceExecFee * order.twapExecuted);
        }

        if (refundExecutionFee > 0) {
            (bool success, ) = msg.sender.call{value: refundExecutionFee}("");
            require(success, "ETH refund failed");
        }

        emit OrderCancelled(orderId);
    }

    // ══════════════════════════════════════════════════════════
    //                      KEEPER EXECUTION
    // ══════════════════════════════════════════════════════════

    function executeOrder(uint256 orderId, bytes[] calldata updateData) external payable nonReentrant {
        if (updateData.length > 0) {
            oracle.updatePriceFeeds{value: msg.value}(updateData);
        }

        PendingOrder storage order = pendingOrders[orderId];
        require(order.isActive, "Not active");

        // FIX LOW-2: Handle expired orders gracefully — refund and reset flags
        if (block.timestamp > order.createdAt + maxOrderAge) {
            order.isActive = false;
            if (order.orderType == 3) {
                hasActiveCloseRequest[order.positionId] = false;
            }
            // Refund collateral + fee for non-close orders
            if (order.orderType != 3 && order.collateral + order.feePaid > 0) {
                _safeTransfer(order.trader, order.collateral + order.feePaid);
            }
            // Refund execution fee
            if (order.executionFee > 0) {
                (bool success, ) = order.trader.call{value: order.executionFee}("");
                require(success, "ETH refund failed");
            }
            emit OrderCancelled(orderId);
            return;
        }

        (uint256 currentPrice, ) = oracle.getPrice(order.pairId);

        if (order.orderType == 0) { // Limit
            uint256 bufferPrice = order.isLong 
                ? order.triggerPrice + (order.triggerPrice * executionBufferBps / 10000) 
                : order.triggerPrice - (order.triggerPrice * executionBufferBps / 10000);
            
            require(order.isLong ? currentPrice <= bufferPrice : currentPrice >= bufferPrice, "Limit not reached");
            
            uint256 execPrice = order.isLong 
                ? (currentPrice < order.triggerPrice ? currentPrice : order.triggerPrice) 
                : (currentPrice > order.triggerPrice ? currentPrice : order.triggerPrice);
                
            _executeOpen(order, execPrice);
            order.isActive = false;
        } else if (order.orderType == 1) { // Stop
            uint256 bufferPrice = order.isLong 
                ? order.triggerPrice - (order.triggerPrice * executionBufferBps / 10000) 
                : order.triggerPrice + (order.triggerPrice * executionBufferBps / 10000);
                
            require(order.isLong ? currentPrice >= bufferPrice : currentPrice <= bufferPrice, "Stop not reached");
            
            _executeOpen(order, order.triggerPrice);
            order.isActive = false;
        } else if (order.orderType == 2) { // Market Open
            bool slippageOk = order.isLong ? currentPrice <= order.triggerPrice : currentPrice >= order.triggerPrice;
            if (slippageOk || order.triggerPrice == 0) {
                _executeOpen(order, currentPrice);
            } else {
                // Slippage failed, cancel order and refund
                _safeTransfer(order.trader, order.collateral + order.feePaid);
                emit OrderCancelled(orderId);
            }
            order.isActive = false;
        } else if (order.orderType == 3) { // Market Close
            _executeClose(order.positionId, currentPrice);
            hasActiveCloseRequest[order.positionId] = false;
            order.isActive = false;
        } else if (order.orderType == 4) { // TWAP
            require(
                order.twapExecuted == 0 || block.timestamp >= order.twapLastExec + order.twapInterval,
                "TWAP: too early"
            );
            
            // Temporary order struct for the slice — FIX HIGH-2: last slice gets remainder
            PendingOrder memory slice = order;
            if (order.twapExecuted + 1 == order.twapSlices) {
                // Last slice: use remainder to avoid rounding loss
                uint256 perSliceSize = order.sizeUsd / order.twapSlices;
                uint256 perSliceCol = order.collateral / order.twapSlices;
                uint256 perSliceFee = order.feePaid / order.twapSlices;
                slice.sizeUsd = order.sizeUsd - (perSliceSize * order.twapExecuted);
                slice.collateral = order.collateral - (perSliceCol * order.twapExecuted);
                slice.feePaid = order.feePaid - (perSliceFee * order.twapExecuted);
            } else {
                slice.sizeUsd = order.sizeUsd / order.twapSlices;
                slice.collateral = order.collateral / order.twapSlices;
                slice.feePaid = order.feePaid / order.twapSlices;
            }
            
            // FIX EXPLOIT-3: Re-validate OI limits for each TWAP slice
            core.validateOpenPosition(order.pairId, order.trader, order.isLong, slice.sizeUsd, order.leverage);

            _executeOpen(slice, currentPrice);
            
            order.twapExecuted += 1;
            order.twapLastExec = block.timestamp;
            
            emit TWAPSliceExecuted(orderId, order.twapExecuted, slice.sizeUsd);
            
            if (order.twapExecuted >= order.twapSlices) {
                order.isActive = false;
            }
        }

        // Pay keeper fee — for TWAP, pay proportional fee per slice
        if (order.executionFee > 0) {
            uint256 keeperPayout;
            if (order.orderType == 4 && order.twapSlices > 0) {
                // TWAP: pay 1/slices of execution fee per slice
                keeperPayout = order.executionFee / order.twapSlices;
            } else if (!order.isActive) {
                // Non-TWAP: pay full fee when order completes
                keeperPayout = order.executionFee;
            }
            if (keeperPayout > 0) {
                (bool success, ) = msg.sender.call{value: keeperPayout}("");
                require(success, "Keeper fee failed");
            }
        }
        
        if (!order.isActive) {
            emit OrderExecuted(orderId, order.orderType == 3 ? order.positionId : nextPositionId - 1);
        }
    }

    function _executeOpen(PendingOrder memory order, uint256 currentPrice) internal {
        int256 impactBps = core.calcPriceImpact(order.pairId, order.isLong, order.sizeUsd);
        
        uint256 entryPrice = currentPrice;
        if (impactBps > 0) {
            uint256 impactVal = (entryPrice * uint256(impactBps)) / 10000;
            entryPrice = order.isLong ? entryPrice + impactVal : entryPrice - impactVal;
        } else if (impactBps < 0) {
            uint256 impactVal = (entryPrice * uint256(-impactBps)) / 10000;
            entryPrice = order.isLong ? entryPrice - impactVal : entryPrice + impactVal;
        }

        uint256 posId = nextPositionId++;
        Position storage pos = positions[posId];
        pos.pairId = order.pairId;
        pos.trader = order.trader;
        pos.isLong = order.isLong;
        pos.sizeUsd = order.sizeUsd;
        pos.collateral = order.collateral;
        pos.entryPrice = entryPrice;
        pos.leverage = order.leverage;
        pos.liquidationPrice = _calcLiqPrice(entryPrice, order.sizeUsd, order.collateral, order.isLong);
        pos.openedAt = block.timestamp;
        pos.lastRolloverSettled = block.timestamp;
        pos.isOpen = true;
        pos.tpPrice = order.tpPrice;
        pos.slPrice = order.slPrice;
        
        // Settle current funding index
        pos.entryFundingIndex = core.updateFunding(order.pairId);

        core.increaseOI(order.pairId, order.trader, order.isLong, order.sizeUsd);
        
        // Move collateral to Vault
        _safeTransfer(address(vault), order.collateral);
        vault.reserveBacking(order.collateral);

        // Distribute fees
        _distributeFee(order.feePaid);

        userPositions[order.trader].push(posId);

        emit PositionOpened(posId, order.trader, order.pairId, order.isLong, order.sizeUsd, entryPrice, order.leverage);
    }

    function _executeClose(uint256 positionId, uint256 currentPrice) internal {
        Position storage pos = positions[positionId];
        require(pos.isOpen, "Not open");

        // 1. Calculate PnL
        int256 pnl = 0;
        if (pos.isLong) {
            pnl = (int256(currentPrice) - int256(pos.entryPrice)) * int256(pos.sizeUsd) / int256(pos.entryPrice);
        } else {
            pnl = (int256(pos.entryPrice) - int256(currentPrice)) * int256(pos.sizeUsd) / int256(pos.entryPrice);
        }

        // 2. Accrued Fees (Rollover + Funding + Closing Fee)
        uint256 closingFee = core.calculateFee(pos.sizeUsd, false); // taker fee
        uint256 rolloverFee = _calcRolloverFee(pos);
        
        core.updateFunding(pos.pairId);
        int256 fundingFee = _calcFundingFee(pos); // positive means trader pays, negative means trader receives

        int256 totalDeductions = int256(closingFee) + int256(rolloverFee) + fundingFee;
        int256 netPnl = pnl - totalDeductions;

        // 3. Update State (CEI Pattern)
        pos.isOpen = false;
        core.decreaseOI(pos.pairId, pos.trader, pos.isLong, pos.sizeUsd);

        // NOTE: trackVaultLoss is handled internally by vault.settlePosition()
        // when loss spills over from Degen into Prime Vault
        
        // 4. Settle with Vault — one clean call
        vault.settlePosition(pos.trader, pos.collateral, netPnl);

        // 5. Distribute closing fee — skip if loss consumed all collateral
        if (closingFee > 0 && netPnl > -int256(pos.collateral)) {
            vault.distributeClosingFee(closingFee);
        }

        emit PositionClosed(positionId, pos.trader, currentPrice, netPnl);
    }

    // ══════════════════════════════════════════════════════════
    //              TP / SL / LIQUIDATION
    // ══════════════════════════════════════════════════════════

    /// @notice Update TP and SL for an open position
    function updateTpSl(uint256 positionId, uint256 newTpPrice, uint256 newSlPrice) external nonReentrant {
        Position storage pos = positions[positionId];
        require(pos.isOpen, "Not open");
        require(pos.trader == msg.sender, "Not owner");
        
        pos.tpPrice = newTpPrice;
        pos.slPrice = newSlPrice;
    }

    /// @notice Execute Take Profit or Stop Loss for an open position
    function executeTPSL(uint256 positionId, bytes[] calldata updateData) external payable nonReentrant {
        if (updateData.length > 0) {
            oracle.updatePriceFeeds{value: msg.value}(updateData);
        }
        
        Position storage pos = positions[positionId];
        require(pos.isOpen, "Not open");

        // FIX EXPLOIT-4: Enforce cooldown to prevent flash loan TP/SL bypass
        require(block.timestamp >= pos.openedAt + core.minPositionDuration(), "Cooldown active");
        
        (uint256 currentPrice, ) = oracle.getPrice(pos.pairId);
        
        bool isTp = false;
        bool shouldClose = false;
        uint256 executionPrice = currentPrice;
        
        if (pos.tpPrice > 0) {
            uint256 tpBufferLong = pos.tpPrice - (pos.tpPrice * executionBufferBps / 10000);
            uint256 tpBufferShort = pos.tpPrice + (pos.tpPrice * executionBufferBps / 10000);
            
            isTp = pos.isLong ? currentPrice >= tpBufferLong : currentPrice <= tpBufferShort;
            shouldClose = isTp;
            if (shouldClose) executionPrice = pos.tpPrice;
        }
        if (!shouldClose && pos.slPrice > 0) {
            uint256 slBufferLong = pos.slPrice + (pos.slPrice * executionBufferBps / 10000);
            uint256 slBufferShort = pos.slPrice - (pos.slPrice * executionBufferBps / 10000);
            
            shouldClose = pos.isLong ? currentPrice <= slBufferLong : currentPrice >= slBufferShort;
            if (shouldClose) executionPrice = pos.slPrice;
        }
        
        require(shouldClose, "TP/SL not triggered");
        
        emit TPSLTriggered(positionId, isTp, executionPrice);
        _executeClose(positionId, executionPrice);
    }

    function liquidate(uint256 positionId, bytes[] calldata updateData) external payable nonReentrant {
        if (updateData.length > 0) {
            oracle.updatePriceFeeds{value: msg.value}(updateData);
        }

        Position storage pos = positions[positionId];
        require(pos.isOpen, "Not open");

        (uint256 currentPrice, ) = oracle.getPrice(pos.pairId);

        bool isLiquidatable = pos.isLong 
            ? currentPrice <= pos.liquidationPrice 
            : currentPrice >= pos.liquidationPrice;

        require(isLiquidatable, "Not liquidatable");

        // FIX CRITICAL-1: Account for accrued fees before distributing collateral
        uint256 rolloverFee = _calcRolloverFee(pos);
        core.updateFunding(pos.pairId);
        int256 fundingFee = _calcFundingFee(pos);

        uint256 totalAccruedFees = rolloverFee;
        if (fundingFee > 0) totalAccruedFees += uint256(fundingFee);

        uint256 settledFees = totalAccruedFees > pos.collateral ? pos.collateral : totalAccruedFees;
        uint256 effectiveCollateral = pos.collateral - settledFees;

        // Calculate liquidation reward from effective collateral
        uint256 reward = (effectiveCollateral * liquidationRewardBps) / 10000;
        
        // CEI Pattern — update state before transfers
        pos.isOpen = false;
        core.decreaseOI(pos.pairId, pos.trader, pos.isLong, pos.sizeUsd);

        // Settle accrued fees first (fees become LP profit)
        if (settledFees > 0) {
            vault.settleAccruedFees(settledFees);
        }

        // Settle liquidation with effective collateral
        vault.settleLiquidation(pos.trader, msg.sender, effectiveCollateral, reward);

        emit PositionLiquidated(positionId, pos.trader, currentPrice, msg.sender, reward);
    }

    // ══════════════════════════════════════════════════════════
    //              AUTO-DELEVERAGING (ADL)
    // ══════════════════════════════════════════════════════════

    /// @notice Auto-Deleveraging (ADL) execution triggered by Keeper in emergency
    function executeADL(uint256[] calldata positionIds, bytes[] calldata updateData) external payable nonReentrant {
        require(msg.sender == core.keeper(), "Only Keeper can ADL");

        // FIX EXPLOIT-5: ADL only allowed when Vault is in crisis (utilization > 95%)
        require(vault.utilization() > 9500, "ADL only in emergency (util > 95%)");
        if (updateData.length > 0) {
            oracle.updatePriceFeeds{value: msg.value}(updateData);
        }

        for (uint i = 0; i < positionIds.length; i++) {
            Position storage pos = positions[positionIds[i]];
            if (!pos.isOpen) continue;

            (uint256 currentPrice, ) = oracle.getPrice(pos.pairId);

            int256 pnl;
            if (pos.isLong) {
                pnl = (int256(currentPrice) - int256(pos.entryPrice)) * int256(pos.sizeUsd) / int256(pos.entryPrice);
            } else {
                pnl = (int256(pos.entryPrice) - int256(currentPrice)) * int256(pos.sizeUsd) / int256(pos.entryPrice);
            }

            require(pnl > 0, "Cannot ADL a losing position");
            _executeClose(positionIds[i], currentPrice);
        }
    }

    // ══════════════════════════════════════════════════════════
    //                   FEES & HELPERS
    // ══════════════════════════════════════════════════════════

    function _distributeFee(uint256 totalFee) internal {
        (uint256 toVault, uint256 toTreasury) = core.getFeeSplit(totalFee);
        
        if (toVault > 0) {
            _safeTransfer(address(vault), toVault);
            vault.receiveFees(toVault);
        }
        
        if (toTreasury > 0) {
            _safeTransfer(core.treasury(), toTreasury);
        }
    }

    /// @dev Redesigned to use sizeUsd/collateral for precise non-integer leverage support
    function _calcLiqPrice(uint256 entryPrice, uint256 sizeUsd, uint256 collateral, bool isLong) internal view returns (uint256) {
        // Max loss before liq = 90% of collateral
        uint256 maxLoss = (collateral * 9000) / 10000;

        // Estimated fees at liquidation (closing fee + rollover buffer)
        uint256 feeBuffer = core.takerFeeBps() + 10; // bps
        uint256 estimatedFees = (sizeUsd * feeBuffer) / 10000;

        // Net allowable price move in USDC terms
        uint256 netAllowable;
        if (estimatedFees >= maxLoss) {
            netAllowable = (sizeUsd * 100) / 10000; // Minimum 1% of size
        } else {
            netAllowable = maxLoss - estimatedFees;
        }

        if (isLong) {
            return entryPrice - (entryPrice * netAllowable) / sizeUsd;
        } else {
            return entryPrice + (entryPrice * netAllowable) / sizeUsd;
        }
    }

    function _calcRolloverFee(Position memory pos) internal view returns (uint256) {
        uint256 elapsed = block.timestamp - pos.lastRolloverSettled;
        return (pos.sizeUsd * rolloverFeePerHour * elapsed) / (3600 * 1e6);
    }

    function _calcFundingFee(Position memory pos) internal view returns (int256) {
        int256 currentIndex = core.cumulativeFundingIndex(pos.pairId);
        int256 delta = currentIndex - pos.entryFundingIndex;
        
        if (pos.isLong) {
            return (int256(pos.sizeUsd) * delta) / 1e18;
        } else {
            return -(int256(pos.sizeUsd) * delta) / 1e18;
        }
    }

    /// @notice Settle accrued fees on a position and reset tracking timestamps
    /// @dev Used internally by increasePosition to prevent fee exploitation
    function _settleAccruedFees(Position storage pos) internal returns (uint256 totalFees) {
        uint256 rollover = _calcRolloverFee(pos);
        core.updateFunding(pos.pairId);
        int256 funding = _calcFundingFee(pos);

        totalFees = rollover;
        if (funding > 0) totalFees += uint256(funding);

        if (totalFees > 0) {
            require(totalFees < pos.collateral, "Position liquidatable from fees");
            pos.collateral -= totalFees;
            vault.settleAccruedFees(totalFees);
        }

        // Reset tracking
        pos.lastRolloverSettled = block.timestamp;
        pos.entryFundingIndex = core.cumulativeFundingIndex(pos.pairId);
    }

    // ══════════════════════════════════════════════════════════
    //              COLLATERAL MANAGEMENT
    // ══════════════════════════════════════════════════════════

    /// @notice Add collateral to an existing position (lower leverage, move liq price away)
    function addCollateral(uint256 positionId, uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        Position storage pos = positions[positionId];
        require(pos.isOpen, "Not open");
        require(pos.trader == msg.sender, "Not owner");

        // Transfer USDC from trader to Vault
        _safeTransferFrom(msg.sender, address(vault), amount);
        vault.reserveBacking(amount);

        // Update position
        pos.collateral += amount;
        pos.leverage = pos.sizeUsd / pos.collateral;
        pos.liquidationPrice = _calcLiqPrice(pos.entryPrice, pos.sizeUsd, pos.collateral, pos.isLong);

        emit CollateralAdded(positionId, msg.sender, amount, pos.liquidationPrice);
    }

    /// @notice Remove collateral from an existing position (raise leverage, move liq price closer)
    function removeCollateral(uint256 positionId, uint256 amount, bytes[] calldata updateData) external payable nonReentrant {
        require(amount > 0, "Zero amount");
        Position storage pos = positions[positionId];
        require(pos.isOpen, "Not open");
        require(pos.trader == msg.sender, "Not owner");

        // Update oracle
        if (updateData.length > 0) {
            oracle.updatePriceFeeds{value: msg.value}(updateData);
        }

        // CRITICAL: Settle accrued fees BEFORE reducing collateral to prevent fee evasion
        _settleAccruedFees(pos);

        uint256 newCollateral = pos.collateral - amount;
        require(newCollateral >= MIN_COLLATERAL, "Below min collateral");

        // Check new leverage doesn't exceed max
        uint256 newLeverage = pos.sizeUsd / newCollateral;
        ConfidentialCore.PairConfig memory pair = core.getPairConfig(pos.pairId);
        require(newLeverage <= pair.maxLeverage, "Exceeds max leverage");

        // Calculate new liq price and verify it hasn't been breached
        uint256 newLiqPrice = _calcLiqPrice(pos.entryPrice, pos.sizeUsd, newCollateral, pos.isLong);
        (uint256 currentPrice, ) = oracle.getPrice(pos.pairId);
        
        if (pos.isLong) {
            require(currentPrice > newLiqPrice, "Would be liquidatable");
        } else {
            require(currentPrice < newLiqPrice, "Would be liquidatable");
        }

        // Update position (Effects before Interactions)
        pos.collateral = newCollateral;
        pos.leverage = newLeverage;
        pos.liquidationPrice = newLiqPrice;

        // Release backing and return collateral
        vault.releaseBacking(amount);
        vault.returnCollateral(msg.sender, amount);

        emit CollateralRemoved(positionId, msg.sender, amount, newLiqPrice);
    }

    // ══════════════════════════════════════════════════════════
    //              INCREASE POSITION (AVERAGING)
    // ══════════════════════════════════════════════════════════

    /// @notice Add size to an existing position with weighted-average entry price
    /// @dev CRITICAL: Settles accrued fees before merging to prevent fee exploitation
    function increasePosition(
        uint256 positionId,
        uint256 additionalSizeUsd,
        uint256 additionalLeverage,
        uint256 acceptablePrice,
        bytes[] calldata updateData
    ) external payable nonReentrant {
        require(additionalSizeUsd >= MIN_POSITION_SIZE, "Size too small");
        Position storage pos = positions[positionId];
        require(pos.isOpen, "Not open");
        require(pos.trader == msg.sender, "Not owner");

        // Update oracle
        if (updateData.length > 0) {
            oracle.updatePriceFeeds{value: msg.value}(updateData);
        }

        (uint256 currentPrice, ) = oracle.getPrice(pos.pairId);

        // Slippage Check
        if (acceptablePrice > 0) {
            if (pos.isLong) {
                require(currentPrice <= acceptablePrice, "Slippage exceeded");
            } else {
                require(currentPrice >= acceptablePrice, "Slippage exceeded");
            }
        }

        // Validate additional size against OI limits
        core.validateOpenPosition(pos.pairId, msg.sender, pos.isLong, additionalSizeUsd, additionalLeverage);

        uint256 addCollateralAmt = additionalSizeUsd / additionalLeverage;
        uint256 fee = core.calculateFee(additionalSizeUsd, false);

        // Transfer USDC from trader
        _safeTransferFrom(msg.sender, address(this), addCollateralAmt + fee);

        // CRITICAL: Settle accrued fees BEFORE merging to prevent exploitation
        _settleAccruedFees(pos);

        // Calculate price impact on additional size only
        int256 impactBps = core.calcPriceImpact(pos.pairId, pos.isLong, additionalSizeUsd);
        uint256 addEntryPrice = currentPrice;
        if (impactBps > 0) {
            uint256 impactVal = (addEntryPrice * uint256(impactBps)) / 10000;
            addEntryPrice = pos.isLong ? addEntryPrice + impactVal : addEntryPrice - impactVal;
        } else if (impactBps < 0) {
            uint256 impactVal = (addEntryPrice * uint256(-impactBps)) / 10000;
            addEntryPrice = pos.isLong ? addEntryPrice - impactVal : addEntryPrice + impactVal;
        }

        // Harmonic average entry price (size-weighted to prevent PnL manipulation)
        uint256 posBase = (pos.sizeUsd * 1e18) / pos.entryPrice;
        uint256 addBase = (additionalSizeUsd * 1e18) / addEntryPrice;
        uint256 newEntryPrice = ((pos.sizeUsd + additionalSizeUsd) * 1e18) / (posBase + addBase);

        // Update position
        pos.sizeUsd += additionalSizeUsd;
        pos.collateral += addCollateralAmt;
        pos.entryPrice = newEntryPrice;
        pos.leverage = pos.sizeUsd / pos.collateral;
        pos.liquidationPrice = _calcLiqPrice(newEntryPrice, pos.sizeUsd, pos.collateral, pos.isLong);

        // Update OI
        core.increaseOI(pos.pairId, msg.sender, pos.isLong, additionalSizeUsd);

        // Move new collateral to Vault
        _safeTransfer(address(vault), addCollateralAmt);
        vault.reserveBacking(addCollateralAmt);

        // Distribute fee
        _distributeFee(fee);

        emit PositionIncreased(positionId, msg.sender, additionalSizeUsd, newEntryPrice, pos.liquidationPrice);
    }

    // ══════════════════════════════════════════════════════════
    //              PARTIAL CLOSE
    // ══════════════════════════════════════════════════════════

    /// @notice Close a portion of an open position
    /// @param closePercent Percentage to close in basis points (1-10000)
    function closePositionPartial(
        uint256 positionId, 
        uint256 closePercent, 
        bytes[] calldata updateData
    ) external payable nonReentrant {
        require(closePercent > 0 && closePercent <= 10000, "Invalid percent");
        Position storage pos = positions[positionId];
        require(pos.isOpen, "Not open");
        require(pos.trader == msg.sender, "Not owner");
        require(block.timestamp >= pos.openedAt + core.minPositionDuration(), "Cooldown active");

        // Update oracle
        if (updateData.length > 0) {
            oracle.updatePriceFeeds{value: msg.value}(updateData);
        }

        (uint256 currentPrice, ) = oracle.getPrice(pos.pairId);

        // Full close shortcut
        if (closePercent == 10000) {
            _executeClose(positionId, currentPrice);
            return;
        }

        // Calculate proportional amounts for the closed portion
        uint256 closeSizeUsd = (pos.sizeUsd * closePercent) / 10000;
        uint256 closeCollateral = (pos.collateral * closePercent) / 10000;

        // Validate remainder
        uint256 remainSize = pos.sizeUsd - closeSizeUsd;
        uint256 remainCollateral = pos.collateral - closeCollateral;
        require(remainSize >= MIN_POSITION_SIZE, "Remainder too small");
        require(remainCollateral >= MIN_COLLATERAL, "Remainder collateral too small");

        // Calculate PnL for closed portion
        int256 pnl;
        if (pos.isLong) {
            pnl = (int256(currentPrice) - int256(pos.entryPrice)) * int256(closeSizeUsd) / int256(pos.entryPrice);
        } else {
            pnl = (int256(pos.entryPrice) - int256(currentPrice)) * int256(closeSizeUsd) / int256(pos.entryPrice);
        }

        // Proportional fees for closed portion
        uint256 closingFee = core.calculateFee(closeSizeUsd, false);
        uint256 rolloverFee = (closeSizeUsd * rolloverFeePerHour * (block.timestamp - pos.lastRolloverSettled)) / (3600 * 1e6);

        core.updateFunding(pos.pairId);
        int256 fundingDelta = core.cumulativeFundingIndex(pos.pairId) - pos.entryFundingIndex;
        int256 fundingFee;
        if (pos.isLong) {
            fundingFee = (int256(closeSizeUsd) * fundingDelta) / 1e18;
        } else {
            fundingFee = -(int256(closeSizeUsd) * fundingDelta) / 1e18;
        }

        int256 totalDeductions = int256(closingFee) + int256(rolloverFee) + fundingFee;
        int256 netPnl = pnl - totalDeductions;

        // Update state BEFORE transfers (CEI)
        pos.sizeUsd = remainSize;
        pos.collateral = remainCollateral;
        pos.leverage = remainSize / remainCollateral;
        // FIX MEDIUM-3: Reset rollover timestamp to prevent double-charging on remainder
        pos.lastRolloverSettled = block.timestamp;
        pos.liquidationPrice = _calcLiqPrice(pos.entryPrice, remainSize, remainCollateral, pos.isLong);

        core.decreaseOI(pos.pairId, pos.trader, pos.isLong, closeSizeUsd);

        // NOTE: trackVaultLoss is handled internally by vault.settlePosition()
        // when loss spills over from Degen into Prime Vault

        // Settle closed portion with Vault
        vault.settlePosition(pos.trader, closeCollateral, netPnl);

        if (closingFee > 0 && netPnl > -int256(closeCollateral)) {
            vault.distributeClosingFee(closingFee);
        }

        emit PositionPartialClose(positionId, msg.sender, closeSizeUsd, currentPrice, netPnl);
    }

    // ══════════════════════════════════════════════════════════
    //                   ADMIN FUNCTIONS
    // ══════════════════════════════════════════════════════════

    modifier onlyOwner() {
        require(msg.sender == core.owner(), "Not owner");
        _;
    }

    function setRolloverFeePerHour(uint256 _fee) external onlyOwner {
        require(_fee == 0, "Zero borrow fee enforced");
        rolloverFeePerHour = _fee;
    }

    function setLiquidationRewardBps(uint256 _bps) external onlyOwner {
        require(_bps <= 500, "Max 5%");
        liquidationRewardBps = _bps;
    }

    function setMaxOrderAge(uint256 _seconds) external onlyOwner {
        require(_seconds >= 1 hours && _seconds <= 30 days, "1h-30d range");
        maxOrderAge = _seconds;
    }

    function setExecutionBufferBps(uint256 _bps) external onlyOwner {
        require(_bps <= 100, "Max 1% buffer");
        executionBufferBps = _bps;
    }
}
