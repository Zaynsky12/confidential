import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const vaultAbi = [
    "function totalPrimeAssets() view returns (uint256)",
    "function totalDegenAssets() view returns (uint256)",
    "function totalBacking() view returns (uint256)",
    "function utilization() view returns (uint256)"
  ];
  const vault = new ethers.Contract("0x718EbD82e2fB4f8D71D2C78cAF43171c1A656b08", vaultAbi, provider);

  const coreAbi = [
    "function getPairConfig(bytes32 pairId) view returns (tuple(bytes32 pairId, bytes32 pythFeedId, uint256 maxLeverage, uint256 maxLongOI, uint256 maxShortOI, uint256 maxPositionPct, bool active))"
  ];
  const core = new ethers.Contract("0x3396f443b8D0D144C831cf7EB4b0cAE5c3BaBd27", coreAbi, provider);

  try {
    const util = await vault.utilization();
    console.log("Utilization:", util.toString());
  } catch(e) { console.log("Failed util", e.message); }

  try {
    const p = await vault.totalPrimeAssets();
    console.log("Prime Assets:", ethers.formatUnits(p, 6));
  } catch(e) { console.log("Failed prime", e.message); }

  try {
    const d = await vault.totalDegenAssets();
    console.log("Degen Assets:", ethers.formatUnits(d, 6));
  } catch(e) { console.log("Failed degen", e.message); }

  try {
    const b = await vault.totalBacking();
    console.log("Total Backing:", ethers.formatUnits(b, 6));
  } catch(e) { console.log("Failed backing", e.message); }

  try {
    const pairId = ethers.id("BTC/USDC");
    const config = await core.getPairConfig(pairId);
    console.log("BTC Max Leverage:", config.maxLeverage.toString());
  } catch(e) { console.log("Failed core", e.message); }
}

main().catch(console.error);
