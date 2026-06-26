const { ethers } = require('ethers');
const provider = new ethers.providers.JsonRpcProvider('https://rpc.testnet.arc.network');
const abi = ['function primeLockup() view returns (uint256)', 'function degenLockup() view returns (uint256)'];
const contract = new ethers.Contract('0x3a9e038bB29C2d8dc13891639b444a80B8F57952', abi, provider);
async function check() {
  const p = await contract.primeLockup();
  const d = await contract.degenLockup();
  console.log('Prime:', p.toString(), 'Degen:', d.toString());
}
check();
