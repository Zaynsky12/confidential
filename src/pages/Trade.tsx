import { useState } from 'react'
import MarketSidebar from '../components/MarketSidebar'
import PriceChart from '../components/PriceChart'
import OrderBook from '../components/OrderBook'
import OrderForm from '../components/OrderForm'
import Positions from '../components/Positions'
import Portfolio from './Portfolio'
import { useArcWallet } from '../hooks/useArcWallet'
import { useTradeStore } from '../store/useTradeStore'

export default function Trade() {
  const { isConnected } = useArcWallet()
  const { setWalletModalOpen, markets, activeMarketId, mobileNav, setMobileNav } = useTradeStore()
  const activeMarket = markets.find((m) => m.id === activeMarketId)
  const [mobileView, setMobileView] = useState<'chart' | 'orderbook' | 'trades'>('chart')
  
  const fp = (p: number) => p >= 10000 ? p.toLocaleString('en-US', { maximumFractionDigits: 1 }) : p >= 100 ? p.toFixed(2) : p.toFixed(3)
  const fv = (v: number) => v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${(v / 1e3).toFixed(2)}K`

  return (
    <div className="trade-layout">
      <div className="trade-sidebar">
        <MarketSidebar />
      </div>
      <div className={`trade-middle ${mobileNav !== 'markets' ? 'mobile-hidden' : ''}`}>
        <div className="trade-middle-top">
          <div className="trade-center">
        {activeMarket && (
          <div className="chart-header-stats">
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18, fontWeight: 600 }}>{activeMarket.pair}</span>
              <span className="badge-accent" style={{ padding: '2px 6px', fontSize: 11, borderRadius: 4, fontWeight: 600 }}>40x</span>
            </div>
            
            <div className="chart-stat-item">
              <span className="chart-stat-label">Mark</span>
              <span className="font-mono chart-stat-value" style={{ color: 'var(--color-accent)' }}>{fp(activeMarket.price)}</span>
            </div>

            <div className="chart-stat-item">
              <span className="chart-stat-label">Oracle</span>
              <span className="font-mono chart-stat-value">{fp(activeMarket.price * 1.0001)}</span>
            </div>

            <div className="chart-stat-item">
              <span className="chart-stat-label">24h Change</span>
              <span className={`font-mono chart-stat-value ${activeMarket.change24h >= 0 ? 'text-green' : 'text-red'}`}>
                {activeMarket.change24h >= 0 ? '+' : ''}{(activeMarket.price * (activeMarket.change24h / 100)).toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1})} / {activeMarket.change24h >= 0 ? '+' : ''}{activeMarket.change24h.toFixed(2)}%
              </span>
            </div>

            <div className="chart-stat-item chart-stat-mobile-col">
              <span className="chart-stat-label">24h Volume</span>
              <span className="font-mono chart-stat-value">${fv(activeMarket.volume24h)}</span>
            </div>

            <div className="chart-stat-item chart-stat-mobile-col">
              <span className="chart-stat-label">Open Interest</span>
              <span className="font-mono chart-stat-value">${fv(activeMarket.openInterest)}</span>
            </div>

            <div className="chart-stat-item chart-stat-mobile-col">
              <span className="chart-stat-label">Funding / Countdown</span>
              <span className="font-mono chart-stat-value" style={{ color: 'var(--color-text1)' }}>
                -0.0001%
              </span>
            </div>
          </div>
        )}

        {/* Mobile Sub-Navigation Tabs */}
        <div className="trade-mobile-tabs mobile-only">
          <button className={`tm-tab ${mobileView === 'chart' ? 'active' : ''}`} onClick={() => setMobileView('chart')}>
            Chart
          </button>
          <button className={`tm-tab ${mobileView === 'orderbook' ? 'active' : ''}`} onClick={() => setMobileView('orderbook')}>
            Order Book
          </button>
          <button className={`tm-tab ${mobileView === 'trades' ? 'active' : ''}`} onClick={() => setMobileView('trades')}>
            Trades
          </button>
        </div>

        {mobileView === 'chart' && (
          <div className="trade-chart">
            <PriceChart />
          </div>
        )}

        {mobileView === 'orderbook' && (
          <div className="trade-chart mobile-only" style={{ display: 'flex', flexDirection: 'column' }}>
            <OrderBook forcedTab="orderbook" hideTabs />
          </div>
        )}

        {mobileView === 'trades' && (
          <div className="trade-chart mobile-only" style={{ display: 'flex', flexDirection: 'column' }}>
            <OrderBook forcedTab="trades" hideTabs />
          </div>
        )}

          </div>
          <div className="trade-orderbook-col trade-desktop-only">
            <OrderBook />
          </div>
        </div>
        <div className="trade-positions">
          <Positions />
        </div>
      </div>
      <div className="trade-right trade-desktop-only">
        <OrderForm />
      </div>

      {mobileNav === 'trade' && (
        <div className="mobile-only trade-mobile-tab-view">
          <OrderForm />
        </div>
      )}

      {mobileNav === 'account' && (
        <div className="mobile-only trade-mobile-tab-view">
          <Portfolio />
        </div>
      )}


      {/* Mobile Bottom Action Bar */}
      <div className="trade-mobile-action-bar">
        {!isConnected ? (
          <button 
            className="btn btn-connect-unified animate-fade-in" 
            style={{ width: '100%', padding: '10px', fontSize: '15px', fontWeight: 600, borderRadius: '8px' }}
            onClick={() => setWalletModalOpen(true)}
          >
            Connect Wallet
          </button>
        ) : (
          <>
            <button className={`mobile-nav-btn ${mobileNav === 'markets' ? 'active' : ''}`} onClick={() => setMobileNav('markets')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="14" width="4" height="7" rx="1"/>
                <rect x="10" y="9" width="4" height="12" rx="1"/>
                <rect x="16" y="3" width="4" height="18" rx="1"/>
              </svg>
              <span>Markets</span>
            </button>
            <button className={`mobile-nav-btn ${mobileNav === 'trade' ? 'active' : ''}`} onClick={() => setMobileNav('trade')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 4h-4v4H7l5 5 5-5h-3V4zM10 20h4v-4h3l-5-5-5 5h3v4z"/>
              </svg>
              <span>Trade</span>
            </button>

            <button className={`mobile-nav-btn ${mobileNav === 'account' ? 'active' : ''}`} onClick={() => setMobileNav('account')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"/>
              </svg>
              <span>Account</span>
            </button>
          </>
        )}
      </div>


      <style>{`
        .trade-layout {
          display: grid;
          grid-template-columns: 200px 1fr 300px;
          min-height: calc(100vh - 60px);
          padding: 0 12px 12px 12px;
          gap: 12px;
        }
        .trade-middle {
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          gap: 12px;
        }
        .trade-middle-top {
          display: flex;
          height: 550px;
          min-width: 0;
          gap: 12px;
        }
        .trade-sidebar {
          position: sticky;
          top: 60px;
          height: calc(100vh - 72px);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .trade-center {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 0;
          min-width: 0;
          flex: 1;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          background-color: var(--color-bg1);
        }
        .trade-chart {
          flex: 1;
          min-height: 0;
        }
        
        /* ═══ Header Stats ═══ */
        .chart-header-stats {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-border);
          flex-wrap: nowrap;
          overflow-x: auto;
          scrollbar-width: none;
          gap: 24px;
          font-size: 13px;
          flex-shrink: 0;
        }
        .chart-header-stats::-webkit-scrollbar {
          display: none;
        }
        .chart-stat-item {
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .chart-stat-label {
          color: var(--color-text3);
          font-size: 11px;
          margin-bottom: 2px;
          white-space: nowrap;
        }
        .chart-stat-value {
          font-weight: 500;
          font-size: 13px;
          white-space: nowrap;
        }
        .trade-positions {
          flex: 1;
          overflow: hidden;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          background-color: var(--color-bg1);
        }
        .trade-positions .positions-container {
          border-top: none;
          background: transparent;
        }
        .trade-orderbook-col {
          width: 260px;
          flex-shrink: 0;
          overflow: hidden;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        .trade-right {
          min-height: 0;
        }

        /* Hidden by default on desktop */
        .trade-mobile-action-bar {
          display: none;
        }
        .trade-mobile-modal-backdrop {
          display: none;
        }
        .trade-mobile-tabs {
          display: none;
        }
        .trade-mobile-tab-view {
          display: none;
        }

        .action-btn {
          flex: 1; padding: 14px;
          font-size: 14px; font-weight: 600;
          border-radius: var(--radius-md); border: none; cursor: pointer;
          letter-spacing: 0.5px;
          transition: opacity 150ms;
        }
        .action-btn:active { opacity: 0.85; transform: scale(0.98); }
        .action-buy { background-color: var(--color-green); color: #070c18; text-transform: uppercase; }
        .action-sell { background-color: var(--color-red); color: #fff; text-transform: uppercase; }
        .action-connect { background-color: var(--color-green); color: #070c18; text-transform: uppercase; font-size: 13px !important; padding: 12px !important; border-radius: 999px !important; width: 100% !important; margin: 0 !important; box-sizing: border-box !important; text-align: center !important; display: flex !important; justify-content: center !important; align-items: center !important; }
        
        .mobile-nav-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: none;
          border: none;
          color: var(--color-text3);
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
        }
        .mobile-nav-btn.active {
          color: var(--color-text1);
        }
        .mobile-nav-btn svg {
          width: 22px;
          height: 22px;
          stroke: currentColor;
        }
        .mobile-nav-btn:hover {
          color: var(--color-text2);
        }

        .trade-below-chart {
          display: flex;
          flex-direction: column;
          padding: 16px;
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }
        .tbc-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .tbc-dropdown {
          display: flex; gap: 4px; align-items: center;
          color: var(--color-text3); font-size: 13px;
        }
        .tbc-settings {
          display: flex; gap: 12px; align-items: center;
          color: var(--color-text3); font-size: 13px;
        }
        .tbc-segmented-control {
          display: flex;
          background: var(--color-bg2);
          border-radius: 24px;
          padding: 4px;
        }
        .tbc-seg-btn {
          padding: 8px 16px;
          background: none; border: none;
          color: var(--color-text3);
          border-radius: 20px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .tbc-seg-btn.active {
          background: var(--color-bg3);
          color: var(--color-text1);
        }
        .tbc-order-value {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .tbc-ov-label {
          color: #a4b3d1;
          font-size: 13px;
        }
        .tbc-ov-value {
          color: #a4b3d1;
          font-size: 15px;
        }
        
        .trade-mobile-modal {
          background: var(--color-bg1);
          border-top-left-radius: var(--radius-xl);
          border-top-right-radius: var(--radius-xl);
          width: 100%; max-height: 85vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUp 250ms cubic-bezier(0.23, 1, 0.32, 1); }

        /* ═══ Tablet (769px — 1024px) — 2-column layout ═══ */
        @media (max-width: 1024px) and (min-width: 769px) {
          .chart-header-stats {
            flex-wrap: nowrap;
            overflow-x: auto;
            -ms-overflow-style: none;
            scrollbar-width: none;
            padding: 10px 12px;
            gap: 16px;
          }
          .chart-header-stats::-webkit-scrollbar {
            display: none;
          }
          
          .trade-layout {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr;
            padding-bottom: 68px;
          }
          .trade-sidebar {
            display: none;
          }
          .trade-middle {
            grid-column: 1;
            grid-row: 1;
          }
          .trade-chart {
            min-height: 360px;
            flex: 1;
          }
          .trade-positions {
            height: 200px;
          }
          .trade-desktop-only {
            display: none !important;
          }
          .trade-mobile-action-bar {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            width: 100%;
            box-sizing: border-box;
            background-color: var(--color-bg0);
            border-top: 1px solid var(--color-border);
            padding: 8px;
            padding-bottom: calc(8px + env(safe-area-inset-bottom));
            gap: 12px;
            z-index: 90;
            justify-content: center;
            align-items: center;
          }
          .trade-mobile-modal-backdrop {
            display: flex;
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
            z-index: 998; flex-direction: column; justify-content: flex-end;
          }
        }

        /* ═══ Mobile (<= 768px) — Hyperliquid Scrollable Layout ═══ */
        @media (max-width: 768px) {
          .chart-header-stats {
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            -ms-overflow-style: none;
            scrollbar-width: none;
            padding: 12px 16px;
            gap: 20px;
          }
          .chart-header-stats::-webkit-scrollbar {
            display: none;
          }
          .chart-stat-item {
            align-items: flex-start;
          }
          .chart-stat-label {
            font-size: 11px;
            margin-bottom: 4px;
            color: var(--color-text3);
          }
          .chart-stat-value {
            font-size: 13px;
            color: var(--color-text1);
          }

          .trade-desktop-only { display: none !important; }
          .trade-mobile-action-bar {
            display: flex;
            position: sticky;
            bottom: 0;
            margin-top: auto;
            width: 100%;
            box-sizing: border-box;
            background-color: var(--color-bg0);
            border-top: 1px solid var(--color-border);
            padding: 12px;
            padding-bottom: 24px;
            padding-bottom: calc(16px + env(safe-area-inset-bottom));
            gap: 10px;
            z-index: 90;
            justify-content: center;
            align-items: center;
          }
          .trade-mobile-modal-backdrop {
            display: flex;
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
            z-index: 998; flex-direction: column; justify-content: flex-end;
          }
          .trade-mobile-modal {
            background: var(--color-bg1);
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
            overflow-y: auto;
            max-height: 85vh;
            width: 100%;
            padding: 16px;
            padding-bottom: calc(16px + env(safe-area-inset-bottom));
          }
          .trade-mobile-tabs {
            display: flex;
            background: var(--color-bg1);
            border-bottom: 1px solid var(--color-border);
            flex-shrink: 0;
          }
          .tm-tab {
            flex: 1;
            text-align: center;
            padding: 14px 0;
            font-size: 14px;
            font-weight: 500;
            color: var(--color-text3);
            border: none;
            background: none;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            transition: all 150ms ease;
          }
          .tm-tab.active {
            color: var(--color-text1);
            border-bottom-color: var(--color-text1);
          }
          .trade-layout {
            display: flex;
            flex-direction: column;
            /* 60px Topbar */
            height: calc(100dvh - 60px);
            min-height: calc(100vh - 60px);
            overflow-y: auto;
            overflow-x: hidden;
            width: 100%;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 120px; /* Matches Account menu spacing */
          }
          .trade-sidebar {
            display: none;
          }
          
          .trade-middle-top {
            height: auto;
            flex-direction: column;
          }
          .trade-center {
            height: auto;
            flex-shrink: 0;
          }
          .trade-chart {
            min-height: 300px;
            height: 50vh;
            max-height: 450px;
            flex: none;
            overflow: hidden !important;
          }
          .trade-below-chart {
            display: none !important;
          }
          .trade-positions {
            height: auto;
            min-height: auto;
            flex-shrink: 0;
            display: block !important;
            overflow: visible;
            /* Restoring inherited desktop card styles (border and bg1) */
          }
          .action-btn {
            padding: 10px 8px;
            font-size: 13px;
            font-weight: 600;
            box-sizing: border-box;
            flex: 1;
            min-width: 0;
          }
          .trade-mobile-action-bar {
            display: flex !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            margin-top: 0;
            box-sizing: border-box;
            background-color: var(--color-bg0);
            border-top: 1px solid var(--color-border);
            padding: 8px 16px;
            padding-bottom: calc(8px + env(safe-area-inset-bottom));
            gap: 12px;
            z-index: 900;
            justify-content: center;
            align-items: center;
          }
          .mobile-nav-btn {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            background: none;
            border: none;
            color: var(--color-text3);
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .mobile-nav-btn svg {
            width: 20px;
            height: 20px;
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.3s ease;
          }
          .mobile-nav-btn.active {
            color: var(--color-text1);
          }
          .mobile-nav-btn.active svg {
            transform: translateY(-2px) scale(1.15);
            filter: drop-shadow(0 4px 6px rgba(255, 255, 255, 0.15));
            color: var(--color-accent);
          }
          .trade-mobile-tab-view {
            display: flex;
            flex-direction: column;
            flex: 1;
            width: 100%;
            min-width: 0;
            overflow-y: auto;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
          }
          .mobile-hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
