import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
    console.log("🚀 Starting Deployment of Confidential DEX V7 (No P2P, Pure Vault Execution)");

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
    
    // Use the latest vault address
    const deployPath = path.join(__dirname, "latest_deploy.json");
    let vaultAddress = "0x64b5a121D7a0CAcAB2F0fde5957768CfF9745FaE"; // V5 Vault
    if (fs.existsSync(deployPath)) {
      const data = JSON.parse(fs.readFileSync(deployPath, "utf8"));
      if (data.vaultAddress) vaultAddress = data.vaultAddress;
    }

    console.log(`Using Core: ${coreAddress}`);
    console.log(`Using Vault (V5): ${vaultAddress}`);

    const loadArtifact = (name) => {
        const raw = fs.readFileSync(path.join(__dirname, `../artifacts/src/${name}.sol/${name}.json`));
        return JSON.parse(raw);
    };

    const getFactory = (name) => {
        const artifact = loadArtifact(name);
        return new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
    };

    // 1. Deploy New Trading (V7)
    console.log("1️⃣ Deploying ConfidentialTrading V7...");
    const TradingFactory = getFactory("ConfidentialTrading");
    const trading = await TradingFactory.deploy(usdcAddress, coreAddress, vaultAddress, oracleAddress);
    await trading.waitForDeployment();
    const tradingAddress = await trading.getAddress();
    console.log(`✅ ConfidentialTrading V7 deployed to: ${tradingAddress}`);

    // 2. Update Core
    console.log(`2️⃣ Updating Core to point to new Trading Contract V7...`);
    const CoreFactory = getFactory("ConfidentialCore");
    const core = CoreFactory.attach(coreAddress);
    
    const tx = await core.setTrading(tradingAddress);
    await tx.wait();
    console.log(`✅ Core linked to New Trading V7.`);

    // Update latest_deploy.json
    fs.writeFileSync(path.join(__dirname, 'latest_deploy.json'), JSON.stringify({ vaultAddress, tradingAddress }));

    console.log("==================================================");
    console.log("🚀 DEPLOYMENT V7 COMPLETE!");
    console.log("NEW TRADING ADDRESS:", tradingAddress);
    console.log("VAULT ADDRESS REMAINS:", vaultAddress);
    console.log("==================================================");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
