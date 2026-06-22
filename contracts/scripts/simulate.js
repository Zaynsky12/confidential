import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const tradingAbi = [
    "function placeMarketOrder(bytes32 pairId, bool isLong, uint256 sizeUsd, uint256 leverage, uint256 tpPrice, uint256 slPrice, uint256 acceptablePrice, bytes[] calldata updateData) external payable"
  ];
  const trading = new ethers.Contract("0x92361Ea75DdFdc7F7aa89AA0917D1B9a3A2c77C0", tradingAbi, provider);

  const pairId = ethers.id("BTC/USDC");
  const sizeUsd = ethers.parseUnits("10", 6); // $10 position
  const leverage = 100n;
  const user = ethers.Wallet.createRandom().address;

  try {
    await trading.placeMarketOrder.staticCall(
      pairId,
      true, // isLong
      sizeUsd,
      leverage,
      0, // tp
      0, // sl
      0, // acceptablePrice
      [], // updateData
      { from: user }
    );
    console.log("Simulation successful");
  } catch (err) {
    console.log("Simulation reverted with:", err.reason || err.shortMessage || err.message);
  }
}
main().catch(console.error);
