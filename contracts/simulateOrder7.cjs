const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json')).abi;
const contract = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);

async function check() {
  try {
    const tx = await contract.executeHybridBatch.staticCall(
      [7], [], [], 
      { from: '0x1729216b0171BB8773D131050Feaa387bF9E84a2' }
    );
    console.log('Success:', tx);
  } catch (err) {
    if (err.data) {
       console.log('Revert data:', err.data);
    } else {
       console.log('Revert reason:', err.reason || err.message);
    }
  }
}
check();
