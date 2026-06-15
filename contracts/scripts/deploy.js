import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  console.log("Starting Deployment to Arc Testnet...");
  
  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
  const ORACLE_ADDRESS = "0x2138f5930b60a6011b3edd57461d1023311d0d17"; // Pyth Price Oracle

  console.log(`USDC Address: ${USDC_ADDRESS}`);
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY is missing in .env!");
  }
  const deployer = new ethers.Wallet(privateKey, provider);

  // 1. Deploy Core
  console.log("Deploying ConfidentialCore...");
  const CoreArtifact = await hre.artifacts.readArtifact("ConfidentialCore");
  const CoreFactory = new ethers.ContractFactory(CoreArtifact.abi, CoreArtifact.bytecode, deployer);
  const core = await CoreFactory.deploy(USDC_ADDRESS, ORACLE_ADDRESS);
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();
  console.log(`✅ ConfidentialCore deployed to: ${coreAddress}`);

  // 2. Deploy Vault
  console.log("Deploying ConfidentialVault...");
  const VaultArtifact = await hre.artifacts.readArtifact("ConfidentialVault");
  const VaultFactory = new ethers.ContractFactory(VaultArtifact.abi, VaultArtifact.bytecode, deployer);
  const vault = await VaultFactory.deploy(USDC_ADDRESS, coreAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`✅ ConfidentialVault deployed to: ${vaultAddress}`);

  // 3. Deploy Trading
  console.log("Deploying ConfidentialTrading...");
  const TradingArtifact = await hre.artifacts.readArtifact("ConfidentialTrading");
  const TradingFactory = new ethers.ContractFactory(TradingArtifact.abi, TradingArtifact.bytecode, deployer);
  const trading = await TradingFactory.deploy(USDC_ADDRESS, coreAddress, vaultAddress, ORACLE_ADDRESS);
  await trading.waitForDeployment();
  const tradingAddress = await trading.getAddress();
  console.log(`✅ ConfidentialTrading deployed to: ${tradingAddress}`);

  // 4. Set Configurations in Core
  console.log("Wiring Contracts (Setting Vault and Trading in Core)...");
  
  const tx1 = await core.setVault(vaultAddress);
  await tx1.wait();
  console.log("? Vault set in Core!");

  const tx2 = await core.setTrading(tradingAddress);
  await tx2.wait();
  console.log("✅ Trading set in Core!");

  // --- FIX: Set Treasury ---
  const TREASURY_ADDRESS = "0x1E6d7683F2948960DC54a7fCf89AcA0237aE60fa";
  console.log(`Setting Treasury to: ${TREASURY_ADDRESS}...`);
  
  const tx3 = await core.setTreasury(TREASURY_ADDRESS);
  await tx3.wait();
  
  console.log("✅ Treasury set successfully!");

  console.log("🚀 DEPLOYMENT COMPLETE! 🚀");
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
