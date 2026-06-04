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
  const { setWalletModalOpen } = useTradeStore()
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderSide, setOrderSide] = useState<OrderSide>('long')
  return (
    <div className="trade-layout">
      <div className="trade-sidebar">
        <MarketSidebar />
      </div>
      <div className="trade-center">
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
        <div className="trade-positions">
          <Positions />
        </div>
      </div>
      <div className="trade-right">
        <div className="trade-order-form trade-desktop-only">
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
          overflow: hidden;
        }
        .trade-chart {
          flex: 1;
          min-height: 0;
          border-bottom: 1px solid var(--color-border);
        }
        .trade-positions {
          height: 250px;
          flex-shrink: 0;
          overflow-y: auto;
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
        .action-connect { background-color: #ffb800; color: #000; text-transform: uppercase; font-size: 13px !important; padding: 12px !important; border-radius: var(--radius-md) !important; }
        
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
          /* Show action bar on tablet since order form is hidden */
          .trade-mobile-action-bar {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background-color: var(--color-bg0);
            border-top: 1px solid var(--color-border);
            padding: 10px 16px;
            gap: 12px;
            z-index: 90; /* Below mobile menu (z:999) */
          }
          .trade-mobile-modal-backdrop {
            display: flex;
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
            z-index: 998; flex-direction: column; justify-content: flex-end;
          }
        }

        /* ═══ Mobile (<= 768px) — Single column stacked ═══ */
        @media (max-width: 768px) {
          .trade-desktop-only { display: none !important; }
          .trade-mobile-action-bar {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            width: 100%;
            box-sizing: border-box;
            background-color: var(--color-bg0);
            border-top: 1px solid var(--color-border);
            padding: 8px 10px calc(8px + env(safe-area-inset-bottom, 0px));
            gap: 8px;
            z-index: 90;
            overflow: hidden;
          }
          .trade-mobile-modal-backdrop {
            display: flex;
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
            z-index: 998; flex-direction: column; justify-content: flex-end;
          }
          .trade-layout {
            display: flex;
            flex-direction: column;
            height: auto;
            min-height: calc(100vh - 52px);
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 68px; /* room for sticky bottom bar */
          }
          .trade-sidebar {
            display: none;
          }
          .trade-center {
            height: auto;
            flex-shrink: 0;
          }
          .trade-chart {
            min-height: 300px;
            height: 45vh;
            flex: none;
          }
          .trade-positions {
            height: auto;
            min-height: 100px;
            max-height: 220px;
          }
          .trade-right {
            border-left: none;
            border-top: 1px solid var(--color-border);
            flex-shrink: 0;
          }
          .trade-order-form {
            display: none;
          }
          .trade-orderbook {
            min-height: 280px;
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
