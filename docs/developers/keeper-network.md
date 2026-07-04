# 🤖 Unified Keeper Network

Execution, liquidations, and price precision at *Confidential DEX* do not rely on a centralized matching engine, but are fully supported by a decentralized army of **Unified Keeper Bots**.

These bots continuously monitor the network (sweeping) every **4 seconds** (24/7) to capture user orders and match them with prices from the Oracle (Pyth).

---

## Permissionless Nodes (Opportunities for Developers)

Unlike exchanges that monopolize profits for internal parties, our Keeper network is **100% Permissionless**.
- Anyone—including you as a developer—can run the Node Keeper script (`feederBot.cjs`) on your own personal server / VPS.
- You have the right to compete with other Keepers on the network to execute *Limit Orders* belonging to retail traders on this platform, and claim the commission **(Execution Fee)**.

---

## 💰 Zero-Sum-Game Economy Scheme

The financial incentive system is structured so that *Bot Operators* running servers will never bleed capital (run out of gas), while *traders* are guaranteed their orders will always be settled.

| Operation Cycle | Fee Scheme / Compensation | Borne By |
| :--- | :--- | :--- |
| **Market Scanning (Every 4 Sec)** | **0 Gas** (Purely read-only data) | None / Free |
| **Initial Order Placement** | **Execution Fee (ARC Coin)** | Deposited by **Trader** upon opening an order |
| **Execution Trigger** | Transaction Execution Cost (*Gas Fee* + Oracle) | Fronted by the **Keeper Bot** |
| **Success Reward Claim** | Contract transfers 100% of Trader's *Execution Fee* | Earned by the **Keeper Bot** instantly! |

::: info Win-Win Execution
When your bot successfully becomes the first to execute a trader's order into the contract, the smart contract instantly disburses the `Execution Fee` (held since the order creation) back into your bot's wallet (`msg.sender`). This generates a self-sustaining cash flow for anyone keeping this network alive!
:::

---

## ⚙️ Bot Operational Responsibilities

The bot cycle processes these 3 heavy workloads asynchronously:
1. **Pending Order Sweep:** Executes a queue of *Limit*, *Stop Market*, *TWAP*, and *delayed Market Orders* when the actual price crosses the trigger price.
2. **Take Profit (TP) / Stop Loss (SL):** Executes protective closures, locking in profits or limiting losses when an asset crosses a trader's predefined thresholds.
3. **Liquidation Sweep:** Tracks margins and ruthlessly liquidates underwater traders who can no longer maintain their Maintenance Margin collateral requirements.

---

## 🚀 How to Run Your Own Keeper Bot

Getting started as a Keeper is incredibly simple. Our bot script is written in Node.js and uses `ethers.js` to interact with the blockchain and the Pyth Network.

### 1. Prerequisites & Server Specs
To ensure high execution speed and avoid losing the race to other Keepers, we recommend running the bot on a VPS (Virtual Private Server) with low latency.

**Recommended VPS Specifications:**
- **CPU:** 1 vCore (2+ vCores for faster RPC parsing)
- **RAM:** 1 GB Minimum (2 GB recommended for Node.js stability)
- **OS:** Ubuntu 22.04 LTS (or similar Linux distro)
- **Network:** High-speed connection (Latency to Arc Network RPC is the most critical factor)

**Software Requirements:**
- Node.js (v18 or higher) installed on your server.
- PM2 (optional, but highly recommended for running the bot 24/7).
- A Web3 Wallet (e.g., MetaMask) loaded with some **ARC testnet tokens** to pay for gas fees.

### 2. Setup Configuration
Inside the `contracts` directory, create a `.env` file and input your Keeper Wallet's private key:

```bash
# contracts/.env
BOT_KEEPER_PRIVATE_KEY=your_private_key_here
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
```
::: warning Private Key Security
Never commit your `.env` file to GitHub or share your private key. Use a dedicated wallet exclusively for the Keeper bot, separate from your main personal funds.
:::

### 3. Run the Bot
Navigate to the `contracts` folder and install the dependencies if you haven't already:

```bash
cd contracts
npm install ethers dotenv node-fetch
```

Then, run the bot script:

```bash
node feederBot.cjs
```

If you prefer to keep it running in the background persistently on a VPS, use PM2:

```bash
npm install -g pm2
pm2 start feederBot.cjs --name "KeeperBot"
pm2 logs KeeperBot
```

### 4. Monitor Your Earnings
Once running, the bot will output logs every 4 seconds. Whenever it successfully executes an order or a liquidation, you will see a success message in the console, and the **Execution Fee** will be automatically deposited directly into your Keeper Wallet address!
