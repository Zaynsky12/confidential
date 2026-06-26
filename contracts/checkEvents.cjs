const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json')).abi;
const contract = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);

async function check() {
  const filter = contract.filters.PositionOpened();
  const events = await contract.queryFilter(filter, -10000, 'latest');
  
  const pos6 = events.find(e => e.args[0] === 6n);
  const pos7 = events.find(e => e.args[0] === 7n);
  
  if (pos6) {
    console.log('Pos 6 TxHash:', pos6.transactionHash);
  } else {
    console.log('Pos 6 event not found');
  }
  
  if (pos7) {
    console.log('Pos 7 TxHash:', pos7.transactionHash);
  } else {
    console.log('Pos 7 event not found');
  }
  
  if (pos6 && pos7) {
     if (pos6.transactionHash === pos7.transactionHash) {
         console.log('RESULT: MATCHED IN SAME BATCH (P2P Hybrid)');
     } else {
         console.log('RESULT: DIFFERENT BATCHES (Processed separately)');
     }
  }
}
check();
