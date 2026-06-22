import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const vaultAbi = [
    "function totalPrimeAssets() view returns (uint256)",
    "function totalDegenAssets() view returns (uint256)",
    "function totalBacking() view returns (uint256)",
    "function utilization() view returns (uint256)"
  ];
  const vault = new ethers.Contract("0xCCee0942115B632dFb0aA50BD1cd034217Bf2D10", vaultAbi, provider);

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
}

main().catch(console.error);
