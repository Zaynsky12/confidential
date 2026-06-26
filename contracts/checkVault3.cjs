const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const CORE_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialCore.json')).abi;
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json')).abi;
const VAULT_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialVault.json')).abi;

async function check() {
  const trading = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);
  const coreAddr = await trading.core();
  const core = new ethers.Contract(coreAddr, CORE_ABI, provider);
  const vaultAddr = await core.vault();
  const vault = new ethers.Contract(vaultAddr, VAULT_ABI, provider);
  
  const cap = await core.utilizationCapBps();
  const util = await vault.utilization();
  console.log('Vault Utilization:', util.toString(), 'BPS');
  console.log('Vault Cap:', cap.toString(), 'BPS');
}
check();
