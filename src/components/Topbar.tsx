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
  const { setWalletModalOpen } = useTradeStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
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
        {/* Left — Logo */}
        <div className="topbar-left">
          <div className="topbar-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#0052FF"/>
              <path d="M2 17l10 5 10-5" stroke="#0052FF" strokeWidth="2" fill="none" opacity="0.5"/>
              <path d="M2 12l10 5 10-5" stroke="#0052FF" strokeWidth="2" fill="none" opacity="0.75"/>
            </svg>
            <span className="topbar-brand">ArcTrade</span>
          </div>
          <span className="badge badge-accent" style={{ fontSize: '9px', padding: '1px 6px' }}>
            TESTNET
          </span>
        </div>

        {/* Center — Nav */}
        <nav className="topbar-nav">
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

        {/* Right — Wallet */}
        <div className="topbar-right">
          {/* Gas indicator */}
          <div className="topbar-gas">
            <span className="gas-dot" />
            <span className="font-mono" style={{ fontSize: '12px' }}>Gas: USDC · ~0.001</span>
          </div>

          {!isConnected ? (
            <button
              className="btn btn-primary"
              style={{ padding: '6px 16px', fontSize: '13px' }}
              onClick={() => setWalletModalOpen(true)}
              id="connect-wallet-btn"
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
                <span className="font-mono" style={{ fontSize: '13px' }}>
                  {truncatedAddress}
                </span>
                <span className="font-mono" style={{ fontSize: '13px', color: 'var(--color-green)' }}>
                  {balance.toFixed(2)} USDC
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: dropdownOpen ? 'rotate(180deg)' : '', transition: 'transform 200ms' }}>
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
      </div>

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
          gap: 10px;
          flex-shrink: 0;
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
        .topbar-nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .topbar-nav-link {
          padding: 6px 14px;
          font-size: 14px;
          font-weight: 400;
          color: var(--color-text2);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: all 200ms ease;
        }
        .topbar-nav-link:hover {
          color: var(--color-text1);
          background-color: var(--color-bg2);
        }
        .topbar-nav-link.active {
          color: var(--color-text1);
          background-color: var(--color-bg2);
          font-weight: 500;
        }
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
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
          gap: 10px;
          padding: 4px 12px 4px 4px;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: background-color 200ms;
          color: var(--color-text1);
        }
        .topbar-account-btn:hover {
          background-color: var(--color-bg2);
        }
        .topbar-avatar {
          width: 28px; height: 28px;
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

        /* ═══ Mobile Responsiveness ═══ */
        @media (max-width: 768px) {
          .topbar {
            height: auto;
            min-height: 52px;
            padding: 8px 0;
          }
          .topbar-inner {
            flex-wrap: wrap;
          }
          .topbar-nav {
            order: 3;
            width: 100%;
            overflow-x: auto;
            margin-top: 8px;
            padding-bottom: 4px;
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .topbar-nav::-webkit-scrollbar {
            display: none;
          }
          .topbar-gas {
            display: none;
          }
          .topbar-brand {
            display: none;
          }
          .badge {
            display: none;
          }
        }
      `}</style>
    </header>
  )
}
