import { ethers } from "ethers";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const VAULT = "0x620AB088ffC0bFa8b44A7E84D51a786f2CFD30bA";
const USDC = "0x3600000000000000000000000000000000000000";

async function main() {
  const rpc = process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network";
  const provider = new ethers.JsonRpcProvider(rpc);
  const pk = process.env.PRIVATE_KEY;
  if (!pk) { console.error("❌ No PRIVATE_KEY"); process.exit(1); }
  const wallet = new ethers.Wallet(pk.startsWith("0x") ? pk : "0x" + pk, provider);

  console.log(`🔑 Deployer: ${wallet.address}`);

  const erc20 = new ethers.Contract(USDC, [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address,uint256) returns (bool)"
  ], wallet);

  const vaultAbi = [
    "function totalPrimeAssets() view returns (uint256)",
    "function totalDegenAssets() view returns (uint256)"
  ];
  const vault = new ethers.Contract(VAULT, vaultAbi, provider);

  const vaultUsdcBefore = await erc20.balanceOf(VAULT);
  const primeAssets = await vault.totalPrimeAssets();
  const degenAssets = await vault.totalDegenAssets();
  const totalAssets = primeAssets + degenAssets;
  const deficit = totalAssets > vaultUsdcBefore ? totalAssets - vaultUsdcBefore : 0n;

  console.log(`\n📊 Vault USDC balance: ${ethers.formatUnits(vaultUsdcBefore, 6)}`);
  console.log(`   Total assets (accounting): ${ethers.formatUnits(totalAssets, 6)}`);
  console.log(`   Deficit: ${ethers.formatUnits(deficit, 6)} USDC`);

  if (deficit == 0n) {
    console.log("\n✅ No deficit — vault has enough USDC. You can withdraw from frontend.");
    return;
  }

  // Send deficit + $0.50 buffer
  const topUp = deficit + 500000n; // deficit + $0.50 buffer
  const deployerBal = await erc20.balanceOf(wallet.address);
  console.log(`\n💵 Deployer USDC: ${ethers.formatUnits(deployerBal, 6)}`);
  console.log(`   Sending: ${ethers.formatUnits(topUp, 6)} USDC to vault...`);

  if (deployerBal < topUp) {
    console.error(`❌ Deployer doesn't have enough USDC (need ${ethers.formatUnits(topUp, 6)})`);
    process.exit(1);
  }

  const tx = await erc20.transfer(VAULT, topUp);
  console.log(`   ⏳ Tx: ${tx.hash}`);
  await tx.wait();

  const vaultUsdcAfter = await erc20.balanceOf(VAULT);
  console.log(`   ✅ Done! Vault USDC now: ${ethers.formatUnits(vaultUsdcAfter, 6)}`);
  console.log(`\n🎉 Now you can withdraw Prime shares from the frontend!`);
}

main().catch(console.error);
