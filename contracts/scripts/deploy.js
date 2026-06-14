import hre from "hardhat";

async function main() {
  console.log("Starting Deployment to Arc Testnet...");
  
  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
  const ORACLE_ADDRESS = "0x2138f5930b60a6011b3edd57461d1023311d0d17"; // Pyth Price Oracle

  console.log(`USDC Address: ${USDC_ADDRESS}`);
  console.log(`Oracle Address: ${ORACLE_ADDRESS}`);

  // 1. Deploy Core
  console.log("Deploying ConfidentialCore...");
  const Core = await hre.ethers.getContractFactory("ConfidentialCore");
  const core = await Core.deploy(USDC_ADDRESS, ORACLE_ADDRESS);
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();
  console.log(`? ConfidentialCore deployed to: ${coreAddress}`);

  // 2. Deploy Vault
  console.log("Deploying ConfidentialVault...");
  const Vault = await hre.ethers.getContractFactory("ConfidentialVault");
  const vault = await Vault.deploy(USDC_ADDRESS, coreAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`? ConfidentialVault deployed to: ${vaultAddress}`);

  // 3. Deploy Trading
  console.log("Deploying ConfidentialTrading...");
  const Trading = await hre.ethers.getContractFactory("ConfidentialTrading");
  const trading = await Trading.deploy(USDC_ADDRESS, coreAddress, vaultAddress, ORACLE_ADDRESS);
  await trading.waitForDeployment();
  const tradingAddress = await trading.getAddress();
  console.log(`? ConfidentialTrading deployed to: ${tradingAddress}`);

  // 4. Set Configurations in Core
  console.log("Wiring Contracts (Setting Vault and Trading in Core)...");
  
  const tx1 = await core.setVault(vaultAddress);
  await tx1.wait();
  console.log("? Vault set in Core!");

  const tx2 = await core.setTrading(tradingAddress);
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
