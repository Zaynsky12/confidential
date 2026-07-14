import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const deployInfo = JSON.parse(fs.readFileSync(path.join(__dirname, 'latest_deploy.json'), 'utf8'));
  const CORE_ADDRESS = deployInfo.coreAddress;
  console.log(`Using Core contract: ${CORE_ADDRESS}`);

  const coreArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '../artifacts/src/ConfidentialCoreV1.sol/ConfidentialCoreV1.json')));
  const coreContract = new ethers.Contract(CORE_ADDRESS, coreArtifact.abi, wallet);

  const PAIRS = [
    { name: 'BTC/USDC' },
    { name: 'ETH/USDC' },
    { name: 'SOL/USDC' },
    { name: 'BNB/USDC' },
    { name: 'XRP/USDC' },
    { name: 'LINK/USDC' },
    { name: 'ARB/USDC' },
    { name: 'AVAX/USDC' },
    { name: 'SUI/USDC' },
    { name: 'APT/USDC' },
    { name: 'NEAR/USDC' },
    { name: 'DOGE/USDC' },
    { name: 'PEPE/USDC' },
    { name: 'WIF/USDC' },
    { name: 'AAPL/USDC' },
    { name: 'TSLA/USDC' },
    { name: 'GOLD/USDC' },
    { name: 'SILVER/USDC' },
    { name: 'SPY/USDC' },
    { name: 'NVDA/USDC' },
    { name: 'EUR/USDC' },
    { name: 'GBP/USDC' },
    { name: 'USDJPY/USDC' },
  ];

  console.log(`\nUpdating OI limits for ${PAIRS.length} trading pairs...`);
  let success = 0;

  for (const pair of PAIRS) {
    const pairId = ethers.keccak256(ethers.toUtf8Bytes(pair.name));
    const isMajor = pair.name === 'BTC/USDC' || pair.name === 'ETH/USDC';
    const limitUsd = isMajor ? "10000000" : "5000000"; // $10M for BTC/ETH, $5M for others
    const maxOI = ethers.parseUnits(limitUsd, 6);
    const maxPositionPct = 10000; // 100%

    try {
      console.log(`  📝 Updating ${pair.name} limits to $${limitUsd}...`);
      const tx = await coreContract.updatePairLimits(pairId, maxOI, maxOI, maxPositionPct);
      console.log(`     Sent tx: ${tx.hash}`);
      await tx.wait();
      console.log(`  ✅ ${pair.name} successfully updated to $${limitUsd}!`);
      success++;
    } catch (e) {
      console.error(`  ❌ Failed to update ${pair.name}:`, e.message?.slice(0, 150));
    }
  }

  console.log(`\n🎉 Finished updating limits! Successfully updated ${success} / ${PAIRS.length} pairs.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
