import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Testing placeOrder...");
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const TRADING_ADDRESS = "0xd9f796201d93dC5eb499B0044a675cB24eB550f9";
  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

  const tradingArtifact = JSON.parse(fs.readFileSync("./artifacts/src/ConfidentialTrading.sol/ConfidentialTrading.json"));
  const tradingContract = new ethers.Contract(TRADING_ADDRESS, tradingArtifact.abi, wallet);

  const usdcArtifact = JSON.parse(fs.readFileSync("./artifacts/src/ConfidentialVault.sol/IERC20.json"));
  const usdcContract = new ethers.Contract(USDC_ADDRESS, usdcArtifact.abi, wallet);

  // Approve USDC
  console.log("Approving USDC...");
  const approveTx = await usdcContract.approve(TRADING_ADDRESS, ethers.MaxUint256);
  await approveTx.wait();
  console.log("USDC Approved!");

  const pairId = ethers.keccak256(ethers.toUtf8Bytes("BTC/USDC"));
  const sizeUsd = ethers.parseUnits("100", 6);
  const leverage = 10n;
  const triggerPrice = 0n;
  const orderType = 2; // market_open
  const reduceOnly = false;
  const tpPrice = 0n;
  const slPrice = 0n;

  console.log("Placing order...");
  try {
    const tx = await tradingContract.placeOrder(
      pairId,
      true,
      sizeUsd,
      leverage,
      triggerPrice,
      orderType,
      reduceOnly,
      tpPrice,
      slPrice,
      { value: ethers.parseUnits("0.013", 18) }
    );
    console.log("Tx Hash:", tx.hash);
    await tx.wait();
    console.log("Order Placed Successfully!");
  } catch (error) {
    console.error("Error placing order:", error);
  }
}

main().catch(console.error);
