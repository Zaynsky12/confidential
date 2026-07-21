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

function getArtifact(name) {
    const artifactPath = path.join(__dirname, `../artifacts/src/${name}.sol/${name}.json`);
    if (!fs.existsSync(artifactPath)) {
        throw new Error(`Artifact for ${name} not found at ${artifactPath}. Please run 'npx hardhat compile' first.`);
    }
    return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function retryRpc(fn, maxRetries = 15, delayMs = 3500) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (err) {
            const isRateLimit = err.message?.includes('request limit reached') || err.message?.includes('-32011') || err.message?.includes('429') || err.code === 'UNKNOWN_ERROR';
            if (isRateLimit && i < maxRetries - 1) {
                console.log(`   ⏳ Arc RPC rate limit hit. Sleeping ${delayMs / 1000}s before retry (${i + 1}/${maxRetries})...`);
                await sleep(delayMs);
                continue;
            }
            throw err;
        }
    }
}

async function main() {
    const network = new ethers.Network("arcTestnet", 5042002);
    const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network", network, { staticNetwork: network });
    
    const origSend = provider.send.bind(provider);
    provider.send = async (method, params) => {
        await sleep(400);
        if (method === 'eth_sendRawTransaction') await sleep(1200);
        for (let i = 0; i < 15; i++) {
            try {
                return await origSend(method, params);
            } catch (e) {
                if ((e.message?.includes('-32011') || e.message?.includes('request limit reached') || e.message?.includes('429')) && i < 14) {
                    console.log(`   ⏳ [Rate limit on ${method}] Sleeping 3s (${i + 1}/15)...`);
                    await sleep(3000);
                    continue;
                }
                throw e;
            }
        }
    };

    if (!process.env.PRIVATE_KEY) {
        throw new Error("PRIVATE_KEY not found in .env");
    }
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log("══════════════════════════════════════════════════════════════");
    console.log("🚀 UPGRADING CONFIDENTIAL TRADING V1 (Fee & Liquidation Fix)");
    console.log("══════════════════════════════════════════════════════════════");
    console.log(`👤 Deployer Address: ${deployer.address}`);

    const balance = await retryRpc(() => provider.getBalance(deployer.address));
    console.log(`💰 Deployer Balance: ${ethers.formatEther(balance)} ARC`);

    // 1. Read existing deployment configuration
    const latestDeployPath = path.join(__dirname, 'latest_deploy.json');
    if (!fs.existsSync(latestDeployPath)) {
        throw new Error("latest_deploy.json not found!");
    }
    const deployInfo = JSON.parse(fs.readFileSync(latestDeployPath, 'utf8'));

    const usdcAddress = deployInfo.usdcAddress;
    const coreAddress = deployInfo.coreAddress;
    const vaultAddress = deployInfo.vaultAddress;
    const oracleAddress = deployInfo.oracleAddress;
    const oldTradingAddress = deployInfo.tradingAddress;

    console.log("\n🔗 Existing Contracts Configuration:");
    console.log(`   • USDC:   ${usdcAddress}`);
    console.log(`   • Core:   ${coreAddress}`);
    console.log(`   • Vault:  ${vaultAddress}`);
    console.log(`   • Oracle: ${oracleAddress}`);
    console.log(`   • Old Trading: ${oldTradingAddress}`);

    // 2. Load Core Contract for validation & relinking
    const coreArtifact = getArtifact("ConfidentialCoreV1");
    const core = new ethers.Contract(coreAddress, coreArtifact.abi, deployer);

    const currentOwner = await retryRpc(() => core.owner());
    if (currentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
        throw new Error(`Deployer (${deployer.address}) is not the owner of Core (${currentOwner})!`);
    }

    // Check if protocol is paused
    const isPaused = await retryRpc(() => core.paused());
    if (!isPaused) {
        console.log("\n⏸️  Pausing protocol during upgrade for safety...");
        const pauseTx = await retryRpc(() => core.pause());
        await retryRpc(() => pauseTx.wait());
        console.log("   ✅ Protocol paused");
        await sleep(3000);
    }

    // 3. Deploy New ConfidentialTradingV1
    console.log("\n📦 Deploying New ConfidentialTradingV1...");
    const tradingArtifact = getArtifact("ConfidentialTradingV1");
    const TradingFactory = new ethers.ContractFactory(tradingArtifact.abi, tradingArtifact.bytecode, deployer);
    
    const newTrading = await retryRpc(() => TradingFactory.deploy(usdcAddress, coreAddress, vaultAddress, oracleAddress));
    await retryRpc(() => newTrading.waitForDeployment());
    const newTradingAddress = await newTrading.getAddress();
    console.log(`✅ New ConfidentialTradingV1 deployed to: ${newTradingAddress}`);
    await sleep(3000);

    // 4. Link Core to New Trading
    console.log("\n🔄 Relinking Core -> New Trading Address...");
    const relinkTx = await retryRpc(() => core.setTrading(newTradingAddress));
    await retryRpc(() => relinkTx.wait());
    console.log(`   ✅ Core now linked to: ${newTradingAddress}`);
    await sleep(3000);

    // 5. Unpause protocol if we paused it
    if (!isPaused) {
        console.log("\n▶️  Unpausing protocol...");
        const unpauseTx = await retryRpc(() => core.unpause());
        await retryRpc(() => unpauseTx.wait());
        console.log("   ✅ Protocol active");
        await sleep(3000);
    }

    // 6. Verify link
    const activeTradingInCore = await retryRpc(() => core.trading());

    console.log("\n🧪 Verification:");
    console.log(`   • core.trading(): ${activeTradingInCore}`);

    if (activeTradingInCore !== newTradingAddress) {
        throw new Error("❌ Verification failed! Linkage mismatch.");
    }
    console.log("   ✅ Linkage verified perfectly across Core and Vault (Vault dynamically checks core.trading())!");

    // 7. Update latest_deploy.json
    deployInfo.tradingAddress = newTradingAddress;
    deployInfo.oldTradingAddresses = deployInfo.oldTradingAddresses || [];
    deployInfo.oldTradingAddresses.push(oldTradingAddress);
    deployInfo.lastUpgradeTimestamp = new Date().toISOString();

    fs.writeFileSync(latestDeployPath, JSON.stringify(deployInfo, null, 2));
    console.log("\n📄 Updated contracts/scripts/latest_deploy.json");

    console.log("\n══════════════════════════════════════════════════════════════");
    console.log("🎉 UPGRADE COMPLETE!");
    console.log("══════════════════════════════════════════════════════════════");
    console.log(`Please update the frontend, subgraph, and feederBot to use:\n👉 ${newTradingAddress}\n`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
