import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const updates = [
  // Crypto Major (100x)
  { pairs: ['BTC/USDC', 'ETH/USDC', 'SOL/USDC', 'BNB/USDC', 'XRP/USDC'], leverage: 100 },
  // Altcoins (75x)
  { pairs: ['LINK/USDC', 'ARB/USDC', 'AVAX/USDC', 'SUI/USDC', 'APT/USDC', 'NEAR/USDC'], leverage: 75 },
  // Meme Coins (50x)
  { pairs: ['DOGE/USDC', 'PEPE/USDC', 'WIF/USDC'], leverage: 50 },
  // RWA (50x)
  { pairs: ['AAPL/USDC', 'TSLA/USDC', 'SPY/USDC', 'NVDA/USDC'], leverage: 50 },
  // Forex & Metals (125x)
  { pairs: ['EUR/USDC', 'GBP/USDC', 'USDJPY/USDC', 'GOLD/USDC', 'SILVER/USDC'], leverage: 125 }
];

async function main() {
  if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.length < 64 || process.env.PRIVATE_KEY.includes('000000000000000000')) {
    console.error("❌ ERROR: Please set your real PRIVATE_KEY in contracts/.env");
    process.exitCode = 1;
    return;
  }

  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const CORE_ADDRESS = "0xa40580Eb283725dCf42CE74735e7Cc324aE56F7f";
  const abi = ["function updatePairLeverage(bytes32 pairId, uint256 maxLeverage_) external"];
  const core = new ethers.Contract(CORE_ADDRESS, abi, wallet);

  console.log("Updating maximum leverages...");

  for (const group of updates) {
    for (const pairName of group.pairs) {
      try {
        const pairId = ethers.id(pairName);
        const tx = await core.updatePairLeverage(pairId, group.leverage);
        console.log(`Updating ${pairName} to ${group.leverage}x (Tx: ${tx.hash})`);
        await tx.wait();
        console.log(`✅ ${pairName} updated to ${group.leverage}x`);
      } catch (err) {
        console.error(`❌ Failed to update ${pairName}:`, err.reason || err.shortMessage || err.message);
      }
    }
  }

  console.log("==================================");
  console.log("LEVERAGE UPDATE COMPLETE!");
  console.log("==================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
