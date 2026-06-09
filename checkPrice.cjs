const { createPublicClient, http } = require('viem');
const { keccak256, toHex } = require('viem');
const { defineChain } = require('viem');

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'ARC', symbol: 'ARC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
});

const client = createPublicClient({
  chain: arcTestnet,
  transport: http()
});

const ORACLE_ADDRESS = '0x04bdb3a7ea3bcf895c6e7e8495f8cf11602fc3f4';
const ABI = [{
  "type": "function",
  "name": "getPrice",
  "inputs": [{"name": "pairId", "type": "bytes32", "internalType": "bytes32"}],
  "outputs": [{"name": "price", "type": "uint256"}, {"name": "publishTime", "type": "uint256"}],
  "stateMutability": "view"
}];

async function main() {
  const pairId = keccak256(toHex("BTC/USDC"));
  console.log('pairId:', pairId);
  try {
    const result = await client.readContract({
      address: ORACLE_ADDRESS,
      abi: ABI,
      functionName: 'getPrice',
      args: [pairId],
    });
    console.log('Price Result:', result);
  } catch (e) {
    console.error('Error fetching price:', e.details || e.message);
  }
}

main().catch(console.error);
