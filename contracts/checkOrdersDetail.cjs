const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json')).abi;

async function check() {
  const contract = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);
  const nextOrderId = await contract.nextOrderId();
  for (let i = Number(nextOrderId) - 3; i < Number(nextOrderId); i++) {
      const o = await contract.pendingOrders(i);
      console.log('Order', i, 'Active:', o[9], 'Type:', Number(o[8]), 'Long:', o[2], 'Size:', ethers.formatUnits(o[3], 6), 'Trigger:', ethers.formatUnits(o[6], 18), 'AccPrice:', ethers.formatUnits(o[7], 18));
  }
}
check();
