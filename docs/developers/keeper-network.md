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

### 2. Setup the Bot Script

Untuk men-setup bot di VPS, Anda bisa mengunduhnya secara otomatis, atau membuat filenya secara manual.

**Opsi A: Menggunakan Wget (Otomatis & Direkomendasikan)**
Buka terminal VPS Anda dan jalankan perintah ini untuk mengunduh script:
```bash
wget https://raw.githubusercontent.com/Zaynsky12/arctrade/main/contracts/feederBot.cjs
```

**Opsi B: Membuat File Manual (Copy-Paste)**
Jika Anda lebih suka membuat filenya secara manual, buat file bernama `feederBot.cjs` di server Anda lalu *copy-paste* seluruh script di bawah ini ke dalamnya.

<details>
<summary>Klik di sini untuk melihat dan meng-copy full <b>feederBot.cjs</b> script</summary>

```javascript
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config(); // fallback local

// Map of Pair Name to Pyth Price ID
const PAIR_PYTH_IDS = {
  'BTC/USDC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'ETH/USDC': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'SOL/USDC': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'BNB/USDC': '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
  'XRP/USDC': '0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8',
  'LINK/USDC': '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
  'ARB/USDC': '0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5',
  'AVAX/USDC': '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
  'SUI/USDC': '0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
  'APT/USDC': '0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5',
  'NEAR/USDC': '0xc415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750',
  'DOGE/USDC': '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
  'PEPE/USDC': '0xd69731a2e74ac1ce884fc3890f7ee324b6deb66147055249568869ed700882e4',
  'WIF/USDC': '0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6ee41b54cd4cc61fc',
  'AAPL/USDC': '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688',
  'TSLA/USDC': '0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1',
  'GOLD/USDC': '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2',
  'SILVER/USDC': '0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e',
  'SPY/USDC': '0x19e09bb805456ada3979a7d1cbb4b6d63babc3a0f8e8a9509f68afa5c4c11cd5',
  'NVDA/USDC': '0xb1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593',
  'EUR/USDC': '0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b',
  'GBP/USDC': '0x84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1',
  'USDJPY/USDC': '0xef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52'
};

// Build pairId -> pythId mapping
const PAIR_ID_TO_PYTH = {};
for (const [name, pythId] of Object.entries(PAIR_PYTH_IDS)) {
  const pairId = ethers.keccak256(ethers.toUtf8Bytes(name));
  PAIR_ID_TO_PYTH[pairId] = pythId;
}

// Fetch Pyth VAA update data from Hermes API
async function fetchPythVaa(pythPriceId) {
  try {
    const cleanId = pythPriceId.startsWith('0x') ? pythPriceId.slice(2) : pythPriceId;
    const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${cleanId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.binary.data.map((hex) => `0x${hex}`);
  } catch (err) {
    console.error(`[Pyth] Error fetching VAA for ${pythPriceId}:`, err.message);
    return [];
  }
}

async function main() {
  console.log("🤖 Starting Confidential DEX Unified Keeper Bot...");
  console.log("═══════════════════════════════════════════════════════");

  const rpcUrl = process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const pk = process.env.BOT_KEEPER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  
  if (!pk) {
    console.error("❌ ERROR: No BOT_KEEPER_PRIVATE_KEY or PRIVATE_KEY found!");
    process.exit(1);
  }

  const wallet = new ethers.Wallet(pk, provider);
  console.log(`🔑 Keeper Wallet: ${wallet.address}`);

  // Load contract addresses
  let TRADING_ADDRESS = "0x4B7291445eE8eD0d3f12c511843078f8B8c4d9Bd"; // Dynamic P2P V1 address
  try {
    const deployPath1 = path.join(__dirname, "latest_deploy.json");
    const deployPath2 = path.join(__dirname, "scripts/latest_deploy.json");
    const deployPath = fs.existsSync(deployPath1) ? deployPath1 : deployPath2;
    if (fs.existsSync(deployPath)) {
      const deployInfo = JSON.parse(fs.readFileSync(deployPath, "utf8"));
      TRADING_ADDRESS = deployInfo.tradingAddress;
    }
  } catch (e) {
    console.log("ℹ️ latest_deploy.json not found, using default V1 address.");
  }

  console.log(`📈 Trading Contract: ${TRADING_ADDRESS}`);

  let tradingAbi = [
    "function nextOrderId() view returns (uint256)",
    "function pendingOrders(uint256) view returns (bytes32 pairId, address trader, bool isLong, uint256 sizeUsd, uint256 collateral, uint256 leverage, uint256 triggerPrice, uint8 orderType, bool isActive, uint256 createdAt, uint256 positionId, uint256 feePaid, uint256 executionFee, uint256 tpPrice, uint256 slPrice, uint256 twapSlices, uint256 twapInterval, uint256 twapExecuted, uint256 twapLastExec)",
    "function executeOrder(uint256 orderId, bytes[] calldata updateData) payable",
    "function nextPositionId() view returns (uint256)",
    "function positions(uint256) view returns (bytes32 pairId, address trader, bool isLong, uint256 sizeUsd, uint256 collateral, uint256 entryPrice, uint256 leverage, uint256 liquidationPrice, uint256 openedAt, bool isOpen, uint256 tpPrice, uint256 slPrice, int256 entryFundingIndex, uint256 lastRolloverSettled)",
    "function liquidate(uint256 positionId, bytes[] calldata updateData) payable",
    "function executeTPSL(uint256 positionId, bytes[] calldata updateData) payable"
  ];

  try {
    const artPath1 = path.join(__dirname, "artifacts/src/ConfidentialTrading.sol/ConfidentialTrading.json");
    const artPath2 = path.join(__dirname, "../artifacts/src/ConfidentialTrading.sol/ConfidentialTrading.json");
    const artPath = fs.existsSync(artPath1) ? artPath1 : artPath2;
    if (fs.existsSync(artPath)) {
      const tradingArtifact = JSON.parse(fs.readFileSync(artPath, "utf8"));
      tradingAbi = tradingArtifact.abi;
    }
  } catch (e) {
    console.log("ℹ️ ABI file not found, using embedded minimal ABI.");
  }

  const tradingContract = new ethers.Contract(TRADING_ADDRESS, tradingAbi, wallet);

  const PYTH_FEE = ethers.parseUnits("0.001", 18); // 0.001 ARC for oracle update

  let isRunning = false;

  async function scanAndExecute() {
    if (isRunning) return;
    isRunning = true;

    try {
      // ═══════════════════════════════════════════════════
      // 1. SCAN PENDING ORDERS
      // ═══════════════════════════════════════════════════
      const nextOrderId = Number(await tradingContract.nextOrderId());
      for (let i = 1; i < nextOrderId; i++) {
        try {
          const order = await tradingContract.pendingOrders(i);
          const isActive = order[8];
          if (!isActive) continue;

          const orderId = i;
          const pairId = order[0];
          const orderType = Number(order[7]); 
          const pythId = PAIR_ID_TO_PYTH[pairId];

          if (!pythId) {
            continue;
          }

          console.log(`[Order #${orderId}] Active Order found! Type: ${orderType}. Fetching Pyth VAA...`);
          const updateData = await fetchPythVaa(pythId);
          if (updateData.length === 0) continue;

          console.log(`[Order #${orderId}] Attempting execution...`);
          const tx = await tradingContract.executeOrder(orderId, updateData, { value: PYTH_FEE });
          console.log(`  🚀 Tx sent: ${tx.hash}`);
          await tx.wait();
          console.log(`  ✅ Order #${orderId} EXECUTED SUCCESSFULLY!`);
        } catch (err) {
          const msg = err.shortMessage || err.message || "";
          if (!msg.includes("Limit not reached") && !msg.includes("Stop not reached") && !msg.includes("TWAP: too early")) {
            console.error(`[Order #${i}] Execution error:`, msg.slice(0, 100));
          }
        }
      }

      // ═══════════════════════════════════════════════════
      // 2. SCAN OPEN POSITIONS (FOR TP/SL & LIQUIDATION)
      // ═══════════════════════════════════════════════════
      const nextPosId = Number(await tradingContract.nextPositionId());
      for (let i = 1; i < nextPosId; i++) {
        try {
          const pos = await tradingContract.positions(i);
          const isOpen = pos[9];
          if (!isOpen) continue;

          const posId = i;
          const pairId = pos[0];
          const tpPrice = pos[10];
          const slPrice = pos[11];
          const pythId = PAIR_ID_TO_PYTH[pairId];

          if (!pythId) continue;

          const updateData = await fetchPythVaa(pythId);
          if (updateData.length === 0) continue;

          // Try Liquidation first
          try {
            const tx = await tradingContract.liquidate(posId, updateData, { value: PYTH_FEE });
            console.log(`[Position #${posId}] 💥 LIQUIDATION tx sent: ${tx.hash}`);
            await tx.wait();
            console.log(`[Position #${posId}] ✅ LIQUIDATED SUCCESSFULLY!`);
            continue;
          } catch (liqErr) {}

          // Try TP/SL if set
          if (tpPrice > 0n || slPrice > 0n) {
            try {
              const tx = await tradingContract.executeTPSL(posId, updateData, { value: PYTH_FEE });
              console.log(`[Position #${posId}] 🎯 TP/SL tx sent: ${tx.hash}`);
              await tx.wait();
              console.log(`[Position #${posId}] ✅ TP/SL EXECUTED SUCCESSFULLY!`);
            } catch (tpslErr) {}
          }
        } catch (err) {}
      }
    } catch (globalErr) {
      console.error("[Bot Loop Error]", globalErr.message);
    } finally {
      isRunning = false;
    }
  }

  console.log("🟢 Bot running. Monitoring orders and positions every 4 seconds...\n");
  setInterval(scanAndExecute, 4000);
  scanAndExecute(); 
}

main().catch(console.error);
```
</details>

### 3. Setup Configuration
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
