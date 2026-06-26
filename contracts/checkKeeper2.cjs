const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json'));
const CORE_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialCore.json'));

async function check() {
  const trading = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);
  const coreAddr = await trading.core();
  console.log('Trading core:', coreAddr);

  const core = new ethers.Contract(coreAddr, CORE_ABI, provider);
  try {
    const k = await core.keeper();
    console.log('Core Keeper:', k);
  } catch (err) {
    console.log('Core Keeper error:', err.message);
  }
}
check();
