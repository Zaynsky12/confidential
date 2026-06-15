import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const CORE_ADDRESS = "0x481529b51EE0d6D39A185130A0a21C8e996Ee9D3";

  const coreArtifact = JSON.parse(fs.readFileSync("./artifacts/src/ConfidentialCore.sol/ConfidentialCore.json"));
  const coreContract = new ethers.Contract(CORE_ADDRESS, coreArtifact.abi, wallet);
  
  console.log(`Setting Fee Distribution...`);
  const tx = await coreContract.setFeeSplit(6000, 4000, 0);
  await tx.wait();
  
  console.log("Fee Distribution Successfully Set to 60/40/0!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
