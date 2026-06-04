import { useState } from 'react'
import MarketSidebar from '../components/MarketSidebar'
import PriceChart from '../components/PriceChart'
import OrderBook from '../components/OrderBook'
import OrderForm from '../components/OrderForm'
import Positions from '../components/Positions'
import type { OrderSide } from '../types'

export default function Trade() {
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
        </div>
        <div className="trade-positions">
          <Positions />
        </div>
      </div>
      <div className="trade-right">
        <div className="trade-order-form desktop-only">
          <OrderForm />
        </div>
        <div className="trade-orderbook">
          <OrderBook />
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="mobile-action-bar mobile-only">
        <button className="action-btn action-buy" onClick={() => { setOrderSide('long'); setIsOrderModalOpen(true); }}>
          Buy / Long
        </button>
        <button className="action-btn action-sell" onClick={() => { setOrderSide('short'); setIsOrderModalOpen(true); }}>
          Sell / Short
        </button>
      </div>

      {/* Mobile Order Form Modal */}
      {isOrderModalOpen && (
        <div className="mobile-order-modal-backdrop mobile-only" onClick={() => setIsOrderModalOpen(false)}>
          <div className="mobile-order-modal animate-slide-up" onClick={e => e.stopPropagation()}>
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

        .mobile-only { display: none; }
        .mobile-action-bar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background-color: var(--color-bg0);
          border-top: 1px solid var(--color-border);
          padding: 12px 16px;
          display: flex; gap: 12px;
          z-index: 100;
        }
        .action-btn {
          flex: 1; padding: 12px;
          font-size: 14px; font-weight: 600; text-transform: uppercase;
          border-radius: var(--radius-md); border: none; cursor: pointer;
        }
        .action-buy { background-color: var(--color-green); color: #070c18; }
        .action-sell { background-color: var(--color-red); color: #fff; }
        
        .mobile-order-modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
          z-index: 999; display: flex; flex-direction: column; justify-content: flex-end;
        }
        .mobile-order-modal {
          background: var(--color-bg1); border-top-left-radius: var(--radius-xl); border-top-right-radius: var(--radius-xl);
          width: 100%; max-height: 85vh; overflow: hidden;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUp 200ms cubic-bezier(0.23, 1, 0.32, 1); }

        /* ═══ Mobile Responsiveness ═══ */
        @media (max-width: 1024px) {
          .mobile-only { display: flex; }
          .desktop-only { display: none !important; }
          .trade-layout {
            display: flex;
            flex-direction: column;
            height: auto;
            overflow: visible;
            padding-bottom: 72px; /* make room for sticky bottom bar */
          }
          .trade-sidebar {
            border-right: none;
            border-bottom: 1px solid var(--color-border);
            height: auto;
          }
          .trade-center {
            height: auto;
          }
          .trade-chart {
            min-height: 400px;
            flex: none;
          }
          .trade-right {
            border-left: none;
            border-top: 1px solid var(--color-border);
          }
          .trade-order-form {
            display: none; /* hidden from normal flow on mobile */
          }
          .trade-orderbook {
            min-height: 300px;
          }
        }
      `}</style>
    </div>
  )
}
