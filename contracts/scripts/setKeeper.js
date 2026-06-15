import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({path: "../.env"});
dotenv.config(); // also load local

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const adminWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const keeperWallet = new ethers.Wallet(process.env.BOT_KEEPER_PRIVATE_KEY, provider);
  
  const CORE_ADDRESS = "0x87000e8eA781B9fdBEaF0A479386efD5b38C2da9";

  const coreArtifact = JSON.parse(fs.readFileSync("./artifacts/src/ConfidentialCore.sol/ConfidentialCore.json"));
  const coreContract = new ethers.Contract(CORE_ADDRESS, coreArtifact.abi, adminWallet);

  console.log(`Setting keeper status for bot address: ${keeperWallet.address}`);
  const tx = await coreContract.setKeeper(keeperWallet.address, true);
  console.log("Tx hash:", tx.hash);
  await tx.wait();
  console.log("Keeper registered successfully!");
}

main().catch(console.error);
