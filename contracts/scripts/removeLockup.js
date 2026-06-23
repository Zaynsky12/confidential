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

  console.log("Removing lockup periods (setting to 0)...");
  const tx = await vault.setTieredLockups(0, 0);
  console.log("Tx hash:", tx.hash);
  await tx.wait();
  
  console.log("✅ Lockup periods removed successfully! You can now withdraw.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
