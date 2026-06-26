const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const CORE_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialCore.json')).abi;
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json')).abi;

async function check() {
  const trading = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);
  const coreAddr = await trading.core();
  const core = new ethers.Contract(coreAddr, CORE_ABI, provider);
  
  // Get pair config
  const pairId = '0x9282eb09b844791118907b4cb066e6f9d167435f2382166b9e3594bcb4072bde';
  const config = await core.pairs(pairId);
  console.log('Max Short OI:', ethers.formatUnits(config.maxShortOI, 6));
  console.log('Current Short OI:', ethers.formatUnits(await core.shortOI(pairId), 6));
}
check();
