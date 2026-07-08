import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTradeStore } from '../store/useTradeStore';
import { useReadContract } from 'wagmi';
import { CONTRACTS, ABIS } from '../config/contracts';

const getAssetLogo = (pair: string) => {
  const base = pair.split('/')[0].toLowerCase()
  const map: Record<string, string> = {
    btc: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    eth: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    sol: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    link: 'https://cryptologos.cc/logos/chainlink-link-logo.png',
    arb: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
    doge: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png',
    eur: 'https://flagcdn.com/w40/eu.png',
    gbp: 'https://flagcdn.com/w40/gb.png',
    usdjpy: 'https://flagcdn.com/w40/jp.png',
    aapl: 'https://ui-avatars.com/api/?name=Apple&background=000000&color=fff&rounded=true&bold=true',
    tsla: 'https://ui-avatars.com/api/?name=Tesla&background=cc0000&color=fff&rounded=true&bold=true',
    spy: 'https://ui-avatars.com/api/?name=SPY&background=003366&color=fff&rounded=true&bold=true',
    gold: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4705.png',
    silver: 'https://ui-avatars.com/api/?name=Silver&background=c0c0c0&color=000&rounded=true&bold=true',
    nvda: 'https://ui-avatars.com/api/?name=Nvidia&background=76b900&color=fff&rounded=true&bold=true',
    pepe: 'https://cryptologos.cc/logos/pepe-pepe-logo.png',
    wif: '/wif.jpg',
    sui: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sui/info/logo.png',
    apt: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/aptos/info/logo.png',
    avax: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
    bnb: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
    xrp: '/xrp.jpg',
    near: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/near/info/logo.png'
  }
  return map[base] || `https://ui-avatars.com/api/?name=${base}&background=1a202c&color=fff&rounded=true&bold=true`
}

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeStrategyTab, setActiveStrategyTab] = useState<'metals' | 'forex' | 'equities'>('metals');
  const markets = useTradeStore(state => state.markets);
  
  // Fetch live stats from the smart contract
  const { data: nextPositionId } = useReadContract({
    address: CONTRACTS.TRADING as `0x${string}`,
    abi: ABIS.TRADING,
    functionName: 'nextPositionId',
    query: {
      refetchInterval: 10000, // refresh every 10s
    }
  });

  const activeTraders = nextPositionId ? Number(nextPositionId) - 1 : 0;
  const displayTraders = activeTraders > 0 ? activeTraders.toLocaleString() : '...';
  
  // Calculate Global Volume from the sum of all individual market 24h volumes
  const totalVolume = markets.reduce((acc, curr) => acc + (curr.volume24h || 0), 0);
  
  // Format the total volume beautifully (e.g., "$1.2M", "$32.4B")
  let formattedVolume = "$0";
  if (totalVolume > 0) {
    if (totalVolume >= 1_000_000_000) {
      formattedVolume = `$${(totalVolume / 1_000_000_000).toFixed(2)}B`;
    } else if (totalVolume >= 1_000_000) {
      formattedVolume = `$${(totalVolume / 1_000_000).toFixed(2)}M`;
    } else if (totalVolume >= 1_000) {
      formattedVolume = `$${(totalVolume / 1_000).toFixed(2)}K`;
    } else {
      formattedVolume = `$${totalVolume.toFixed(2)}`;
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#131313', color: '#e5e2e1', fontFamily: "'Geist', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Geist:wght@400;600;700;800;900&display=swap');

        .glow-mint {
          box-shadow: 0 0 24px rgba(75, 255, 153, 0.2);
        }
        .glow-mint:hover {
          box-shadow: 0 0 32px rgba(75, 255, 153, 0.4);
        }
        .glass-surface {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
        }
        .hero-overlay {
          background: linear-gradient(to bottom, rgba(19,19,19,0.4) 0%, rgba(19,19,19,0.85) 100%);
        }
        .home-feature-card:hover {
          transform: translateY(-4px);
        }
        .home-faq-item:hover {
          background: #2a2a2a !important;
        }
        .home-footer-link:hover {
          color: #1ae381 !important;
          opacity: 1 !important;
        }
        .home-nav-link:hover {
          color: #4BFF99 !important;
        }

        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .market-marquee-container {
          overflow: hidden;
          white-space: nowrap;
          width: 100%;
          background: rgba(19, 19, 19, 0.4);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          padding: 16px 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
          z-index: 20;
        }
        @media (min-width: 768px) {
          .market-marquee-container { padding: 32px 0; gap: 32px; }
        }
        .market-marquee {
          display: flex;
          width: max-content;
        }
        .marquee-left {
          animation: scroll 120s linear infinite;
        }
        .marquee-right {
          animation: scroll-reverse 120s linear infinite;
        }
        .market-marquee:hover {
          animation-play-state: paused;
        }
        .market-item {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0 20px;
          color: #e5e2e1;
          font-family: 'Geist', sans-serif;
          font-weight: 600;
          font-size: 13px;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        @media (min-width: 768px) {
          .market-item { gap: 10px; margin: 0 48px; font-size: 15px; }
        }
        .market-item:hover {
          opacity: 0.8;
        }

        /* ═══ Typography ═══ */
        .t-headline-xl {
          font-family: 'Geist', sans-serif;
          font-size: 46px;
          line-height: 52px;
          letter-spacing: -0.04em;
          font-weight: 700;
        }
        .t-headline-lg {
          font-family: 'Geist', sans-serif;
          font-size: 20px;
          line-height: 28px;
          letter-spacing: -0.02em;
          font-weight: 600;
        }
        .t-headline-lg-mobile {
          font-family: 'Geist', sans-serif;
          font-size: 18px;
          line-height: 24px;
          font-weight: 600;
        }
        .t-body-md {
          font-family: 'Geist', sans-serif;
          font-size: 14px;
          line-height: 22px;
          font-weight: 400;
        }
        .t-hero-p {
          font-family: 'Geist', sans-serif;
          font-size: 17px;
          line-height: 26px;
          font-weight: 400;
        }
        .t-body-sm {
          font-family: 'Geist', sans-serif;
          font-size: 13px;
          line-height: 18px;
          font-weight: 400;
        }
        .t-cta {
          font-family: 'Geist', sans-serif;
          font-size: 14px;
          line-height: 18px;
          letter-spacing: 0.02em;
          font-weight: 600;
        }
        .t-label-mono {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          line-height: 14px;
          letter-spacing: 0.05em;
          font-weight: 500;
        }
        .footer-logo {
          width: 24px;
          height: 24px;
        }
        .footer-title {
          font-size: 20px;
        }
        .footer-copy {
          font-size: 12px;
          line-height: 18px;
        }

        /* ═══ Desktop overrides ═══ */
        @media (min-width: 768px) {
          .t-headline-xl {
            font-size: 80px;
            line-height: 88px;
          }
          .t-hero-p {
            font-size: 23px;
            line-height: 34px;
          }
          .t-headline-lg {
            font-size: 32px;
            line-height: 40px;
          }
          .t-headline-lg-mobile {
            font-size: 24px;
            line-height: 32px;
          }
          .t-body-md {
            font-size: 16px;
            line-height: 24px;
          }
          .t-cta {
            font-size: 16px;
            line-height: 20px;
          }
          .t-label-mono {
            font-size: 12px;
            line-height: 16px;
          }
          .footer-logo {
            width: 32px !important;
            height: 32px !important;
          }
          .footer-title {
            font-size: 24px !important;
          }
          .footer-copy {
            font-size: 14px !important;
            line-height: 20px !important;
          }
          .home-stats-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .home-stats-item:not(:first-child) {
            border-left: 1px solid rgba(255,255,255,0.1);
          }
          .home-features-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .home-institutional-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .home-footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .home-footer-right {
            align-items: flex-end !important;
          }
          .home-nav-desktop {
            display: flex !important;
          }
          .home-nav-container {
            padding: 16px 64px !important;
          }
          .home-section-pad {
            padding-left: 64px !important;
            padding-right: 64px !important;
          }
          .home-trust-heading {
            font-size: 56px !important;
            line-height: 64px !important;
          }
          .home-token-heading {
            font-size: 64px !important;
            line-height: 72px !important;
          }
          .home-features-heading {
            font-size: 48px !important;
            line-height: 56px !important;
          }
          .stats-number {
            font-size: 36px !important;
          }
          .md-block {
            display: block !important;
          }
          .feature-title {
            font-size: 18px !important;
          }
          .feature-desc {
            font-size: 14px !important;
            line-height: 24px !important;
          }
          .feature-num {
            font-size: 20px !important;
          }
        }
        .md-block {
          display: none;
        }
        .feature-title {
          font-family: 'Geist', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #fbfff8;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .feature-desc {
          font-family: 'Geist', sans-serif;
          font-size: 12px;
          line-height: 20px;
          color: #bacbbb;
          margin: 0;
        }
        .feature-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          font-weight: 700;
          color: rgba(75, 255, 153, 0.4);
        }
        .stats-label-responsive {
          font-size: 9.5px;
          letter-spacing: 0.08em;
        }
        .stats-num-responsive {
          font-size: 16px;
        }
        @media (min-width: 640px) {
          .stats-label-responsive {
            font-size: 11px;
            letter-spacing: 0.1em;
          }
          .stats-num-responsive {
            font-size: 22px;
          }
        }

        /* ═══ Mockup Float Animation ═══ */
        @keyframes mockup-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .home-mockup-float {
          animation: mockup-float 6s ease-in-out infinite;
        }
        .home-mockup-float:hover {
          transform: translateY(-6px) scale(1.01) !important;
          box-shadow: 0 48px 120px rgba(0, 0, 0, 0.8), 0 0 100px rgba(75, 255, 153, 0.12) !important;
        }

        /* ═══ Feature Item Hover ═══ */
        .home-feature-item:hover {
          background: rgba(75, 255, 153, 0.04) !important;
          border-color: rgba(75, 255, 153, 0.15) !important;
          transform: translateY(-4px);
        }

        /* ═══ Feature Connector Line ═══ */
        .feature-connector {
          position: absolute;
          background: linear-gradient(to bottom, transparent, rgba(75, 255, 153, 0.3) 20%, rgba(75, 255, 153, 0.3) 80%, transparent);
          width: 2px;
          height: calc(100% - 64px);
          left: calc(50% - 1px);
          top: 32px;
          z-index: 0;
          box-shadow: 0 0 16px rgba(75, 255, 153, 0.4);
        }
        @media (min-width: 768px) {
          .feature-connector {
            background: linear-gradient(to right, transparent, rgba(75, 255, 153, 0.3) 20%, rgba(75, 255, 153, 0.3) 80%, transparent);
            width: calc(100% - 64px);
            height: 2px;
            left: 32px;
        }

        /* ═══ Avantis-Inspired Strategy & Edge Cards ═══ */
        .edge-grid-2x2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 900px) {
          .edge-grid-2x2 {
            grid-template-columns: 1fr 1fr;
          }
        }
        .edge-card {
          position: relative;
          background: rgba(14, 14, 19, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 22px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        @media (min-width: 768px) {
          .edge-card {
            padding: 36px;
            border-radius: 24px;
          }
        }
        .edge-card:hover {
          border-color: rgba(75, 255, 153, 0.3);
          transform: translateY(-5px);
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6), 0 0 40px rgba(75, 255, 153, 0.08);
          background: rgba(20, 22, 28, 0.75);
        }
        .edge-card-trader:hover {
          border-color: rgba(213, 134, 255, 0.45);
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6), 0 0 40px rgba(213, 134, 255, 0.12);
        }
        .edge-card-lp:hover {
          border-color: rgba(75, 255, 153, 0.45);
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6), 0 0 40px rgba(75, 255, 153, 0.12);
        }
        .responsive-card-h3 {
          font-family: 'Geist', sans-serif;
          font-size: 18px;
          line-height: 24px;
          font-weight: 700;
          color: #fbfff8;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        @media (min-width: 768px) {
          .responsive-card-h3 {
            font-size: 32px;
            line-height: 38px;
            margin-bottom: 16px;
          }
        }
        .responsive-headline-xl {
          color: #fbfff8;
          font-size: 24px;
          line-height: 32px;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin: 0;
        }
        @media (min-width: 768px) {
          .responsive-headline-xl {
            font-size: 48px;
            line-height: 56px;
          }
        }
        .vaults-responsive-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          width: 100%;
          max-width: 960px;
          margin-bottom: 40px;
        }
        @media (min-width: 768px) {
          .vaults-responsive-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }
        }
        .vault-card-inner {
          padding: 22px;
          border-radius: 18px;
        }
        @media (min-width: 768px) {
          .vault-card-inner {
            padding: 32px;
            border-radius: 20px;
          }
        }
        .strategy-card-responsive {
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .strategy-card-responsive {
            border-radius: 24px;
            padding: 32px;
            gap: 32px;
          }
        }
        .strategy-tab-btn {
          flex: 1 1 auto;
          text-align: center;
          padding: 8px 10px;
          border-radius: 9999px;
          font-family: 'Geist', sans-serif;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          border: 1px solid transparent;
          background: rgba(255, 255, 255, 0.04);
          color: #bacbbb;
          white-space: nowrap;
        }
        @media (min-width: 768px) {
          .strategy-tab-btn {
            flex: 0 0 auto;
            padding: 12px 24px;
            font-size: 15px;
          }
        }
        .strategy-tab-btn:hover {
          color: #fbfff8;
          background: rgba(255, 255, 255, 0.08);
        }
        .strategy-tab-btn.active {
          background: rgba(75, 255, 153, 0.15);
          color: #4BFF99;
          border-color: rgba(75, 255, 153, 0.4);
          box-shadow: 0 0 20px rgba(75, 255, 153, 0.15);
        }
        .strategy-tabs-container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 16px;
        }
        @media (min-width: 640px) {
          .strategy-tabs-container {
            display: flex;
            gap: 12px;
            padding-bottom: 24px;
          }
        }
        .tab-mobile-only {
          display: inline;
        }
        .tab-desktop-only {
          display: none;
        }
        @media (min-width: 640px) {
          .tab-mobile-only {
            display: none;
          }
          .tab-desktop-only {
            display: inline;
          }
        }
        .strategy-asset-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background 0.2s ease;
        }
        .strategy-asset-row:last-child {
          border-bottom: none;
        }
        .strategy-asset-row:hover {
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
        }
        .strategy-table-card {
          background: rgba(0,0,0,0.45);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          overflow: hidden;
        }
        .strategy-table-grid {
          display: grid;
          grid-template-columns: 1.5fr 0.8fr 1fr;
          gap: 6px;
          align-items: center;
        }
        @media (min-width: 640px) {
          .strategy-table-grid {
            grid-template-columns: 2fr 1fr 1fr;
            gap: 12px;
          }
        }
        .strategy-pair-text {
          font-weight: 600;
          color: #fbfff8;
          font-size: 12px;
        }
        @media (min-width: 640px) {
          .strategy-pair-text {
            font-size: 14px;
          }
        }
        .strategy-card-glow {
          background: radial-gradient(circle at top right, rgba(75, 255, 153, 0.08), transparent 60%),
                      radial-gradient(circle at bottom left, rgba(75, 255, 153, 0.05), transparent 60%),
                      rgba(14, 14, 19, 0.75);
        }
        .widget-flex-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: flex-start;
          padding: 10px 0;
        }
        @media (min-width: 480px) {
          .widget-flex-row {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
        .strategy-grid-responsive {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .strategy-grid-responsive {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
        }
      `}</style>

      {/* ═══ TopNavBar ═══ */}
      <nav style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'fixed', top: 0, zIndex: 50, width: '100%' }}>
        <div className="home-nav-container" style={{ maxWidth: 1280, margin: '0 auto', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/logo.png" alt="Confidential Logo" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'contain' }} />
            <span className="hidden md:inline" style={{ fontFamily: "'Geist', sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: '-0.04em', color: '#fbfff8' }}>Confidential</span>
          </div>
          <div className="home-nav-desktop" style={{ display: 'none', alignItems: 'center', gap: 32 }}>
            <Link to="/trade" className="home-nav-link" style={{ color: '#bacbbb', fontWeight: 500, fontFamily: "'Geist', sans-serif", fontSize: 16, letterSpacing: '0.02em', textDecoration: 'none', transition: 'color 0.3s' }}>Trade</Link>
            <Link to="/vaults" className="home-nav-link" style={{ color: '#bacbbb', fontFamily: "'Geist', sans-serif", fontSize: 16, letterSpacing: '0.02em', fontWeight: 500, textDecoration: 'none', transition: 'color 0.3s' }}>Stake</Link>
            <a href="/docs/overview/introduction.html" className="home-nav-link" style={{ color: '#bacbbb', fontFamily: "'Geist', sans-serif", fontSize: 16, letterSpacing: '0.02em', fontWeight: 500, textDecoration: 'none', transition: 'color 0.3s' }}>Docs</a>
          </div>
          <Link to="/trade" className="glow-mint" style={{ backgroundColor: '#4BFF99', color: '#131313', padding: '8px 24px', borderRadius: 9999, fontFamily: "'Geist', sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: '0.02em', textDecoration: 'none', display: 'inline-block', transition: 'all 0.3s' }}>
            Launch App
          </Link>
        </div>
      </nav>

      {/* ═══ Hero Section ═══ */}
      <section style={{ position: 'relative', display: 'flex', flexDirection: 'column', paddingTop: 100, backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBb_cWYwrsqX2bYrkJrvDCF9_x4mcbMa7q2xqeZ4YWhYdWYO1fIOwlkjErTIsZRXTHg4b68_uvTBZh5jL_ZzDq6Oe-gw_IOAgAh3xIf6hrS_CvFz8Puaj018StL_B5cv_jIJVFLv1cN032wks7CGnL-2BX-a47Lgz-gCkGhYW3beEMnt3bP9d9ghftm5xt9Hq0nkjybX0L0sHcfumueeZvFDhRjhU76HjZIpKFRZEZNhy9mUMVY4fzrS1hcAgKCUUoc-ZQfjsINvIZ_")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="hero-overlay" style={{ position: 'absolute', inset: 0 }}></div>
        <div className="home-section-pad" style={{ position: 'relative', zIndex: 10, maxWidth: 1280, margin: '0 auto', padding: '0 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 className="t-headline-xl" style={{ color: '#fbfff8', maxWidth: 896, letterSpacing: '-0.04em', marginBottom: 16 }}>
            The Universal <br /><span style={{ color: '#4BFF99' }}>Leverage Protocol.</span>
          </h1>
          <p className="t-hero-p" style={{ color: '#bacbbb', maxWidth: 672, marginBottom: 0 }}>
            Trade crypto, forex, and commodities with up to 100x leverage. Institutional liquidity, zero front-running, and absolute on-chain transparency on the Arc Network.
          </p>
        </div>

        {/* ═══ Market Marquee ═══ */}
        <div className="market-marquee-container" style={{ position: 'relative', marginTop: 48 }}>
          {/* Baris Pertama: Gerak ke Kiri */}
          <div className="market-marquee marquee-left">
            {[...markets, ...markets].map((m, idx) => (
              <Link 
                to="/trade" 
                key={`left-${m.id}-${idx}`} 
                className="market-item" 
                onClick={() => useTradeStore.getState().setActiveMarket(m.id)}
              >
                <img 
                  src={getAssetLogo(m.pair)} 
                  alt={m.pair} 
                  style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', background: m.category === 'crypto' ? 'transparent' : '#fff', padding: m.category === 'rwa' ? '2px' : '0' }} 
                  onError={(e) => e.currentTarget.style.display = 'none'} 
                />
                <span>{m.pair}</span>
              </Link>
            ))}
          </div>
          
          {/* Baris Kedua: Gerak ke Kanan */}
          <div className="market-marquee marquee-right">
            {[...markets].reverse().concat([...markets].reverse()).map((m, idx) => (
              <Link 
                to="/trade" 
                key={`right-${m.id}-${idx}`} 
                className="market-item" 
                onClick={() => useTradeStore.getState().setActiveMarket(m.id)}
              >
                <img 
                  src={getAssetLogo(m.pair)} 
                  alt={m.pair} 
                  style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', background: m.category === 'crypto' ? 'transparent' : '#fff', padding: m.category === 'rwa' ? '2px' : '0' }} 
                  onError={(e) => e.currentTarget.style.display = 'none'} 
                />
                <span>{m.pair}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Stats Bar ═══ */}
      <section style={{ position: 'relative', zIndex: 30, padding: '0 16px', marginTop: 36, marginBottom: 36 }}>
        <div className="glass-surface stats-bar-responsive" style={{ maxWidth: 1024, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', alignItems: 'center', padding: '14px 8px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', background: 'linear-gradient(135deg, rgba(20,20,20,0.8) 0%, rgba(10,10,10,0.9) 100%)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'center', flex: 1, minWidth: 0, padding: '6px 0' }}>
            <span className="t-label-mono stats-label-responsive" style={{ color: '#88919e', textTransform: 'uppercase' }}>Total Trades</span>
            <span className="stats-number stats-num-responsive" style={{ color: '#fbfff8', textShadow: '0 0 24px rgba(255,255,255,0.1)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{displayTraders}</span>
          </div>
          
          <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)', flexShrink: 0 }}></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'center', flex: 1, minWidth: 0, padding: '6px 0' }}>
            <span className="t-label-mono stats-label-responsive" style={{ color: '#88919e', textTransform: 'uppercase' }}>Global Volume</span>
            <span className="stats-number stats-num-responsive" style={{ color: '#4BFF99', textShadow: '0 0 24px rgba(75,255,153,0.2)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{formattedVolume}</span>
          </div>
          
          <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)', flexShrink: 0 }}></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'center', flex: 1, minWidth: 0, padding: '6px 0' }}>
            <span className="t-label-mono stats-label-responsive" style={{ color: '#88919e', textTransform: 'uppercase' }}>Markets</span>
            <span className="stats-number stats-num-responsive" style={{ color: '#fbfff8', textShadow: '0 0 24px rgba(255,255,255,0.1)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{markets.length}</span>
          </div>
        </div>
      </section>

      {/* ═══ Features Section ═══ */}
      <section className="home-section-pad" style={{ padding: '64px 16px 0px 16px', backgroundColor: '#070707' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span className="t-label-mono" style={{ color: '#4BFF99', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>UNIVERSAL ACCESS</span>
            <h2 className="t-headline-lg home-features-heading" style={{ color: '#fbfff8', letterSpacing: '-0.02em', fontWeight: 700, margin: 0 }}>Scalable Leverage for Everyone</h2>
          </div>

          {/* Institutional Laptop Mockup */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 960, margin: '-32px auto 0 auto', zIndex: 20 }}>
            <img 
              src="/app-preview.png" 
              alt="Confidential Trading Platform" 
              className="home-mockup-float"
              style={{ 
                position: 'relative',
                zIndex: 1,
                width: '100%', 
                borderRadius: 16,
                mixBlendMode: 'screen', // This will make the black background disappear completely
                filter: 'drop-shadow(0 20px 40px rgba(75, 255, 153, 0.1))',
                pointerEvents: 'none',
                userSelect: 'none',
              }} 
            />
          </div>
        </div>
      </section>

      {/* ═══ Avantis-Inspired Strategy Showcase ═══ */}
      <section className="home-section-pad" style={{ padding: '0px 16px 64px 16px', backgroundColor: '#070707', marginTop: '-30px', position: 'relative', zIndex: 25, overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Strategy Tabs & Comparison Card */}
          <div className="glass-surface strategy-card-glow strategy-card-responsive" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="strategy-tabs-container">
              <button
                className={`strategy-tab-btn ${activeStrategyTab === 'metals' ? 'active' : ''}`}
                onClick={() => setActiveStrategyTab('metals')}
              >
                <span className="tab-mobile-only">Metals</span>
                <span className="tab-desktop-only">Metals x Crypto</span>
              </button>
              <button
                className={`strategy-tab-btn ${activeStrategyTab === 'forex' ? 'active' : ''}`}
                onClick={() => setActiveStrategyTab('forex')}
              >
                <span className="tab-mobile-only">Forex</span>
                <span className="tab-desktop-only">Forex x Crypto</span>
              </button>
              <button
                className={`strategy-tab-btn ${activeStrategyTab === 'equities' ? 'active' : ''}`}
                onClick={() => setActiveStrategyTab('equities')}
              >
                <span className="tab-mobile-only">Equities</span>
                <span className="tab-desktop-only">Equities x Crypto</span>
              </button>
            </div>

            <div className="strategy-grid-responsive">
              {/* Left Column: Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <span className="t-label-mono" style={{ color: '#4BFF99', letterSpacing: '0.1em' }}>
                  {activeStrategyTab === 'metals' && 'PRECIOUS METALS DIVERSIFICATION'}
                  {activeStrategyTab === 'forex' && 'GLOBAL MACRO FOREX HEDGING'}
                  {activeStrategyTab === 'equities' && 'ON-CHAIN SYNTHETIC EQUITIES'}
                </span>
                <h3 style={{ fontFamily: "'Geist', sans-serif", fontSize: 22, fontWeight: 700, color: '#fbfff8', margin: 0 }}>
                  {activeStrategyTab === 'metals' && 'Hedge Volatility with On-Chain Gold & Silver'}
                  {activeStrategyTab === 'forex' && 'Trade Global Currencies 24/7 with Zero Front-Running'}
                  {activeStrategyTab === 'equities' && 'Instant Blue-Chip Stock Exposure on the Arc Network'}
                </h3>
                <p className="t-body-md" style={{ color: '#bacbbb', margin: 0, lineHeight: '24px' }}>
                  {activeStrategyTab === 'metals' && 'Metals like Gold and Silver often retain or grow their value during economic uncertainty. Pair up to 50x leverage on GOLD/USDC and SILVER/USDC on one single collateral pool.'}
                  {activeStrategyTab === 'forex' && 'Capture macro rate shifts on EUR/USDC, GBP/USDC, and USDJPY/USDC. Benefit from institutional-grade liquidity and zero P2P matching delays.'}
                  {activeStrategyTab === 'equities' && 'Long or short NVDA/USDC, AAPL/USDC, and TSLA/USDC synthetics with up to 20x leverage (and 50x on SPY/USDC). No brokerage cut-off hours, no geographic restrictions.'}
                </p>
              </div>

              {/* Right Column: Asset List & CTA at bottom */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="strategy-table-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                    <span style={{ color: '#88919e', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>ASSET PAIR</span>
                    <span style={{ color: '#88919e', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>MAX LEVERAGE</span>
                  </div>

                  {activeStrategyTab === 'metals' && (
                    <>
                      <div className="strategy-asset-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/4705.png" alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', background: '#fff', padding: '2px', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#fbfff8', fontSize: 14 }}>GOLD / USDC</div>
                            <div style={{ fontSize: 11, color: '#88919e' }}>Pyth Sub-ms Oracle</div>
                          </div>
                        </div>
                        <span style={{ color: '#4BFF99', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 14, background: 'rgba(75,255,153,0.1)', padding: '4px 10px', borderRadius: 9999, border: '1px solid rgba(75,255,153,0.25)' }}>50x</span>
                      </div>
                      <div className="strategy-asset-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src="https://ui-avatars.com/api/?name=Silver&background=c0c0c0&color=000&rounded=true&bold=true" alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#fbfff8', fontSize: 14 }}>SILVER / USDC</div>
                            <div style={{ fontSize: 11, color: '#88919e' }}>Pyth Sub-ms Oracle</div>
                          </div>
                        </div>
                        <span style={{ color: '#4BFF99', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 14, background: 'rgba(75,255,153,0.1)', padding: '4px 10px', borderRadius: 9999, border: '1px solid rgba(75,255,153,0.25)' }}>50x</span>
                      </div>
                    </>
                  )}

                  {activeStrategyTab === 'forex' && (
                    <>
                      <div className="strategy-asset-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src="https://flagcdn.com/w40/eu.png" alt="" style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#fbfff8', fontSize: 14 }}>EUR / USDC</div>
                            <div style={{ fontSize: 11, color: '#88919e' }}>Pyth Sub-ms Oracle</div>
                          </div>
                        </div>
                        <span style={{ color: '#4BFF99', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 14, background: 'rgba(75,255,153,0.1)', padding: '4px 10px', borderRadius: 9999, border: '1px solid rgba(75,255,153,0.25)' }}>100x</span>
                      </div>
                      <div className="strategy-asset-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src="https://flagcdn.com/w40/gb.png" alt="" style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#fbfff8', fontSize: 14 }}>GBP / USDC</div>
                            <div style={{ fontSize: 11, color: '#88919e' }}>Pyth Sub-ms Oracle</div>
                          </div>
                        </div>
                        <span style={{ color: '#4BFF99', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 14, background: 'rgba(75,255,153,0.1)', padding: '4px 10px', borderRadius: 9999, border: '1px solid rgba(75,255,153,0.25)' }}>100x</span>
                      </div>
                      <div className="strategy-asset-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src="https://flagcdn.com/w40/jp.png" alt="" style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#fbfff8', fontSize: 14 }}>USDJPY / USDC</div>
                            <div style={{ fontSize: 11, color: '#88919e' }}>Pyth Sub-ms Oracle</div>
                          </div>
                        </div>
                        <span style={{ color: '#4BFF99', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 14, background: 'rgba(75,255,153,0.1)', padding: '4px 10px', borderRadius: 9999, border: '1px solid rgba(75,255,153,0.25)' }}>100x</span>
                      </div>
                    </>
                  )}

                  {activeStrategyTab === 'equities' && (
                    <>
                      <div className="strategy-asset-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src="https://ui-avatars.com/api/?name=Nvidia&background=76b900&color=fff&rounded=true&bold=true" alt="" style={{ width: 22, height: 22, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#fbfff8', fontSize: 14 }}>NVDA / USDC</div>
                            <div style={{ fontSize: 11, color: '#88919e' }}>Pyth Sub-ms Oracle</div>
                          </div>
                        </div>
                        <span style={{ color: '#4BFF99', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 14, background: 'rgba(75,255,153,0.1)', padding: '4px 10px', borderRadius: 9999, border: '1px solid rgba(75,255,153,0.25)' }}>20x</span>
                      </div>
                      <div className="strategy-asset-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src="https://ui-avatars.com/api/?name=Apple&background=000000&color=fff&rounded=true&bold=true" alt="" style={{ width: 22, height: 22, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#fbfff8', fontSize: 14 }}>AAPL / USDC</div>
                            <div style={{ fontSize: 11, color: '#88919e' }}>Pyth Sub-ms Oracle</div>
                          </div>
                        </div>
                        <span style={{ color: '#4BFF99', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 14, background: 'rgba(75,255,153,0.1)', padding: '4px 10px', borderRadius: 9999, border: '1px solid rgba(75,255,153,0.25)' }}>20x</span>
                      </div>
                      <div className="strategy-asset-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src="https://ui-avatars.com/api/?name=Tesla&background=cc0000&color=fff&rounded=true&bold=true" alt="" style={{ width: 22, height: 22, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#fbfff8', fontSize: 14 }}>TSLA / USDC</div>
                            <div style={{ fontSize: 11, color: '#88919e' }}>Pyth Sub-ms Oracle</div>
                          </div>
                        </div>
                        <span style={{ color: '#4BFF99', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 14, background: 'rgba(75,255,153,0.1)', padding: '4px 10px', borderRadius: 9999, border: '1px solid rgba(75,255,153,0.25)' }}>20x</span>
                      </div>
                      <div className="strategy-asset-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src="https://ui-avatars.com/api/?name=SPY&background=003366&color=fff&rounded=true&bold=true" alt="" style={{ width: 22, height: 22, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#fbfff8', fontSize: 14 }}>SPY / USDC</div>
                            <div style={{ fontSize: 11, color: '#88919e' }}>Pyth Sub-ms Oracle</div>
                          </div>
                        </div>
                        <span style={{ color: '#4BFF99', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 14, background: 'rgba(75,255,153,0.1)', padding: '4px 10px', borderRadius: 9999, border: '1px solid rgba(75,255,153,0.25)' }}>50x</span>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <Link
                    to="/trade"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      gap: 8,
                      padding: '12px 20px',
                      borderRadius: 9999,
                      background: 'rgba(75, 255, 153, 0.1)',
                      border: '1px solid rgba(75, 255, 153, 0.35)',
                      color: '#4BFF99',
                      fontFamily: "'Geist', sans-serif",
                      fontWeight: 700,
                      textDecoration: 'none',
                      fontSize: 14,
                      boxShadow: '0 0 20px rgba(75, 255, 153, 0.08)'
                    }}
                  >
                    Explore {activeStrategyTab.toUpperCase()} Markets →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THE CONFIDENTIAL EDGE ("Scalable Leverage for Everyone") ═══ */}
      <section className="home-section-pad" style={{ padding: '64px 16px', backgroundColor: '#070707', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 400, height: 250, background: '#4BFF99', filter: 'blur(160px)', opacity: 0.08, pointerEvents: 'none' }} />
        
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="t-label-mono" style={{ color: '#4BFF99', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>
              THE CONFIDENTIAL EDGE
            </span>
            <h2 className="responsive-headline-xl">
              Engineered for Institutional Scale
            </h2>
          </div>

          <div className="edge-grid-2x2">
            {/* CARD 1: TRADER - Loss Protection & Rebates */}
            <div className="edge-card edge-card-trader">
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 20 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#4BFF99', backgroundColor: 'rgba(75, 255, 153, 0.1)', padding: '6px 14px', borderRadius: 9999, border: '1px solid rgba(75, 255, 153, 0.25)' }}>
                    TRADER ADVANTAGE
                  </span>
                </div>
                <h3 className="responsive-card-h3">
                  Contrarian Skew Advantage
                </h3>
                <p className="t-body-md" style={{ color: '#bacbbb', lineHeight: '26px', marginBottom: 28 }}>
                  Trade smarter against crowded sentiment: Get up to a <strong style={{ color: '#fbfff8' }}>50% discount on price impact</strong> and earn continuous P2P funding rewards when your trade balances Open Interest skew.
                </p>
              </div>

              {/* Interactive Widget inside Card 1 */}
              <div style={{ background: 'rgba(0, 0, 0, 0.5)', borderRadius: 16, padding: '20px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>
                  <span style={{ color: '#bacbbb' }}>MARKET SKEW RATIO</span>
                  <span style={{ color: '#4BFF99', fontWeight: 600 }}>LONG 76% / SHORT 24%</span>
                </div>
                <div style={{ width: '100%', height: 8, background: '#262626', borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 14 }}>
                  <div style={{ width: '76%', background: '#ff5c5c' }} />
                  <div style={{ width: '24%', background: '#4BFF99' }} />
                </div>
                <div className="widget-flex-row">
                  <span style={{ fontSize: 13, color: '#4BFF99', fontWeight: 600 }}>Contrarian Discount Active</span>
                  <span style={{ backgroundColor: 'rgba(75, 255, 153, 0.15)', color: '#4BFF99', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                    50% Impact Discount
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: TRADER - Positive Slippage */}
            <div className="edge-card edge-card-trader">
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 20 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#4BFF99', backgroundColor: 'rgba(75, 255, 153, 0.1)', padding: '6px 14px', borderRadius: 9999, border: '1px solid rgba(75, 255, 153, 0.25)' }}>
                    TRADER ADVANTAGE
                  </span>
                </div>
                <h3 className="responsive-card-h3">
                  Positive Slippage Rewards
                </h3>
                <p className="t-body-md" style={{ color: '#bacbbb', lineHeight: '26px', marginBottom: 28 }}>
                  Get rewarded when you balance Open Interest. Our Quadratic Slippage Engine gives skew-balancing orders <strong style={{ color: '#4BFF99' }}>positive slippage</strong>, executing your trade at a price better than spot market price.
                </p>
              </div>

              {/* Interactive Widget inside Card 2 */}
              <div style={{ background: 'rgba(0, 0, 0, 0.5)', borderRadius: 16, padding: '20px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#88919e', fontFamily: "'JetBrains Mono', monospace" }}>EXECUTION COMPARISON</span>
                  <span style={{ fontSize: 12, color: '#4BFF99', fontFamily: "'JetBrains Mono', monospace" }}>ZERO MEV FRONT-RUNNING</span>
                </div>
                <div className="widget-flex-row" style={{ borderBottom: '1px dashed rgba(255,255,255,0.08)' }}>
                  <span style={{ color: '#bacbbb', fontSize: 14 }}>Traditional DEX Orderbook</span>
                  <span style={{ color: '#ff5c5c', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>-12.4 bps (Negative)</span>
                </div>
                <div className="widget-flex-row">
                  <span style={{ color: '#fbfff8', fontWeight: 600, fontSize: 14 }}>Confidential 2-Step Keeper</span>
                  <span style={{ color: '#4BFF99', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>+15.0 bps (Better than Spot)</span>
                </div>
              </div>
            </div>

            {/* CARD 3: LIQUIDITY PROVIDER - Optimized for LPs */}
            <div className="edge-card edge-card-lp">
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 20 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#4BFF99', backgroundColor: 'rgba(75, 255, 153, 0.1)', padding: '6px 14px', borderRadius: 9999, border: '1px solid rgba(75, 255, 153, 0.25)' }}>
                    LIQUIDITY PROVIDER
                  </span>
                </div>
                <h3 className="responsive-card-h3">
                  Optimized LP Yield Matrix
                </h3>
                <p className="t-body-md" style={{ color: '#bacbbb', lineHeight: '26px', marginBottom: 28 }}>
                  Act as the house. Our dynamic risk engine optimizes LP returns across all market regimes. Earn sustainable, auto-compounding yield from platform trading fees, liquidations, and borrow rates.
                </p>
              </div>

              {/* Protocol Real Yield Revenue Streams Widget */}
              <div style={{ background: 'rgba(0, 0, 0, 0.5)', borderRadius: 16, padding: '20px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="widget-flex-row">
                  <span style={{ fontSize: 12, color: '#88919e', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>REAL YIELD REVENUE SOURCE</span>
                  <span style={{ fontSize: 12, color: '#4BFF99', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>100% REAL USDC</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="widget-flex-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#bacbbb' }}>Trading & Borrow Fee Share</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fbfff8', fontFamily: "'JetBrains Mono', monospace" }}>70% to Vault LPs</span>
                  </div>
                  <div className="widget-flex-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#bacbbb' }}>Liquidation Penalty Allocation</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fbfff8', fontFamily: "'JetBrains Mono', monospace" }}>Direct Vault Accrual</span>
                  </div>
                  <div className="widget-flex-row">
                    <span style={{ fontSize: 13, color: '#bacbbb' }}>Token Dilution / Inflation</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#4BFF99', fontFamily: "'JetBrains Mono', monospace" }}>0.0% (Zero Dilution)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 4: LIQUIDITY PROVIDER - Whale & Toxic Flow Shield */}
            <div className="edge-card edge-card-lp">
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 20 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#4BFF99', backgroundColor: 'rgba(75, 255, 153, 0.1)', padding: '6px 14px', borderRadius: 9999, border: '1px solid rgba(75, 255, 153, 0.25)' }}>
                    LIQUIDITY PROVIDER
                  </span>
                </div>
                <h3 className="responsive-card-h3">
                  Whale & Toxic Flow Shield
                </h3>
                <p className="t-body-md" style={{ color: '#bacbbb', lineHeight: '26px', marginBottom: 28 }}>
                  Your capital is protected against toxic arbitrage. Strict 80% utilization caps and quadratic slippage penalties on massive institutional order sizes shield vault LPs from flash dumps and toxic flow.
                </p>
              </div>

              {/* Security Gauge Widget inside Card 4 */}
              <div style={{ background: 'rgba(0, 0, 0, 0.5)', borderRadius: 16, padding: '20px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div className="widget-flex-row" style={{ marginBottom: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                  <span style={{ color: '#88919e' }}>VAULT UTILIZATION CAP</span>
                  <span style={{ color: '#4BFF99', fontWeight: 700 }}>80% MAX PROTECTED</span>
                </div>
                <div style={{ width: '100%', height: 8, background: '#262626', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ width: '80%', height: '100%', background: 'linear-gradient(90deg, #4BFF99, #1ae381)' }} />
                </div>
                <div className="widget-flex-row" style={{ fontSize: 13 }}>
                  <span style={{ color: '#bacbbb' }}>Keeper Oracle Latency</span>
                  <span style={{ color: '#fbfff8', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>Pyth Pull-Oracle Sub-ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DUAL VAULT LIQUIDITY & YIELD CTA ═══ */}
      <section className="home-section-pad" style={{ padding: '64px 16px', backgroundColor: '#0A0A0E', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-10%', bottom: '-10%', width: 350, height: 350, background: '#4BFF99', borderRadius: '50%', filter: 'blur(160px)', opacity: 0.08, pointerEvents: 'none' }} />
        
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="t-label-mono" style={{ color: '#4BFF99', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>
              REAL YIELD ENGINE
            </span>
            <h2 className="responsive-headline-xl" style={{ marginBottom: 20 }}>
              Fueling Universal Leverage with <span style={{ color: '#4BFF99' }}>Confidential Vaults.</span>
            </h2>
            <p className="t-body-md" style={{ color: '#bacbbb', maxWidth: 680, margin: '0 auto' }}>
              Our platform isn&apos;t just for directional traders. Provide USDC liquidity to earn a sustainable share of protocol trading fees, borrow rates, and liquidation rewards.
            </p>
          </div>

          <div className="vaults-responsive-grid">
            <div className="glass-surface vault-card-inner" style={{ border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#fbfff8', fontFamily: "'JetBrains Mono', monospace" }}>Prime Vault</span>
              </div>
              <p style={{ color: '#bacbbb', fontSize: 14, lineHeight: '22px', margin: 0 }}>
                Designed for capital preservation. Prime LPs enjoy 70% capital protection against severe drawdowns while earning steady yield with 5-day lockup.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#88919e', fontSize: 13 }}>Est. APY</span>
                <span style={{ color: '#4BFF99', fontWeight: 700, fontSize: 18, fontFamily: "'JetBrains Mono', monospace" }}>~ 15.0%</span>
              </div>
            </div>

            <div className="glass-surface vault-card-inner" style={{ border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#fbfff8', fontFamily: "'JetBrains Mono', monospace" }}>Degen Vault</span>
              </div>
              <p style={{ color: '#bacbbb', fontSize: 14, lineHeight: '22px', margin: 0 }}>
                Designed for maximum yield hunters. Earn 3x higher profit share from all protocol trading fees and liquidation bonuses as the first-loss liquidity buffer (2-day lockup).
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#88919e', fontSize: 13 }}>Est. APY</span>
                <span style={{ color: '#4BFF99', fontWeight: 700, fontSize: 18, fontFamily: "'JetBrains Mono', monospace" }}>~ 45.0%</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              to="/vaults"
              className="glow-mint"
              style={{
                backgroundColor: '#4BFF99',
                color: '#131313',
                padding: '14px 32px',
                borderRadius: 9999,
                fontFamily: "'Geist', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Stake USDC & Earn Real Yield
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FAQ Section ═══ */}
      <section className="home-section-pad" style={{ padding: '64px 16px', backgroundColor: '#070707', borderTop: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <div style={{ maxWidth: 768, margin: '0 auto' }}>
          <h2 className="responsive-headline-xl" style={{ marginBottom: 36, textAlign: 'center' }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              {
                q: 'What makes Confidential different from traditional perpetual DEXs?',
                a: 'Confidential is engineered with an advanced modular architecture: multi-asset synthetic leverage (Crypto, Forex, Metals, and Equities), up to 50% price impact discounts for contrarian traders, continuous P2P funding rewards, and dual-vault LP system (Prime Vault & Degen Vault).'
              },
              {
                q: 'How do Contrarian Skew Advantages work for Traders?',
                a: 'When you open a trade that helps rebalance the protocol’s overall Open Interest (OI) skew, our Quadratic Slippage Engine rewards you with up to a 50% discount on price impact—executing your order at a price better than spot. Additionally, you receive continuous hourly P2P funding rewards paid by the majority side.'
              },
              {
                q: 'How do Liquidity Providers (LPs) earn yield in Confidential Vaults?',
                a: 'LPs deposit USDC into either our Prime Vault (for capital protection) or Degen Vault (for maximized yield). LPs earn real, auto-compounding yield generated directly from platform trading fees, borrow fees, and liquidated collateral.'
              },
              {
                q: 'Are there any MEV or front-running risks?',
                a: 'Zero MEV risk. Confidential uses a 2-Step Keeper architecture coupled with Pyth Pull-Oracles. Orders are requested on-chain and settled at high-fidelity sub-second oracle prices, eliminating sandwich attacks and toxic front-running.'
              },
              {
                q: 'How do I get started?',
                a: 'Simply connect your Web3 wallet. There is no KYC, no mandatory account sign-ups, and no deposit delays. Trade directly from your wallet with zero friction on the Arc Network.'
              },
            ].map((faq, idx) => (
              <div 
                key={idx} 
                className="glass-surface home-faq-item" 
                style={{ padding: '20px 24px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.3s', border: activeFaq === idx ? '1px solid #4BFF99' : '1px solid rgba(255, 255, 255, 0.05)' }} 
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 className="t-cta" style={{ color: activeFaq === idx ? '#4BFF99' : '#fbfff8', transition: 'color 0.3s', margin: 0 }}>{faq.q}</h4>
                  <span className="material-symbols-outlined" style={{ color: activeFaq === idx ? '#4BFF99' : '#bacbbb', flexShrink: 0, marginLeft: 12, transform: activeFaq === idx ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.3s, color 0.3s' }}>
                    add
                  </span>
                </div>
                <div style={{ maxHeight: activeFaq === idx ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.4s ease-in-out' }}>
                  <p className="t-body-md" style={{ color: '#bacbbb', paddingTop: 16, margin: 0, lineHeight: '26px' }}>
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="home-section-pad" style={{ backgroundColor: '#070707', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '48px 16px', width: '100%' }}>
        <div className="home-footer-grid" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
          <div className="home-footer-left" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/logo.png" alt="Confidential Logo" className="footer-logo" style={{ borderRadius: '50%', objectFit: 'contain' }} />
              <span className="footer-title" style={{ fontFamily: "'Geist', sans-serif", fontWeight: 900, letterSpacing: '-0.04em', color: '#fbfff8' }}>Confidential</span>
            </div>
            <p className="t-body-sm footer-copy" style={{ color: '#bacbbb', maxWidth: 384 }}>
              © 2026 Confidential. All rights reserved.
            </p>
          </div>
          <div className="home-footer-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {['X', 'Discord', 'Telegram'].map(s => (
                <a key={s} className="t-label-mono home-footer-link" style={{ color: '#bacbbb', textTransform: 'uppercase', opacity: 0.8, textDecoration: 'none', transition: 'all 0.3s' }} href="#">{s}</a>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <a className="t-label-mono home-footer-link" style={{ color: '#bacbbb', textTransform: 'uppercase', opacity: 0.8, textDecoration: 'none', transition: 'all 0.3s' }} href="/docs/legal/privacy-policy.html">Privacy Policy</a>
              <a className="t-label-mono home-footer-link" style={{ color: '#bacbbb', textTransform: 'uppercase', opacity: 0.8, textDecoration: 'none', transition: 'all 0.3s' }} href="/docs/legal/terms-of-service.html">Terms of Service</a>
              <a className="t-label-mono home-footer-link" style={{ color: '#bacbbb', textTransform: 'uppercase', opacity: 0.8, textDecoration: 'none', transition: 'all 0.3s' }} href="/docs/overview/introduction.html">Docs</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
