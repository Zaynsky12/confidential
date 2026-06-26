const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json')).abi;
const contract = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);

async function check() {
  const nextPosId = await contract.nextPositionId();
  console.log('Total Positions:', (nextPosId - 1n).toString());
  
  const startPos = Number(nextPosId) > 10 ? Number(nextPosId) - 10 : 1;
  for (let i = startPos; i < Number(nextPosId); i++) {
    const pos = await contract.positions(i);
    console.log('Pos ID ' + i + ': Trader: ' + pos.trader + ', ' + (pos.isLong ? 'LONG' : 'SHORT') + ', Size: $' + ethers.formatUnits(pos.sizeUsd, 6) + ', Open: ' + pos.isOpen);
  }

  const nextOrderId = await contract.nextOrderId();
  console.log('\nTotal Orders Created:', (nextOrderId - 1n).toString());
  
  let activeCount = 0;
  for (let i = Number(nextOrderId) - 10 > 0 ? Number(nextOrderId) - 10 : 1; i < Number(nextOrderId); i++) {
    const order = await contract.pendingOrders(i);
    if (order.isActive) {
      activeCount++;
      console.log('Active Order ID ' + i + ': Trader: ' + order.trader + ', ' + (order.isLong ? 'LONG' : 'SHORT') + ', Type: ' + order.orderType + ', Size: $' + ethers.formatUnits(order.sizeUsd, 6));
    }
  }
  if (activeCount === 0) console.log('No active pending orders in the last 10 orders.');
}
check();
