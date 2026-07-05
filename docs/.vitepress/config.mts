import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/docs/',
  cleanUrls: true,
  title: "Confidential DEX",
  description: "Advanced Agentic Trading Platform",
  appearance: 'dark',
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Overview', link: '/overview/introduction' },
      { text: 'Trading', link: '/trading/mechanics' },
      { text: 'Liquidity', link: '/liquidity/dual-vaults' }
    ],

    sidebar: [
      {
        text: '📖 Overview',
        collapsed: false,
        items: [
          { text: 'What is Confidential DEX?', link: '/overview/introduction' },
          { text: 'System Architecture', link: '/overview/architecture' }
        ]
      },
      {
        text: '📈 Trading',
        collapsed: false,
        items: [
          { text: 'Trading Mechanics', link: '/trading/mechanics' },
          { text: 'Fees & Price Impact', link: '/trading/fees-and-impact' }
        ]
      },
      {
        text: '🏦 Liquidity (Vaults)',
        collapsed: false,
        items: [
          { text: 'Dual-Tranche Vaults', link: '/liquidity/dual-vaults' },
          { text: 'Risk & Stability', link: '/liquidity/risk-management' }
        ]
      },
      {
        text: '💻 Developers',
        collapsed: false,
        items: [
          { text: 'Keeper Network', link: '/developers/keeper-network' },
          { text: 'Smart Contracts', link: '/developers/smart-contracts' }
        ]
      },
      {
        text: '⚖️ Legal',
        collapsed: false,
        items: [
          { text: 'Privacy Policy', link: '/legal/privacy-policy' },
          { text: 'Terms of Service', link: '/legal/terms-of-service' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Zaynsky12/arctrade' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026-present Confidential DEX'
    },
    
    search: {
      provider: 'local'
    }
  }
})
