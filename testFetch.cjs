const fetch = require('node-fetch');

const PAIRS = [
  { name: 'BTC/USDC', pythId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43' },
  { name: 'ETH/USDC', pythId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace' },
];

async function testFetch() {
  console.log('1. Joining IDs');
  const ids = PAIRS.map(p => p.pythId).join('&ids[]=');
  console.log('2. Fetching URL', `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${ids}`);
  const response = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${ids}`);
  console.log('3. Got response', response.status);
  const data = await response.json();
  console.log('4. Got data', !!data.parsed);
}
testFetch().catch(console.error);
