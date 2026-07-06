import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

async function main() {
    console.log("🚀 Starting FULL Deployment of Confidential DEX V2 (Fresh Start)");
    console.log("═══════════════════════════════════════════════════════");

    if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.length < 64) {
      console.error("❌ ERROR: Invalid PRIVATE_KEY in .env file!");
      process.exitCode = 1;
      return;
    }

    const provider = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network");
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(`Deploying from account: ${deployer.address}`);
    
    const balance = await provider.getBalance(deployer.address);
    console.log(`Account balance: ${ethers.formatEther(balance)} ARC`);

    // Constants
    const usdcAddress = '0x3600000000000000000000000000000000000000';
    const oracleAddress = '0x897b9947185079B42d94CbbF332192CEFd9ACCFA'; // Reuse existing Oracle
    const pythContractAddress = '0xA2aa501b19aff244D90cc15a4Cf739D2725B5729'; // Pyth on Arc Testnet

    const loadArtifact = (name) => {
        const raw = fs.readFileSync(path.join(__dirname, `../artifacts/src/${name}.sol/${name}.json`));
        return JSON.parse(raw);
    };

    const getFactory = (name) => {
        const artifact = loadArtifact(name);
        return new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
    };

    // ═══════════════════════════════════════════
    // Step 1: Deploy ConfidentialCore (NEW)
    // ═══════════════════════════════════════════
    console.log("\n1️⃣  Deploying ConfidentialCore V2...");
    const CoreFactory = getFactory("ConfidentialCoreV1");
    const core = await CoreFactory.deploy(usdcAddress, oracleAddress);
    await core.waitForDeployment();
    const coreAddress = await core.getAddress();
    console.log(`✅ ConfidentialCore deployed to: ${coreAddress}`);

    // ═══════════════════════════════════════════
    // Step 2: Deploy ConfidentialVault (NEW)
    // ═══════════════════════════════════════════
    console.log("\n2️⃣  Deploying ConfidentialVault V2...");
    const VaultFactory = getFactory("ConfidentialVaultV1");
    const vault = await VaultFactory.deploy(usdcAddress, coreAddress);
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log(`✅ ConfidentialVault deployed to: ${vaultAddress}`);

    // ═══════════════════════════════════════════
    // Step 3: Deploy ConfidentialTrading (NEW)
    // ═══════════════════════════════════════════
    console.log("\n3️⃣  Deploying ConfidentialTrading V2...");
    const TradingFactory = getFactory("ConfidentialTradingV1");
    const trading = await TradingFactory.deploy(usdcAddress, coreAddress, vaultAddress, oracleAddress);
    await trading.waitForDeployment();
    const tradingAddress = await trading.getAddress();
    console.log(`✅ ConfidentialTrading deployed to: ${tradingAddress}`);

    // ═══════════════════════════════════════════
    // Step 4: Link Core ↔ Vault ↔ Trading
    // ═══════════════════════════════════════════
    console.log("\n4️⃣  Linking Core ↔ Vault ↔ Trading...");
    
    let tx = await core.setVault(vaultAddress);
    await tx.wait();
    console.log("   ✅ Core → Vault linked");

    tx = await core.setTrading(tradingAddress);
    await tx.wait();
    console.log("   ✅ Core → Trading linked");

    tx = await core.setTreasury(deployer.address);
    await tx.wait();
    console.log("   ✅ Core → Treasury linked (deployer)");

    tx = await core.setKeeper(deployer.address);
    await tx.wait();
    console.log("   ✅ Core → Keeper registered (deployer)");

    // ═══════════════════════════════════════════
    // Step 5: Verify Linkage
    // ═══════════════════════════════════════════
    console.log("\n5️⃣  Verifying linkage...");
    const linkedVault = await core.vault();
    const linkedTrading = await core.trading();
    const linkedTreasury = await core.treasury();
    const linkedKeeper = await core.keeper();
    
    console.log(`   Core.vault()    = ${linkedVault} ${linkedVault === vaultAddress ? '✅' : '❌ MISMATCH'}`);
    console.log(`   Core.trading()  = ${linkedTrading} ${linkedTrading === tradingAddress ? '✅' : '❌ MISMATCH'}`);
    console.log(`   Core.treasury() = ${linkedTreasury} ✅`);
    console.log(`   Core.keeper()   = ${linkedKeeper} ✅`);

    // ═══════════════════════════════════════════
    // Save deployment info
    // ═══════════════════════════════════════════
    const deployInfo = {
      version: "V1",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      coreAddress,
      vaultAddress,
      tradingAddress,
      oracleAddress,
      usdcAddress
    };
    
    fs.writeFileSync(path.join(__dirname, 'latest_deploy.json'), JSON.stringify(deployInfo, null, 2));

    console.log("\n══════════════════════════════════════════════════════");
    console.log("🎉 DEPLOYMENT V1 COMPLETE!");
    console.log("══════════════════════════════════════════════════════");
    console.log(`CORE:    ${coreAddress}`);
    console.log(`VAULT:   ${vaultAddress}`);
    console.log(`TRADING: ${tradingAddress}`);
    console.log(`ORACLE:  ${oracleAddress} (reused)`);
    console.log("══════════════════════════════════════════════════════");
    console.log("\nNext steps:");
    console.log("1. Run: node scripts/setupPairs_v1.js");
    console.log("2. Update frontend contracts.ts");
    console.log("3. Update subgraph.yaml");
    console.log("4. Deploy keeper bot");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
