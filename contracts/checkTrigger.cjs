const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json')).abi;

async function check() {
  const contract = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);
  const o = await contract.pendingOrders(9);
  console.log('Trigger Price:', ethers.formatUnits(o[7], 18));
}
check();
