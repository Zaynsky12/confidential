import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function main() {
  console.log("🚀 Updating Vault Caps (70% Prime, 30% Degen)");

  if (!process.env.PRIVATE_KEY) {
    console.error("❌ ERROR: Please set your PRIVATE_KEY in contracts/.env");
    process.exitCode = 1;
    return;
  }

  const provider = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Read latest deploy
  const deployPath = path.join(__dirname, "latest_deploy.json");
  let vaultAddress = "0x64b5a121D7a0CAcAB2F0fde5957768CfF9745FaE"; // fallback
  if (fs.existsSync(deployPath)) {
    const data = JSON.parse(fs.readFileSync(deployPath, "utf8"));
    if (data.vaultAddress) vaultAddress = data.vaultAddress;
  }

  console.log("Connecting to Vault at:", vaultAddress);
  
  const vaultAbi = [
    "function setDepositCaps(uint256 _perUser, uint256 _degenTotal, uint256 _primeTotal) external",
    "function setPrimeProtection(uint256 _bps) external"
  ];
  
  const vault = new ethers.Contract(vaultAddress, vaultAbi, wallet);

  // 15M Degen (30%), 35M Prime (70%), 1M per user
  const maxPerUser = ethers.parseUnits("1000000", 6);
  const maxDegen = ethers.parseUnits("15000000", 6);
  const maxPrime = ethers.parseUnits("35000000", 6);

  console.log("1️⃣ Updating Deposit Caps...");
  let tx = await vault.setDepositCaps(maxPerUser, maxDegen, maxPrime);
  console.log("Tx hash:", tx.hash);
  await tx.wait();
  console.log("✅ Deposit Caps Updated!");

  console.log("2️⃣ Updating Prime Protection to 70% (7000 bps)...");
  tx = await vault.setPrimeProtection(7000);
  console.log("Tx hash:", tx.hash);
  await tx.wait();
  console.log("✅ Prime Protection Updated!");

  console.log("🎉 All Vault configurations successfully updated to 70/30 ratio.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
