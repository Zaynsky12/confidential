const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json')).abi;
const contract = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);

async function check() {
  try {
    const pythId = 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';
    const fetch = (await import('node-fetch')).default;
    const res = await fetch('https://hermes.pyth.network/v2/updates/price/latest?ids[]=' + pythId);
    const data = await res.json();
    const pythPayload = data.binary.data.map(hex => '0x' + hex);
    
    console.log('Got payload, simulating...');
    const tx = await contract.executeHybridBatch.staticCall(
      [], [9], pythPayload, 
      { from: '0x1729216b0171BB8773D131050Feaa387bF9E84a2', value: ethers.parseUnits('0.001', 18) }
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
