import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const vaultAbi = ["function totalAssets() view returns (uint256)"];
  const vault = new ethers.Contract("0x6e70367215F067632d3a94EB9a7A3f63C21A680C", vaultAbi, provider);

  const liquidity = await vault.totalAssets();
  console.log("Vault Liquidity:", ethers.formatUnits(liquidity, 6), "USDC");
}

main().catch(console.error);
