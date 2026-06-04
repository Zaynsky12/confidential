import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useArcWallet } from '../hooks/useArcWallet'
import { useTradeStore } from '../store/useTradeStore'
import MarketSidebar from './MarketSidebar'

const NAV_LINKS = [
  { to: '/', label: 'Trade' },
  { to: '/vault', label: 'Vault' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/bridge', label: 'Bridge' },
]

export default function Topbar() {
  const { isConnected, truncatedAddress, balance, disconnect } = useArcWallet()
  const { setWalletModalOpen, markets, activeMarketId } = useTradeStore()
  const activeMarket = markets.find((m) => m.id === activeMarketId)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false)
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
        <div className="topbar-center mobile-only">
          <button 
            onClick={() => setIsMarketSelectorOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--color-text1)', cursor: 'pointer' }}
          >
            <span className="font-mono" style={{ fontWeight: 600, fontSize: 15 }}>
              {activeMarket ? activeMarket.pair : 'Trade'}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Right — Wallet & Settings */}
        <div className="topbar-right desktop-only">
          <div className="topbar-gas desktop-only">
            <span className="gas-dot" />
            <span className="font-mono" style={{ fontSize: '12px' }}>Gas: USDC · ~0.001</span>
          </div>

          {!isConnected ? (
            <button
              className="btn btn-primary btn-connect"
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
          
          <button className="settings-btn desktop-only" style={{ background: 'none', border: 'none', color: 'var(--color-text3)', cursor: 'pointer', padding: '4px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
                  className="btn btn-primary"
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Market Selector Modal */}
      {isMarketSelectorOpen && (
        <div className="mobile-market-modal animate-fade-in-up mobile-only">
          <div className="mobile-market-modal-header">
            <span style={{ fontSize: 16, fontWeight: 600 }}>Markets</span>
            <button className="mobile-close-btn" onClick={() => setIsMarketSelectorOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <MarketSidebar onClose={() => setIsMarketSelectorOpen(false)} />
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

        .mobile-market-modal {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background-color: var(--color-bg0);
          display: flex;
          flex-direction: column;
        }
        .mobile-market-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border);
        }

        /* ═══ Mobile Responsiveness ═══ */
        @media (max-width: 768px) {
          .topbar {
            height: 52px;
          }
          .topbar-left {
            gap: 12px;
            flex: 1;
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
            padding: 4px 12px;
            font-size: 12px;
          }
        }
      `}</style>
    </header>
  )
}
