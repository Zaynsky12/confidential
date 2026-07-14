# 🛡️ Risk Management & Stability

Investor and Liquidity Provider (LP) trust is extremely fragile when faced with the threat of a Bank Run. We understand this threat, which is why we designed on-chain protection mechanisms natively within our smart contracts (not web2 manual scripting) to manage liquidity circulation and deflect crisis scenarios.

---

## 1. Vault Utilization Cap: 80%

This is the first threshold that acts proactively every time a trader **OPENS** a new position.

- The Smart Contract will intercept and reject (revert) a position opening request if the Vault's cash collateral currently used to back the total Open Interest is above the **80%** mark.
- The sacred **20% (Cash Reserve)** limit will always be protected. This guarantees fresh capital availability so that any day, any Liquidity Provider can process a withdrawal from their Vault shares without experiencing frozen funds or transaction execution failures.

### Market-Specific Open Interest Limits (L/S Cap)

To prevent concentrated exposure and protect vault reserves from single-asset volatility, maximum open interest capacity is hardcoded per trading pair:
- **Major Crypto (`BTC/USDC`, `ETH/USDC`):** Capped at **$10,000,000 ($10M)** per side (Long / Short).
- **Altcoins, Commodities, Forex & Stocks:** Capped at **$5,000,000 ($5M)** per side (Long / Short).

---

## 2. Emergency Auto-Deleveraging (ADL): 95%

::: danger ADL Trigger (Crisis Condition)
The ultimate defense line for extreme liquidity crises. If radical market price fluctuations cause Vault utilization to spike past the critical **95%** threshold, the system enters ADL mode.
:::

The very second utilization hits 95%, our entire network of *Keeper Bots* is granted full authority to ruthlessly kill (partially liquidate) the positions of traders who are **currently profitable**, forcing collateral margins back into the Vault's reserves. This harsh measure ensures LPs are shielded from brutal bankruptcy and keeps the ecosystem breathing for another day.

---

## 3. Auto-Scaling Withdrawals (Dynamic Liquidity Fulfillment)

Have you ever had a withdrawal transaction fail (revert) on other protocols just because their cash reserves were dry for the day? At *Confidential DEX*, we introduce the **Auto-Scaling Withdrawals** feature.

- If you (`LP A`) click the button to withdraw $1,000,000, but it happens that the idle physical cash (Available Liquidity) in the vault today is only $400,000 (with the rest being held by traders)...
- Your transaction **WILL NOT BE REJECTED**.
- Our Smart Contract will intelligently **disburse the $400,000 to your wallet that exact second**, while your remaining $600,000 remains intact as Token Shares (`cUSDC`) in your wallet. You can withdraw the remainder when traders close their positions the following day.
