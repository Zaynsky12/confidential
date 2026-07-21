const { ethers } = require("../contracts/node_modules/ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const PAIR_PYTH_IDS = {
  'BTC/USDC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'ETH/USDC': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'SOL/USDC': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'BNB/USDC': '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
};
const PAIR_ID_TO_PYTH = {};
const PAIR_ID_TO_NAME = {};
for (const [name, pythId] of Object.entries(PAIR_PYTH_IDS)) {
  const pairId = ethers.keccak256(ethers.toUtf8Bytes(name));
  PAIR_ID_TO_PYTH[pairId] = pythId;
  PAIR_ID_TO_NAME[pairId] = name;
}

const ORDER_TYPE_NAMES = {
  0: 'Limit', 1: 'Stop', 2: 'MarketOpen', 3: 'MarketClose',
  4: 'TWAP', 5: 'Increase', 6: 'PartialClose', 7: 'RemoveCol'
};

async function fetchPythVaa(pythPriceId) {
  try {
    const cleanId = pythPriceId.startsWith('0x') ? pythPriceId.slice(2) : pythPriceId;
    const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${cleanId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.binary.data.map((hex) => `0x${hex}`);
  } catch (err) {
    console.error(`[Pyth] VAA error: ${err.message}`);
    return [];
  }
}

async function main() {
  const rpcUrl = process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const pk = process.env.BOT_KEEPER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(pk, provider);
  console.log(`🔑 Using Keeper: ${wallet.address}`);

  const TRADING_ADDRESS = "0x266C76800b5bdEd90c246AC60319831078fA28A4";
  const ap = path.join(__dirname, "../contracts/artifacts/src/ConfidentialTradingV1.sol/ConfidentialTradingV1.json");
  const tradingAbi = JSON.parse(fs.readFileSync(ap, "utf8")).abi;
  const contract = new ethers.Contract(TRADING_ADDRESS, tradingAbi, wallet);

  const nextId = Number(await contract.nextOrderId());
  console.log(`📦 nextOrderId: ${nextId}`);

  const startId = Math.max(1, nextId - 20);
  for (let i = startId; i < nextId; i++) {
    try {
      const o = await contract.pendingOrders(i);
      if (!o.isActive) continue;
      const typeName = ORDER_TYPE_NAMES[Number(o.orderType)] || `T${o.orderType}`;
      const pairName = PAIR_ID_TO_NAME[o.pairId] || o.pairId.slice(0, 10);
      const sizeUsd = ethers.formatUnits(o.sizeUsd, 6);
      const triggerPrice = ethers.formatUnits(o.triggerPrice, 18);
      console.log(`\n========================================`);
      console.log(`🟢 Order #${i} [ACTIVE]: ${typeName} ${pairName} (${o.isLong ? 'LONG' : 'SHORT'})`);
      console.log(`   Trader: ${o.trader}`);
      console.log(`   Size: $${sizeUsd}, Collateral: $${ethers.formatUnits(o.collateral, 6)}`);
      console.log(`   Trigger Price: $${triggerPrice}`);
      console.log(`   Created At: ${new Date(Number(o.createdAt) * 1000).toLocaleString()}`);

      const pythId = PAIR_ID_TO_PYTH[o.pairId];
      if (!pythId) {
        console.log(`   ❌ No Pyth ID for pair ${o.pairId}`);
        continue;
      }

      const updateData = await fetchPythVaa(pythId);
      if (updateData.length === 0) {
        console.log(`   ❌ Failed to fetch Pyth VAA`);
        continue;
      }

      console.log(`   ⏳ Running staticCall simulation for Order #${i}...`);
      try {
        await contract.executeOrder.staticCall(i, updateData, { value: ethers.parseUnits("0.01", 18) });
        console.log(`   ✅ SIMULATION PASSED for Order #${i}!`);
      } catch (simErr) {
        console.log(`   ❌ SIMULATION REVERTED for Order #${i}:`);
        console.log(`      Reason: ${simErr.reason || 'none'}`);
        console.log(`      ShortMessage: ${simErr.shortMessage || 'none'}`);
        console.log(`      Full Message: ${simErr.message}`);
        if (simErr.data) console.log(`      Data: ${simErr.data}`);
        if (simErr.info?.error?.data) console.log(`      Info Data: ${simErr.info.error.data}`);
      }
    } catch (e) {
      console.log(`Error reading order #${i}: ${e.message}`);
    }
  }
}

main().catch(console.error);
