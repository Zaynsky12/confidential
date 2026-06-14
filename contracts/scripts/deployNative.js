import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Starting Native Ethers Deployment to Arc Testnet...");
  
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Deployer Address:", wallet.address);

  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
  const ORACLE_ADDRESS = "0x2138f5930b60a6011b3edd57461d1023311d0d17"; // Pyth Price Oracle

  // Load Artifacts
  const coreArtifact = JSON.parse(fs.readFileSync("./artifacts/src/ConfidentialCore.sol/ConfidentialCore.json"));
  const vaultArtifact = JSON.parse(fs.readFileSync("./artifacts/src/ConfidentialVault.sol/ConfidentialVault.json"));
  const tradingArtifact = JSON.parse(fs.readFileSync("./artifacts/src/ConfidentialTrading.sol/ConfidentialTrading.json"));

  // 1. Deploy Core
  console.log("Deploying ConfidentialCore...");
  const CoreFactory = new ethers.ContractFactory(coreArtifact.abi, coreArtifact.bytecode, wallet);
  const core = await CoreFactory.deploy(USDC_ADDRESS, ORACLE_ADDRESS);
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();
  console.log(`? ConfidentialCore deployed to: ${coreAddress}`);

  // 2. Deploy Vault
  console.log("Deploying ConfidentialVault...");
  const VaultFactory = new ethers.ContractFactory(vaultArtifact.abi, vaultArtifact.bytecode, wallet);
  const vault = await VaultFactory.deploy(USDC_ADDRESS, coreAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`? ConfidentialVault deployed to: ${vaultAddress}`);

  // 3. Deploy Trading
  console.log("Deploying ConfidentialTrading...");
  const TradingFactory = new ethers.ContractFactory(tradingArtifact.abi, tradingArtifact.bytecode, wallet);
  const trading = await TradingFactory.deploy(USDC_ADDRESS, coreAddress, vaultAddress, ORACLE_ADDRESS);
  await trading.waitForDeployment();
  const tradingAddress = await trading.getAddress();
  console.log(`? ConfidentialTrading deployed to: ${tradingAddress}`);

  // 4. Set Configurations in Core
  console.log("Wiring Contracts (Setting Vault and Trading in Core)...");
  
  // Use Contract instance to call methods
  const coreContract = new ethers.Contract(coreAddress, coreArtifact.abi, wallet);
  
  const tx1 = await coreContract.setVault(vaultAddress);
  await tx1.wait();
  console.log("? Vault set in Core!");

  const tx2 = await coreContract.setTrading(tradingAddress);
  await tx2.wait();
  console.log("? Trading set in Core!");

  console.log("? DEPLOYMENT COMPLETE! ?");
  console.log("-----------------------------------------");
  console.log(`export const CONTRACTS = {`);
  console.log(`  USDC: '${USDC_ADDRESS}',`);
  console.log(`  CORE: '${coreAddress}',`);
  console.log(`  VAULT: '${vaultAddress}',`);
  console.log(`  TRADING: '${tradingAddress}',`);
  console.log(`  ORACLE: '${ORACLE_ADDRESS}',`);
  console.log(`}`);
  console.log("-----------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
