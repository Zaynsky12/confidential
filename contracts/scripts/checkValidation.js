import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const coreAbi = [
    "function validateOpenPosition(bytes32 pairId, address user, bool isLong, uint256 sizeUsd, uint256 leverage) external view",
    "error ExceedsMaxLeverage()",
    "error ExceedsMaxOI()",
    "error ExceedsMaxPositionSize()",
    "error ExceedsUtilizationCap()",
    "error PairNotActive()"
  ];
  const core = new ethers.Contract("0x87F27e1D09aFe69E7B29acc44c18a81FF5113906", coreAbi, provider);

  const pairId = ethers.id("BTC/USDC");
  const sizeUsd = ethers.parseUnits("10", 6);
  const leverage = 50n;
  const user = ethers.Wallet.createRandom().address;

  try {
    await core.validateOpenPosition(pairId, user, true, sizeUsd, leverage);
    console.log("Validation passed for 50x");
  } catch (err) {
    if (err.data) {
      const decoded = core.interface.parseError(err.data);
      console.log("Reverted for 50x with custom error:", decoded ? decoded.name : err.data);
    } else {
      console.log("Reverted for 50x with:", err.reason || err.message);
    }
  }
}
main().catch(console.error);
