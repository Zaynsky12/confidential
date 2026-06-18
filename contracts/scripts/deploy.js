import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("Starting deployment to Arc Testnet...");

  if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.length < 64) {
    console.error("❌ ERROR: Invalid PRIVATE_KEY in .env file! Please set a valid private key before deploying.");
    process.exitCode = 1;
    return;
  }

  const provider = new ethers.JsonRpcProvider(process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network");
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log("Deploying contracts with the account:", deployer.address);

  // Constants
  const USDC = "0x3600000000000000000000000000000000000000";
  const PYTH = "0x2880aB155794e7179c9eE2e38200202908C17B43";

  // Helpers to load artifacts
  const loadArtifact = (name) => {
    const raw = fs.readFileSync(`./artifacts/src/${name}.sol/${name}.json`);
    return JSON.parse(raw);
  };

  const getFactory = (name) => {
    const artifact = loadArtifact(name);
    return new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
  };

  // 1. Deploy Oracle
  console.log("Deploying PythPriceOracle...");
  const OracleFactory = getFactory("PythPriceOracle");
  const oracle = await OracleFactory.deploy(PYTH);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("Oracle deployed to:", oracleAddress);

  // 2. Deploy Core
  console.log("Deploying ConfidentialCore...");
  const CoreFactory = getFactory("ConfidentialCore");
  const core = await CoreFactory.deploy(USDC, oracleAddress);
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();
  console.log("Core deployed to:", coreAddress);

  // 3. Deploy Vault
  console.log("Deploying ConfidentialVault...");
  const VaultFactory = getFactory("ConfidentialVault");
  const vault = await VaultFactory.deploy(USDC, coreAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("Vault deployed to:", vaultAddress);

  // 4. Deploy Trading
  console.log("Deploying ConfidentialTrading...");
  const TradingFactory = getFactory("ConfidentialTrading");
  const trading = await TradingFactory.deploy(
    USDC,
    coreAddress,
    vaultAddress,
    oracleAddress
  );
  await trading.waitForDeployment();
  const tradingAddress = await trading.getAddress();
  console.log("Trading deployed to:", tradingAddress);

  // 5. Wire up contracts
  console.log("Wiring up contracts...");
  await (await core.setVault(vaultAddress)).wait();
  await (await core.setTrading(tradingAddress)).wait();
  await (await core.setTreasury(deployer.address)).wait(); // Dev wallet = treasury

  // Helper for adding pairs
  async function addPair(name, pythId, leverage, longOI, shortOI) {
    console.log(`Adding pair ${name}...`);
    const nameBytes = ethers.id(name);
    await (await core.addPair(name, pythId, leverage, longOI, shortOI, 2000)).wait();
    await (await oracle.setPriceFeed(nameBytes, pythId)).wait();
  }

  // 6. Register trading pairs
  console.log("Registering trading pairs...");

  // ── Crypto (max 50x leverage) ──
  await addPair("BTC/USDC",   "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43", 50, 5000000n * 10n**6n, 5000000n * 10n**6n);
  await addPair("ETH/USDC",   "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", 50, 3000000n * 10n**6n, 3000000n * 10n**6n);
  await addPair("SOL/USDC",   "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d", 50, 1000000n * 10n**6n, 1000000n * 10n**6n);
  await addPair("BNB/USDC",   "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f", 50, 1000000n * 10n**6n, 1000000n * 10n**6n);
  await addPair("XRP/USDC",   "0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8", 50, 1000000n * 10n**6n, 1000000n * 10n**6n);
  await addPair("LINK/USDC",  "0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221", 25, 500000n * 10n**6n, 500000n * 10n**6n);
  await addPair("ARB/USDC",   "0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5", 25, 250000n * 10n**6n, 250000n * 10n**6n);
  await addPair("AVAX/USDC",  "0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7", 25, 500000n * 10n**6n, 500000n * 10n**6n);
  await addPair("SUI/USDC",   "0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744", 25, 250000n * 10n**6n, 250000n * 10n**6n);
  await addPair("APT/USDC",   "0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5", 25, 250000n * 10n**6n, 250000n * 10n**6n);
  await addPair("NEAR/USDC",  "0xc415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750", 25, 250000n * 10n**6n, 250000n * 10n**6n);
  await addPair("DOGE/USDC",  "0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c", 20, 200000n * 10n**6n, 200000n * 10n**6n);
  await addPair("PEPE/USDC",  "0xd69731a2e74ac1ce884fc3890f7ee324b6deb66147055249568869ed700882e4", 20, 100000n * 10n**6n, 100000n * 10n**6n);
  await addPair("WIF/USDC",   "0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6ee41b54cd4cc61fc", 20, 100000n * 10n**6n, 100000n * 10n**6n);

  // ── RWA (max 100x leverage for metals, 50x for equities) ──
  await addPair("AAPL/USDC",  "0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688", 50, 500000n * 10n**6n, 500000n * 10n**6n);
  await addPair("TSLA/USDC",  "0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1", 50, 500000n * 10n**6n, 500000n * 10n**6n);
  await addPair("GOLD/USDC",  "0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2", 100, 1000000n * 10n**6n, 1000000n * 10n**6n);
  await addPair("SILVER/USDC","0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e", 100, 500000n * 10n**6n, 500000n * 10n**6n);
  await addPair("SPY/USDC",   "0x19e09bb805456ada3979a7d1cbb4b6d63babc3a0f8e8a9509f68afa5c4c11cd5", 50, 500000n * 10n**6n, 500000n * 10n**6n);
  await addPair("NVDA/USDC",  "0xb1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593", 50, 500000n * 10n**6n, 500000n * 10n**6n);

  // ── Forex (max 100x leverage) ──
  await addPair("EUR/USDC",   "0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b", 100, 2000000n * 10n**6n, 2000000n * 10n**6n);
  await addPair("GBP/USDC",   "0x84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1", 100, 2000000n * 10n**6n, 2000000n * 10n**6n);
  await addPair("USDJPY/USDC","0xef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52", 100, 2000000n * 10n**6n, 2000000n * 10n**6n);

  console.log("\n==================================");
  console.log("DEPLOYMENT COMPLETE!");
  console.log("Core:", coreAddress);
  console.log("Oracle:", oracleAddress);
  console.log("Vault:", vaultAddress);
  console.log("Trading:", tradingAddress);
  console.log("==================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
