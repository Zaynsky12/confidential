# 🏛️ System Architecture

The architecture of *Confidential DEX* is built on a modular foundation (Tripartite System) that is fully centralized in terms of execution performance (*Keepers*), yet fully decentralized regarding asset security logic (*Smart Contracts*).

---

## The Tripartite Contracts

The main logic of this protocol is split into three core *Smart Contract* pillars to minimize gas overhead, avoid complexity that leads to bugs, and secure user funds.

| Contract Layer | Primary Role & Function |
| :--- | :--- |
| **1. ConfidentialCore.sol** | **(Source of Truth)**<br>The brain of the system. Stores all critical states such as Open Interest (Max OI) limits, Leverage configurations, security caps (Vault Caps), and Circuit Breaker mechanisms. |
| **2. ConfidentialTrading.sol** | **(Execution Engine)**<br>The primary interaction point for Traders. Handles order creation, validates margin sufficiency, leverage, Pyth Oracle prices, and calculates Price Impact penalties before triggering logic within the Vault. |
| **3. ConfidentialVault.sol** | **(Liquidity Reserve)**<br>Acts like a bank vault. Entirely responsible for securing USDC funds deposited by Liquidity Providers. Processes LP deposits/withdrawals, pays out PnL to traders, and mints LP shares. |

---

## 🔒 Anti-Exploit Defense Layers

Our security system is designed to withstand all types of high-level hacks and network manipulations in DeFi:

### 1. Anti-Flash Loan & MEV Shield
::: warning 5-Second Cooldown Period
Any newly opened position is impossible to close, modify, or tamper with for exactly **5 seconds**. This completely neutralizes *Flash Loan Attacks* and *sandwich (MEV)* price manipulations within a single block cycle.
:::

### 2. Strict CEI (Checks-Effects-Interactions)
All functions involving the transfer and withdrawal of tokens (USDC) are strictly executed using the CEI design pattern. Balance updates and position statuses must be resolved *before* any physical funds (USDC) are moved, completely closing the door on **Reentrancy Attacks**.

### 3. Pyth Oracle Confidence Check
During extreme market volatility (such as wars or economic crises), Oracle data ranges risk widening too far. *Confidential DEX* will **reject (revert) trading interactions** if the *Confidence Interval* gap from the *Pyth Network* exceeds the safe threshold of 2%. We prioritize capital preservation over phantom price differences.

### 4. Admin Fat-Finger Protection
The system does not allow direct, unilateral transfer of administrative rights (Ownership). This process uses a **2-Step Ownership Transfer** mechanism (`transferOwnership` followed by `acceptOwnership` from the new wallet), preventing the permanent loss of contract control due to a typo in the wallet address (Fat-Finger Error).
