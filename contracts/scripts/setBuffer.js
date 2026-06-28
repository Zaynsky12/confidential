import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function main() {
  console.log("🚀 Updating Execution Buffer to 0.3% (30 bps)");

  if (!process.env.PRIVATE_KEY) {
    console.error("❌ ERROR: Please set your PRIVATE_KEY in contracts/.env");
    process.exitCode = 1;
    return;
  }

  const provider = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Read latest deploy
  const deployPath = path.join(__dirname, "latest_deploy.json");
  let tradingAddress = "0x84a8B259d4c07eB042C046Cf5C95Db59a9407e40"; 
  if (fs.existsSync(deployPath)) {
    const data = JSON.parse(fs.readFileSync(deployPath, "utf8"));
    if (data.tradingAddress) tradingAddress = data.tradingAddress;
  }

  console.log("Connecting to Trading at:", tradingAddress);
  
  const tradingAbi = [
    "function setExecutionBufferBps(uint256 _bps) external"
  ];
  
  const trading = new ethers.Contract(tradingAddress, tradingAbi, wallet);

  console.log("Setting executionBufferBps to 30...");
  let tx = await trading.setExecutionBufferBps(30);
  console.log("Tx hash:", tx.hash);
  await tx.wait();
  console.log("✅ Execution Buffer Updated to 0.3%!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
