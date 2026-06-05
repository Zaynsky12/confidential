import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useArcWallet } from '../hooks/useArcWallet'
import { useTradeStore } from '../store/useTradeStore'

const NAV_LINKS = [
  { to: '/', label: 'Trade' },
  { to: '/vault', label: 'Vault' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/bridge', label: 'Bridge' },
]

export default function Topbar() {
  const { isConnected, truncatedAddress, balance, disconnect } = useArcWallet()
  const { setWalletModalOpen, markets, activeMarketId, setActiveMarket } = useTradeStore()
  const activeMarket = markets.find((m) => m.id === activeMarketId)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false)
  const [marketSearch, setMarketSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredMarkets = markets.filter((m) =>
    m.pair.toLowerCase().includes(marketSearch.toLowerCase())
  )

  const formatPrice = (price: number) => {
    if (price >= 10000) return price.toFixed(1)
    if (price >= 100) return price.toFixed(2)
    if (price >= 1) return price.toFixed(3)
    return price.toFixed(4)
  }

  return (
    <header className="topbar">
      {/* Glow effect */}
      <div className="topbar-glow" />

      <div className="topbar-inner">
        {/* Left — Logo & Desktop Nav */}
        <div className="topbar-left">
          {/* Mobile Hamburger */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="topbar-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#0052FF"/>
              <path d="M2 17l10 5 10-5" stroke="#0052FF" strokeWidth="2" fill="none" opacity="0.5"/>
              <path d="M2 12l10 5 10-5" stroke="#0052FF" strokeWidth="2" fill="none" opacity="0.75"/>
            </svg>
            <span className="topbar-brand">ArcTrade</span>
          </div>

          <nav className="topbar-nav desktop-only">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `topbar-nav-link ${isActive ? 'active' : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Center — Active Market (Mobile Only) */}
        <div className="topbar-center mobile-only" style={{ flexDirection: 'column', gap: 2 }}>
          <button 
            onClick={() => setIsMarketSelectorOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--color-text1)', cursor: 'pointer' }}
          >
            {activeMarket && activeMarket.pair.includes('BTC') ? (
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#F7931A"/>
                <path d="M21.9 14.1c.3-2.1-1.3-3.2-3.5-4l.7-2.9-1.8-.4-.7 2.8c-.5-.1-.9-.2-1.4-.4l.7-2.8-1.8-.4-.7 2.9c-1.6-.3-3.1-.7-4.3-1.6l-1 2.2s.8.6 1.8 1.1c-.2.7-1 4.2-1.2 4.9-1.4.3-2.5 0-2.5 0l-1.1 2.4c1.1.5 2.1.8 3.2.8l-.7 3 1.8.5.7-3c.5.1.9.3 1.4.4l-.7 3 1.8.4.7-3c2.4.5 4.5.4 5.9-1.7 1.1-1.7.7-3 .2-3.8 1.2-.2 2.1-.9 2.5-2.5zm-3.5 5.5c-.5 1.9-3.7.9-4.8.6l.8-3.4c1.1.3 4.6 1 4 2.8zm.5-5c-.4 1.7-2.9.8-3.7.6l.7-3c.8.2 3.3.6 3 2.4z" fill="#fff"/>
              </svg>
            ) : (
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#627EEA' }} />
            )}
            <span className="font-mono" style={{ fontWeight: 600, fontSize: 16 }}>
              {activeMarket ? activeMarket.pair : 'Trade'}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {activeMarket && (
            <span className="font-mono" style={{ fontSize: 13, color: 'var(--color-text2)', fontWeight: 500 }}>
              ${formatPrice(activeMarket.price)}
            </span>
          )}
        </div>

        {/* Right — Wallet & Settings */}
        <div className="topbar-right">
          <div className="topbar-gas desktop-only">
            <span className="gas-dot" />
            <span className="font-mono" style={{ fontSize: '12px' }}>Gas: USDC · ~0.001</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="desktop-only" style={{ display: 'flex', gap: '8px', marginRight: '8px' }}>
              <button className="btn" onClick={() => !isConnected && setWalletModalOpen(true)} style={{ padding: '6px 12px', fontSize: '13px', backgroundColor: 'rgba(46, 189, 133, 0.1)', color: 'var(--color-green)', border: '1px solid rgba(46, 189, 133, 0.2)' }}>Deposit</button>
              <button className="btn" onClick={() => !isConnected && setWalletModalOpen(true)} style={{ padding: '6px 12px', fontSize: '13px', backgroundColor: 'transparent', color: 'var(--color-text2)', border: '1px solid var(--color-border)' }}>Withdraw</button>
            </div>

            {!isConnected ? (
              <button
                className="btn btn-connect-unified"
                onClick={() => setWalletModalOpen(true)}
              >
                Connect Wallet
              </button>
            ) : (
              <div className="topbar-account" ref={dropdownRef}>
              <button
                className="topbar-account-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="topbar-avatar" />
                <span className="font-mono desktop-only" style={{ fontSize: '13px' }}>
                  {truncatedAddress}
                </span>
                <svg className="desktop-only" width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: dropdownOpen ? 'rotate(180deg)' : '', transition: 'transform 200ms' }}>
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="topbar-dropdown animate-fade-in-up" style={{ animationDuration: '200ms' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="label" style={{ marginBottom: '4px' }}>Connected Wallet</div>
                    <div className="font-mono" style={{ fontSize: '13px' }}>{truncatedAddress}</div>
                  </div>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="label" style={{ marginBottom: '4px' }}>Balance</div>
                    <div className="font-mono" style={{ fontSize: '16px', color: 'var(--color-green)' }}>
                      {balance.toFixed(2)} USDC
                    </div>
                  </div>
                  <div style={{ padding: '8px' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ width: '100%', fontSize: '13px', color: 'var(--color-red)' }}
                      onClick={() => {
                        disconnect()
                        setDropdownOpen(false)
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
          
          <button className="settings-btn desktop-only" style={{ background: 'none', border: 'none', color: 'var(--color-text3)', cursor: 'pointer', padding: '4px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <button className="favorite-btn mobile-only" style={{ background: 'none', border: 'none', color: 'var(--color-text3)', cursor: 'pointer', padding: '4px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-backdrop" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="topbar-logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#0052FF"/>
                  <path d="M2 17l10 5 10-5" stroke="#0052FF" strokeWidth="2" fill="none" opacity="0.5"/>
                  <path d="M2 12l10 5 10-5" stroke="#0052FF" strokeWidth="2" fill="none" opacity="0.75"/>
                </svg>
                <span className="topbar-brand">ArcTrade</span>
              </div>
              <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <nav className="mobile-menu-nav">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `mobile-nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="mobile-menu-footer">
              {!isConnected ? (
                <button
                  className="btn btn-connect-unified"
                  style={{ width: '100%', padding: '12px' }}
                  onClick={() => { setWalletModalOpen(true); setIsMobileMenuOpen(false); }}
                >
                  Connect Wallet
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="topbar-avatar" />
                      <span className="font-mono" style={{ color: 'var(--color-text1)' }}>{truncatedAddress}</span>
                    </div>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--color-red)' }}
                      onClick={() => { disconnect(); setIsMobileMenuOpen(false); }}
                    >
                      Disconnect
                    </button>
                  </div>
                  <div className="font-mono" style={{ fontSize: '16px', color: 'var(--color-green)' }}>
                    {balance.toFixed(2)} USDC
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button className="btn" style={{ flex: 1, padding: '10px', fontSize: '13px', backgroundColor: 'var(--color-green)', color: '#070c18', border: 'none', fontWeight: 600 }}>Deposit</button>
                    <button className="btn" style={{ flex: 1, padding: '10px', fontSize: '13px', backgroundColor: 'transparent', color: 'var(--color-text1)', border: '1px solid var(--color-border)' }}>Withdraw</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Market Selector — Slide-in Panel from Right */}
      {isMarketSelectorOpen && (
        <div
          className="market-selector-backdrop mobile-only"
          onClick={() => setIsMarketSelectorOpen(false)}
        >
          <div
            className="market-selector-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel Header */}
            <div className="msp-header">
              <span className="msp-title">Markets</span>
              <button
                className="mobile-close-btn"
                onClick={() => setIsMarketSelectorOpen(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="msp-search-wrapper">
              <div className="msp-search">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: 'var(--color-text3)' }}>
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <input
                  className="msp-search-input"
                  placeholder="Search markets..."
                  type="text"
                  value={marketSearch}
                  onChange={(e) => setMarketSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="msp-table-wrapper">
              <table className="msp-table">
                <thead className="msp-thead">
                  <tr>
                    <th className="msp-th">Pair</th>
                    <th className="msp-th msp-th-right">Price</th>
                    <th className="msp-th msp-th-right">24h</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarkets.map((m) => {
                    const isActive = m.id === activeMarketId
                    return (
                      <tr
                        key={m.id}
                        className={`msp-row ${isActive ? 'msp-row-active' : ''}`}
                        onClick={() => {
                          setActiveMarket(m.id)
                          setIsMarketSelectorOpen(false)
                          setMarketSearch('')
                        }}
                      >
                        <td className="msp-td msp-td-pair">{m.pair}</td>
                        <td className="msp-td msp-td-price font-mono">{formatPrice(m.price)}</td>
                        <td className={`msp-td msp-td-change font-mono ${m.change24h >= 0 ? 'text-green' : 'text-red'}`}>
                          {m.change24h >= 0 ? '+' : ''}{m.change24h.toFixed(2)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .topbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background-color: var(--color-bg1);
          border-bottom: 1px solid var(--color-border);
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }
        .topbar-glow {
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 600px; height: 1px;
          background: radial-gradient(ellipse, rgba(0,82,255,0.4) 0%, transparent 70%);
          pointer-events: none;
        }
        .topbar-inner {
          width: 100%;
          max-width: 1600px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .topbar-left {
          display: flex;
          align-items: center;
          gap: 24px; /* Space between logo and nav */
          flex: 1;
        }
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--color-text1);
          cursor: pointer;
          padding: 4px;
        }
        .topbar-logo {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .topbar-brand {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--color-text1);
        }
        .topbar-center {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
        }
        .mobile-only {
          display: none;
        }
        .topbar-nav {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .topbar-nav-link {
          padding: 8px 0;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          transition: color 200ms ease;
        }
        .topbar-nav-link:hover {
          color: rgba(255, 255, 255, 0.8);
        }
        .topbar-nav-link.active {
          color: #ffffff;
        }
        .topbar-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 16px;
          flex: 1;
        }
        .btn-connect {
          padding: 6px 16px;
          font-size: 13px;
        }
        .btn-connect-unified {
          background-color: var(--color-green) !important;
          color: #070c18 !important;
          border: none !important;
          border-radius: 999px !important;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 20px;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: opacity 150ms;
        }
        .btn-connect-unified:hover {
          opacity: 0.9;
        }
        .topbar-gas {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--color-text2);
        }
        .gas-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background-color: var(--color-green);
          box-shadow: 0 0 6px var(--color-green);
        }
        .topbar-account {
          position: relative;
        }
        .topbar-account-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: background-color 200ms;
          color: var(--color-text1);
        }
        .topbar-account-btn:hover {
          background-color: var(--color-bg2);
        }
        .topbar-avatar {
          width: 24px; height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0052FF, #00d4aa, #0052FF);
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .topbar-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 240px;
          background-color: var(--color-bg1);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-modal);
          overflow: hidden;
        }

        /* Mobile Drawer */
        .mobile-menu-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 999;
          display: flex;
          justify-content: flex-start;
          animation: fadeIn 200ms ease;
        }
        .mobile-menu-drawer {
          width: 80%;
          max-width: 320px;
          background-color: var(--color-bg0);
          height: 100%;
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--color-border);
          animation: slideInLeft 200ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .mobile-menu-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border);
        }
        .mobile-close-btn {
          background: none;
          border: none;
          color: var(--color-text2);
          cursor: pointer;
        }
        .mobile-menu-nav {
          display: flex;
          flex-direction: column;
          padding: 16px;
          gap: 8px;
          flex: 1;
        }
        .mobile-nav-link {
          padding: 12px 16px;
          font-size: 16px;
          font-weight: 500;
          color: var(--color-text2);
          text-decoration: none;
          border-radius: var(--radius-lg);
        }
        .mobile-nav-link.active {
          color: #fff;
          background-color: var(--color-bg2);
        }
        .mobile-menu-footer {
          padding: 20px;
          border-top: 1px solid var(--color-border);
        }

        /* ═══ Mobile Market Selector — Slide-in Panel ═══ */
        .market-selector-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
          animation: fadeIn 200ms ease;
        }
        .market-selector-panel {
          width: 85%;
          max-width: 360px;
          height: 100%;
          background-color: var(--color-bg0);
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--color-border);
          animation: slideInRight 250ms cubic-bezier(0.23, 1, 0.32, 1);
          box-shadow: -8px 0 32px rgba(0, 0, 0, 0.4);
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        /* Panel Header */
        .msp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--color-border);
        }
        .msp-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text1);
        }

        /* Search */
        .msp-search-wrapper {
          padding: 12px 12px 0;
        }
        .msp-search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background-color: var(--color-bg2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }
        .msp-search-input {
          width: 100%;
          font-size: 13px;
          color: var(--color-text1);
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--font-ui);
        }
        .msp-search-input::placeholder {
          color: var(--color-text3);
        }

        /* Table */
        .msp-table-wrapper {
          flex: 1;
          overflow-y: auto;
          padding-top: 8px;
        }
        .msp-table {
          width: 100%;
          text-align: left;
          border-collapse: collapse;
        }
        .msp-thead {
          position: sticky;
          top: 0;
          background-color: var(--color-bg0);
          z-index: 10;
          border-bottom: 1px solid var(--color-border);
        }
        .msp-th {
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-text3);
          padding: 6px 12px;
        }
        .msp-th-right {
          text-align: right;
        }
        .msp-row {
          cursor: pointer;
          transition: background-color 150ms;
          border-left: 2px solid transparent;
        }
        .msp-row:hover {
          background-color: var(--color-bg2);
        }
        .msp-row-active {
          background-color: var(--color-bg2);
          border-left-color: var(--color-accent);
        }
        .msp-td {
          padding: 12px;
          font-size: 13px;
        }
        .msp-td-pair {
          font-weight: 500;
          color: var(--color-text1);
        }
        .msp-td-price {
          text-align: right;
          color: var(--color-text1);
          font-size: 13px;
        }
        .msp-td-change {
          text-align: right;
          font-size: 13px;
        }

        /* ═══ Tablet Responsiveness (769px — 1024px) ═══ */
        @media (max-width: 1024px) and (min-width: 769px) {
          .topbar-nav {
            gap: 10px;
          }
          .topbar-nav-link {
            font-size: 13px;
          }
          .mobile-menu-btn {
            display: block;
          }
          .mobile-only {
            display: flex;
          }
          .topbar-logo {
            display: none;
          }
          .topbar-left {
            flex: 0;
            gap: 12px;
          }
        }

        /* ═══ Mobile Responsiveness ═══ */
        @media (max-width: 768px) {
          .topbar {
            height: 60px;
            padding-top: 4px;
          }
          .topbar-left {
            gap: 12px;
            flex: 1;
          }
          .topbar-right {
            flex: 1;
            justify-content: flex-end;
          }
          .mobile-menu-btn {
            display: block;
          }
          .topbar-logo {
            display: none; /* Hidden on mobile header, shown in drawer */
          }
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: flex;
          }
          .btn-connect {
            display: none !important;
          }
          .topbar-account {
            display: none !important;
          }
        }
      `}</style>
    </header>
  )
}
