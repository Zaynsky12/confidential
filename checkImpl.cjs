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
  const impl = await client.getStorageAt({
    address: '0xACeA761c27A909d4D3895128EBe6370FDE2dF481',
    slot: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
  });
  console.log('Impl Address:', impl);
  const code = await client.getBytecode({ address: '0x' + impl.slice(26) });
  console.log('Impl Code Length:', code ? code.length : 'null');
}
main().catch(console.error);
