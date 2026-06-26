const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json'));
const contract = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);

async function check() {
  const nextId = await contract.nextOrderId();
  for (let i=1; i < nextId; i++) {
     const o = await contract.pendingOrders(i);
     if (o.isActive) {
        console.log('Active Order ID:', i, 'isLong:', o.isLong, 'Size:', ethers.formatUnits(o.sizeUsd, 6));
     }
  }
}
check();
