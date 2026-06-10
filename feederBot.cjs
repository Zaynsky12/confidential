const { createWalletClient, createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
require('dotenv').config();
const { defineChain } = require('viem');

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

const privateKey = process.env.PRIVATE_KEY || '0x';
if (privateKey === '0x') {
    console.error("Missing PRIVATE_KEY in .env");
    process.exit(1);
}
const account = privateKeyToAccount(privateKey);
const client = createPublicClient({ chain: arcTestnet, transport: http() });
const wallet = createWalletClient({ account, chain: arcTestnet, transport: http() });

const TRADING_ADDRESS = '0xc35ca2227833b07f69a56a32feb0a4cc2130b2a8';

// Minimal ABI required for liquidations
const TRADING_ABI = [
  {
    "inputs": [],
    "name": "nextPositionId",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "positionId","type": "uint256"}],
    "name": "getPosition",
    "outputs": [
      {
        "components": [
          {"internalType": "bytes32","name": "pairId","type": "bytes32"},
          {"internalType": "address","name": "trader","type": "address"},
          {"internalType": "bool","name": "isLong","type": "bool"},
          {"internalType": "uint256","name": "sizeUsd","type": "uint256"},
          {"internalType": "uint256","name": "collateral","type": "uint256"},
          {"internalType": "uint256","name": "entryPrice","type": "uint256"},
          {"internalType": "uint256","name": "leverage","type": "uint256"},
          {"internalType": "uint256","name": "liquidationPrice","type": "uint256"},
          {"internalType": "uint256","name": "openedAt","type": "uint256"},
          {"internalType": "bool","name": "isOpen","type": "bool"}
        ],
        "internalType": "struct ConfidentialTrading.Position",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256","name": "positionId","type": "uint256"},
      {"internalType": "bytes[]","name": "updateData","type": "bytes[]"}
    ],
    "name": "liquidate",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

const PYTH_ADDRESS = '0x2880aB155794e7179c9eE2e38200202908C17B43';
const PYTH_ABI = [
  {"inputs":[{"internalType":"bytes[]","name":"updateData","type":"bytes[]"}],"name":"getUpdateFee","outputs":[{"internalType":"uint256","name":"feeAmount","type":"uint256"}],"stateMutability":"view","type":"function"}
];

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
];

async function checkLiquidations() {
  try {
    // 1. Fetch current max position ID
    const nextIdStr = await client.readContract({
      address: TRADING_ADDRESS,
      abi: TRADING_ABI,
      functionName: 'nextPositionId',
    });
    const nextId = Number(nextIdStr);

    if (nextId === 0) {
      console.log(`[${new Date().toLocaleTimeString()}] No positions exist yet.`);
      return;
    }

    // 2. Fetch all open positions (in a real production app, we would use subgraph to avoid massive loops)
    // For this implementation, looping through all position IDs is fine
    const activePositions = [];
    const activePairs = new Set();

    for (let i = 0; i < nextId; i++) {
      const pos = await client.readContract({
        address: TRADING_ADDRESS,
        abi: TRADING_ABI,
        functionName: 'getPosition',
        args: [BigInt(i)]
      });

      if (pos.isOpen) {
        activePositions.push({ id: i, ...pos });
        activePairs.add(pos.pairId);
      }
    }

    console.log(`[${new Date().toLocaleTimeString()}] Monitoring ${activePositions.length} active position(s)...`);

    if (activePositions.length === 0) return;

    // 3. Fetch latest pyth prices for all pairs
    const ids = PAIRS.map(p => p.pythId).join('&ids[]=');
    const response = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${ids}`);
    const pythResponse = await response.json();
    
    if (!pythResponse.binary || !pythResponse.binary.data) return;
    
    const pythPayload = pythResponse.binary.data.map(d => '0x' + d.replace('0x', ''));
    
    // Create a price map for easy lookup
    const currentPrices = {};
    for (const data of pythResponse.parsed) {
        // Pyth uses pair ID as string without 0x
        const cleanId = data.id;
        const priceNum = BigInt(data.price.price) * (10n ** BigInt(18 + data.price.expo));
        currentPrices[cleanId] = priceNum;
    }

    // 4. Check if any position needs liquidation
    for (const pos of activePositions) {
        const cleanPairId = pos.pairId.replace('0x', '');
        const currentPrice = currentPrices[cleanPairId];

        if (!currentPrice) continue;

        let shouldLiquidate = false;
        if (pos.isLong) {
            shouldLiquidate = currentPrice <= pos.liquidationPrice;
        } else {
            shouldLiquidate = currentPrice >= pos.liquidationPrice;
        }

        if (shouldLiquidate) {
            console.log(`🚨 LIQUIDATION DETECTED for Position #${pos.id}!`);
            console.log(`   Trader: ${pos.trader}`);
            console.log(`   Liq Price: ${pos.liquidationPrice.toString()}`);
            console.log(`   Cur Price: ${currentPrice.toString()}`);
            
            try {
                // Get update fee
                const fee = await client.readContract({
                    address: PYTH_ADDRESS,
                    abi: PYTH_ABI,
                    functionName: 'getUpdateFee',
                    args: [pythPayload]
                });

                console.log(`   Sending liquidation tx...`);
                const hash = await wallet.writeContract({
                    address: TRADING_ADDRESS,
                    abi: TRADING_ABI,
                    functionName: 'liquidate',
                    args: [BigInt(pos.id), pythPayload],
                    value: fee
                });

                console.log(`   ✅ LIQUIDATED SUCCESS! Tx: ${hash}`);
            } catch (err) {
                console.error(`   ❌ Failed to liquidate pos #${pos.id}:`, err.message);
            }
        }
    }

  } catch (e) {
    console.error('Error monitoring positions:', e.message);
  }
}

console.log('🚀 Starting Liquidator Bot for Arc Testnet...');
console.log(`📡 Connected to Trading Contract: ${TRADING_ADDRESS}`);
console.log('Bot will monitor all active positions every 10 seconds.');

// Run immediately
checkLiquidations();
// Run every 10 seconds
setInterval(checkLiquidations, 10000);
