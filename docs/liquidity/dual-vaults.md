# 🏦 Dual-Tranche Vault System

The foundation of success and orderbook depth for a Decentralized Exchange relies on its Liquidity Provider (LP) architecture.

At Confidential DEX, liquidity is segmented into **two independent vault layers (Dual-Tranche Vault)** running entirely on-chain. Collectively, this system can absorb an absolute maximum capacity (Total TVL Cap) of **$50,000,000 USDC**.

We utilize the cutting-edge **ERC-4626 Tokenized Vault** architecture with built-in *Auto-Compounding*. Whenever the exchange generates profit, your (`cUSDC`) shares will passively increase in value without you needing to manually claim rewards.

---

## 📊 Detailed Comparison (Degen vs Prime)

| Contract Specification | 🔴 Degen Vault | 🔵 Prime Vault |
| :--- | :--- | :--- |
| **Investor Risk Profile** | *High-Risk*, Yield Seekers | *Risk-Averse*, Institutions, *Whales* |
| **Max Capacity (TVL Cap)** | **$15,000,000** (30% Quota) | **$35,000,000** (70% Quota) |
| **Revenue Share** | **3x** (Triple the regular share) | **1x** (Regular Share) |
| **Capital Risk (Trader Wins)** | **Proportional Shared-Loss** (+ overflow) | **Proportional Shared-Loss** (60% floor protected) |
| **Lockup Period** | **2 Days** (172,800 seconds) | **5 Days** (432,000 seconds) |
| **Deposit Time Algorithm** | Absolute/Straight-line | *Weighted Average Deposit Time* |

---

## 🔴 Degen Vault (High-Yield Vault)

The Degen Vault is the high-yield engine of this ecosystem's economy. This layer is highly coveted by aggressive investors.
*   **Risk (Proportional Shared-Loss):** Degen LPs share trader payout liabilities proportionally with Prime LPs based on TVL ratio. However, Degen absorbs any overflow if Prime hits its 60% Protection Floor.
*   **Premium Yields:** Degen Vault receives a **3x profit multiplier** from protocol revenues (including daily Trading Fees, Liquidation results, Funding Rates, and the collateral of losing Traders).
*   **Epoch Bankruptcy:** The Degen Vault *can* be depleted to $0 in cases of extreme market movement. If this happens, the smart contract performs a clean slate wipe (Epoch Reset) so that new capital depositors do not inherit the debt of past losses.

---

## 🔵 Prime Vault (Capital Protected Vault)

The Prime Vault is a robust, stable DeFi bond instrument that serves as the backbone of the exchange's cash reserves.
*   **Stable Value Growth:** Built specifically for corporate entities (DAOs) or Whales who prefer slow, certain, and constant asset appreciation over hunting for wild monthly yields.
*   **Proportional Shared-Loss & 60% Protection Floor:** When traders win, Prime LPs share the payout liability proportionally with Degen LPs so the burden is fair. However, our Smart Contract guarantees that **at least 60% of Prime assets are locked and protected** (`primeProtectionBps = 6000`).
*   **40% Circuit Breaker:** If cumulative historical losses hitting Prime reach **40% of Historical Total Deposits**, the protocol automatically pauses to protect capital.
*   **Weighted Average Mechanism:** Depositing $50 today will not arbitrarily reset the 5-day Lockup Period of your previous $5,000,000 principal. The system calculates a weighted average to ensure you are not penalized.
