# 🏛️ System Architecture

The architecture of *Confidential DEX* is built on a modular foundation (Tripartite System) that is fully centralized in terms of execution performance (*Keepers*), yet fully decentralized regarding asset security logic (*Smart Contracts*).

---

## The Tripartite Contracts

The main logic of this protocol is split into three core *Smart Contract* pillars to minimize gas overhead, avoid complexity that leads to bugs, and secure user funds.

| Contract Layer | Primary Role & Function |
| :--- | :--- |
| **1. ConfidentialCoreV1.sol** | **(Source of Truth)**<br>The brain of the system. Stores all critical states such as Open Interest (Max OI) limits, Leverage configurations, security caps (Vault Caps), and Circuit Breaker mechanisms. |
| **2. ConfidentialTradingV1.sol** | **(Execution Engine)**<br>The primary interaction point for Traders. Handles order requests via a 2-step execution model (Request -> Keeper Execution), validates margin sufficiency, leverage, Pyth Oracle prices, and calculates Price Impact penalties before triggering logic within the Vault. |
| **3. ConfidentialVaultV1.sol** | **(Liquidity Reserve)**<br>Acts like a bank vault. Entirely responsible for securing USDC funds deposited by Liquidity Providers. Processes LP deposits/withdrawals, pays out PnL to traders, and mints LP shares. |

---

## 🔒 Anti-Exploit Defense Layers

Our security system is designed to withstand all types of high-level hacks and network manipulations in DeFi:

### 1. 2-Step Request-Execute Model (Anti-MEV & Anti-Exploit)
::: info Advanced MEV & Toxic Flow Shield
*Confidential DEX V1* employs a secure **2-Step Request-Execute** model for all orders (Market, Limit, Stop, TWAP, and Close):
1. **Request (Step 1):** The Trader submits an order request (`placeOrder`) which locks collateral and records the intent on-chain without trusting static/stale prices.
2. **Execute (Step 2):** The decentralized Unified Keeper Network (`feederBot`) instantly monitors the request, pulls the freshest real-time Pyth Oracle VAA proof, and calls `executeOrder` to settle the trade directly against the Vault. This completely eliminates *Stale Price Arbitrage*, *Sandwich Attacks*, and *Toxic Flow*.
:::

### 2. Anti-Flash Loan & 5-Second Cooldown
::: warning 5-Second Cooldown Period
Any newly opened position is impossible to close, modify, or tamper with for exactly **5 seconds**. This completely neutralizes *Flash Loan Attacks* and rapid price manipulations within a single block cycle.
:::

### 3. Strict CEI (Checks-Effects-Interactions)
All functions involving the transfer and withdrawal of tokens (USDC) are strictly executed using the CEI design pattern. Balance updates and position statuses must be resolved *before* any physical funds (USDC) are moved, completely closing the door on **Reentrancy Attacks**.

### 4. Pyth Oracle Confidence Check
During extreme market volatility (such as wars or economic crises), Oracle data ranges risk widening too far. *Confidential DEX* will **reject (revert) trading interactions** if the *Confidence Interval* gap from the *Pyth Network* exceeds the safe threshold of 2%. We prioritize capital preservation over phantom price differences.

### 5. Admin Fat-Finger Protection
The system does not allow direct, unilateral transfer of administrative rights (Ownership). This process uses a **2-Step Ownership Transfer** mechanism (`transferOwnership` followed by `acceptOwnership` from the new wallet), preventing the permanent loss of contract control due to a typo in the wallet address (Fat-Finger Error).

### 6. Keeper Bot Manual VPS Integration

To operate the decentralized execution layer manually, Node Operators can run the `feederBot.cjs` script on a VPS using PM2. Ensure that you have manually uploaded the latest V1 `feederBot.cjs` and ABIs to your VPS.

```bash
# Restart your bot to fetch the new Trading Contract addresses
pm2 restart feederBot
pm2 logs feederBot
```
