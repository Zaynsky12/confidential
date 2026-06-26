const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json')).abi;
const contract = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);

async function check() {
  const oracleAddr = await contract.oracle();
  console.log('Oracle:', oracleAddr);
  
  const ORACLE_ABI = JSON.parse(fs.readFileSync('../src/abis/PythPriceOracle.json')).abi;
  const oracle = new ethers.Contract(oracleAddr, ORACLE_ABI, provider);
  
  // BTC pairId
  const btcPairId = ethers.keccak256(ethers.toUtf8Bytes("BTC/USD"));
  const price = await oracle.getPrice(btcPairId);
  console.log('BTC Price:', ethers.formatUnits(price[0], 18));
}
check();
