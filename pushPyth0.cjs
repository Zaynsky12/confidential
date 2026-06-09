const { createWalletClient, createPublicClient, http, publicActions } = require('viem');
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
const ABI = [{
  "type": "function",
  "name": "updatePriceFeeds",
  "inputs": [{"name": "updateData", "type": "bytes[]", "internalType": "bytes[]"}],
  "outputs": [],
  "stateMutability": "payable"
}];

async function main() {
  console.log('Fetching Pyth VAA...');
  const url = 'https://hermes.pyth.network/v2/updates/price/latest?ids[]=e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';
  const response = await fetch(url);
  const data = await response.json();
  const updateData = data.binary.data.map(d => '0x' + d);

  console.log('Sending transaction to update price feeds...');
  try {
    const tx = await client.writeContract({
      address: ORACLE_ADDRESS,
      abi: ABI,
      functionName: 'updatePriceFeeds',
      args: [updateData],
      value: 0n,
    });
    console.log('Tx sent:', tx);
    const receipt = await client.waitForTransactionReceipt({ hash: tx });
    console.log('Tx confirmed:', receipt.transactionHash);
  } catch (e) {
    console.error('Reverted:', e.details || e.message);
  }
}

main().catch(console.error);
