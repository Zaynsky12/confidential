import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const tradingAddress = "0x92361Ea75DdFdc7F7aa89AA0917D1B9a3A2c77C0";

  const bytecode = await provider.getCode(tradingAddress);
  
  const sighashCap = ethers.id("updateTPSL(uint256,uint256,uint256)").substring(0, 10);
  console.log("Selector for updateTPSL (caps):", sighashCap);
  console.log("Found?", bytecode.includes(sighashCap.slice(2)));
}

main().catch(console.error);
