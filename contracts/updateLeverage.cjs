const { createWalletClient, createPublicClient, http, keccak256, toHex, defineChain } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
require('dotenv').config();

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
});

async function main() {
  const privateKey = process.env.PRIVATE_KEY || '0x';
  if (privateKey === '0x') {
    console.error("Missing PRIVATE_KEY in .env");
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  const client = createPublicClient({ chain: arcTestnet, transport: http() });
  const wallet = createWalletClient({ account, chain: arcTestnet, transport: http() });

  const CORE_ADDRESS = '0x3396f443b8D0D144C831cf7EB4b0cAE5c3BaBd27';
  
  const ABI = [{
    "inputs": [
      { "internalType": "bytes32", "name": "pairId", "type": "bytes32" },
      { "internalType": "uint256", "name": "maxLeverage_", "type": "uint256" }
    ],
    "name": "updatePairLeverage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }];

  const pairsToUpdate = [
    { name: "BTC/USDC", lev: 100n },
    { name: "ETH/USDC", lev: 100n },
    { name: "LINK/USDC", lev: 50n },
    { name: "ARB/USDC", lev: 50n },
    { name: "AVAX/USDC", lev: 50n },
    { name: "SUI/USDC", lev: 50n },
    { name: "APT/USDC", lev: 50n },
    { name: "NEAR/USDC", lev: 50n },
    { name: "DOGE/USDC", lev: 50n },
    { name: "PEPE/USDC", lev: 50n },
    { name: "WIF/USDC", lev: 50n },
    { name: "GOLD/USDC", lev: 50n },
    { name: "SILVER/USDC", lev: 50n },
    { name: "AAPL/USDC", lev: 20n },
    { name: "TSLA/USDC", lev: 20n },
    { name: "NVDA/USDC", lev: 20n }
  ];

  console.log(`Starting leverage updates as owner: ${account.address}`);
  let nonce = await client.getTransactionCount({ address: account.address });

  for (const p of pairsToUpdate) {
    const pairId = keccak256(toHex(p.name));
    console.log(`Updating ${p.name} to ${p.lev}x...`);
    
    try {
      const hash = await wallet.writeContract({
        address: CORE_ADDRESS,
        abi: ABI,
        functionName: 'updatePairLeverage',
        args: [pairId, p.lev],
        nonce: nonce++
      });
      console.log(`  -> Tx: ${hash}`);
    } catch (e) {
      console.error(`  -> Failed for ${p.name}: ${e.message}`);
    }
  }

  console.log("All updates sent to mempool!");
}

main().catch(console.error);
