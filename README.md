# Confidential Perpetual DEX

A decentralized, high-performance perpetual trading platform built on the Arc Network Testnet. Confidential offers a professional trading experience with 1-click trading (infinite approval), dynamic charting, and a dedicated yield vault.

## Features

- ⚡ **1-Click Trading**: Enjoy a seamless CEX-like experience. Approve USDC once and trade effortlessly without repeated Metamask pop-ups.
- 📈 **Professional Charting**: Integrated TradingView Advanced Charts for real-time technical analysis.
- 🏦 **Yield Vault**: Deposit USDC to provide liquidity to the platform and earn a portion of the trading fees.
- 📱 **Mobile Optimized**: A fully responsive interface with native mobile navigation, optimized for touch interaction.
- 🔐 **Secure & Decentralized**: Fully self-custodial, operating via audited smart contracts on Arc Network.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Web3 Integration**: Wagmi v2, Viem, Privy (for Email/Wallet login)
- **State Management**: Zustand
- **Styling**: Vanilla CSS (Custom Design System)
- **Smart Contracts**: Solidity, Foundry
- **Oracle**: Pyth Network

## Quick Start

### Prerequisites
- Node.js (v18+)
- Foundry (for smart contract deployment)

### Frontend Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory and add your Privy App ID:
   ```env
   VITE_PRIVY_APP_ID=your_privy_app_id
   VITE_ARC_RPC=https://rpc.testnet.arc.io
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

### Smart Contract Setup

1. Navigate to the `contracts` folder:
   ```bash
   cd contracts
   ```

2. Create a `.env` file for your deployment keys (NEVER commit this file):
   ```env
   PRIVATE_KEY=0x...
   ARC_RPC_URL=https://rpc.testnet.arc.io
   ```

3. Deploy the contracts to Arc Testnet:
   ```bash
   forge script script/Deploy.s.sol:DeployScript --rpc-url $ARC_RPC_URL --broadcast
   ```

## Contract Addresses (Arc Testnet)

- **ConfidentialCore**: `0xe7713624d3dd7d7c2e360de47114401c31f1dd76`
- **ConfidentialTrading**: `0x6b6de0047bbddad1d8b3b18b34a115b482650e9c`
- **ConfidentialVault**: `0xb38ed2873e8e74486cbbfeb646ddaf73238ec958`
- **PythPriceOracle**: `0x04bdb3a7ea3bcf895c6e7e8495f8cf11602fc3f4`

## Disclaimer

This is a testnet application. Use only for testing and development purposes. Do not deposit real funds into these contracts.
