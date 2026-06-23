import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ ERROR: Please set your PRIVATE_KEY in contracts/.env");
    process.exitCode = 1;
    return;
  }

  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Address from src/config/contracts.ts
  const VAULT_ADDRESS = "0x3a9e038bB29C2d8dc13891639b444a80B8F57952";

  console.log("Connecting to Vault at:", VAULT_ADDRESS);
  
  const vaultAbi = [
    "function setTieredLockups(uint256 _degenSeconds, uint256 _primeSeconds) external"
  ];
  const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, wallet);

  const degenLockup = 2 * 24 * 60 * 60; // 2 Days in seconds (172800)
  const primeLockup = 5 * 24 * 60 * 60; // 5 Days in seconds (432000)

  console.log(`Setting lockup periods: Degen = ${degenLockup}s, Prime = ${primeLockup}s...`);
  const tx = await vault.setTieredLockups(degenLockup, primeLockup);
  console.log("Tx hash:", tx.hash);
  console.log("Waiting for confirmation...");
  await tx.wait();
  
  console.log("✅ Lockup periods successfully RESTORED! (Degen: 2 Days, Prime: 5 Days)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
