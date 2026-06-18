import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function main() {
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ ERROR: Please set your PRIVATE_KEY in contracts/.env");
    process.exitCode = 1;
    return;
  }

  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
  const CORE_ADDRESS = "0xa40580Eb283725dCf42CE74735e7Cc324aE56F7f";
  const ORACLE_ADDRESS = "0xe0E76F817494e624d3CDdAC1218fCDe9624f65d3";

  console.log("Starting Bedah Jantung (Vault & Trading Deployment)...");
  
  // 1. Deploy New Vault
  console.log("1️⃣ Deploying new ConfidentialVault...");
  const vaultCompiledFile = fs.readFileSync("./artifacts/src/ConfidentialVault.sol/ConfidentialVault.json", "utf8");
  const vaultCompiled = JSON.parse(vaultCompiledFile);
  const vaultFactory = new ethers.ContractFactory(vaultCompiled.abi, vaultCompiled.bytecode, wallet);
  const vault = await vaultFactory.deploy(USDC_ADDRESS, CORE_ADDRESS);
  await vault.waitForDeployment();
  const NEW_VAULT_ADDRESS = await vault.getAddress();
  console.log("✅ New Vault Deployed to:", NEW_VAULT_ADDRESS);

  // 2. Deploy New Trading (Linked to New Vault)
  console.log("2️⃣ Deploying new ConfidentialTrading...");
  const tradingCompiledFile = fs.readFileSync("./artifacts/src/ConfidentialTrading.sol/ConfidentialTrading.json", "utf8");
  const tradingCompiled = JSON.parse(tradingCompiledFile);
  const tradingFactory = new ethers.ContractFactory(tradingCompiled.abi, tradingCompiled.bytecode, wallet);
  const trading = await tradingFactory.deploy(USDC_ADDRESS, CORE_ADDRESS, NEW_VAULT_ADDRESS, ORACLE_ADDRESS);
  await trading.waitForDeployment();
  const NEW_TRADING_ADDRESS = await trading.getAddress();
  console.log("✅ New Trading Deployed to:", NEW_TRADING_ADDRESS);

  // 3. Update Core
  console.log("3️⃣ Updating ConfidentialCore...");
  const coreAbi = [
    "function setVault(address _vault) external",
    "function setTrading(address _trading) external"
  ];
  const core = new ethers.Contract(CORE_ADDRESS, coreAbi, wallet);
  
  let tx = await core.setVault(NEW_VAULT_ADDRESS);
  await tx.wait();
  console.log("✅ Core linked to New Vault.");

  tx = await core.setTrading(NEW_TRADING_ADDRESS);
  await tx.wait();
  console.log("✅ Core linked to New Trading.");

  console.log("==================================================");
  console.log("🚀 BEDAH JANTUNG COMPLETE!");
  console.log("NEW VAULT ADDRESS:", NEW_VAULT_ADDRESS);
  console.log("NEW TRADING ADDRESS:", NEW_TRADING_ADDRESS);
  console.log("IMPORTANT: Don't forget to update these addresses in:");
  console.log("1. src/config/contracts.ts");
  console.log("2. subgraph/subgraph.yaml");
  console.log("==================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
