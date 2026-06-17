import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  ConfidentialTrading,
  PositionOpened,
  PositionClosed,
  PositionLiquidated,
  OrderPlaced,
  OrderCancelled,
  OrderExecuted,
  TWAPSliceExecuted,
  TPSLTriggered
} from "../generated/ConfidentialTrading/ConfidentialTrading"
import {
  Deposit,
  Withdraw
} from "../generated/ConfidentialVault/ConfidentialVault"
import { Position, Order, TradeRecord, VaultDeposit, PairDayData } from "../generated/schema"

function updatePairDayData(pairId: Bytes, timestamp: BigInt, volumeUsd: BigInt): void {
  let dayId = timestamp.toI32() / 86400
  let id = pairId.toHexString() + "-" + dayId.toString()
  
  let dayData = PairDayData.load(id)
  if (dayData == null) {
    dayData = new PairDayData(id)
    dayData.pairId = pairId
    dayData.date = dayId * 86400
    dayData.volumeUsd = BigInt.fromI32(0)
  }
  
  dayData.volumeUsd = dayData.volumeUsd.plus(volumeUsd)
  dayData.save()
}

export function handlePositionOpened(event: PositionOpened): void {
  let positionId = event.params.positionId.toString()
  let position = new Position(positionId)

  position.positionId = event.params.positionId
  position.trader = event.params.trader
  position.pairId = event.params.pairId
  position.isLong = event.params.isLong
  position.sizeUsd = event.params.sizeUsd
  position.entryPrice = event.params.entryPrice
  position.leverage = event.params.leverage
  
  // Calculate collateral: sizeUsd / leverage
  if (event.params.leverage.gt(BigInt.fromI32(0))) {
    position.collateral = event.params.sizeUsd.div(event.params.leverage)
  } else {
    position.collateral = BigInt.fromI32(0)
  }
  
  let contract = ConfidentialTrading.bind(event.address)
  let posCall = contract.try_positions(event.params.positionId)
  if (!posCall.reverted) {
    position.liquidationPrice = posCall.value.getLiquidationPrice()
    position.tpPrice = posCall.value.getTpPrice()
    position.slPrice = posCall.value.getSlPrice()
  } else {
    position.liquidationPrice = BigInt.fromI32(0)
    position.tpPrice = BigInt.fromI32(0)
    position.slPrice = BigInt.fromI32(0)
  }

  position.isOpen = true
  position.openedAt = event.block.timestamp
  position.save()

  // Create Trade Record
  let trade = new TradeRecord(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  trade.trader = event.params.trader
  trade.pairId = event.params.pairId
  trade.action = "Open"
  trade.sizeUsd = event.params.sizeUsd
  trade.price = event.params.entryPrice
  trade.timestamp = event.block.timestamp
  trade.txHash = event.transaction.hash
  trade.save()

  // Update Daily Volume
  updatePairDayData(event.params.pairId, event.block.timestamp, event.params.sizeUsd)
}

export function handlePositionClosed(event: PositionClosed): void {
  let positionId = event.params.positionId.toString()
  let position = Position.load(positionId)
  
  if (position != null) {
    position.isOpen = false
    position.closedAt = event.block.timestamp
    position.exitPrice = event.params.exitPrice
    position.pnl = event.params.pnl
    position.save()

    let trade = new TradeRecord(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
    trade.trader = event.params.trader
    trade.pairId = position.pairId
    trade.action = "Close"
    trade.sizeUsd = position.sizeUsd
    trade.price = event.params.exitPrice
    trade.timestamp = event.block.timestamp
    trade.txHash = event.transaction.hash
    trade.save()

    // Update Daily Volume
    updatePairDayData(position.pairId, event.block.timestamp, position.sizeUsd)
  }
}

export function handlePositionLiquidated(event: PositionLiquidated): void {
  let positionId = event.params.positionId.toString()
  let position = Position.load(positionId)
  
  if (position != null) {
    position.isOpen = false
    position.closedAt = event.block.timestamp
    position.save()

    let trade = new TradeRecord(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
    trade.trader = position.trader
    trade.pairId = position.pairId
    trade.action = "Liquidate"
    trade.sizeUsd = position.sizeUsd
    trade.price = position.liquidationPrice
    trade.timestamp = event.block.timestamp
    trade.txHash = event.transaction.hash
    trade.save()

    // Update Daily Volume
    updatePairDayData(position.pairId, event.block.timestamp, position.sizeUsd)
  }
}

export function handleOrderPlaced(event: OrderPlaced): void {
  let orderId = event.params.orderId.toString()
  let order = new Order(orderId)

  order.orderId = event.params.orderId
  order.trader = event.params.trader
  order.pairId = event.params.pairId
  order.orderType = event.params.orderType
  order.triggerPrice = event.params.triggerPrice
  
  let contract = ConfidentialTrading.bind(event.address)
  let orderCall = contract.try_pendingOrders(event.params.orderId)
  
  if (!orderCall.reverted) {
    order.isLong = orderCall.value.getIsLong()
    order.sizeUsd = orderCall.value.getSizeUsd()
    order.leverage = orderCall.value.getLeverage()
    order.collateral = orderCall.value.getCollateral()
    order.tpPrice = orderCall.value.getTpPrice()
    order.slPrice = orderCall.value.getSlPrice()
    order.twapSlices = orderCall.value.getTwapSlices()
    order.twapExecuted = orderCall.value.getTwapExecuted()
  } else {
    order.isLong = true
    order.sizeUsd = BigInt.fromI32(0)
    order.leverage = BigInt.fromI32(1)
    order.collateral = BigInt.fromI32(0)
    order.tpPrice = BigInt.fromI32(0)
    order.slPrice = BigInt.fromI32(0)
    order.twapSlices = BigInt.fromI32(0)
    order.twapExecuted = BigInt.fromI32(0)
  }

  order.isActive = true
  order.createdAt = event.block.timestamp
  order.save()
}

export function handleOrderCancelled(event: OrderCancelled): void {
  let orderId = event.params.orderId.toString()
  let order = Order.load(orderId)
  if (order != null) {
    order.isActive = false
    order.save()
  }
}

export function handleOrderExecuted(event: OrderExecuted): void {
  let orderId = event.params.orderId.toString()
  let order = Order.load(orderId)
  if (order != null) {
    order.isActive = false
    order.executedAt = event.block.timestamp
    order.positionId = event.params.positionId
    order.save()
  }
}

export function handleTWAPSliceExecuted(event: TWAPSliceExecuted): void {
  let orderId = event.params.orderId.toString()
  let order = Order.load(orderId)
  if (order != null) {
    order.twapExecuted = event.params.sliceNumber
    order.save()
  }
}

export function handleTPSLTriggered(event: TPSLTriggered): void {
  // Logic handled in handlePositionClosed which follows immediately
}

export function handleDeposit(event: Deposit): void {
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  let deposit = new VaultDeposit(id)
  
  deposit.user = event.params.user
  deposit.action = "deposit"
  deposit.amount = event.params.amount
  deposit.shares = event.params.sharesReceived
  deposit.timestamp = event.block.timestamp
  deposit.txHash = event.transaction.hash
  deposit.save()
}

export function handleWithdraw(event: Withdraw): void {
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  let withdraw = new VaultDeposit(id)
  
  withdraw.user = event.params.user
  withdraw.action = "withdraw"
  withdraw.amount = event.params.amount
  withdraw.shares = event.params.sharesBurned
  withdraw.timestamp = event.block.timestamp
  withdraw.txHash = event.transaction.hash
  withdraw.save()
}
