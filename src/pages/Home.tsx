import { Link } from 'react-router-dom';
import { useTradeStore } from '../store/useTradeStore';

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
  const markets = useTradeStore(state => state.markets);
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
          padding: 24px 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
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
          margin: 0 32px;
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
          font-size: 36px;
          line-height: 42px;
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

        /* ═══ Desktop overrides ═══ */
        @media (min-width: 768px) {
          .t-headline-xl {
            font-size: 80px;
            line-height: 88px;
          }
          .t-headline-lg {
            font-size: 32px;
            line-height: 40px;
          }
          .t-headline-lg-mobile {
            font-size: 24px;
            line-height: 32px;
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
            Trade Perps With <br /><span style={{ color: '#4BFF99' }}>Arc-Level Speed.</span>
          </h1>
          <p className="t-body-md" style={{ color: '#bacbbb', maxWidth: 672, marginBottom: 0 }}>
            Seamless. Flexible. Decentralized. Connect your wallet and trade instantly. Experience lightning-fast execution using USDC on the Arc ecosystem.
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
            <span className="t-label-mono" style={{ color: '#88919e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>24h Volume</span>
            <span className="t-headline-lg" style={{ color: '#fbfff8', textShadow: '0 0 24px rgba(255,255,255,0.1)', fontSize: 36 }}>$32bn</span>
          </div>
          
          <div className="md-block" style={{ width: 1, height: 64, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)' }}></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'center', minWidth: 200, padding: '16px 0' }}>
            <span className="t-label-mono" style={{ color: '#88919e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Traders</span>
            <span className="t-headline-lg" style={{ color: '#4BFF99', textShadow: '0 0 24px rgba(75,255,153,0.2)', fontSize: 36 }}>{'>'}10k</span>
          </div>
          
          <div className="md-block" style={{ width: 1, height: 64, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)' }}></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'center', minWidth: 200, padding: '16px 0' }}>
            <span className="t-label-mono" style={{ color: '#88919e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Markets</span>
            <span className="t-headline-lg" style={{ color: '#fbfff8', textShadow: '0 0 24px rgba(255,255,255,0.1)', fontSize: 36 }}>{'>'}70</span>
          </div>
        </div>
      </section>

      {/* ═══ Features Section ═══ */}
      <section className="home-section-pad" style={{ padding: '64px 16px', backgroundColor: '#070707' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 className="t-headline-lg home-features-heading" style={{ color: '#fbfff8', marginBottom: 48, textAlign: 'center', letterSpacing: '-0.02em', fontWeight: 700 }}>Built for maximum trading performance</h2>
          <div className="home-features-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {/* Feature 1 */}
            <div className="glass-surface home-feature-card" style={{ padding: 24, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 20, transition: 'transform 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
                <span className="t-label-mono" style={{ color: '#4BFF99' }}>01</span>
                <h3 className="t-headline-lg-mobile" style={{ color: '#fbfff8' }}>Powered by Arc</h3>
              </div>
              <p className="t-body-md" style={{ color: '#bacbbb' }}>
                Enjoy ultimate flexibility and blazing-fast execution speeds on the Arc L1 ecosystem. Pay your execution fees seamlessly with Arc USDC.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Crypto', 'RWA', 'Forex'].map(tag => (
                  <span key={tag} className="t-label-mono" style={{ color: '#fbfff8', backgroundColor: '#201f1f', padding: '4px 12px', borderRadius: 9999, border: '1px solid rgba(255,255,255,0.05)' }}>{tag}</span>
                ))}
              </div>
            </div>
            {/* Feature 2 */}
            <div className="glass-surface home-feature-card" style={{ padding: 24, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 20, transition: 'transform 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
                <span className="t-label-mono" style={{ color: '#4BFF99' }}>02</span>
                <h3 className="t-headline-lg-mobile" style={{ color: '#fbfff8' }}>Connect &amp; Trade</h3>
              </div>
              <p className="t-body-md" style={{ color: '#bacbbb' }}>
                Say goodbye to complicated onboarding. Simply connect your wallet and start trading immediately with zero friction and no KYC required.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: '#4BFF99', fontSize: 20 }}>bolt</span>
                <span className="t-label-mono" style={{ color: '#4BFF99' }}>Instant Web3</span>
              </div>
            </div>
            {/* Feature 3 */}
            <div className="glass-surface home-feature-card" style={{ padding: 24, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 20, transition: 'transform 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
                <span className="t-label-mono" style={{ color: '#4BFF99' }}>03</span>
                <h3 className="t-headline-lg-mobile" style={{ color: '#fbfff8' }}>Dual-Vault Architecture</h3>
              </div>
              <p className="t-body-md" style={{ color: '#bacbbb' }}>
                Become the house through our flagship dual-vault system. Maximize your capital efficiency and earn real yield generated from platform fees.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: '#4BFF99', fontSize: 20 }}>savings</span>
                <span className="t-label-mono" style={{ color: '#4BFF99' }}>Real Yield</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Trust Section ═══ */}
      <section className="home-section-pad" style={{ padding: '80px 16px', backgroundColor: '#131313', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, background: '#4BFF99', borderRadius: '50%', filter: 'blur(150px)', opacity: 0.05, pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 896, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="t-headline-lg home-trust-heading" style={{ color: '#fbfff8', marginBottom: 24, letterSpacing: '-0.02em', fontWeight: 700 }}>
            CEX Speed. <br /> DEX Security.
          </h2>
          <p className="t-body-md" style={{ color: '#bacbbb', maxWidth: 672, margin: '0 auto' }}>
            Combining the seamless trading experience of centralized exchanges with full decentralization and transparency. You are always in control of your assets.
          </p>
        </div>
      </section>

      {/* ═══ Token Section ═══ */}
      <section className="home-section-pad" style={{ padding: '64px 16px', backgroundColor: '#0e0e0e', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: 0, bottom: 0, width: 400, height: 400, background: '#4BFF99', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.1, pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1280, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 className="t-headline-xl home-token-heading" style={{ color: '#fbfff8', marginBottom: 24, letterSpacing: '-0.04em', fontSize: 36, lineHeight: '42px' }}>
            Be the House. <br /><span style={{ color: '#4BFF99' }}>Earn Real Yield.</span>
          </h2>
          <p className="t-body-md" style={{ color: '#bacbbb', maxWidth: 672, marginBottom: 40 }}>
            Our platform isn't just for traders. Deposit your USDC into our Vaults to earn passive income from platform trading fees. The future of finance is in your hands.
          </p>
          <a href="/vaults" className="glass-surface" style={{ color: '#fbfff8', border: '1px solid #62688F', padding: '16px 32px', borderRadius: 9999, fontFamily: "'Geist', sans-serif", fontSize: 16, fontWeight: 600, letterSpacing: '0.02em', textDecoration: 'none', display: 'inline-block', transition: 'all 0.3s' }}>
            View Vault Liquidity
          </a>
        </div>
      </section>

      {/* ═══ FAQ Section ═══ */}
      <section className="home-section-pad" style={{ padding: '64px 16px', backgroundColor: '#070707', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 768, margin: '0 auto' }}>
          <h2 className="t-headline-lg" style={{ color: '#fbfff8', marginBottom: 48, textAlign: 'center', letterSpacing: '-0.02em' }}>You have questions. We have answers.</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'How do I start trading?',
              'What markets are supported?',
              'How does the Vault system work?',
            ].map((q) => (
              <div key={q} className="glass-surface home-faq-item" style={{ padding: '16px 20px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 className="t-cta" style={{ color: '#fbfff8' }}>{q}</h4>
                  <span className="material-symbols-outlined" style={{ color: '#bacbbb', flexShrink: 0, marginLeft: 12 }}>add</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="home-section-pad" style={{ backgroundColor: '#070707', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '48px 16px', width: '100%' }}>
        <div className="home-footer-grid" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/logo.png" alt="Confidential Logo" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'contain' }} />
              <span style={{ fontFamily: "'Geist', sans-serif", fontSize: 24, fontWeight: 900, letterSpacing: '-0.04em', color: '#fbfff8' }}>Confidential</span>
            </div>
            <p className="t-body-sm" style={{ color: '#bacbbb', maxWidth: 384 }}>
              © 2026 Confidential DEX. All rights reserved. Built for the sovereign trader.
            </p>
          </div>
          <div className="home-footer-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {['X', 'Discord', 'Telegram'].map(s => (
                <a key={s} className="t-label-mono home-footer-link" style={{ color: '#bacbbb', textTransform: 'uppercase', opacity: 0.8, textDecoration: 'none', transition: 'all 0.3s' }} href="#">{s}</a>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {['Privacy Policy', 'Terms of Service'].map(s => (
                <a key={s} className="t-label-mono home-footer-link" style={{ color: '#bacbbb', textTransform: 'uppercase', opacity: 0.8, textDecoration: 'none', transition: 'all 0.3s' }} href="#">{s}</a>
              ))}
              <a className="t-label-mono home-footer-link" style={{ color: '#bacbbb', textTransform: 'uppercase', opacity: 0.8, textDecoration: 'none', transition: 'all 0.3s' }} href="https://docs.confidential.exchange" target="_blank" rel="noreferrer">Docs</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
