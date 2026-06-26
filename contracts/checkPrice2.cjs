const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json')).abi;
const contract = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);

async function check() {
  const oracleAddr = await contract.oracle();
  const ORACLE_ABI = JSON.parse(fs.readFileSync('../src/abis/PythPriceOracle.json')).abi;
  const oracle = new ethers.Contract(oracleAddr, ORACLE_ABI, provider);
  
  const btcPairId = '0x9282eb09b844791118907b4cb066e6f9d167435f2382166b9e3594bcb4072bde';
  try {
      const price = await oracle.getPrice(btcPairId);
      console.log('BTC Price:', ethers.formatUnits(price[0], 18));
  } catch (err) {
      console.log('Error:', err.message);
  }
}
check();
