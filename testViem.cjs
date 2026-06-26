const { keccak256, toHex, stringToHex } = require('viem');
try {
    console.log(keccak256(stringToHex('BTC/USDC')));
    console.log(keccak256(toHex('BTC/USDC')));
} catch (e) {
    console.log('Error:', e.message);
}
