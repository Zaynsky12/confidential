const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const abi = ['function nextPositionId() view returns (uint256)', 'function positions(uint256) view returns (tuple(bytes32 pairId, address trader, bool isLong, uint256 sizeUsd, uint256 collateral, uint256 entryPrice, uint256 leverage, uint256 liquidationPrice, uint256 openedAt, bool isOpen, uint256 tpPrice, uint256 slPrice, int256 entryFundingIndex, uint256 lastRolloverSettled))'];
const contract = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', abi, provider);
async function check() {
  const p = await contract.nextPositionId();
  console.log('Total Positions:', p.toString());
  for (let i = 1; i < parseInt(p.toString()); i++) {
    const pos = await contract.positions(i);
    console.log(Pos :   USD, Entry: , Open: );
  }
}
check();
