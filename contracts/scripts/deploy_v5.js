import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
    console.log("🚀 Starting Deployment of Confidential DEX V5 (Security Patch & Clean P2P-AMM)");

    if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.length < 64) {
      console.error("❌ ERROR: Invalid PRIVATE_KEY in .env file!");
      process.exitCode = 1;
      return;
    }

    const provider = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network");
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(`Deploying from account: ${deployer.address}`);

    const coreAddress = '0x3396f443b8D0D144C831cf7EB4b0cAE5c3BaBd27';
    const oracleAddress = '0x897b9947185079B42d94CbbF332192CEFd9ACCFA'; 
    const usdcAddress = '0x3600000000000000000000000000000000000000'; 

    console.log(`Using Core: ${coreAddress}`);

    const loadArtifact = (name) => {
        const raw = fs.readFileSync(path.join(__dirname, `../artifacts/src/${name}.sol/${name}.json`));
        return JSON.parse(raw);
    };

    const getFactory = (name) => {
        const artifact = loadArtifact(name);
        return new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
    };

    // 1. Deploy New Vault
    console.log("1️⃣ Deploying ConfidentialVault V5...");
    const VaultFactory = getFactory("ConfidentialVault");
    const vault = await VaultFactory.deploy(usdcAddress, coreAddress);
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log(`✅ ConfidentialVault V5 deployed to: ${vaultAddress}`);

    // 2. Deploy New Trading
    console.log("2️⃣ Deploying ConfidentialTrading V5...");
    const TradingFactory = getFactory("ConfidentialTrading");
    const trading = await TradingFactory.deploy(usdcAddress, coreAddress, vaultAddress, oracleAddress);
    await trading.waitForDeployment();
    const tradingAddress = await trading.getAddress();
    console.log(`✅ ConfidentialTrading V5 deployed to: ${tradingAddress}`);

    // 3. Update Core
    console.log(`3️⃣ Updating Core to point to new Vault and Trading Contracts...`);
    const CoreFactory = getFactory("ConfidentialCore");
    const core = CoreFactory.attach(coreAddress);
    
    let tx = await core.setVault(vaultAddress);
    await tx.wait();
    console.log(`✅ Core linked to New Vault.`);

    tx = await core.setTrading(tradingAddress);
    await tx.wait();
    console.log(`✅ Core linked to New Trading.`);

    // Read existing .env
    const envPath = path.join(__dirname, '../../.env');
    let envData = '';
    if (fs.existsSync(envPath)) {
       envData = fs.readFileSync(envPath, 'utf8');
    }

    // Update .env file if we want to save addresses
    console.log("==================================================");
    console.log("🚀 DEPLOYMENT V5 COMPLETE!");
    console.log("NEW VAULT ADDRESS:", vaultAddress);
    console.log("NEW TRADING ADDRESS:", tradingAddress);
    console.log("==================================================");
    
    // Save to a temp file so other scripts can read it
    fs.writeFileSync(path.join(__dirname, 'latest_deploy.json'), JSON.stringify({ vaultAddress, tradingAddress }));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
