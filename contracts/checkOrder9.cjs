const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json')).abi;
const contract = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);

async function check() {
  const order = await contract.pendingOrders(9);
  console.log('Order 9 isLong:', order.isLong);
  console.log('Order 9 orderType:', order.orderType);
  console.log('Order 9 triggerPrice:', ethers.formatUnits(order.triggerPrice, 18));
  console.log('Order 9 acceptablePrice:', ethers.formatUnits(order.acceptablePrice, 18));
}
check();
