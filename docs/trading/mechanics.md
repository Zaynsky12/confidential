# ⚙️ Trading Mechanics

We focus on institutional-grade functional execution. All trading mechanisms are designed to ensure that transactions are fair, precise, and align with mathematical expectations without any hidden friction.

---

## Limit Order Discipline (Zero Buffer Accuracy)
Unlike other exchanges that apply price tolerances to *Limit Orders* for the sake of execution speed, at Confidential DEX, we enforce a **0% Buffer (100% Accuracy)**.

A *Limit Order* will only be executed into an *Open Position* if the market price (from the Oracle) **exactly touches or crosses your absolute target**. There is no such thing as premature execution.

## 🛡️ Execution Buffer (Anti-Wick Protection)

For conditional orders like *Stop Loss (SL)* and *Take Profit (TP)*, account security is the top priority:

::: info 0.3% Buffer (30 bps)
We have embedded an execution buffer of **0.3%** specifically for SL and TP. If the market experiences an instant crash or extreme wicks, our execution bots still have a buffer range to save your order, ensuring it executes successfully rather than reverting due to wild slippage.
:::

---

## 🧮 Partial Close & Harmonic Averaging

### Partial Close Flexibility
Traders are granted full control over their position's risk management. You are not forced to close a position entirely (100%). You can take partial profits, for instance, by closing 50% of your position.
- When you execute a *Partial Close*, the Smart Contract precisely recalculates the remaining collateral.
- The profit/loss on the closed portion is instantly settled into your wallet (or deducted from your collateral).
- Liquidation prices and margins are updated instantaneously.

### Harmonic Averaging
When a trader adds collateral to an ongoing position (such as *Averaging Down* or adding margin to mitigate liquidation risks), the system does not use a simple average formula.

The system strictly applies **Harmonic Mean Averaging**. This mathematically ensures that the new entry price and the combined leverage size are calculated with absolute accuracy, closing any exploitation gaps where traders could force their leverage beyond the maximum allowed limit.

---

## ⏱️ TWAP Execution (Time-Weighted Average Price)
For institutions and *Whales* looking to deploy massive capital, our system supports *TWAP* orders. The algorithm splices a giant order into smaller slices that are executed periodically over a calibrated timeframe. This automatically neutralizes Price Impact and reduces the burden on liquidity reserves at any single point in time.
