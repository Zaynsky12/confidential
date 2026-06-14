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
        bool reduceOnly;
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

    uint256 public rolloverFeePerHour = 20; // 0.002% per hour
    
    // Limits
    uint256 public constant MIN_POSITION_SIZE = 10 * 1e6; // $10 min size

    // Liquidation reward: 1% of collateral goes to liquidator
    uint256 public liquidationRewardBps = 100; // 1% in basis points

    // ──────────── Events ────────────
    event OrderPlaced(uint256 indexed orderId, address indexed trader, bytes32 pairId, uint8 orderType, uint256 triggerPrice);
    event OrderCancelled(uint256 indexed orderId);
    event OrderExecuted(uint256 indexed orderId, uint256 indexed positionId);
    event PositionOpened(uint256 indexed positionId, address indexed trader, bytes32 pairId, bool isLong, uint256 sizeUsd, uint256 entryPrice, uint256 leverage);
    event PositionClosed(uint256 indexed positionId, address indexed trader, uint256 exitPrice, int256 pnl);
    event PositionLiquidated(uint256 indexed positionId, address indexed trader, uint256 executionPrice, address indexed liquidator, uint256 reward);
    event TWAPSliceExecuted(uint256 indexed orderId, uint256 sliceNumber, uint256 sizeUsd);
    event TPSLTriggered(uint256 indexed positionId, bool isTakeProfit, uint256 executionPrice);

    constructor(address _usdc, address _core, address _vault, address _oracle) {
        usdc = IERC20(_usdc);
        core = ConfidentialCore(_core);
        vault = ConfidentialVault(_vault);
        oracle = PythPriceOracle(_oracle);
    }

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
        bool reduceOnly,
        uint256 tpPrice,
        uint256 slPrice
    ) external payable nonReentrant returns (uint256 orderId) {
        require(sizeUsd >= MIN_POSITION_SIZE, "Size too small");
        require(orderType <= 2, "Invalid order type"); // 0=limit, 1=stop, 2=market

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
        o.reduceOnly = reduceOnly;
        o.isActive = true;
        o.createdAt = block.timestamp;
        o.feePaid = fee;
        o.executionFee = msg.value;
        o.tpPrice = tpPrice;
        o.slPrice = slPrice;

        userOrders[msg.sender].push(orderId);

        emit OrderPlaced(orderId, msg.sender, pairId, orderType, triggerPrice);
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
        
        // Cooldown check to prevent flash loan manipulation
        require(block.timestamp >= pos.openedAt + core.minPositionDuration(), "Cooldown active");

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

        // Refund collateral + fee + execution fee
        if (order.orderType != 3) {
            uint256 remainingCollateral = order.collateral;
            uint256 remainingFee = order.feePaid;
            
            // If TWAP partially executed, refund remainder
            if (order.orderType == 4 && order.twapExecuted > 0) {
                uint256 slicesLeft = order.twapSlices - order.twapExecuted;
                remainingCollateral = (order.collateral * slicesLeft) / order.twapSlices;
                remainingFee = (order.feePaid * slicesLeft) / order.twapSlices;
            }

            if (remainingCollateral + remainingFee > 0) {
                _safeTransfer(msg.sender, remainingCollateral + remainingFee);
            }
        }

        if (order.executionFee > 0) {
            (bool success, ) = msg.sender.call{value: order.executionFee}("");
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

        (uint256 currentPrice, ) = oracle.getPrice(order.pairId);

        if (order.orderType == 0) { // Limit
            require(order.isLong ? currentPrice <= order.triggerPrice : currentPrice >= order.triggerPrice, "Limit not reached");
            _executeOpen(order, currentPrice, orderId, false);
            order.isActive = false;
        } else if (order.orderType == 1) { // Stop
            require(order.isLong ? currentPrice >= order.triggerPrice : currentPrice <= order.triggerPrice, "Stop not reached");
            _executeOpen(order, currentPrice, orderId, false);
            order.isActive = false;
        } else if (order.orderType == 2) { // Market Open
            bool slippageOk = order.isLong ? currentPrice <= order.triggerPrice : currentPrice >= order.triggerPrice;
            if (slippageOk || order.triggerPrice == 0) {
                _executeOpen(order, currentPrice, orderId, false);
            } else {
                // Slippage failed, cancel order and refund
                _safeTransfer(order.trader, order.collateral + order.feePaid);
                emit OrderCancelled(orderId);
            }
            order.isActive = false;
        } else if (order.orderType == 3) { // Market Close
            _executeClose(order.positionId, currentPrice);
            order.isActive = false;
        } else if (order.orderType == 4) { // TWAP
            require(
                order.twapExecuted == 0 || block.timestamp >= order.twapLastExec + order.twapInterval,
                "TWAP: too early"
            );
            
            // Temporary order struct for the slice
            PendingOrder memory slice = order;
            slice.sizeUsd = order.sizeUsd / order.twapSlices;
            slice.collateral = order.collateral / order.twapSlices;
            slice.feePaid = order.feePaid / order.twapSlices;
            
            _executeOpen(slice, currentPrice, orderId, true);
            
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

    function _executeOpen(PendingOrder memory order, uint256 currentPrice, uint256 orderId, bool isTwapSlice) internal {
        // Calculate dynamic price impact
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
        pos.liquidationPrice = _calcLiqPrice(entryPrice, order.leverage, order.isLong);
        pos.openedAt = block.timestamp;
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
        
        // Track vault loss in circuit breaker (called directly from Trading, NOT Vault)
        // Note: we only track if trader makes a net profit (vault pays out)
        if (netPnl > 0) {
            core.trackVaultLoss(uint256(netPnl));
        }

        // 4. Settle with Vault — one clean call
        vault.settlePosition(pos.trader, pos.collateral, netPnl);

        // 5. Distribute closing fee (GMX style explicit split)
        if (closingFee > 0) {
            vault.distributeClosingFee(closingFee);
        }

        emit PositionClosed(positionId, pos.trader, currentPrice, pnl);
    }

    // ══════════════════════════════════════════════════════════
    //              TP / SL / LIQUIDATION
    // ══════════════════════════════════════════════════════════

    /// @notice Execute Take Profit or Stop Loss for an open position
    function executeTPSL(uint256 positionId, bytes[] calldata updateData) external payable nonReentrant {
        if (updateData.length > 0) {
            oracle.updatePriceFeeds{value: msg.value}(updateData);
        }
        
        Position storage pos = positions[positionId];
        require(pos.isOpen, "Not open");
        
        (uint256 currentPrice, ) = oracle.getPrice(pos.pairId);
        
        bool isTp = false;
        bool shouldClose = false;
        
        if (pos.tpPrice > 0) {
            isTp = pos.isLong ? currentPrice >= pos.tpPrice : currentPrice <= pos.tpPrice;
            shouldClose = isTp;
        }
        if (!shouldClose && pos.slPrice > 0) {
            shouldClose = pos.isLong ? currentPrice <= pos.slPrice : currentPrice >= pos.slPrice;
        }
        
        require(shouldClose, "TP/SL not triggered");
        
        emit TPSLTriggered(positionId, isTp, currentPrice);
        _executeClose(positionId, currentPrice);
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

        // Calculate liquidation reward (1% of collateral to liquidator)
        uint256 reward = (pos.collateral * liquidationRewardBps) / 10000;
        
        // CEI Pattern — update state before transfers
        pos.isOpen = false;
        core.decreaseOI(pos.pairId, pos.trader, pos.isLong, pos.sizeUsd);

        // Settle liquidation directly with Vault
        vault.settleLiquidation(pos.trader, msg.sender, pos.collateral, reward);

        emit PositionLiquidated(positionId, pos.trader, currentPrice, msg.sender, reward);
    }

    // ══════════════════════════════════════════════════════════
    //                   FEES & HELPERS
    // ══════════════════════════════════════════════════════════

    function _distributeFee(uint256 totalFee) internal {
        (uint256 toVault, uint256 toTreasury, uint256 toInsurance) = core.getFeeSplit(totalFee);
        
        if (toVault > 0) {
            _safeTransfer(address(vault), toVault);
            vault.receiveFees(toVault);
        }
        
        if (toTreasury > 0) {
            _safeTransfer(core.treasury(), toTreasury);
        }
        
        if (toInsurance > 0) {
            address insurance = core.insuranceFund();
            require(insurance != address(0), "Insurance fund not set");
            _safeTransfer(insurance, toInsurance);
        }
    }

    function _calcLiqPrice(uint256 entryPrice, uint256 leverage, bool isLong) internal view returns (uint256) {
        // Account for: 90% margin + taker closing fee (0.04%) + rollover buffer (0.10%)
        uint256 feeBuffer = core.takerFeeBps() + 10; 
        uint256 feeImpact = feeBuffer * leverage;
        
        // Guard against underflow: if fees eat too much margin, use minimum move
        uint256 movePercent;
        if (feeImpact >= 9000) {
            movePercent = 100; // Minimum 1% move to liquidation
        } else {
            movePercent = (9000 - feeImpact) / leverage;
        }

        if (isLong) {
            return entryPrice - (entryPrice * movePercent) / 10000;
        } else {
            return entryPrice + (entryPrice * movePercent) / 10000;
        }
    }

    function _calcRolloverFee(Position memory pos) internal view returns (uint256) {
        uint256 elapsed = block.timestamp - pos.openedAt;
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
}
