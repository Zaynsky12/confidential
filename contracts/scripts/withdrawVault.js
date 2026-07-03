import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env first, then local contracts/.env
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

async function main() {
  const rpcUrl = process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  let pk = process.env.PRIVATE_KEY || process.env.BOT_KEEPER_PRIVATE_KEY;
  if (!pk || pk.includes("YOUR_PRIVATE_KEY") || pk.length < 60) {
    // try checking if there is another variable or if BOT_KEEPER_PRIVATE_KEY is valid
    pk = process.env.BOT_KEEPER_PRIVATE_KEY;
  }
  if (!pk || pk.includes("YOUR_PRIVATE_KEY") || pk.length < 60) {
    console.error("❌ ERROR: Valid PRIVATE_KEY or BOT_KEEPER_PRIVATE_KEY not found in .env");
    process.exit(1);
  }
  if (!pk.startsWith("0x")) pk = "0x" + pk;
  const wallet = new ethers.Wallet(pk, provider);
  console.log(`🔑 Wallet Address: ${wallet.address}`);

  // Read latest deploy info
  const deployPath = path.join(__dirname, "latest_deploy.json");
  if (!fs.existsSync(deployPath)) {
    console.error("❌ ERROR: latest_deploy.json not found!");
    process.exit(1);
  }
  const deployInfo = JSON.parse(fs.readFileSync(deployPath, "utf8"));
  const vaultAddress = deployInfo.vaultAddress;
  console.log(`🏦 Vault Address:  ${vaultAddress}`);

  const vaultAbi = [
    "function setTieredLockups(uint256 _degenSeconds, uint256 _primeSeconds) external",
    "function sharesOf(address user, bool isDegen) external view returns (uint256)",
    "function balanceOfUnderlying(address user, bool isDegen) external view returns (uint256)",
    "function withdraw(uint256 shareAmount, bool isDegen) external",
    "function usdc() external view returns (address)",
    "function totalAssets() external view returns (uint256)"
  ];
  
  const erc20Abi = [
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)"
  ];

  const vaultContract = new ethers.Contract(vaultAddress, vaultAbi, wallet);
  const usdcAddress = await vaultContract.usdc();
  const usdcContract = new ethers.Contract(usdcAddress, erc20Abi, wallet);

  const initialUsdc = await usdcContract.balanceOf(wallet.address);
  console.log(`💵 Initial USDC Balance: ${ethers.formatUnits(initialUsdc, 6)} USDC`);

  // Step 1: Remove lockup periods
  console.log("\n🔓 Step 1: Removing Lockup Periods (setting to 0 seconds)...");
  try {
    const txLock = await vaultContract.setTieredLockups(0, 0);
    console.log(`   ⏳ Transaction submitted: ${txLock.hash}`);
    await txLock.wait();
    console.log("   ✅ Lockup periods set to 0!");
  } catch (err) {
    console.warn("   ⚠️ Could not set lockup (maybe not owner or already 0):", err.shortMessage || err.message);
  }

  // Step 2: Check and withdraw Degen shares
  const degenShares = await vaultContract.sharesOf(wallet.address, true);
  const degenVal = await vaultContract.balanceOfUnderlying(wallet.address, true);
  console.log(`\n🔥 Degen Tranche Shares: ${ethers.formatUnits(degenShares, 6)} (~${ethers.formatUnits(degenVal, 6)} USDC)`);
  
  if (degenShares > 0n) {
    console.log("   📤 Withdrawing Degen Shares...");
    try {
      const txW1 = await vaultContract.withdraw(degenShares, true);
      console.log(`   ⏳ Transaction submitted: ${txW1.hash}`);
      await txW1.wait();
      console.log("   ✅ Degen withdrawal successful!");
    } catch (err) {
      console.error("   ❌ Degen withdrawal failed:", err.shortMessage || err.message);
    }
  } else {
    console.log("   ⏭️ No Degen shares to withdraw.");
  }

  // Step 3: Check and withdraw Prime shares
  const primeShares = await vaultContract.sharesOf(wallet.address, false);
  const primeVal = await vaultContract.balanceOfUnderlying(wallet.address, false);
  console.log(`\n🛡️ Prime Tranche Shares: ${ethers.formatUnits(primeShares, 6)} (~${ethers.formatUnits(primeVal, 6)} USDC)`);

  if (primeShares > 0n) {
    console.log("   📤 Withdrawing Prime Shares...");
    try {
      const txW2 = await vaultContract.withdraw(primeShares, false);
      console.log(`   ⏳ Transaction submitted: ${txW2.hash}`);
      await txW2.wait();
      console.log("   ✅ Prime withdrawal successful!");
    } catch (err) {
      console.error("   ❌ Prime withdrawal failed:", err.shortMessage || err.message);
    }
  } else {
    console.log("   ⏭️ No Prime shares to withdraw.");
  }

  // Step 4: Check final USDC balance
  const finalUsdc = await usdcContract.balanceOf(wallet.address);
  const withdrawn = finalUsdc - initialUsdc;
  console.log(`\n💵 Final USDC Balance: ${ethers.formatUnits(finalUsdc, 6)} USDC`);
  if (withdrawn > 0n) {
    console.log(`🎉 Total Withdrawn: +${ethers.formatUnits(withdrawn, 6)} USDC`);
  }
}

main().catch((err) => {
  console.error("❌ Fatal Error:", err);
  process.exit(1);
});
