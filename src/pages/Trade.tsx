import { useState } from 'react'
import MarketSidebar from '../components/MarketSidebar'
import PriceChart from '../components/PriceChart'
import OrderBook from '../components/OrderBook'
import OrderForm from '../components/OrderForm'
import Positions from '../components/Positions'
import { useArcWallet } from '../hooks/useArcWallet'
import { useTradeStore } from '../store/useTradeStore'
import type { OrderSide } from '../types'

export default function Trade() {
  const { isConnected } = useArcWallet()
  const { setWalletModalOpen, markets, activeMarketId } = useTradeStore()
  const activeMarket = markets.find((m) => m.id === activeMarketId)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderSide, setOrderSide] = useState<OrderSide>('long')
  const [mobileView, setMobileView] = useState<'chart' | 'orderbook' | 'trades'>('chart')
  
  const fp = (p: number) => p >= 10000 ? p.toLocaleString('en-US', { maximumFractionDigits: 1 }) : p >= 100 ? p.toFixed(2) : p.toFixed(3)
  const fv = (v: number) => v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${(v / 1e3).toFixed(2)}K`

  return (
    <div className="trade-layout">
      <div className="trade-sidebar">
        <MarketSidebar />
      </div>
      <div className="trade-center">
        {activeMarket && (
          <div className="chart-header-stats">
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18, fontWeight: 600 }}>{activeMarket.pair.replace('/', '-')}</span>
              <span className="badge-accent" style={{ padding: '2px 6px', fontSize: 11, borderRadius: 4, fontWeight: 600 }}>40x</span>
            </div>
            
            <div className="chart-stat-item desktop-only">
              <span className="chart-stat-label">Mark</span>
              <span className="font-mono chart-stat-value" style={{ color: 'var(--color-accent)' }}>{fp(activeMarket.price)}</span>
            </div>

            <div className="chart-stat-item desktop-only">
              <span className="chart-stat-label">Oracle</span>
              <span className="font-mono chart-stat-value">{fp(activeMarket.price * 1.0001)}</span>
            </div>

            <div className="chart-stat-item desktop-only">
              <span className="chart-stat-label">24h Change</span>
              <span className={`font-mono chart-stat-value ${activeMarket.change24h >= 0 ? 'text-green' : 'text-red'}`}>
                {activeMarket.change24h >= 0 ? '+' : ''}{activeMarket.change24h.toFixed(2)}%
              </span>
            </div>

            <div className="chart-stat-item chart-stat-mobile-col">
              <span className="chart-stat-label">24h Volume</span>
              <span className="font-mono chart-stat-value">{fv(activeMarket.volume24h)}</span>
            </div>

            <div className="chart-stat-item chart-stat-mobile-col">
              <span className="chart-stat-label">Open Interest</span>
              <span className="font-mono chart-stat-value">{fv(activeMarket.openInterest)}</span>
            </div>

            <div className="chart-stat-item chart-stat-mobile-col mobile-only">
              <span className="chart-stat-label">Funding / Countdown</span>
              <span className="font-mono chart-stat-value">
                <span style={{ color: 'var(--color-green)' }}>0.0011%</span> <span style={{ color: 'var(--color-text1)' }}>00:48:11</span>
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
            {/* Mobile Below-Chart Controls */}
            <div className="mobile-only trade-below-chart">
              <div className="tbc-row">
                <div className="tbc-dropdown">
                  Date Range <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </div>
                <div className="tbc-settings">
                  <span style={{ color: 'var(--color-text1)' }}>22:11:37 UTC+1</span>
                  <span>%</span>
                  <span>log</span>
                  <span style={{ color: '#e29931', fontWeight: 500 }}>auto</span>
                </div>
              </div>
              
              <div className="tbc-row" style={{ marginTop: 16 }}>
                <div className="tbc-segmented-control">
                  <button className="tbc-seg-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
                  <button className="tbc-seg-btn active"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/></svg></button>
                  <button className="tbc-seg-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg></button>
                </div>
                <div className="tbc-order-value">
                  <span className="tbc-ov-label">Order Value</span>
                  <span className="tbc-ov-value font-mono">0 BTC / 0 USD</span>
                </div>
              </div>
            </div>
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

        <div className="trade-positions">
          <Positions />
        </div>
      </div>
      <div className="trade-right trade-desktop-only">
        <div className="trade-order-form">
          <OrderForm />
        </div>
        <div className="trade-orderbook">
          <OrderBook />
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="trade-mobile-action-bar">
        {!isConnected ? (
          <button className="action-btn action-connect" onClick={() => setWalletModalOpen(true)}>
            Connect Wallet
          </button>
        ) : (
          <>
            <button className="action-btn action-buy" onClick={() => { setOrderSide('long'); setIsOrderModalOpen(true); }}>
              BUY
            </button>
            <button className="action-btn action-sell" onClick={() => { setOrderSide('short'); setIsOrderModalOpen(true); }}>
              SELL
            </button>
          </>
        )}
      </div>

      {/* Mobile Order Form Modal */}
      {isOrderModalOpen && (
        <div className="trade-mobile-modal-backdrop" onClick={() => setIsOrderModalOpen(false)}>
          <div className="trade-mobile-modal animate-slide-up" onClick={e => e.stopPropagation()}>
            <OrderForm initialSide={orderSide} onClose={() => setIsOrderModalOpen(false)} />
          </div>
        </div>
      )}

      <style>{`
        .trade-layout {
          display: grid;
          grid-template-columns: 200px 1fr 300px;
          height: calc(100vh - 52px);
          overflow: hidden;
        }
        .trade-sidebar {
          border-right: 1px solid var(--color-border);
          overflow-y: auto;
          background: var(--color-bg0);
        }
        .trade-center {
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .trade-chart {
          flex: 1;
          min-height: 0;
          border-bottom: 1px solid var(--color-border);
        }
        
        /* ═══ Header Stats ═══ */
        .chart-header-stats {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-border);
          flex-wrap: wrap;
          gap: 24px;
          font-size: 13px;
          flex-shrink: 0;
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
          min-height: 200px;
          flex-shrink: 0;
          overflow: visible;
          background: var(--color-bg0);
        }
        .trade-right {
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--color-border);
          overflow: hidden;
          background: var(--color-bg1);
        }
        .trade-order-form {
          flex-shrink: 0;
          border-bottom: 1px solid var(--color-border);
        }
        .trade-orderbook {
          flex: 1;
          overflow: hidden;
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
            grid-template-columns: 1fr 280px;
            grid-template-rows: 1fr;
            padding-bottom: 68px;
          }
          .trade-sidebar {
            display: none;
          }
          .trade-center {
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
          .trade-right {
            grid-column: 2;
            grid-row: 1;
            border-left: 1px solid var(--color-border);
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
            padding: 12px;
            padding-bottom: 24px;
            padding-bottom: calc(16px + env(safe-area-inset-bottom));
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
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            padding: 12px 16px;
            gap: 16px;
          }
          .chart-stat-item {
            align-items: flex-start;
          }
          .chart-stat-label {
            font-size: 12px;
            margin-bottom: 4px;
            color: var(--color-text3);
          }
          .chart-stat-value {
            font-size: 14px;
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
            padding-bottom: 0;
          }
          .trade-sidebar {
            display: none;
          }
          
          .trade-center {
            height: auto;
            flex-shrink: 0;
          }
          .trade-chart {
            min-height: 200px;
            height: 35vh;
            max-height: 280px;
            flex: none;
            overflow: hidden !important;
          }
          .trade-below-chart {
            display: none !important;
          }
          .trade-positions {
            height: auto;
            min-height: 120px;
            flex-shrink: 0;
            display: block !important;
            overflow: visible;
          }
          .action-btn {
            padding: 8px 4px;
            font-size: 11px;
            box-sizing: border-box;
            flex: 1;
            min-width: 0;
          }
        }
      `}</style>
    </div>
  )
}
