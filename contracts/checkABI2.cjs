const fs = require('fs');
const TRADING_ABI = JSON.parse(fs.readFileSync('artifacts/src/ConfidentialTrading.sol/ConfidentialTrading.json')).abi;
const po = TRADING_ABI.find(x => x.name === 'pendingOrders');
console.log(po.outputs.map(o => o.name + ' ' + o.type));
