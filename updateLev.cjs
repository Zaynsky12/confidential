const { createWalletClient, http, publicActions, parseAbi, keccak256, toHex } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { defineChain } = require('viem');

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { decimals: 18, name: 'ETH', symbol: 'ETH' },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
});

const privateKey = '0x5ed9d2254238154e5f20d3f4a3c95a41e007b616b82fef54beefd57db35f966e';
const account = privateKeyToAccount(privateKey);

const client = createWalletClient({
  account,
  chain: arcTestnet,
  transport: http()
}).extend(publicActions);

const CORE_ADDRESS = '0x769c307ca53c2b84decea5b2a6f45304cd7785cb';

const coreAbi = parseAbi([
  'function updatePairLeverage(bytes32 pairId, uint256 maxLeverage_) external'
]);

async function main() {
  console.log(`Connecting as ${account.address}`);
  
  const goldId = keccak256(toHex('GOLD/USDC'));
  const silverId = keccak256(toHex('SILVER/USDC'));

  console.log(`Updating GOLD/USDC (100x)...`);
  const tx1 = await client.writeContract({
    address: CORE_ADDRESS,
    abi: coreAbi,
    functionName: 'updatePairLeverage',
    args: [goldId, 100n],
  });
  console.log(`Tx1 Hash: ${tx1}`);

  console.log(`Updating SILVER/USDC (100x)...`);
  const tx2 = await client.writeContract({
    address: CORE_ADDRESS,
    abi: coreAbi,
    functionName: 'updatePairLeverage',
    args: [silverId, 100n],
  });
  console.log(`Tx2 Hash: ${tx2}`);
  console.log('Update Complete!');
}

main().catch(console.error);
