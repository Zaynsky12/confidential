import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const coreAbi = [
    "function getPairConfig(bytes32) view returns(tuple(bytes32 pairId, bytes32 pythFeedId, uint256 maxLeverage, uint256 maxLongOI, uint256 maxShortOI, uint256 maxPositionPct, bool active))"
  ];
  const core = new ethers.Contract("0x3396f443b8D0D144C831cf7EB4b0cAE5c3BaBd27", coreAbi, provider);

  const pairs = [
    'BTC/USDC', 'ETH/USDC', 'SOL/USDC', 'BNB/USDC', 'XRP/USDC',
    'LINK/USDC', 'ARB/USDC', 'AVAX/USDC', 'SUI/USDC', 'APT/USDC', 'NEAR/USDC',
    'DOGE/USDC', 'PEPE/USDC', 'WIF/USDC',
    'AAPL/USDC', 'TSLA/USDC', 'SPY/USDC', 'NVDA/USDC',
    'GOLD/USDC', 'SILVER/USDC',
    'EUR/USDC', 'GBP/USDC', 'USDJPY/USDC'
  ];

  for (const pair of pairs) {
    try {
      const id = ethers.id(pair);
      const config = await core.getPairConfig(id);
      console.log(`${pair}: ${config.maxLeverage.toString()}`);
    } catch(e) {
      console.log(`Failed for ${pair}`);
    }
  }
}
main().catch(console.error);
