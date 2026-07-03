import { ethers } from "ethers";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const USER = "0x3190e3B097fAC3579fB8817C4E8E094Aa58B354a";
const VAULT = "0x620AB088ffC0bFa8b44A7E84D51a786f2CFD30bA";

async function main() {
  const rpc = process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network";
  const provider = new ethers.JsonRpcProvider(rpc);

  const abi = [
    "function sharesOf(address user, bool isDegen) view returns (uint256)",
    "function balanceOfUnderlying(address user, bool isDegen) view returns (uint256)",
    "function totalDegenAssets() view returns (uint256)",
    "function totalPrimeAssets() view returns (uint256)",
    "function totalDegenShares() view returns (uint256)",
    "function totalPrimeShares() view returns (uint256)",
    "function totalBacking() view returns (uint256)",
    "function availableLiquidity() view returns (uint256)",
    "function degenLockupPeriod() view returns (uint256)",
    "function primeLockupPeriod() view returns (uint256)",
    "function degenDepositTimestamp(address) view returns (uint256)",
    "function primeDepositTimestamp(address) view returns (uint256)",
    "function degenEpoch() view returns (uint256)",
    "function primeEpoch() view returns (uint256)",
    "function usdc() view returns (address)",
    "function utilization() view returns (uint256)"
  ];
  const erc20Abi = ["function balanceOf(address) view returns (uint256)"];

  const vault = new ethers.Contract(VAULT, abi, provider);
  const usdcAddr = await vault.usdc();
  const usdc = new ethers.Contract(usdcAddr, erc20Abi, provider);

  const now = Math.floor(Date.now() / 1000);

  // User shares
  const degenShares = await vault.sharesOf(USER, true);
  const primeShares = await vault.sharesOf(USER, false);
  const degenVal = await vault.balanceOfUnderlying(USER, true);
  const primeVal = await vault.balanceOfUnderlying(USER, false);

  // Vault state
  const totalDegenAssets = await vault.totalDegenAssets();
  const totalPrimeAssets = await vault.totalPrimeAssets();
  const totalBacking = await vault.totalBacking();
  const availLiq = await vault.availableLiquidity();
  const vaultUsdc = await usdc.balanceOf(VAULT);
  const util = await vault.utilization();

  // Lockup
  const degenLockup = await vault.degenLockupPeriod();
  const primeLockup = await vault.primeLockupPeriod();
  const degenDepTime = await vault.degenDepositTimestamp(USER);
  const primeDepTime = await vault.primeDepositTimestamp(USER);

  const primeUnlockAt = Number(primeDepTime) + Number(primeLockup);
  const degenUnlockAt = Number(degenDepTime) + Number(degenLockup);

  console.log("═══════════════════════════════════════");
  console.log(`  VAULT DIAGNOSTICS for ${USER}`);
  console.log("═══════════════════════════════════════");
  console.log(`\n📊 User Shares:`);
  console.log(`  Degen: ${ethers.formatUnits(degenShares, 6)} shares (~${ethers.formatUnits(degenVal, 6)} USDC)`);
  console.log(`  Prime: ${ethers.formatUnits(primeShares, 6)} shares (~${ethers.formatUnits(primeVal, 6)} USDC)`);

  console.log(`\n🏦 Vault State:`);
  console.log(`  Total Degen Assets: ${ethers.formatUnits(totalDegenAssets, 6)} USDC`);
  console.log(`  Total Prime Assets: ${ethers.formatUnits(totalPrimeAssets, 6)} USDC`);
  console.log(`  Total Backing (locked by positions): ${ethers.formatUnits(totalBacking, 6)} USDC`);
  console.log(`  Available Liquidity: ${ethers.formatUnits(availLiq, 6)} USDC`);
  console.log(`  USDC in Vault contract: ${ethers.formatUnits(vaultUsdc, 6)} USDC`);
  console.log(`  Utilization: ${Number(util) / 100}%`);

  console.log(`\n🔒 Lockup Status:`);
  console.log(`  Prime lockup period: ${Number(primeLockup)} seconds (${(Number(primeLockup)/3600).toFixed(1)} hours)`);
  console.log(`  Prime deposit time: ${primeDepTime > 0n ? new Date(Number(primeDepTime)*1000).toISOString() : 'never'}`);
  console.log(`  Prime unlock at:    ${primeDepTime > 0n ? new Date(primeUnlockAt*1000).toISOString() : 'N/A'}`);
  console.log(`  Now:                ${new Date(now*1000).toISOString()}`);
  if (primeDepTime > 0n) {
    if (now >= primeUnlockAt) {
      console.log(`  ✅ Prime lockup EXPIRED — can withdraw`);
    } else {
      console.log(`  ❌ Prime lockup NOT expired — ${((primeUnlockAt - now)/3600).toFixed(1)} hours remaining`);
    }
  }

  console.log(`\n⚠️ Withdrawal Checks:`);
  if (primeShares == 0n) {
    console.log(`  ❌ FAIL: User has 0 Prime shares — nothing to withdraw`);
  }
  if (primeVal > 0n && primeVal > availLiq) {
    console.log(`  ❌ FAIL: InsufficientLiquidity — want ${ethers.formatUnits(primeVal,6)} but only ${ethers.formatUnits(availLiq,6)} available`);
    console.log(`     → Backing locked: ${ethers.formatUnits(totalBacking,6)} USDC (from open positions)`);
  }
  if (primeVal > 0n && primeVal > vaultUsdc) {
    console.log(`  ❌ FAIL: Vault doesn't have enough USDC balance`);
  }
  if (primeDepTime > 0n && now < primeUnlockAt) {
    console.log(`  ❌ FAIL: LockupNotExpired`);
  }
  if (primeShares > 0n && primeVal > 0n && primeVal <= availLiq && now >= primeUnlockAt) {
    console.log(`  ✅ All checks pass — withdrawal should succeed`);
  }
}

main().catch(console.error);
