const { createPublicClient, http } = require('viem');
const { defineChain } = require('viem');
const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
});
const client = createPublicClient({ chain: arcTestnet, transport: http() });

async function check() {
  const code = await client.getBytecode({ address: '0x3396f443b8D0D144C831cf7EB4b0cAE5c3BaBd27' });
  console.log('Code length:', code ? code.length : 0);
  
  const tradingCode = await client.getBytecode({ address: '0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277' });
  console.log('Trading Code length:', tradingCode ? tradingCode.length : 0);
}
check();
