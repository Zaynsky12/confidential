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

const PYTH_ADDRESS = '0xACeA761c27A909d4D3895128EBe6370FDE2dF481';
const PYTH_ABI = [{
  "type": "function",
  "name": "getUpdateFee",
  "inputs": [{"name": "updateData", "type": "bytes[]", "internalType": "bytes[]"}],
  "outputs": [{"name": "feeAmount", "type": "uint256", "internalType": "uint256"}],
  "stateMutability": "view"
}];

async function main() {
  console.log('Fetching Pyth VAA...');
  // Fetch BTC/USD and ETH/USD just in case
  const url = 'https://hermes.pyth.network/v2/updates/price/latest?ids[]=e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43&ids[]=ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data || !data.binary || !data.binary.data) {
    throw new Error('Invalid response from Hermes');
  }

  const updateData = data.binary.data.map(d => '0x' + d);
  console.log('Got updateData:', updateData.length, 'feeds');

  const fee = await client.readContract({
    address: PYTH_ADDRESS,
    abi: PYTH_ABI,
    functionName: 'getUpdateFee',
    args: [updateData],
  });
  console.log('Update fee:', fee.toString());

  console.log('Sending transaction to update price feeds...');
  const tx = await client.writeContract({
    address: ORACLE_ADDRESS,
    abi: ABI,
    functionName: 'updatePriceFeeds',
    args: [updateData],
    value: fee,
  });

  console.log('Tx sent:', tx);
  const receipt = await client.waitForTransactionReceipt({ hash: tx });
  console.log('Tx confirmed:', receipt.transactionHash);
}

main().catch(console.error);
