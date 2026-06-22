const { createWalletClient, createPublicClient, http, keccak256, toHex } = require('viem');
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

const privateKey = process.env.BOT_KEEPER_PRIVATE_KEY || '0x';
if (privateKey === '0x') {
  console.error("Missing BOT_KEEPER_PRIVATE_KEY in .env");
  process.exit(1);
}
const account = privateKeyToAccount(privateKey);
const client = createPublicClient({ chain: arcTestnet, transport: http() });
const wallet = createWalletClient({ account, chain: arcTestnet, transport: http() });

const TRADING_ADDRESS = '0xf37fe2E9A552a0b2003324B293B2e6E4AD9C5645';
const P2P_ADDRESS = '0x9D557c5Acc5a6B015C079273CE35D7FE44F74828';

// Express Server Setup
const express = require('express');
const cors = require('cors');
const app = express();

// FIX MEDIUM-4: Restrict CORS to known frontend origins
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://confidential.finance'],
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// FIX MEDIUM-3: Rate limiting to prevent DoS/spam
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute per IP

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

// In-Memory Orderbook
// Structure: { pairId: { longs: [order1, order2], shorts: [order1, order2] } }
const orderbook = {};
// Updated ABI for V2 (TWAP, TP/SL, Funding)
const TRADING_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_usdc",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_core",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_vault",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_oracle",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      }
    ],
    "name": "OrderCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      }
    ],
    "name": "OrderExecuted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "trader",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "pairId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "orderType",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "triggerPrice",
        "type": "uint256"
      }
    ],
    "name": "OrderPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "trader",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "exitPrice",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "int256",
        "name": "pnl",
        "type": "int256"
      }
    ],
    "name": "PositionClosed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "trader",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "executionPrice",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "liquidator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "reward",
        "type": "uint256"
      }
    ],
    "name": "PositionLiquidated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "trader",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "pairId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isLong",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "sizeUsd",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "entryPrice",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "leverage",
        "type": "uint256"
      }
    ],
    "name": "PositionOpened",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isTakeProfit",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "executionPrice",
        "type": "uint256"
      }
    ],
    "name": "TPSLTriggered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "sliceNumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "sizeUsd",
        "type": "uint256"
      }
    ],
    "name": "TWAPSliceExecuted",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MIN_POSITION_SIZE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      }
    ],
    "name": "cancelOrder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "core",
    "outputs": [
      {
        "internalType": "contract ConfidentialCore",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      }
    ],
    "name": "createCloseRequest",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "pairId",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "isLong",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "totalSizeUsd",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "leverage",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "slices",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "intervalSec",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "tpPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "slPrice",
        "type": "uint256"
      }
    ],
    "name": "createTwapOrder",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      },
      {
        "internalType": "bytes[]",
        "name": "updateData",
        "type": "bytes[]"
      }
    ],
    "name": "executeOrder",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "internalType": "bytes[]",
        "name": "updateData",
        "type": "bytes[]"
      }
    ],
    "name": "executeTPSL",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "internalType": "bytes[]",
        "name": "updateData",
        "type": "bytes[]"
      }
    ],
    "name": "liquidate",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "liquidationRewardBps",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextOrderId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextPositionId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "oracle",
    "outputs": [
      {
        "internalType": "contract PythPriceOracle",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "pendingOrders",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "pairId",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "trader",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isLong",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "sizeUsd",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "collateral",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "leverage",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "triggerPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "orderType",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "reduceOnly",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "positionId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "feePaid",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "executionFee",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "tpPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "slPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "twapSlices",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "twapInterval",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "twapExecuted",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "twapLastExec",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "pairId",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "isLong",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "sizeUsd",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "leverage",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "triggerPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "orderType",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "reduceOnly",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "tpPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "slPrice",
        "type": "uint256"
      }
    ],
    "name": "placeOrder",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "positions",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "pairId",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "trader",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isLong",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "sizeUsd",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "collateral",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "entryPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "leverage",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "liquidationPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "openedAt",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isOpen",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "tpPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "slPrice",
        "type": "uint256"
      },
      {
        "internalType": "int256",
        "name": "entryFundingIndex",
        "type": "int256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rolloverFeePerHour",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdc",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userOrders",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userPositions",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "vault",
    "outputs": [
      {
        "internalType": "contract ConfidentialVault",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const PYTH_ADDRESS = '0x2880aB155794e7179c9eE2e38200202908C17B43';
const PYTH_ABI = [
  { "inputs": [{ "internalType": "bytes[]", "name": "updateData", "type": "bytes[]" }], "name": "getUpdateFee", "outputs": [{ "internalType": "uint256", "name": "feeAmount", "type": "uint256" }], "stateMutability": "view", "type": "function" }
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
  if (isRunning) return; // Concurrency Lock
  isRunning = true;

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

    // 2. CHECK PENDING ORDERS
    const nextOrderIdStr = await client.readContract({
      address: TRADING_ADDRESS,
      abi: TRADING_ABI,
      functionName: 'nextOrderId',
    });
    const nextOrderId = Number(nextOrderIdStr);

    for (let i = 1; i < nextOrderId; i++) { // Starts at 1
        try {
            const orderRaw = await client.readContract({
                address: TRADING_ADDRESS,
                abi: TRADING_ABI,
                functionName: 'pendingOrders',
                args: [BigInt(i)]
            });
            
            const isActive = orderRaw[8];
            if (!isActive) continue;

            const order = {
                id: i,
                pairId: orderRaw[0],
                isLong: orderRaw[2],
                triggerPrice: orderRaw[6],
                orderType: orderRaw[7],
                twapSlices: Number(orderRaw[15]),
                twapInterval: Number(orderRaw[16]),
                twapExecuted: Number(orderRaw[17]),
                twapLastExec: Number(orderRaw[18])
            };

            const currentPrice = currentPrices[order.pairId];
            if (!currentPrice) continue;

            let shouldExecute = false;
            
            if (order.orderType === 2 || order.orderType === 3) {
                // Market Open (2) or Market Close (3) execute immediately
                shouldExecute = true;
            } else if (order.orderType === 0) {
                // Limit
                shouldExecute = order.isLong ? (currentPrice <= order.triggerPrice) : (currentPrice >= order.triggerPrice);
            } else if (order.orderType === 1) {
                // Stop
                shouldExecute = order.isLong ? (currentPrice >= order.triggerPrice) : (currentPrice <= order.triggerPrice);
            } else if (order.orderType === 4) {
                // TWAP
                if (order.twapExecuted < order.twapSlices) {
                    const now = Math.floor(Date.now() / 1000);
                    if (order.twapExecuted === 0 || now >= order.twapLastExec + order.twapInterval) {
                        shouldExecute = true;
                    }
                }
            }

            if (shouldExecute) {
                console.log(`⚡ EXECUTING Order #${order.id} (Type: ${order.orderType})`);
                const hash = await wallet.writeContract({
                    address: TRADING_ADDRESS,
                    abi: TRADING_ABI,
                    functionName: 'executeOrder',
                    args: [BigInt(order.id), pythPayload],
                    value: pythFee
                });
                console.log(`   ✅ EXECUTION SUCCESS! Tx: ${hash}`);
            }
        } catch (err) {
            console.error(`❌ Failed to read/execute order #${i}:`, err.shortMessage || err.message);
        }
    }

    // 3. CHECK LIQUIDATIONS AND TP/SL
    const nextPosIdStr = await client.readContract({
      address: TRADING_ADDRESS,
      abi: TRADING_ABI,
      functionName: 'nextPositionId',
    });
    const nextPosId = Number(nextPosIdStr);

    for (let i = 1; i < nextPosId; i++) { // Starts at 1
      try {
          const posRaw = await client.readContract({
            address: TRADING_ADDRESS,
            abi: TRADING_ABI,
            functionName: 'positions',
            args: [BigInt(i)]
          });

          const isOpen = posRaw[9];
          if (!isOpen) continue;

          const pos = {
              id: i,
              pairId: posRaw[0],
              isLong: posRaw[2],
              liquidationPrice: posRaw[7],
              tpPrice: posRaw[10],
              slPrice: posRaw[11]
          };

          const currentPrice = currentPrices[pos.pairId];
          if (!currentPrice) continue;

          // 3A. Liquidations
          let shouldLiquidate = false;
          if (pos.isLong) {
            shouldLiquidate = currentPrice <= pos.liquidationPrice;
          } else {
            shouldLiquidate = currentPrice >= pos.liquidationPrice;
          }

          if (shouldLiquidate) {
            console.log(`🚨 LIQUIDATING Position #${pos.id}...`);
            const hash = await wallet.writeContract({
                address: TRADING_ADDRESS,
                abi: TRADING_ABI,
                functionName: 'liquidate',
                args: [BigInt(pos.id), pythPayload],
                value: pythFee
            });
            console.log(`   ✅ LIQUIDATED SUCCESS! Tx: ${hash}`);
            continue; // Skip TP/SL check if liquidated
          }

          // 3B. TP / SL
          if (pos.tpPrice > 0n || pos.slPrice > 0n) {
              let shouldCloseTpSl = false;
              let isTp = false;
              
              if (pos.tpPrice > 0n) {
                  isTp = pos.isLong ? (currentPrice >= pos.tpPrice) : (currentPrice <= pos.tpPrice);
                  shouldCloseTpSl = isTp;
              }
              if (!shouldCloseTpSl && pos.slPrice > 0n) {
                  shouldCloseTpSl = pos.isLong ? (currentPrice <= pos.slPrice) : (currentPrice >= pos.slPrice);
              }

              if (shouldCloseTpSl) {
                  console.log(`🎯 ${isTp ? 'TAKE PROFIT' : 'STOP LOSS'} TRIGGERED for Position #${pos.id}...`);
                  const hash = await wallet.writeContract({
                      address: TRADING_ADDRESS,
                      abi: TRADING_ABI,
                      functionName: 'executeTPSL',
                      args: [BigInt(pos.id), pythPayload],
                      value: pythFee
                  });
                  console.log(`   ✅ TP/SL EXECUTED! Tx: ${hash}`);
              }
          }

      } catch (err) {
          console.error(`❌ Failed to process pos #${i}:`, err.shortMessage || err.message);
      }
    }

  } catch (e) {
    console.error('Error in Keeper Loop:', e.shortMessage || e.message);
  } finally {
      isRunning = false; // Release Lock
  }
}

const P2P_ABI = [
  {
    "inputs": [
      { "internalType": "bytes", "name": "makerPayload", "type": "bytes" },
      { "internalType": "bytes", "name": "takerPayload", "type": "bytes" },
      { "internalType": "bytes", "name": "makerSig", "type": "bytes" },
      { "internalType": "bytes", "name": "takerSig", "type": "bytes" },
      { "internalType": "uint256", "name": "matchPrice", "type": "uint256" }
    ],
    "name": "settleP2PTrade",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// ══════════════════════════════════════════════════════════
//                      P2P MATCHMAKING
// ══════════════════════════════════════════════════════════

// FIX MEDIUM-2: Validate EIP-712 signature before queuing order
const { verifyTypedData } = require('viem');

const P2P_DOMAIN = {
  name: 'Confidential DEX',
  version: '1',
  chainId: 5042002,
  verifyingContract: P2P_ADDRESS
};

const ORDER_TYPES = {
  Order: [
    { name: 'trader', type: 'address' },
    { name: 'pairId', type: 'bytes32' },
    { name: 'isLong', type: 'bool' },
    { name: 'sizeUsd', type: 'uint256' },
    { name: 'collateral', type: 'uint256' },
    { name: 'price', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'expiry', type: 'uint256' }
  ]
};

app.post('/api/p2p/order', rateLimit, async (req, res) => {
    const { order, signature } = req.body;
    
    // Validate payload
    if (!order || !signature || !order.pairId || typeof order.isLong === 'undefined') {
        return res.status(400).json({ error: 'Invalid order payload' });
    }

    // Validate expiry is not in the past
    const now = Math.floor(Date.now() / 1000);
    if (Number(order.expiry) <= now) {
        return res.status(400).json({ error: 'Order already expired' });
    }

    // FIX MEDIUM-2: Verify the EIP-712 signature off-chain before queuing
    try {
        const message = {
            trader: order.trader,
            pairId: order.pairId,
            isLong: order.isLong,
            sizeUsd: BigInt(order.sizeUsd),
            collateral: BigInt(order.collateral),
            price: BigInt(order.price),
            nonce: BigInt(order.nonce),
            expiry: BigInt(order.expiry)
        };

        const isValid = await verifyTypedData({
            address: order.trader,
            domain: P2P_DOMAIN,
            types: ORDER_TYPES,
            primaryType: 'Order',
            message,
            signature
        });

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid signature — verification failed' });
        }
    } catch (err) {
        console.error('Signature verification error:', err.message);
        return res.status(401).json({ error: 'Signature verification failed' });
    }

    const pairId = order.pairId;
    if (!orderbook[pairId]) {
        orderbook[pairId] = { longs: [], shorts: [] };
    }

    // Add to orderbook
    if (order.isLong) {
        orderbook[pairId].longs.push({ order, signature, receivedAt: Date.now(), retryCount: 0 });
    } else {
        orderbook[pairId].shorts.push({ order, signature, receivedAt: Date.now(), retryCount: 0 });
    }

    console.log(`📩 [P2P] Received new ${order.isLong ? 'LONG' : 'SHORT'} order for ${pairId}. Size: $${order.sizeUsd / 1e6}`);
    res.json({ success: true, message: 'Order queued in Sequencer' });
});

let isMatching = false;
const MAX_RETRIES = 3;

async function matchOrders() {
    if (isMatching) return;
    isMatching = true;

    try {
        for (const pairId in orderbook) {
            const longs = orderbook[pairId].longs;
            const shorts = orderbook[pairId].shorts;

            // Clean expired orders
            const now = Math.floor(Date.now() / 1000);
            orderbook[pairId].longs = longs.filter(o => Number(o.order.expiry) > now);
            orderbook[pairId].shorts = shorts.filter(o => Number(o.order.expiry) > now);

            if (orderbook[pairId].longs.length > 0 && orderbook[pairId].shorts.length > 0) {
                // Find matching orders (same sizeUsd)
                for (let i = 0; i < orderbook[pairId].longs.length; i++) {
                    const longOrder = orderbook[pairId].longs[i];
                    
                    const matchIndex = orderbook[pairId].shorts.findIndex(shortOrder => shortOrder.order.sizeUsd === longOrder.order.sizeUsd);
                    
                    if (matchIndex !== -1) {
                        const shortOrder = orderbook[pairId].shorts[matchIndex];
                        console.log(`🔥 [P2P] MATCH FOUND for ${pairId}! Settling on-chain...`);

                        // Encode payloads for the contract
                        const encodeOrder = (o) => {
                            const abiCoder = require('viem').encodeAbiParameters;
                            return abiCoder(
                                [
                                    {
                                        "components": [
                                            { "name": "trader", "type": "address" },
                                            { "name": "pairId", "type": "bytes32" },
                                            { "name": "isLong", "type": "bool" },
                                            { "name": "sizeUsd", "type": "uint256" },
                                            { "name": "collateral", "type": "uint256" },
                                            { "name": "price", "type": "uint256" },
                                            { "name": "nonce", "type": "uint256" },
                                            { "name": "expiry", "type": "uint256" }
                                        ],
                                        "name": "OrderInfo",
                                        "type": "tuple"
                                    }
                                ],
                                [
                                    [
                                        o.trader,
                                        o.pairId,
                                        o.isLong,
                                        BigInt(o.sizeUsd),
                                        BigInt(o.collateral),
                                        BigInt(o.price),
                                        BigInt(o.nonce),
                                        BigInt(o.expiry)
                                    ]
                                ]
                            );
                        };

                        const makerPayload = encodeOrder(longOrder.order);
                        const takerPayload = encodeOrder(shortOrder.order);
                        
                        const matchPrice = BigInt(longOrder.order.price) > 0n ? BigInt(longOrder.order.price) : 0n;

                        try {
                            const hash = await wallet.writeContract({
                                address: P2P_ADDRESS,
                                abi: P2P_ABI,
                                functionName: 'settleP2PTrade',
                                args: [
                                    makerPayload,
                                    takerPayload,
                                    longOrder.signature,
                                    shortOrder.signature,
                                    matchPrice
                                ]
                            });
                            console.log(`   ✅ P2P SETTLEMENT SUCCESS! Tx: ${hash}`);
                            
                            // Remove from queue
                            orderbook[pairId].longs.splice(i, 1);
                            orderbook[pairId].shorts.splice(matchIndex, 1);
                            i--;
                            
                        } catch (e) {
                            const errMsg = e.shortMessage || e.message;
                            console.error(`   ❌ P2P Settlement failed:`, errMsg);

                            // FIX MEDIUM-5: Smart retry logic — only drop on permanent errors
                            const permanentErrors = ['Invalid signature', 'Invalid nonce', 'Order expired', 'Pair mismatch', 'Direction mismatch', 'Size mismatch'];
                            const isPermanent = permanentErrors.some(pe => errMsg.includes(pe));

                            if (isPermanent) {
                                console.log(`   🗑️ Permanent error — dropping both orders`);
                                orderbook[pairId].longs.splice(i, 1);
                                orderbook[pairId].shorts.splice(matchIndex, 1);
                                i--;
                            } else {
                                // Transient error (gas, network, utilization) — retry later
                                longOrder.retryCount = (longOrder.retryCount || 0) + 1;
                                shortOrder.retryCount = (shortOrder.retryCount || 0) + 1;
                                
                                if (longOrder.retryCount >= MAX_RETRIES) {
                                    console.log(`   🗑️ Long order exceeded ${MAX_RETRIES} retries — dropping`);
                                    orderbook[pairId].longs.splice(i, 1);
                                    i--;
                                }
                                if (shortOrder.retryCount >= MAX_RETRIES) {
                                    console.log(`   🗑️ Short order exceeded ${MAX_RETRIES} retries — dropping`);
                                    orderbook[pairId].shorts.splice(matchIndex, 1);
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error('Error in Matchmaking Loop:', err.message);
    } finally {
        isMatching = false;
    }
}

// ══════════════════════════════════════════════════════════
//                      START SERVICES
// ══════════════════════════════════════════════════════════

console.log('🚀 Starting Keeper Bot V2 & Hybrid P2P Sequencer...');
console.log(`📡 Connected to Trading: ${TRADING_ADDRESS}`);
console.log(`📡 Connected to P2P: ${P2P_ADDRESS}`);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 P2P Sequencer API listening on port ${PORT}`);
});

// Run AMM Keeper Loop
runKeeper();
setInterval(runKeeper, 5000);

// Run Matchmaking Loop
setInterval(matchOrders, 1000);
