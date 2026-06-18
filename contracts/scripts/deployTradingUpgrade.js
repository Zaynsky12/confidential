import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Starting Native Ethers Deployment for Trading Upgrade...");
  
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Deployer Address:", wallet.address);

  // Existing Addresses
  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
  const ORACLE_ADDRESS = "0x2138f5930b60a6011b3edd57461d1023311d0d17";
  const CORE_ADDRESS = "0x87000e8eA781B9fdBEaF0A479386efD5b38C2da9";
  const VAULT_ADDRESS = "0x6e70367215F067632d3a94EB9a7A3f63C21A680C";

  // Load Artifacts
  const coreArtifact = JSON.parse(fs.readFileSync("./artifacts/src/ConfidentialCore.sol/ConfidentialCore.json"));
  const tradingArtifact = JSON.parse(fs.readFileSync("./artifacts/src/ConfidentialTrading.sol/ConfidentialTrading.json"));

  // 1. Deploy Trading
  console.log("Deploying new ConfidentialTrading...");
  const TradingFactory = new ethers.ContractFactory(tradingArtifact.abi, tradingArtifact.bytecode, wallet);
  const trading = await TradingFactory.deploy(USDC_ADDRESS, CORE_ADDRESS, VAULT_ADDRESS, ORACLE_ADDRESS);
  await trading.waitForDeployment();
  const tradingAddress = await trading.getAddress();
  console.log(`? New ConfidentialTrading deployed to: ${tradingAddress}`);

  // 2. Set Configurations in Core
  console.log("Wiring Contracts (Setting Trading in Core)...");
  
  // Use Contract instance to call methods
  const coreContract = new ethers.Contract(CORE_ADDRESS, coreArtifact.abi, wallet);
  
  const tx = await coreContract.setTrading(tradingAddress);
  await tx.wait();
  console.log("? New Trading set in Core!");

  console.log("? UPGRADE COMPLETE! ?");
  console.log("-----------------------------------------");
  console.log(`  TRADING: '${tradingAddress}'`);
  console.log("-----------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
