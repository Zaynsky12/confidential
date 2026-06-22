import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
    console.log("🚀 Starting Deployment of Confidential DEX V3 (Hybrid P2P)");

    if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.length < 64) {
      console.error("❌ ERROR: Invalid PRIVATE_KEY in .env file!");
      process.exitCode = 1;
      return;
    }

    const provider = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network");
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(`Deploying from account: ${deployer.address}`);

    // Read existing .env
    const envPath = path.join(__dirname, '../../.env');
    let envData = fs.readFileSync(envPath, 'utf8');

    const coreAddress = '0x3396f443b8D0D144C831cf7EB4b0cAE5c3BaBd27';
    const vaultAddress = '0x718EbD82e2fB4f8D71D2C78cAF43171c1A656b08';
    const oracleAddress = '0x897b9947185079B42d94CbbF332192CEFd9ACCFA'; 
    const usdcAddress = '0x3600000000000000000000000000000000000000'; 

    if (!coreAddress || !vaultAddress) {
        throw new Error("Missing CORE_ADDRESS or VAULT_ADDRESS in .env");
    }

    console.log(`Using Core: ${coreAddress}`);
    console.log(`Using Vault: ${vaultAddress}`);

    const loadArtifact = (name) => {
        const raw = fs.readFileSync(`./artifacts/src/${name}.sol/${name}.json`);
        return JSON.parse(raw);
    };

    const getFactory = (name) => {
        const artifact = loadArtifact(name);
        return new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
    };

    // 1. Deploy Trading V3
    console.log("Deploying ConfidentialTrading V3...");
    const TradingFactory = getFactory("ConfidentialTrading");
    const trading = await TradingFactory.deploy(usdcAddress, coreAddress, vaultAddress, oracleAddress);
    await trading.waitForDeployment();
    const tradingAddress = await trading.getAddress();
    console.log(`✅ ConfidentialTrading V3 deployed to: ${tradingAddress}`);

    // 2. Deploy P2P Contract
    console.log("Deploying ConfidentialP2P...");
    const P2PFactory = getFactory("ConfidentialP2P");
    const p2p = await P2PFactory.deploy(coreAddress, tradingAddress);
    await p2p.waitForDeployment();
    const p2pAddress = await p2p.getAddress();
    console.log(`✅ ConfidentialP2P deployed to: ${p2pAddress}`);

    // 3. Register P2P Contract in Trading
    console.log(`Authorizing P2P Contract in Trading...`);
    const tx1 = await trading.setP2PContract(p2pAddress);
    await tx1.wait();
    console.log(`✅ P2P Authorized.`);

    // 4. Update Core with new Trading contract
    console.log(`Updating Core to point to new Trading Contract...`);
    const CoreFactory = getFactory("ConfidentialCore");
    const core = CoreFactory.attach(coreAddress);
    const tx2 = await core.setTrading(tradingAddress); // using setTrading based on deploy.js!
    await tx2.wait();
    console.log(`✅ Core Updated.`);

    // Update .env file
    envData = envData.replace(/TRADING_ADDRESS=.*/g, `TRADING_ADDRESS=${tradingAddress}`);
    
    if (envData.includes('P2P_ADDRESS')) {
        envData = envData.replace(/P2P_ADDRESS=.*/g, `P2P_ADDRESS=${p2pAddress}`);
    } else {
        envData += `\nP2P_ADDRESS=${p2pAddress}\n`;
    }

    fs.writeFileSync(envPath, envData);
    console.log("✅ .env file updated with new TRADING_ADDRESS and P2P_ADDRESS");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
