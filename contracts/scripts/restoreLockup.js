import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config({ path: '../.env' });

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const VAULT_ADDRESS = "0x3a9e038bB29C2d8dc13891639b444a80B8F57952";
  
  const vaultAbi = [
    "function setTieredLockups(uint256 _degenSeconds, uint256 _primeSeconds) external"
  ];
  const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, wallet);

  console.log("Restoring lockup periods (2 days Degen / 5 days Prime)...");
  // 2 days = 172800 seconds, 5 days = 432000 seconds
  const tx = await vault.setTieredLockups(172800, 432000);
  await tx.wait();
  
  console.log("✅ Lockup periods restored successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
