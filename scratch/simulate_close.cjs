const { createPublicClient, createWalletClient, http, toHex } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { defineChain } = require('viem');

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
});

const client = createPublicClient({ chain: arcTestnet, transport: http() });

const TRADING_ADDRESS = '0xd9f796201d93dC5eb499B0044a675cB24eB550f9';
const TRADING_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "pendingOrders",
    "outputs": [
      { "internalType": "bytes32", "name": "pairId", "type": "bytes32" },
      { "internalType": "address", "name": "trader", "type": "address" },
      { "internalType": "bool", "name": "isLong", "type": "bool" },
      { "internalType": "uint256", "name": "sizeUsd", "type": "uint256" },
      { "internalType": "uint256", "name": "collateral", "type": "uint256" },
      { "internalType": "uint256", "name": "leverage", "type": "uint256" },
      { "internalType": "uint256", "name": "triggerPrice", "type": "uint256" },
      { "internalType": "uint8", "name": "orderType", "type": "uint8" },
      { "internalType": "bool", "name": "reduceOnly", "type": "bool" },
      { "internalType": "bool", "name": "isActive", "type": "bool" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
      { "internalType": "uint256", "name": "positionId", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextOrderId",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "orderId", "type": "uint256" },
      { "internalType": "bytes[]", "name": "updateData", "type": "bytes[]" }
    ],
    "name": "executeOrder",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

async function main() {
  const nextOrderIdStr = await client.readContract({
    address: TRADING_ADDRESS,
    abi: TRADING_ABI,
    functionName: 'nextOrderId',
  });
  const nextOrderId = Number(nextOrderIdStr);
  
  console.log(`Checking orders up to ID ${nextOrderId - 1}...`);
  
  for (let i = nextOrderId - 1; i >= Math.max(1, nextOrderId - 5); i--) {
    const order = await client.readContract({
      address: TRADING_ADDRESS,
      abi: TRADING_ABI,
      functionName: 'pendingOrders',
      args: [BigInt(i)]
    });
    
    const isActive = order[9];
    const orderType = order[7];
    
    if (isActive && orderType === 3) {
      console.log(`Found Active Close Order ID: ${i}`);
      try {
         // Simulate the executeOrder transaction (this will throw the exact contract error!)
         await client.simulateContract({
           address: TRADING_ADDRESS,
           abi: TRADING_ABI,
           functionName: 'executeOrder',
           args: [BigInt(i), []], // Empty Pyth payload for simulation is fine if it reverts inside executeClose
           value: 0n,
           account: '0x1729A39D4c74D1cCBcf8c7b8E52Caa69818bA12a' // Keeper address
         });
         console.log(`Order ${i} simulation succeeded!`);
      } catch (err) {
         console.log(`Order ${i} simulation REVERTED:`, err.shortMessage || err.message);
      }
    }
  }
}

main().catch(console.error);
