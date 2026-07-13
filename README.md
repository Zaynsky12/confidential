# Confidential DEX (V1)

A decentralized, high-performance perpetual trading platform built on the **Arc Network Testnet**. Confidential DEX offers a professional, institutional-grade trading experience with instantaneous order execution, dynamic charts, and an isolated yield vault architecture that rivals centralized exchanges (CEXs) like Binance while maintaining 100% self-custody.

![Confidential DEX Preview](./confidential%20app.png)

## 🚀 Key Features

- **⚡ Instant Execution & Zero Slippage:** Frontend-injected Pyth Oracle updates ensure your orders execute exactly when you click, removing the need for a secondary keeper for market orders.
- **🛡️ 1-Click Trading:** Approve USDC once and trade effortlessly without repeated Metamask confirmations.
- **🏦 Real Yield Vault:** Liquidity Providers (LPs) can deposit USDC to earn a real yield powered by trading fees and liquidations.
- **📈 Advanced Charting:** Fully integrated interactive charts for real-time technical analysis of Crypto, Forex, and RWA (Metals/Equities).
- **🔒 Decentralized & Secure:** Fully transparent, isolated contracts audited through multiple iterations.
- **📱 Mobile-First Design:** A highly responsive, app-like interface designed specifically for mobile and desktop efficiency.

## 🛠️ Architecture & Tech Stack

### Frontend Application
- **Framework:** React 18, TypeScript, Vite
- **Web3 Integrations:** Wagmi v2, Viem, Privy (Email/Social/Wallet login abstraction)
- **State Management:** Zustand
- **UI/UX:** Custom Design System (Vanilla CSS with dynamic themes)

### Smart Contracts (Solidity)
The V1 Architecture separates concerns into three primary contracts to maximize security:
- **`ConfidentialCoreV1.sol`**: The central registry. Manages pairs, oracle integration, maximum open interest limits, fee distribution routing, and dynamic funding rate calculation.
- **`ConfidentialVaultV1.sol`**: The treasury. Holds all user deposits (LPs) and trader collaterals. Responsible for paying out PnL and collecting losses.
- **`ConfidentialTradingV1.sol`**: The execution engine. Processes Market Orders, Limit Orders, Stop Losses, Take Profits, and Liquidations seamlessly.

### Infrastructure
- **Blockchain:** Arc Testnet (`rpc.testnet.arc.network`)
- **Data Subgraph:** Goldsky Subgraph (`0.1`)
- **Oracle Network:** Pyth Network
- **Keeper Bot:** Custom Node.js Bot running on PM2 for background liquidations and Limit Orders.

## 📚 Documentation

For an in-depth understanding of the platform's tier-1 circuit breakers, quadratic price impacts, and security mechanisms, please read our comprehensive **[Platform Mechanics Guide](./platform_mechanics.md)**.

## 📜 Contract Addresses (Arc Testnet V1)

- **ConfidentialCore**: `0xC3EB0406FF2601D452673710e859Fbf75A0B892d`
- **ConfidentialTrading**: `0xF0B85870e6CD14E9f9f0d5428ABaF94B51F69A67`
- **ConfidentialVault**: `0x5F4d94b9E92Bb09B647a2D044C488F1947427f4c`
- **USDC Token (Arc)**: `0x3600000000000000000000000000000000000000`
- **Pyth Oracle**: `0x897b9947185079B42d94CbbF332192CEFd9ACCFA`

## 💻 Quick Start Guide

### 1. Installation
Clone the repository and install dependencies using NPM:
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_PRIVY_APP_ID=your_privy_app_id
VITE_ARC_RPC=https://rpc.testnet.arc.network
```

### 3. Run Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:5173`.

---

## 🔒 Security & Contribution

This is currently a Testnet deployment. While the architecture mimics production environments, do not deposit real funds into these contracts. For security reports or contributions, please open an issue or submit a pull request.

**Confidential DEX © 2026**
