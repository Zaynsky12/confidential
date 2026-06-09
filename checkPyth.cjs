const { createPublicClient, http } = require('viem');
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

const PYTH_ADDRESS = '0xACeA761c27A909d4D3895128EBe6370FDE2dF481';
const ABI = [{
  "type": "function",
  "name": "getPriceUnsafe",
  "inputs": [{"name": "id", "type": "bytes32", "internalType": "bytes32"}],
  "outputs": [
    {
      "components": [
        {"name": "price", "type": "int64"},
        {"name": "conf", "type": "uint64"},
        {"name": "expo", "type": "int32"},
        {"name": "publishTime", "type": "uint256"}
      ],
      "name": "price",
      "type": "tuple"
    }
  ],
  "stateMutability": "view"
}];

async function main() {
  const feedId = '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43'; // BTC/USD
  try {
    const result = await client.readContract({
      address: PYTH_ADDRESS,
      abi: ABI,
      functionName: 'getPriceUnsafe',
      args: [feedId],
    });
    console.log('Pyth Unsafe Price Result:', result);
  } catch (e) {
    console.error('Error fetching Pyth unsafe price:', e.details || e.message);
  }
}

main().catch(console.error);
