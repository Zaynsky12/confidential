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
const USDC = '0x3600000000000000000000000000000000000000';
const deployer = '0x5ed9d2254238154e5f20d3f4a3c95a41e007b616b82fef54beefd57db35f966e'; // private key
const { privateKeyToAccount } = require('viem/accounts');

async function main() {
  const account = privateKeyToAccount(deployer);
  const bal = await client.readContract({
    address: USDC,
    abi: [{"type":"function","name":"balanceOf","inputs":[{"name":"account","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view"}],
    functionName: 'balanceOf',
    args: [account.address],
  });
  console.log('Deployer USDC Balance:', bal.toString());
}
main().catch(console.error);
