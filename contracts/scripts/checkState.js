import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  
  const coreAbi = ["function pairs(bytes32) view returns (bytes32, bytes32, uint256, uint256, uint256, uint256, bool)"];
  const core = new ethers.Contract("0x87000e8eA781B9fdBEaF0A479386efD5b38C2da9", coreAbi, provider);

  const btcPairId = ethers.keccak256(ethers.toUtf8Bytes("BTC/USDC"));
  const btcPair = await core.pairs(btcPairId);
  console.log("BTC/USDC Active:", btcPair[6]);

  const tradingAbi = ["function authorizedKeepers(address) view returns (bool)"];
  const trading = new ethers.Contract("0x92361Ea75DdFdc7F7aa89AA0917D1B9a3A2c77C0", tradingAbi, provider);

  const keeperAddress = "0xee3be9c9d6dbfbf0fc59c86fdffae68515def5d2"; 
  const isKeeper = await trading.authorizedKeepers(keeperAddress);
  console.log("Is Keeper Authorized:", isKeeper);
}

main().catch(console.error);
