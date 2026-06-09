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

async function main() {
  const code = await client.getBytecode({ address: '0xACeA761c27A909d4D3895128EBe6370FDE2dF481' });
  console.log('Pyth Contract Code:', code ? code.length : 'null');
}
main().catch(console.error);
