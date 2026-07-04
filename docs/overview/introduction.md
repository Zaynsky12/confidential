# What is Confidential DEX?

**Confidential DEX** is a next-generation Decentralized Perpetual Exchange (PerpDEX) natively built on the **Arc Network**, specializing in instant, zero-slippage execution, backed by deep liquidity and a *Zero Borrow Fee* model.

We combine the efficiency, speed, and convenience of a Centralized Exchange (CEX) with the absolute security, transparency, and self-custody of Web3.

## Problems We Solve

### 1. High Execution Latency
Many traditional DEXs rely on slow P2P orderbooks or wait for counterparties. At *Confidential DEX*, we discard that concept. Every order is instantly executed against our *Dual-Tranche Vault*, resulting in **instant 1-step settlement** with no waiting time.

### 2. Punishing Slippage Costs
Slippage often eats up a large portion of a trader's profit on traditional AMM platforms. We guarantee **Zero Slippage** for highly liquid pairs thanks to our precise Oracle pricing architecture powered by the Pyth Network. The price you see is the price you get.

### 3. Whale Exploitation & Manipulation
Whales often manipulate orderbooks or drain liquidity. We implement a **Dynamic Quadratic Price Impact** algorithm. Retail orders will barely feel its impact, but if a *Whale* attempts to open a massive position that disrupts the market ratio, they will be choked with an exponential price penalty.

---

## ⚡ Frictionless Ecosystem

Our infrastructure runs via *Real-time* synchronization using **Goldsky GraphQL** and *Event-Driven Smart Contracts*. Every click on this platform is secured and escorted by a **Unified Keeper Bot**, ensuring your Stop Loss, Take Profit, and Limit Orders are executed on time without charging a single cent of *gas fees* from your wallet while monitoring prices.

::: tip Zero Borrow Fee
We have **eliminated daily Borrow Fees**! Instead of paying borrowing costs, we introduced a *Dynamic Skew-Based Funding Rate*, where traders can actually get paid (earn fees) if they are willing to take positions that balance the market's Long/Short ratio.
:::
