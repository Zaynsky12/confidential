const { createPublicClient, http } = require('viem');
const { defineChain } = require('viem');

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
});

const client = createPublicClient({ chain: arcTestnet, transport: http() });
const CORE_ADDRESS = '0x481529b51EE0d6D39A185130A0a21C8e996Ee9D3';

const CORE_ABI = [
  { "inputs": [], "name": "treasury", "outputs": [{ "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "insuranceFund", "outputs": [{ "type": "address" }], "stateMutability": "view", "type": "function" }
];

async function main() {
  const treasury = await client.readContract({
    address: CORE_ADDRESS,
    abi: CORE_ABI,
    functionName: 'treasury'
  });
  console.log('Treasury:', treasury);
  
  const insurance = await client.readContract({
    address: CORE_ADDRESS,
    abi: CORE_ABI,
    functionName: 'insuranceFund'
  });
  console.log('Insurance:', insurance);
}

main().catch(console.error);
