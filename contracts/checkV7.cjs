const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const abi = ['function nextOrderId() view returns (uint256)', 'function nextPositionId() view returns (uint256)'];
const contract = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', abi, provider);
async function check() {
  const o = await contract.nextOrderId();
  const p = await contract.nextPositionId();
  console.log('V7 Orders:', o.toString(), 'V7 Positions:', p.toString());
}
check();
