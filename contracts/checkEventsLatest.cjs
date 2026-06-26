const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json')).abi;
const contract = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);

async function check() {
  const latestBlock = await provider.getBlockNumber();
  const filter = contract.filters.PositionOpened();
  const events = await contract.queryFilter(filter, latestBlock - 5000, latestBlock);
  
  const pos8 = events.find(e => e.args[0] === 8n);
  const pos9 = events.find(e => e.args[0] === 9n);
  
  if (pos8) {
    console.log('Pos 8 TxHash:', pos8.transactionHash);
  } else {
    console.log('Pos 8 event not found in last 5000 blocks');
  }
  
  if (pos9) {
    console.log('Pos 9 TxHash:', pos9.transactionHash);
  } else {
    console.log('Pos 9 event not found in last 5000 blocks');
  }
  
  if (pos8 && pos9) {
     if (pos8.transactionHash === pos9.transactionHash) {
         console.log('\n=======================================');
         console.log('🎉 RESULT: MATCHED IN SAME BATCH (P2P Hybrid) 🎉');
         console.log('=======================================');
     } else {
         console.log('\n=======================================');
         console.log('❌ RESULT: DIFFERENT BATCHES (Processed separately) ❌');
         console.log('=======================================');
     }
  }
}
check();
