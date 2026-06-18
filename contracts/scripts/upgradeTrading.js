import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function main() {
  if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.length < 64 || process.env.PRIVATE_KEY.includes('000000000000000000')) {
    console.error("❌ ERROR: Please set your real PRIVATE_KEY in contracts/.env");
    process.exitCode = 1;
    return;
  }

  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
  const CORE_ADDRESS = "0xa40580Eb283725dCf42CE74735e7Cc324aE56F7f";
  const VAULT_ADDRESS = "0x242Cd3Cd3711415527b6b020d9413cEB0Ae900c8";
  const ORACLE_ADDRESS = "0xe0E76F817494e624d3CDdAC1218fCDe9624f65d3";

  console.log("Deploying upgraded ConfidentialTrading...");
  
  // Read compiled JSON from Hardhat artifacts folder
  const compiledFile = fs.readFileSync("./artifacts/src/ConfidentialTrading.sol/ConfidentialTrading.json", "utf8");
  const compiled = JSON.parse(compiledFile);

  const factory = new ethers.ContractFactory(compiled.abi, compiled.bytecode, wallet);
  const trading = await factory.deploy(USDC_ADDRESS, CORE_ADDRESS, VAULT_ADDRESS, ORACLE_ADDRESS);
  await trading.waitForDeployment();
  
  const tradingAddress = await trading.getAddress();
  console.log("✅ Upgraded Trading Deployed to:", tradingAddress);

  // Link to core
  console.log("Linking new Trading contract to Core...");
  const coreAbi = ["function setTrading(address _trading) external"];
  const core = new ethers.Contract(CORE_ADDRESS, coreAbi, wallet);
  
  const tx = await core.setTrading(tradingAddress);
  await tx.wait();
  console.log("✅ Core linked to new Trading contract.");

  console.log("==================================================");
  console.log("UPGRADE COMPLETE!");
  console.log("NEW TRADING ADDRESS:", tradingAddress);
  console.log("IMPORTANT: Don't forget to update this address in:");
  console.log("1. src/config/contracts.ts");
  console.log("2. subgraph/subgraph.yaml");
  console.log("==================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
