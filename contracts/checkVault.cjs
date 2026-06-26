const { ethers } = require('ethers');
const fs = require('fs');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const TRADING_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialTrading.json')).abi;
const CORE_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialCore.json')).abi;
const VAULT_ABI = JSON.parse(fs.readFileSync('../src/abis/ConfidentialVault.json')).abi;

async function check() {
  const trading = new ethers.Contract('0x35eCC51F4172c6ab2c5F0e51e75761D1473F5277', TRADING_ABI, provider);
  const coreAddr = await trading.core();
  const core = new ethers.Contract(coreAddr, CORE_ABI, provider);
  const vaultAddr = await core.vault();
  const vault = new ethers.Contract(vaultAddr, VAULT_ABI, provider);
  
  const degenAssets = await vault.getDegenAssets();
  const primeAssets = await vault.getPrimeAssets();
  const locked = await vault.getLockedLiquidity();
  
  console.log('Degen:', ethers.formatUnits(degenAssets, 6));
  console.log('Locked:', ethers.formatUnits(locked, 6));
  if (degenAssets > 0n) {
      console.log('Utilization:', (Number(locked) * 100 / Number(degenAssets)).toFixed(2) + '%');
  }
}
check();
