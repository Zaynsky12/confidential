const { ethers } = require('ethers');
const provider = new ethers.providers.JsonRpcProvider('https://rpc.testnet.arc.network');
async function check() {
  const b = await provider.getBlockNumber();
  console.log('Current Block:', b);
}
check();
