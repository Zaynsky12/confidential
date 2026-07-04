---
layout: home

hero:
  name: Confidential DEX
  text: The Universal Leverage Protocol
  tagline: Trade crypto, forex, and commodities with up to 100x leverage. Institutional liquidity, zero slippage, and absolute on-chain transparency.
  actions:
    - theme: brand
      text: 📖 Read Documentation
      link: /overview/introduction
    - theme: alt
      text: 🚀 Launch App
      link: http://localhost:5174/

features:
  - title: ⚡ Deterministic Execution
    details: Bypass the limitations of traditional orderbooks. Experience sub-second, zero-latency trade settlements powered by Pyth Oracles.
    link: /trading/mechanics
    linkText: Explore Mechanics
  - title: 🛡️ Asymmetric Whale Defense
    details: Retail traders enjoy guaranteed zero slippage. Institutional-sized orders are regulated by our proprietary Quadratic Price Impact engine.
    link: /trading/fees-and-impact
    linkText: View Fee Structure
  - title: 🏦 Dual-Tranche Yield Matrix
    details: Deposit USDC into our crisis-resistant vaults. Earn sustainable, auto-compounding yields engineered to survive extreme market volatility.
    link: /liquidity/dual-vaults
    linkText: Liquidity Vaults
  - title: 🤖 Permissionless Keeper Network
    details: A completely decentralized execution layer. Deploy a node, automate liquidations, and earn real yield from protocol execution fees.
    link: /developers/keeper-network
    linkText: Run a Node
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #6c8ef8 30%, #a482ff);
}

.VPHero .main {
  order: 1;
  text-align: center;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.VPHero .name,
.VPHero .text,
.VPHero .tagline {
  text-align: center !important;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.VPHero .actions {
  justify-content: center !important;
}
</style>
