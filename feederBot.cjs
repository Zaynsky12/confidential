const { createWalletClient, createPublicClient, http, keccak256, toHex, parseUnits } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
require('dotenv').config();
const { defineChain } = require('viem');
// const fetch = require('node-fetch'); // Ensure node-fetch is installed or use global fetch in Node 18+

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

const privateKey = process.env.PRIVATE_KEY || '0x';
if (privateKey === '0x') {
    console.error("Missing PRIVATE_KEY in .env");
    process.exit(1);
}
const account = privateKeyToAccount(privateKey);
const client = createPublicClient({ chain: arcTestnet, transport: http() });
const wallet = createWalletClient({ account, chain: arcTestnet, transport: http() });

const ORACLE_ADDRESS = '0xf004ab1ea65151e1215b918077665c7d29e122c8';
const ORACLE_ABI = [
  {"type":"function","name":"updatePriceFeeds","inputs":[{"name":"updateData","type":"bytes[]"}],"outputs":[],"stateMutability":"payable"},
  {"type":"function","name":"pyth","inputs":[],"outputs":[{"name":"","type":"address"}],"stateMutability":"view"}
];

const PAIRS = [
  { name: 'BTC/USDC', pythId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43' },
  { name: 'ETH/USDC', pythId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace' },
  { name: 'SOL/USDC', pythId: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d' },
  { name: 'BNB/USDC', pythId: '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f' },
  { name: 'XRP/USDC', pythId: '0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8' },
  { name: 'LINK/USDC', pythId: '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221' },
  { name: 'ARB/USDC', pythId: '0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5' },
  { name: 'AVAX/USDC', pythId: '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7' },
  { name: 'SUI/USDC', pythId: '0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744' },
  { name: 'APT/USDC', pythId: '0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5' },
  { name: 'NEAR/USDC', pythId: '0xc415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750' },
  { name: 'DOGE/USDC', pythId: '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c' },
  { name: 'PEPE/USDC', pythId: '0xd69731a2e74ac1ce884fc3890f7ee324b6deb66147055249568869ed700882e4' },
  { name: 'WIF/USDC', pythId: '0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6ee41b54cd4cc61fc' },
  { name: 'AAPL/USDC', pythId: '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688' },
  { name: 'TSLA/USDC', pythId: '0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1' },
  { name: 'GOLD/USDC', pythId: '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2' },
  { name: 'SILVER/USDC', pythId: '0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e' },
  { name: 'SPY/USDC', pythId: '0x19e09bb805456ada3979a7d1cbb4b6d63babc3a0f8e8a9509f68afa5c4c11cd5' },
  { name: 'NVDA/USDC', pythId: '0xb1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593' },
  { name: 'EUR/USDC', pythId: '0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b' },
  { name: 'GBP/USDC', pythId: '0x84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1' },
  { name: 'USDJPY/USDC', pythId: '0xef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52' },
];

async function updatePrices() {
  try {
    const ids = PAIRS.map(p => p.pythId).join('&ids[]=');
    const response = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${ids}`);
    const data = await response.json();

    if (!data.binary || !data.binary.data) return;

    // Convert Hermes VAA payloads to bytes[]
    const updateData = data.binary.data.map(d => '0x' + d.replace('0x', ''));

    // To get the fee, we need to read from the official Pyth contract.
    // Our oracle forwards it. But our oracle doesn't expose getUpdateFee!
    // Wait, let's read directly from the Pyth contract on Arc testnet.
    const PYTH_ADDRESS = '0x2880aB155794e7179c9eE2e38200202908C17B43';
    const PYTH_ABI = [{"inputs":[{"internalType":"bytes[]","name":"updateData","type":"bytes[]"}],"name":"getUpdateFee","outputs":[{"internalType":"uint256","name":"feeAmount","type":"uint256"}],"stateMutability":"view","type":"function"}];
    
    const fee = await client.readContract({
      address: PYTH_ADDRESS,
      abi: PYTH_ABI,
      functionName: 'getUpdateFee',
      args: [updateData]
    });

    for (let i = 0; i < PAIRS.length; i++) {
        const pair = PAIRS[i];
        const cleanId = pair.pythId.replace('0x', '');
        const pythData = data.parsed.find(d => d.id === cleanId);
        if (pythData) {
            const priceNum = Number(pythData.price.price) * (10 ** pythData.price.expo);
            console.log(`[${new Date().toLocaleTimeString()}] Fetched ${pair.name} Live Price: $${priceNum.toFixed(2)}`);
        }
    }

    // Push Cryptographic VAA to Smart Contract
    await wallet.writeContract({
      address: ORACLE_ADDRESS,
      abi: ORACLE_ABI,
      functionName: 'updatePriceFeeds',
      args: [updateData],
      value: fee
    });
    console.log(`[${new Date().toLocaleTimeString()}] ✅ Pyth VAA Pushed to On-Chain Oracle successfully!`);

  } catch (e) {
    console.error('Error updating prices:', e.message);
  }
}

console.log('Starting Live Price Feeder Bot for Arc Testnet...');
console.log('Bot will sync real-time Pyth prices to the Smart Contract every 10 seconds.');
// Run immediately
updatePrices();
// Run every 10 seconds
setInterval(updatePrices, 10000);
