const { createPublicClient, http, parseAbi } = require('viem');
const { defineChain } = require('viem');
const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
});
const client = createPublicClient({ chain: arcTestnet, transport: http() });

const CORE_ABI = parseAbi(['function keeper() view returns (address)']);

async function check() {
  const k = await client.readContract({
    address: '0x3396f443b8D0D144C831cf7EB4b0cAE5c3BaBd27',
    abi: CORE_ABI,
    functionName: 'keeper'
  });
  console.log('Core Keeper:', k);
}
check();
