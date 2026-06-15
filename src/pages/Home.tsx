import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'


export default function Home() {
  const { t } = useTranslation()

  return (
    <div className="home-container">
      {/* Background Orbs */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      
      {/* ═══ CLEAN NAVBAR ═══ */}
      <nav className="home-nav">
        <div className="home-nav-inner">
          <div className="home-nav-left">
            <Link to="/" className="home-nav-logo">
              <img src="/logo.png" alt="Confidential" style={{ height: 28, width: 28, objectFit: 'contain' }} />
              <span>Confidential</span>
            </Link>
          </div>
          <div className="home-nav-links">
            <a href="https://docs.confidential.exchange" target="_blank" rel="noreferrer">Docs</a>
            <a href="https://blog.confidential.exchange" target="_blank" rel="noreferrer">Blog</a>
            <Link to="/vault">Vault</Link>
          </div>
          <div className="home-nav-right">
            <Link to="/trade" className="home-nav-cta">Launch App</Link>
            
          </div>
        </div>
      </nav>

      <div className="home-content">
        
        {/* ═══ HERO ═══ */}
        <section className="hero-section">
          <h1 className="hero-title animate-fade-in-up">
            {t('home.heroTitle')}
          </h1>
          <p className="hero-subtitle animate-fade-in-up delay-100">
            {t('home.heroSubtitle')}
          </p>
          <div className="hero-cta animate-fade-in-up delay-200">
            <Link to="/trade" className="btn-primary-large">
              {t('home.startTrading')}
            </Link>
            <Link to="/vault" className="btn-secondary-large">
              {t('home.provideLiquidity')}
            </Link>
          </div>
        </section>

        {/* ═══ MARQUEE (SUPPORTED MARKETS) ═══ */}
        <section className="marquee-section animate-fade-in-up delay-300">
          <div className="marquee-container">
            <div className="marquee-content">
              {/* Duplicate list for infinite scroll effect */}
              {[...Array(2)].map((_, i) => (
                <div key={i} className="marquee-group">
                  <div className="marquee-item"><img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" alt="BTC" /> BTC/USD</div>
                  <div className="marquee-item"><img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" /> ETH/USD</div>
                  <div className="marquee-item"><img src="https://cryptologos.cc/logos/solana-sol-logo.png" alt="SOL" /> SOL/USD</div>
                  <div className="marquee-item"><img src="/xrp.jpg" alt="XRP" style={{ borderRadius: '50%' }} /> XRP/USD</div>
                  <div className="marquee-item"><img src="/wif.jpg" alt="WIF" style={{ borderRadius: '50%' }} /> WIF/USD</div>
                  <div className="marquee-item"><span style={{ fontSize: '18px' }}>🇪🇺</span> EUR/USD</div>
                  <div className="marquee-item"><span style={{ fontSize: '18px' }}>🇬🇧</span> GBP/USD</div>
                  <div className="marquee-item"><span style={{ fontSize: '18px' }}>🇯🇵</span> USD/JPY</div>
                  <div className="marquee-item"><img src="https://cryptologos.cc/logos/pax-gold-paxg-logo.png" alt="GOLD" /> XAU/USD</div>
                  <div className="marquee-item"><div style={{ width: 24, height: 24, borderRadius: '50%', background: '#c0c0c0', border: '1px solid #999' }}></div> XAG/USD</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ METRICS ═══ */}
        <section className="metrics-section animate-fade-in-up delay-300">
          <div className="metric-box">
            <div className="metric-label">{t('home.metrics.totalVolume')}</div>
            <div className="metric-value">$1.24B</div>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-box">
            <div className="metric-label">{t('home.metrics.totalTVL')}</div>
            <div className="metric-value">$42.5M</div>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-box">
            <div className="metric-label">{t('home.metrics.openInterest')}</div>
            <div className="metric-value">$18.9M</div>
          </div>
        </section>

        {/* ═══ FEATURES ═══ */}
        <section className="features-section">
          <h2 className="section-title">Why Confidential?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>{t('home.features.f1Title')}</h3>
              <p>{t('home.features.f1Desc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💼</div>
              <h3>{t('home.features.f2Title')}</h3>
              <p>{t('home.features.f2Desc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏦</div>
              <h3>{t('home.features.f3Title')}</h3>
              <p>{t('home.features.f3Desc')}</p>
            </div>
          </div>
        </section>

        {/* ═══ PARTNERS / INFRASTRUCTURE ═══ */}
        <section className="partners-section">
          <h2 className="section-title">{t('home.partners.title')}</h2>
          <div className="features-grid">
            <div className="feature-card partner-card">
              <div className="partner-logo">
                <img src="https://cryptologos.cc/logos/pyth-network-pyth-logo.png" alt="Pyth" />
              </div>
              <h3>{t('home.partners.p1Title')}</h3>
              <p>{t('home.partners.p1Desc')}</p>
            </div>
            <div className="feature-card partner-card">
              <div className="partner-logo">
                <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>A</div>
              </div>
              <h3>{t('home.partners.p2Title')}</h3>
              <p>{t('home.partners.p2Desc')}</p>
            </div>
            <div className="feature-card partner-card">
              <div className="partner-logo">
                <div style={{ width: 40, height: 40, borderRadius: '8px', background: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚡</div>
              </div>
              <h3>{t('home.partners.p3Title')}</h3>
              <p>{t('home.partners.p3Desc')}</p>
            </div>
          </div>
        </section>

        {/* ═══ CTA BOTTOM ═══ */}
        <section className="cta-bottom">
          <Link to="/trade" className="btn-primary-large">{t('home.startTrading')}</Link>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="home-footer">
          <div className="footer-left">
            <img src="/logo.png" alt="" style={{ height: 20, width: 20, objectFit: 'contain', opacity: 0.5 }} />
            <span>© 2025 Confidential. All rights reserved.</span>
          </div>
          <div className="footer-right">
            <a href="https://twitter.com/confidentialDEX" target="_blank" rel="noreferrer">Twitter</a>
            <a href="https://discord.gg/confidential" target="_blank" rel="noreferrer">Discord</a>
            <a href="https://docs.confidential.exchange" target="_blank" rel="noreferrer">Docs</a>
          </div>
        </footer>
      </div>

      <style>{`
        .home-container {
          position: relative;
          min-height: 100vh;
          background: #000;
          color: #fff;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        /* ═══ Background Orbs ═══ */
        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(140px);
          opacity: 0.12;
          z-index: 0;
          pointer-events: none;
        }
        .orb-1 { top: -15%; left: 5%; width: 55vw; height: 55vw; background: var(--color-accent); }
        .orb-2 { bottom: -25%; right: -5%; width: 50vw; height: 50vw; background: #6366f1; }

        /* ═══ NAVBAR ═══ */
        .home-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          backdrop-filter: blur(12px);
          background: rgba(0,0,0,0.4);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .home-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .home-nav-left { display: flex; align-items: center; }
        .home-nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #fff;
          font-weight: 700;
          font-size: 18px;
          letter-spacing: -0.02em;
        }
        .home-nav-links {
          display: flex;
          gap: 32px;
          align-items: center;
        }
        .home-nav-links a {
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .home-nav-links a:hover { color: #fff; }
        .home-nav-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .home-nav-cta {
          background: #fff;
          color: #000;
          padding: 6px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .home-nav-cta:hover {
          background: rgba(255,255,255,0.9);
          transform: translateY(-1px);
        }

        /* ═══ CONTENT ═══ */
        .home-content {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* ═══ HERO ═══ */
        .hero-section {
          text-align: center;
          max-width: 820px;
          padding-top: 160px;
          margin-bottom: 80px;
        }
        .hero-title {
          font-size: clamp(36px, 6vw, 68px);
          font-weight: 700;
          line-height: 1.08;
          margin: 0 0 24px 0;
          letter-spacing: -0.035em;
          background: linear-gradient(180deg, #FFFFFF 20%, #71717A 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subtitle {
          font-size: clamp(15px, 1.8vw, 19px);
          color: #a1a1aa;
          line-height: 1.65;
          margin: 0 auto 40px auto;
          max-width: 560px;
        }
        .hero-cta {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn-primary-large {
          background: var(--color-accent);
          color: #000;
          padding: 10px 28px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-primary-large:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 24px rgba(96, 165, 250, 0.3);
        }
        .btn-secondary-large {
          background: transparent;
          color: #fff;
          padding: 10px 28px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.15);
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-secondary-large:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.3);
        }

        /* ═══ MARQUEE ═══ */
        .marquee-section {
          width: 100vw;
          overflow: hidden;
          background: rgba(255,255,255,0.02);
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 16px 0;
          margin-bottom: 60px;
        }
        .marquee-container {
          display: flex;
          overflow: hidden;
          user-select: none;
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        .marquee-content {
          display: flex;
          flex-shrink: 0;
          min-width: 100%;
          animation: scroll 30s linear infinite;
        }
        .marquee-group {
          display: flex;
          align-items: center;
          gap: 48px;
          padding-right: 48px;
        }
        .marquee-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          font-size: 15px;
          color: rgba(255,255,255,0.7);
          white-space: nowrap;
        }
        .marquee-item img {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* ═══ METRICS ═══ */
        .metrics-section {
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 700px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(8px);
          padding: 32px 0;
          margin-bottom: 100px;
        }
        .metric-box {
          flex: 1;
          text-align: center;
        }
        .metric-divider {
          width: 1px;
          height: 40px;
          background: rgba(255,255,255,0.1);
        }
        .metric-label {
          color: #71717a;
          font-size: 13px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 6px;
        }
        .metric-value {
          font-size: 28px;
          font-weight: 600;
          font-family: var(--font-mono);
          color: #fff;
        }

        /* ═══ FEATURES & PARTNERS ═══ */
        .features-section, .partners-section {
          width: 100%;
          margin-bottom: 100px;
        }
        .section-title {
          text-align: center;
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 48px 0;
          letter-spacing: -0.02em;
          color: #fff;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .feature-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 32px 28px;
          transition: all 0.3s;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.12);
        }
        .feature-icon { font-size: 28px; margin-bottom: 16px; }
        .partner-logo {
          margin-bottom: 20px;
        }
        .partner-logo img {
          height: 40px;
          object-fit: contain;
        }
        .feature-card h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 10px 0;
          color: #fff;
        }
        .feature-card p {
          font-size: 14px;
          line-height: 1.65;
          color: #71717a;
          margin: 0;
        }

        /* ═══ CTA BOTTOM ═══ */
        .cta-bottom {
          margin-bottom: 100px;
          text-align: center;
        }

        /* ═══ FOOTER ═══ */
        .home-footer {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 32px 0;
          border-top: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 24px;
        }
        .footer-left {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #52525b;
          font-size: 13px;
        }
        .footer-right {
          display: flex;
          gap: 24px;
        }
        .footer-right a {
          color: #52525b;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .footer-right a:hover { color: #fff; }

        /* ═══ ANIMATIONS ═══ */
        .animate-fade-in-up {
          animation: fadeInUp 0.7s ease-out forwards;
          opacity: 0;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ═══ MOBILE ═══ */
        @media (max-width: 768px) {
          .home-content {
            padding: 0 16px;
          }
          .home-nav-inner {
            padding: 0 16px;
          }
          .home-nav-logo span {
            display: none;
          }
          .home-nav-links { display: none; }
          .home-nav-cta {
            padding: 8px 16px;
            font-size: 13px;
          }
          .hero-section { padding-top: 100px; margin-bottom: 40px; width: 100%; }
          .hero-title { font-size: clamp(32px, 8vw, 40px); }
          .hero-subtitle { font-size: 15px; margin-bottom: 32px; }
          
          .hero-cta {
            flex-direction: column;
            width: 100%;
            gap: 12px;
          }
          .btn-primary-large, .btn-secondary-large {
            width: 100%;
            text-align: center;
            padding: 10px 0;
            display: block;
          }
          
          .metrics-section {
            flex-direction: column;
            gap: 0;
            padding: 0;
            width: 100%;
            margin-bottom: 60px;
          }
          .metric-box {
            width: 100%;
            padding: 24px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          .metric-box:last-child { border-bottom: none; }
          .metric-divider { display: none; }
          .metric-value { font-size: 28px; }
          
          .features-grid {
            grid-template-columns: 1fr;
            width: 100%;
          }
          .feature-card {
            padding: 24px;
          }
          
          .section-title {
            font-size: 26px;
            margin-bottom: 32px;
          }
          
          .home-footer {
            flex-direction: column;
            gap: 24px;
            text-align: center;
          }
          .footer-right {
            flex-wrap: wrap;
            justify-content: center;
            gap: 16px;
          }
          .marquee-section {
            margin-bottom: 40px;
          }
          .cta-bottom {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
