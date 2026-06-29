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

  const VAULT_ADDRESS = "0x64b5a121D7a0CAcAB2F0fde5957768CfF9745FaE";

  console.log("Connecting to Vault at:", VAULT_ADDRESS);
  
  const vaultAbi = [
    "function setTieredLockups(uint256 _degenSeconds, uint256 _primeSeconds) external"
  ];
  const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, wallet);

  console.log(`Setting lockup periods: Degen = 0s, Prime = 0s...`);
  const tx = await vault.setTieredLockups(0, 0);
  console.log("Tx hash:", tx.hash);
  console.log("Waiting for confirmation...");
  await tx.wait();
  
  console.log("✅ Lockup periods successfully REMOVED! You can withdraw immediately.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
