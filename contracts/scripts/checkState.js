import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const tradingAbi = ["function nextPositionId() view returns (uint256)", "function nextOrderId() view returns (uint256)"];
  const trading = new ethers.Contract("0x92361Ea75DdFdc7F7aa89AA0917D1B9a3A2c77C0", tradingAbi, provider);

  const nextPos = await trading.nextPositionId();
  const nextOrder = await trading.nextOrderId();
  
  console.log("nextPositionId:", nextPos.toString());
  console.log("nextOrderId:", nextOrder.toString());
}

main().catch(console.error);
