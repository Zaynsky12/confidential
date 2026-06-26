const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json')).abi;

async function check() {
  const contract = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);
  const executedFilter = contract.filters.OrderExecuted();
  const executedLogs = await contract.queryFilter(executedFilter, -10000, 'latest');
  const cancelledFilter = contract.filters.OrderCancelled();
  const cancelledLogs = await contract.queryFilter(cancelledFilter, -10000, 'latest');
  
  for (let l of executedLogs) {
      if ([9,10,11].includes(Number(l.args[0]))) console.log('Executed Order', Number(l.args[0]), 'PosID:', Number(l.args[1]));
  }
  for (let l of cancelledLogs) {
      if ([9,10,11].includes(Number(l.args[0]))) console.log('Cancelled Order', Number(l.args[0]));
  }
}
check();
