import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });
if (!process.env.PRIVATE_KEY && fs.existsSync(path.join(__dirname, '../.env'))) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

async function main() {
    console.log("🚀 Starting Deployment of ConfidentialTrading V2 (0% Limit Order Buffer)");
    console.log("═════════════════════════════════════════════════════════════════════════════");

    const pk = process.env.PRIVATE_KEY || process.env.BOT_KEEPER_PRIVATE_KEY;
    if (!pk || pk.length < 64) {
      console.error("❌ ERROR: Invalid PRIVATE_KEY in .env file!");
      process.exitCode = 1;
      return;
    }

    const provider = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network");
    const deployer = new ethers.Wallet(pk, provider);
    console.log(`Deploying from account: ${deployer.address}`);
    
    const balance = await provider.getBalance(deployer.address);
    console.log(`Account balance: ${ethers.formatEther(balance)} ARC`);

    // Load existing V1 deploy info
    const deployInfoPath = path.join(__dirname, 'latest_deploy.json');
    const deployInfo = JSON.parse(fs.readFileSync(deployInfoPath, 'utf8'));
    
    const coreAddress = deployInfo.coreAddress;
    const vaultAddress = deployInfo.vaultAddress;
    const oracleAddress = deployInfo.oracleAddress;
    const usdcAddress = deployInfo.usdcAddress;

    console.log(`\nReusing Existing Core:   ${coreAddress}`);
    console.log(`Reusing Existing Vault:  ${vaultAddress}`);
    console.log(`Reusing Existing Oracle: ${oracleAddress}`);

    const loadArtifact = (name) => {
        const raw = fs.readFileSync(path.join(__dirname, `../artifacts/src/${name}.sol/${name}.json`));
        return JSON.parse(raw);
    };

    // ═══════════════════════════════════════════
    // Step 1: Deploy ConfidentialTrading V2
    // ═══════════════════════════════════════════
    console.log("\n1️⃣  Deploying ConfidentialTrading V2...");
    const TradingArtifact = loadArtifact("ConfidentialTrading");
    const TradingFactory = new ethers.ContractFactory(TradingArtifact.abi, TradingArtifact.bytecode, deployer);
    const trading = await TradingFactory.deploy(usdcAddress, coreAddress, vaultAddress, oracleAddress);
    await trading.waitForDeployment();
    const newTradingAddress = await trading.getAddress();
    console.log(`✅ ConfidentialTrading V2 deployed to: ${newTradingAddress}`);

    // ═══════════════════════════════════════════
    // Step 2: Link Core & Vault to new Trading
    // ═══════════════════════════════════════════
    console.log("\n2️⃣  Linking Core & Vault to new Trading V2...");
    const CoreArtifact = loadArtifact("ConfidentialCore");
    const coreContract = new ethers.Contract(coreAddress, CoreArtifact.abi, deployer);

    const VaultArtifact = loadArtifact("ConfidentialVault");
    const vaultContract = new ethers.Contract(vaultAddress, VaultArtifact.abi, deployer);

    let tx = await coreContract.setTrading(newTradingAddress);
    await tx.wait();
    console.log("   ✅ Core → Trading linked to V2 (Vault dynamically reads core.trading())");

    // ═══════════════════════════════════════════
    // Step 3: Verify Linkage
    // ═══════════════════════════════════════════
    console.log("\n3️⃣  Verifying linkage...");
    const linkedTradingCore = await coreContract.trading();
    console.log(`   Core.trading:  ${linkedTradingCore} ${linkedTradingCore === newTradingAddress ? '✅' : '❌'}`);

    if (linkedTradingCore !== newTradingAddress) {
        throw new Error("❌ Verification Failed!");
    }

    // ═══════════════════════════════════════════
    // Step 4: Update config files
    // ═══════════════════════════════════════════
    console.log("\n4️⃣  Updating project configuration files...");
    
    // Update latest_deploy.json
    deployInfo.tradingAddress = newTradingAddress;
    deployInfo.version = "V2 (0% Limit Buffer)";
    deployInfo.timestamp = new Date().toISOString();
    fs.writeFileSync(deployInfoPath, JSON.stringify(deployInfo, null, 2));
    console.log("   ✅ Updated contracts/scripts/latest_deploy.json");

    // Update src/config/contracts.ts
    const contractsTsPath = path.join(__dirname, '../../src/config/contracts.ts');
    let contractsTs = fs.readFileSync(contractsTsPath, 'utf8');
    contractsTs = contractsTs.replace(
      /TRADING:\s*'0x[a-fA-F0-9]{40}'/,
      `TRADING: '${newTradingAddress}'`
    );
    fs.writeFileSync(contractsTsPath, contractsTs);
    console.log("   ✅ Updated src/config/contracts.ts");

    // Update subgraph/subgraph.yaml
    const subgraphYamlPath = path.join(__dirname, '../../subgraph/subgraph.yaml');
    if (fs.existsSync(subgraphYamlPath)) {
      let subgraphYaml = fs.readFileSync(subgraphYamlPath, 'utf8');
      const oldTrading = /address:\s*"0x[a-fA-F0-9]{40}"\s*# TRADING/g;
      subgraphYaml = subgraphYaml.replace(oldTrading, `address: "${newTradingAddress}" # TRADING`);
      fs.writeFileSync(subgraphYamlPath, subgraphYaml);
      console.log("   ✅ Updated subgraph/subgraph.yaml");
    }

    // Update contracts/feederBot.cjs default address
    const feederBotPath = path.join(__dirname, '../feederBot.cjs');
    if (fs.existsSync(feederBotPath)) {
      let feederBot = fs.readFileSync(feederBotPath, 'utf8');
      feederBot = feederBot.replace(
        /let TRADING_ADDRESS = "0x[a-fA-F0-9]{40}";/,
        `let TRADING_ADDRESS = "${newTradingAddress}";`
      );
      fs.writeFileSync(feederBotPath, feederBot);
      console.log("   ✅ Updated contracts/feederBot.cjs");
    }

    console.log("\n═════════════════════════════════════════════════════════════════════════════");
    console.log(`🎉 SUCCESS! ConfidentialTrading V2 is live at: ${newTradingAddress}`);
    console.log("═════════════════════════════════════════════════════════════════════════════");
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
