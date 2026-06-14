import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Setting Treasury Address...");
  
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // The newly deployed Core Address
  const CORE_ADDRESS = "0x481529b51EE0d6D39A185130A0a21C8e996Ee9D3";
  const TREASURY_ADDRESS = "0x1E6d7683F2948960DC54a7fCf89AcA0237aE60fa";

  const coreArtifact = JSON.parse(fs.readFileSync("./artifacts/src/ConfidentialCore.sol/ConfidentialCore.json"));
  const coreContract = new ethers.Contract(CORE_ADDRESS, coreArtifact.abi, wallet);
  
  console.log(`Setting Treasury to ${TREASURY_ADDRESS}...`);
  const tx = await coreContract.setTreasury(TREASURY_ADDRESS);
  await tx.wait();
  
  console.log("? Treasury Address Successfully Set!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
