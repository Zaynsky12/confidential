const { createWalletClient, createPublicClient, http, keccak256, toHex } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
require('dotenv').config();
const { defineChain } = require('viem');
const fs = require('fs');
const path = require('path');

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
});

const privateKey = process.env.BOT_KEEPER_PRIVATE_KEY || '0x';
if (privateKey === '0x') {
  console.error("Missing BOT_KEEPER_PRIVATE_KEY in .env");
  process.exit(1);
}
const account = privateKeyToAccount(privateKey);
const client = createPublicClient({ chain: arcTestnet, transport: http() });
const wallet = createWalletClient({ account, chain: arcTestnet, transport: http() });

const TRADING_ADDRESS = '0x2e2D16b4cA6C617b4e0DBD07DC4246d3F88C3D34';
const TRADING_ABI = [{"inputs":[{"internalType":"uint256[]","name":"positionIds","type":"uint256[]"},{"internalType":"bytes[]","name":"updateData","type":"bytes[]"}],"name":"executeADL","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"orderId","type":"uint256"},{"internalType":"bytes[]","name":"updateData","type":"bytes[]"}],"name":"executeOrder","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"positionId","type":"uint256"},{"internalType":"bytes[]","name":"updateData","type":"bytes[]"}],"name":"executeTPSL","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"positionId","type":"uint256"},{"internalType":"bytes[]","name":"updateData","type":"bytes[]"}],"name":"liquidate","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"pendingOrders","outputs":[{"internalType":"bytes32","name":"pairId","type":"bytes32"},{"internalType":"address","name":"trader","type":"address"},{"internalType":"bool","name":"isLong","type":"bool"},{"internalType":"uint256","name":"sizeUsd","type":"uint256"},{"internalType":"uint256","name":"collateral","type":"uint256"},{"internalType":"uint256","name":"leverage","type":"uint256"},{"internalType":"uint256","name":"triggerPrice","type":"uint256"},{"internalType":"uint8","name":"orderType","type":"uint8"},{"internalType":"bool","name":"isActive","type":"bool"},{"internalType":"uint256","name":"createdAt","type":"uint256"},{"internalType":"uint256","name":"positionId","type":"uint256"},{"internalType":"uint256","name":"feePaid","type":"uint256"},{"internalType":"uint256","name":"executionFee","type":"uint256"},{"internalType":"uint256","name":"tpPrice","type":"uint256"},{"internalType":"uint256","name":"slPrice","type":"uint256"},{"internalType":"uint256","name":"twapSlices","type":"uint256"},{"internalType":"uint256","name":"twapInterval","type":"uint256"},{"internalType":"uint256","name":"twapExecuted","type":"uint256"},{"internalType":"uint256","name":"twapLastExec","type":"uint256"}],"stateMutability":"view","type":"function"}];

const PYTH_ADDRESS = '0x2880aB155794e7179c9eE2e38200202908C17B43';
const PYTH_ABI = [
  { "inputs": [{ "internalType": "bytes[]", "name": "updateData", "type": "bytes[]" }], "name": "getUpdateFee", "outputs": [{ "internalType": "uint256", "name": "feeAmount", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

const GOLDSKY_URL = 'https://api.goldsky.com/api/public/project_cmq6wbchslca901xaekhtfer7/subgraphs/confidentialdex/110/gn';

// Express Server Setup
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://confidential.finance'],
  methods: ['GET', 'POST'],
}));
app.use(express.json());

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 30;

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + RATE_LIMIT_WINDOW;
  }
  
  record.count++;
  rateLimitMap.set(ip, record);
  
  if (record.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Rate limit exceeded. Max 30 requests per minute.' });
  }
  next();
}

const PAIRS = [
  { name: 'BTC/USDC', pythId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43' },
  { name: 'ETH/USDC', pythId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace' },
  { name: 'SOL/USDC', pythId: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d' },
  { name: 'BNB/USDC', pythId: '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f' },
  { name: 'XRP/USDC', pythId: '0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8' },
  { name: 'LINK/USDC', pythId: '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221' },
  { name: 'ARB/USDC', pythId: '0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5' },
  { name: 'AVAX/USDC', pythId: '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7' },
  { name: 'SUI/USDC', pythId: '0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744' },
  { name: 'APT/USDC', pythId: '0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5' },
  { name: 'NEAR/USDC', pythId: '0xc415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750' },
  { name: 'DOGE/USDC', pythId: '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c' },
  { name: 'PEPE/USDC', pythId: '0xd69731a2e74ac1ce884fc3890f7ee324b6deb66147055249568869ed700882e4' },
  { name: 'WIF/USDC', pythId: '0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6ee41b54cd4cc61fc' },
  { name: 'AAPL/USDC', pythId: '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688' },
  { name: 'TSLA/USDC', pythId: '0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1' },
  { name: 'GOLD/USDC', pythId: '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2' },
  { name: 'SILVER/USDC', pythId: '0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e' },
  { name: 'SPY/USDC', pythId: '0x19e09bb805456ada3979a7d1cbb4b6d63babc3a0f8e8a9509f68afa5c4c11cd5' },
  { name: 'NVDA/USDC', pythId: '0xb1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593' },
  { name: 'EUR/USDC', pythId: '0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b' },
  { name: 'GBP/USDC', pythId: '0x84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1' },
  { name: 'USDJPY/USDC', pythId: '0xef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52' },
];

let isRunning = false;

async function runKeeper() {
  if (isRunning) return;
  isRunning = true;

  process.stdout.write(`\r⏳ [${new Date().toLocaleTimeString()}] Fetching from Subgraph & Pyth...`);

  try {
    // 1. Fetch Pyth Prices
    const ids = PAIRS.map(p => p.pythId).join('&ids[]=');
    const response = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${ids}`);
    const pythResponse = await response.json();

    if (!pythResponse.binary || !pythResponse.binary.data) {
        isRunning = false;
        return;
    }

    const pythPayload = pythResponse.binary.data.map(d => '0x' + d.replace('0x', ''));
    const pythFee = await client.readContract({
        address: PYTH_ADDRESS,
        abi: PYTH_ABI,
        functionName: 'getUpdateFee',
        args: [pythPayload]
    });

    const currentPrices = {};
    for (const data of pythResponse.parsed) {
      const cleanId = data.id;
      const priceNum = BigInt(data.price.price) * (10n ** BigInt(18 + data.price.expo));
      
      const pair = PAIRS.find(p => p.pythId.replace('0x','') === cleanId);
      if (pair) {
        const onChainPairId = keccak256(toHex(pair.name));
        currentPrices[onChainPairId] = priceNum;
      }
    }

    // 2. Fetch Active Orders and Positions via Subgraph
    const query = `
      {
        orders(where: { isActive: true }, first: 1000) {
          orderId
          orderType
          triggerPrice
          isLong
          twapSlices
          twapExecuted
          pairId
        }
        positions(where: { isOpen: true }, first: 1000) {
          positionId
          pairId
          isLong
          liquidationPrice
          tpPrice
          slPrice
        }
      }
    `;

    const sgResponse = await fetch(GOLDSKY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    
    const sgData = await sgResponse.json();
    if (!sgData || !sgData.data) {
        console.error("Subgraph Error Details:", JSON.stringify(sgData));
        throw new Error("Failed to fetch from subgraph");
    }

    const { orders, positions } = sgData.data;
    
    // 3. Process Orders Individually
    for (const order of orders) {
        const currentPrice = currentPrices[order.pairId];
        if (!currentPrice) continue;

        const isLong = order.isLong;
        const triggerPrice = BigInt(order.triggerPrice);
        const orderType = Number(order.orderType);

        let shouldExecute = false;
        
        if (orderType === 2 || orderType === 3) {
            shouldExecute = true; // Market orders / closes
        } else if (orderType === 0) {
            const bufferPrice = isLong 
                ? triggerPrice + (triggerPrice * 30n / 10000n) 
                : triggerPrice - (triggerPrice * 30n / 10000n);
            shouldExecute = isLong ? (currentPrice <= bufferPrice) : (currentPrice >= bufferPrice);
        } else if (orderType === 1) {
            const bufferPrice = isLong 
                ? triggerPrice - (triggerPrice * 30n / 10000n) 
                : triggerPrice + (triggerPrice * 30n / 10000n);
            shouldExecute = isLong ? (currentPrice >= bufferPrice) : (currentPrice <= bufferPrice);
        } else if (orderType === 4) {
            // Fetch missing TWAP fields from contract
            try {
                const orderRaw = await client.readContract({
                    address: TRADING_ADDRESS,
                    abi: TRADING_ABI,
                    functionName: 'pendingOrders',
                    args: [BigInt(order.orderId)]
                });
                const twapInterval = Number(orderRaw[16]);
                const twapLastExec = Number(orderRaw[18]);
                if (Number(order.twapExecuted) < Number(order.twapSlices)) {
                    const now = Math.floor(Date.now() / 1000);
                    if (Number(order.twapExecuted) === 0 || now >= twapLastExec + twapInterval) {
                        shouldExecute = true;
                    }
                }
            } catch(e) {}
        }

        if (shouldExecute) {
            console.log(`\n⚡ EXECUTING Order #${order.orderId} (Type: ${orderType})`);
            try {
                const hash = await wallet.writeContract({
                    address: TRADING_ADDRESS,
                    abi: TRADING_ABI,
                    functionName: 'executeOrder',
                    args: [BigInt(order.orderId), pythPayload],
                    value: pythFee
                });
                console.log(`   ✅ EXECUTION SUCCESS! Tx: ${hash}`);
            } catch (err) {
                console.error(`❌ Execution failed:`, err.shortMessage || err.message);
            }
        }
    }

    // 4. Process Liquidations and TP/SL
    for (const pos of positions) {
        const currentPrice = currentPrices[pos.pairId];
        if (!currentPrice) continue;

        const isLong = pos.isLong;
        const liquidationPrice = BigInt(pos.liquidationPrice);
        const tpPrice = pos.tpPrice ? BigInt(pos.tpPrice) : 0n;
        const slPrice = pos.slPrice ? BigInt(pos.slPrice) : 0n;

        // 4A. Liquidations
        let shouldLiquidate = false;
        if (isLong) {
          shouldLiquidate = currentPrice <= liquidationPrice;
        } else {
          shouldLiquidate = currentPrice >= liquidationPrice;
        }

        if (shouldLiquidate) {
          console.log(`🚨 LIQUIDATING Position #${pos.positionId}...`);
          try {
              const hash = await wallet.writeContract({
                  address: TRADING_ADDRESS,
                  abi: TRADING_ABI,
                  functionName: 'liquidate',
                  args: [BigInt(pos.positionId), pythPayload],
                  value: pythFee
              });
              console.log(`   ✅ LIQUIDATED SUCCESS! Tx: ${hash}`);
          } catch (err) {
              console.error(`❌ Liquidation failed:`, err.shortMessage || err.message);
          }
          continue; // Skip TP/SL
        }

        // 4B. TP / SL
        if (tpPrice > 0n || slPrice > 0n) {
            let shouldCloseTpSl = false;
            let isTp = false;
            
            if (tpPrice > 0n) {
                const tpBufferLong = tpPrice - (tpPrice * 30n / 10000n);
                const tpBufferShort = tpPrice + (tpPrice * 30n / 10000n);
                isTp = isLong ? (currentPrice >= tpBufferLong) : (currentPrice <= tpBufferShort);
                shouldCloseTpSl = isTp;
            }
            if (!shouldCloseTpSl && slPrice > 0n) {
                const slBufferLong = slPrice + (slPrice * 30n / 10000n);
                const slBufferShort = slPrice - (slPrice * 30n / 10000n);
                shouldCloseTpSl = isLong ? (currentPrice <= slBufferLong) : (currentPrice >= slBufferShort);
            }

            if (shouldCloseTpSl) {
                console.log(`🎯 ${isTp ? 'TAKE PROFIT' : 'STOP LOSS'} TRIGGERED for Position #${pos.positionId}...`);
                try {
                    const hash = await wallet.writeContract({
                        address: TRADING_ADDRESS,
                        abi: TRADING_ABI,
                        functionName: 'executeTPSL',
                        args: [BigInt(pos.positionId), pythPayload],
                        value: pythFee
                    });
                    console.log(`   ✅ TP/SL EXECUTED! Tx: ${hash}`);
                } catch (err) {
                    console.error(`❌ TP/SL failed:`, err.shortMessage || err.message);
                }
            }
        }
    }

  } catch (e) {
    console.error('\nError in Keeper Loop:', e.shortMessage || e.message);
  } finally {
      isRunning = false;
  }
}

console.log('🚀 Starting Keeper Bot V7 (Subgraph Optimized, No P2P)...');
console.log(`📡 Connected to Trading: ${TRADING_ADDRESS}`);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 API listening on port ${PORT}`);
});

// Run AMM Keeper Loop every 4 seconds to test Goldsky rate limits
runKeeper();
setInterval(runKeeper, 4000);
