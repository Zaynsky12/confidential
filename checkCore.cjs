const { createPublicClient, http, keccak256, toHex } = require('viem');
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
const CORE = '0x769c307ca53c2b84decea5b2a6f45304cd7785cb';
const ABI = require('./contracts/out/ConfidentialCore.sol/ConfidentialCore.json').abi;

async function main() {
  const pairId = keccak256(toHex("BTC/USDC"));
  const pair = await client.readContract({
    address: CORE,
    abi: ABI,
    functionName: 'pairs',
    args: [pairId],
  });
  console.log('Pair:', pair);
}
main().catch(console.error);
