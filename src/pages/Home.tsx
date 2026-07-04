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
    gold: 'https://cryptologos.cc/logos/pax-gold-paxg-logo.png',
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
          padding: 32px 0;
          display: flex;
          flex-direction: column;
          gap: 32px;
          z-index: 20;
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
          gap: 10px;
          margin: 0 48px;
          color: #e5e2e1;
          font-family: 'Geist', sans-serif;
          font-weight: 600;
          font-size: 15px;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .market-item:hover {
          opacity: 0.8;
        }

        /* ═══ Typography ═══ */
        .t-headline-xl {
          font-family: 'Geist', sans-serif;
          font-size: 52px;
          line-height: 56px;
          letter-spacing: -0.04em;
          font-weight: 700;
        }
        .t-headline-lg {
          font-family: 'Geist', sans-serif;
          font-size: 24px;
          line-height: 32px;
          letter-spacing: -0.02em;
          font-weight: 600;
        }
        .t-headline-lg-mobile {
          font-family: 'Geist', sans-serif;
          font-size: 20px;
          line-height: 28px;
          font-weight: 600;
        }
        .t-body-md {
          font-family: 'Geist', sans-serif;
          font-size: 16px;
          line-height: 24px;
          font-weight: 400;
        }
        .t-hero-p {
          font-family: 'Geist', sans-serif;
          font-size: 18px;
          line-height: 28px;
          font-weight: 400;
        }
        .t-body-sm {
          font-family: 'Geist', sans-serif;
          font-size: 14px;
          line-height: 20px;
          font-weight: 400;
        }
        .t-cta {
          font-family: 'Geist', sans-serif;
          font-size: 16px;
          line-height: 20px;
          letter-spacing: 0.02em;
          font-weight: 600;
        }
        .t-label-mono {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          line-height: 16px;
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
            font-size: 20px;
            line-height: 30px;
          }
          .t-headline-lg {
            font-size: 32px;
            line-height: 40px;
          }
          .t-headline-lg-mobile {
            font-size: 24px;
            line-height: 32px;
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
          .md-block {
            display: block !important;
          }
        }
        .md-block {
          display: none;
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
            <a href="https://docs.confidential.exchange" target="_blank" rel="noreferrer" className="home-nav-link" style={{ color: '#bacbbb', fontFamily: "'Geist', sans-serif", fontSize: 16, letterSpacing: '0.02em', fontWeight: 500, textDecoration: 'none', transition: 'color 0.3s' }}>Docs</a>
          </div>
          <Link to="/trade" className="glow-mint" style={{ backgroundColor: '#4BFF99', color: '#131313', padding: '8px 24px', borderRadius: 9999, fontFamily: "'Geist', sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: '0.02em', textDecoration: 'none', display: 'inline-block', transition: 'all 0.3s' }}>
            Launch App
          </Link>
        </div>
      </nav>

      {/* ═══ Hero Section ═══ */}
      <section style={{ position: 'relative', display: 'flex', flexDirection: 'column', paddingTop: 140, backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBb_cWYwrsqX2bYrkJrvDCF9_x4mcbMa7q2xqeZ4YWhYdWYO1fIOwlkjErTIsZRXTHg4b68_uvTBZh5jL_ZzDq6Oe-gw_IOAgAh3xIf6hrS_CvFz8Puaj018StL_B5cv_jIJVFLv1cN032wks7CGnL-2BX-a47Lgz-gCkGhYW3beEMnt3bP9d9ghftm5xt9Hq0nkjybX0L0sHcfumueeZvFDhRjhU76HjZIpKFRZEZNhy9mUMVY4fzrS1hcAgKCUUoc-ZQfjsINvIZ_")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="hero-overlay" style={{ position: 'absolute', inset: 0 }}></div>
        <div className="home-section-pad" style={{ position: 'relative', zIndex: 10, maxWidth: 1280, margin: '0 auto', padding: '0 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 className="t-headline-xl" style={{ color: '#fbfff8', maxWidth: 896, letterSpacing: '-0.04em', marginBottom: 24 }}>
            The Universal <br /><span style={{ color: '#4BFF99' }}>Leverage Protocol.</span>
          </h1>
          <p className="t-hero-p" style={{ color: '#bacbbb', maxWidth: 672, marginBottom: 0 }}>
            Trade crypto, forex, and commodities with up to 100x leverage. Institutional liquidity, zero slippage, and absolute on-chain transparency on the Arc Network.
          </p>
        </div>

        {/* ═══ Market Marquee ═══ */}
        <div className="market-marquee-container" style={{ position: 'relative', marginTop: 80 }}>
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
                <span className="font-mono" style={{ color: m.change24h >= 0 ? '#4BFF99' : '#ff4b4b', marginLeft: 4, fontWeight: 500, fontSize: 13 }}>
                  {m.change24h >= 0 ? '+' : ''}{m.change24h.toFixed(2)}%
                </span>
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
                <span className="font-mono" style={{ color: m.change24h >= 0 ? '#4BFF99' : '#ff4b4b', marginLeft: 4, fontWeight: 500, fontSize: 13 }}>
                  {m.change24h >= 0 ? '+' : ''}{m.change24h.toFixed(2)}%
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Stats Bar ═══ */}
      <section style={{ position: 'relative', zIndex: 30, padding: '0 16px', marginTop: 80, marginBottom: 80 }}>
        <div className="glass-surface" style={{ maxWidth: 1024, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', alignItems: 'center', padding: '24px 32px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', background: 'linear-gradient(135deg, rgba(20,20,20,0.8) 0%, rgba(10,10,10,0.9) 100%)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'center', minWidth: 200, padding: '16px 0' }}>
            <span className="t-label-mono" style={{ color: '#88919e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Global Volume</span>
            <span className="t-headline-lg" style={{ color: '#fbfff8', textShadow: '0 0 24px rgba(255,255,255,0.1)', fontSize: 36 }}>{formattedVolume}</span>
          </div>
          
          <div className="md-block" style={{ width: 1, height: 64, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)' }}></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'center', minWidth: 200, padding: '16px 0' }}>
            <span className="t-label-mono" style={{ color: '#88919e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Traders</span>
            <span className="t-headline-lg" style={{ color: '#4BFF99', textShadow: '0 0 24px rgba(75,255,153,0.2)', fontSize: 36 }}>{displayTraders}</span>
          </div>
          
          <div className="md-block" style={{ width: 1, height: 64, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)' }}></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'center', minWidth: 200, padding: '16px 0' }}>
            <span className="t-label-mono" style={{ color: '#88919e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Markets</span>
            <span className="t-headline-lg" style={{ color: '#fbfff8', textShadow: '0 0 24px rgba(255,255,255,0.1)', fontSize: 36 }}>{markets.length}</span>
          </div>
        </div>
      </section>

      {/* ═══ Features Section ═══ */}
      <section className="home-section-pad" style={{ padding: '64px 16px', backgroundColor: '#070707' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 className="t-headline-lg home-features-heading" style={{ color: '#fbfff8', marginBottom: 48, textAlign: 'center', letterSpacing: '-0.02em', fontWeight: 700 }}>Engineered for Institutional Scale</h2>
          <div className="home-features-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {/* Feature 1 */}
            <div className="glass-surface home-feature-card" style={{ padding: 24, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 20, transition: 'transform 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
                <span className="t-label-mono" style={{ color: '#4BFF99' }}>01</span>
                <h3 className="t-headline-lg-mobile" style={{ color: '#fbfff8' }}>Deterministic Settlement</h3>
              </div>
              <p className="t-body-md" style={{ color: '#bacbbb' }}>
                Eliminate orderbook front-running and MEV. Our direct-to-vault architecture guarantees sub-second execution powered by high-fidelity Pyth Oracle data.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Anti-MEV', 'Sub-second', 'Pyth Network'].map(tag => (
                  <span key={tag} className="t-label-mono" style={{ color: '#fbfff8', backgroundColor: 'rgba(75, 255, 153, 0.05)', padding: '4px 12px', borderRadius: 9999, border: '1px solid rgba(75, 255, 153, 0.2)' }}>{tag}</span>
                ))}
              </div>
            </div>
            {/* Feature 2 */}
            <div className="glass-surface home-feature-card" style={{ padding: 24, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 20, transition: 'transform 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
                <span className="t-label-mono" style={{ color: '#4BFF99' }}>02</span>
                <h3 className="t-headline-lg-mobile" style={{ color: '#fbfff8' }}>Quadratic Slippage Engine</h3>
              </div>
              <p className="t-body-md" style={{ color: '#bacbbb' }}>
                Retail trades execute with absolute 0% slippage. Massive institutional position sizing triggers an asymmetric penalty function to protect underlying protocol liquidity.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Zero Slippage', 'Whale Protection'].map(tag => (
                  <span key={tag} className="t-label-mono" style={{ color: '#fbfff8', backgroundColor: 'rgba(75, 255, 153, 0.05)', padding: '4px 12px', borderRadius: 9999, border: '1px solid rgba(75, 255, 153, 0.2)' }}>{tag}</span>
                ))}
              </div>
            </div>
            {/* Feature 3 */}
            <div className="glass-surface home-feature-card" style={{ padding: 24, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 20, transition: 'transform 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
                <span className="t-label-mono" style={{ color: '#4BFF99' }}>03</span>
                <h3 className="t-headline-lg-mobile" style={{ color: '#fbfff8' }}>Tranche-Based Yield Matrix</h3>
              </div>
              <p className="t-body-md" style={{ color: '#bacbbb' }}>
                Hedge against market volatility. Deploy capital into our Dual-Vault system to earn passive, auto-compounding yields derived directly from protocol revenue.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Real Yield', 'Auto-Compound'].map(tag => (
                  <span key={tag} className="t-label-mono" style={{ color: '#fbfff8', backgroundColor: 'rgba(75, 255, 153, 0.05)', padding: '4px 12px', borderRadius: 9999, border: '1px solid rgba(75, 255, 153, 0.2)' }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ═══ Token Section ═══ */}
      <section className="home-section-pad" style={{ padding: '64px 16px', backgroundColor: '#0e0e0e', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: 0, bottom: 0, width: 400, height: 400, background: '#4BFF99', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.1, pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1280, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 className="t-headline-xl home-token-heading" style={{ color: '#fbfff8', marginBottom: 24, letterSpacing: '-0.04em', fontSize: 36, lineHeight: '42px' }}>
            Earn Sustainable Yield <br />with <span style={{ color: '#4BFF99' }}>Confidential Vaults.</span>
          </h2>
          <p className="t-body-md" style={{ color: '#bacbbb', maxWidth: 672, marginBottom: 40 }}>
            Our platform isn't just for traders. Deposit your USDC into the Degen or Prime vaults to earn passive income from platform trading fees and liquidations.
          </p>
          <a href="/vaults" className="glass-surface" style={{ color: '#fbfff8', border: '1px solid #4BFF99', padding: '16px 32px', borderRadius: 9999, fontFamily: "'Geist', sans-serif", fontSize: 16, fontWeight: 600, letterSpacing: '0.02em', textDecoration: 'none', display: 'inline-block', transition: 'all 0.3s' }}>
            View Vault Liquidity
          </a>
        </div>
      </section>

      {/* ═══ FAQ Section ═══ */}
      <section className="home-section-pad" style={{ padding: '80px 16px', backgroundColor: '#070707', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 768, margin: '0 auto' }}>
          <h2 className="t-headline-lg" style={{ color: '#fbfff8', marginBottom: 48, textAlign: 'center', letterSpacing: '-0.02em', fontWeight: 700 }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              {
                q: 'How do I start trading?',
                a: 'Simply connect your Web3 wallet (e.g. MetaMask, WalletConnect) and you are ready. No KYC, no deposits, and no complicated onboarding. Trade directly from your wallet with zero friction on the Arc Network.'
              },
              {
                q: 'Are there any P2P matching delays?',
                a: 'Absolutely not. We bypass traditional orderbook models. Your trades are executed instantly against our direct-to-vault liquidity pool, powered by high-fidelity Pyth Oracle prices. Experience zero latency and guaranteed execution.'
              },
              {
                q: 'How does the Vault system work?',
                a: 'Our Tranche-Based Yield Matrix allows you to act as the house. By depositing USDC into the Degen or Prime vaults, you provide the liquidity that powers all trades. In return, you earn a share of platform fees and liquidations, automatically compounded.'
              },
            ].map((faq, idx) => (
              <div 
                key={idx} 
                className="glass-surface home-faq-item" 
                style={{ padding: '20px 24px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.3s', border: activeFaq === idx ? '1px solid #4BFF99' : '1px solid rgba(255, 255, 255, 0.05)' }} 
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 className="t-cta" style={{ color: activeFaq === idx ? '#4BFF99' : '#fbfff8', transition: 'color 0.3s' }}>{faq.q}</h4>
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
              <a className="t-label-mono home-footer-link" style={{ color: '#bacbbb', textTransform: 'uppercase', opacity: 0.8, textDecoration: 'none', transition: 'all 0.3s' }} href="http://localhost:5173/legal/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>
              <a className="t-label-mono home-footer-link" style={{ color: '#bacbbb', textTransform: 'uppercase', opacity: 0.8, textDecoration: 'none', transition: 'all 0.3s' }} href="http://localhost:5173/legal/terms-of-service" target="_blank" rel="noreferrer">Terms of Service</a>
              <a className="t-label-mono home-footer-link" style={{ color: '#bacbbb', textTransform: 'uppercase', opacity: 0.8, textDecoration: 'none', transition: 'all 0.3s' }} href="http://localhost:5173" target="_blank" rel="noreferrer">Docs</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
