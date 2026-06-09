const { createWalletClient, http, publicActions } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
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

const account = privateKeyToAccount('0x5ed9d2254238154e5f20d3f4a3c95a41e007b616b82fef54beefd57db35f966e');
const client = createWalletClient({
  account,
  chain: arcTestnet,
  transport: http()
}).extend(publicActions);

const ORACLE_ADDRESS = '0x04bdb3a7ea3bcf895c6e7e8495f8cf11602fc3f4';
// function setMaxStaleness(uint256 _seconds)
const ABI = [{
  "type": "function",
  "name": "setMaxStaleness",
  "inputs": [{"name": "_seconds", "type": "uint256", "internalType": "uint256"}],
  "outputs": [],
  "stateMutability": "nonpayable"
}];

async function main() {
  console.log('Sending transaction...');
  const tx = await client.writeContract({
    address: ORACLE_ADDRESS,
    abi: ABI,
    functionName: 'setMaxStaleness',
    args: [BigInt(31536000000)], // very large staleness
  });
  console.log('Tx sent:', tx);
  const receipt = await client.waitForTransactionReceipt({ hash: tx });
  console.log('Tx confirmed:', receipt.transactionHash);
}

main().catch(console.error);
