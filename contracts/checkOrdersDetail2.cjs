const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json')).abi;

async function check() {
  const contract = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);
  const nextOrderId = await contract.nextOrderId();
  for (let i = 1; i < Number(nextOrderId); i++) {
      const o = await contract.pendingOrders(i);
      if (o.isActive === true) {
         console.log('Order', i, 'Type:', Number(o.orderType), 'Long:', o.isLong, 'Size:', ethers.formatUnits(o.sizeUsd, 6), 'Trigger:', ethers.formatUnits(o.triggerPrice, 18), 'AccPrice:', ethers.formatUnits(o.acceptablePrice, 18));
      }
  }
}
check();
