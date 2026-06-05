import { useState, useEffect } from 'react'
import { useTradeStore } from '../store/useTradeStore'

export type OrderBookTab = 'orderbook' | 'trades'

interface OrderBookProps {
  forcedTab?: OrderBookTab
  hideTabs?: boolean
}

export default function OrderBook({ forcedTab, hideTabs }: OrderBookProps = {}) {
  const { orderBook, recentTrades, activeMarketId, markets } = useTradeStore()
  const [tab, setTab] = useState<OrderBookTab>(forcedTab || 'orderbook')

  useEffect(() => {
    if (forcedTab) setTab(forcedTab)
  }, [forcedTab])

  const activeMarket = markets.find((m) => m.id === activeMarketId)

  const formatPrice = (p: number) => {
    if (!activeMarket) return p.toFixed(2)
    if (activeMarket.price >= 10000) return p.toFixed(1)
    if (activeMarket.price >= 100) return p.toFixed(2)
    return p.toFixed(4)
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const maxAskTotal = Math.max(...orderBook.asks.map((a) => a.total), 0.01)
  const maxBidTotal = Math.max(...orderBook.bids.map((b) => b.total), 0.01)
  const spread = orderBook.asks.length && orderBook.bids.length
    ? (orderBook.asks[orderBook.asks.length - 1].price - orderBook.bids[0].price).toFixed(2)
    : '0.00'

  return (
    <div className="orderbook-wrapper">
      {/* Tabs */}
      {!hideTabs && (
        <div className="ob-tabs">
          <button className={`ob-tab ${tab === 'orderbook' ? 'active' : ''}`} onClick={() => setTab('orderbook')}>
            Order Book
          </button>
          <button className={`ob-tab ${tab === 'trades' ? 'active' : ''}`} onClick={() => setTab('trades')}>
            Recent Trades
          </button>
        </div>
      )}

      <div className="ob-content">
        {tab === 'orderbook' && (
          <>
            {/* Header */}
            <div className="ob-header">
              <span>Price (USDC)</span>
              <span>Size</span>
              <span>Total</span>
            </div>

            {/* Asks (reversed — lowest ask at bottom) */}
            <div className="ob-asks">
              {orderBook.asks.map((ask, i) => (
                <div key={`ask-${i}`} className="ob-row ask">
                  <div className="ob-depth-bar ask-bar" style={{ width: `${(ask.total / maxAskTotal) * 100}%` }} />
                  <span className="font-mono text-red">{formatPrice(ask.price)}</span>
                  <span className="font-mono">{ask.size.toFixed(4)}</span>
                  <span className="font-mono" style={{ color: 'var(--color-text3)' }}>{ask.total.toFixed(4)}</span>
                </div>
              ))}
            </div>

            {/* Spread */}
            <div className="ob-spread">
              <span className="font-mono" style={{ color: 'var(--color-text1)', fontSize: '14px', fontWeight: 600 }}>
                {activeMarket ? formatPrice(activeMarket.price) : '—'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-text3)' }}>Spread: {spread}</span>
            </div>

            {/* Bids */}
            <div className="ob-bids">
              {orderBook.bids.map((bid, i) => (
                <div key={`bid-${i}`} className="ob-row bid">
                  <div className="ob-depth-bar bid-bar" style={{ width: `${(bid.total / maxBidTotal) * 100}%` }} />
                  <span className="font-mono text-green">{formatPrice(bid.price)}</span>
                  <span className="font-mono">{bid.size.toFixed(4)}</span>
                  <span className="font-mono" style={{ color: 'var(--color-text3)' }}>{bid.total.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'trades' && (
          <>
            <div className="ob-header">
              <span>Time</span>
              <span>Side</span>
              <span>Price</span>
              <span>Size</span>
            </div>
            <div className="trades-list">
              {recentTrades.map((t) => (
                <div key={t.id} className="ob-row trade-row">
                  <span className="font-mono" style={{ color: 'var(--color-text3)', fontSize: '11px' }}>{formatTime(t.time)}</span>
                  <span className={`font-mono ${t.side === 'buy' ? 'text-green' : 'text-red'}`} style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                    {t.side}
                  </span>
                  <span className={`font-mono ${t.side === 'buy' ? 'text-green' : 'text-red'}`}>{formatPrice(t.price)}</span>
                  <span className="font-mono">{t.size.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        .orderbook-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: var(--color-bg1);
          border-top: 1px solid var(--color-border);
        }
        .ob-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-border);
        }
        .ob-tab {
          flex: 1;
          padding: 8px;
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text3);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 200ms;
          text-align: center;
        }
        .ob-tab:hover { color: var(--color-text2); }
        .ob-tab.active {
          color: var(--color-text1);
          border-bottom-color: var(--color-accent);
        }
        .ob-content {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .ob-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          padding: 6px 12px;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-text3);
          border-bottom: 1px solid var(--color-border);
        }
        .ob-header span:nth-child(2) { text-align: right; }
        .ob-header span:nth-child(3) { text-align: right; }
        .ob-header span:nth-child(4) { text-align: right; }
        .ob-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          padding: 3px 12px;
          font-size: 12px;
          position: relative;
          transition: background-color 100ms;
        }
        .ob-row:hover { background-color: var(--color-bg2); }
        .ob-row span:nth-child(2) { text-align: right; z-index: 1; }
        .ob-row span:nth-child(3) { text-align: right; z-index: 1; }
        .ob-row span:nth-child(4) { text-align: right; z-index: 1; }
        .ob-row span:first-child { z-index: 1; }
        .ob-depth-bar {
          position: absolute;
          right: 0;
          top: 0;
          height: 100%;
          transition: width 300ms ease;
        }
        .ask-bar { background-color: rgba(246, 70, 93, 0.08); }
        .bid-bar { background-color: rgba(14, 203, 129, 0.08); }
        .ob-asks {
          display: flex;
          flex-direction: column;
        }
        .ob-bids {
          display: flex;
          flex-direction: column;
        }
        .ob-spread {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 12px;
          background-color: var(--color-bg2);
          border-top: 1px solid var(--color-border);
          border-bottom: 1px solid var(--color-border);
        }
        .trade-row {
          grid-template-columns: 1fr 0.6fr 1fr 1fr;
        }
        .trades-list {
          flex: 1;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .ob-header, .ob-row {
            font-size: 11px;
            padding: 3px 8px;
          }
          .trade-row {
            font-size: 10px;
          }
          .ob-tab {
            font-size: 11px;
            padding: 10px 4px;
          }
          .ob-spread {
            padding: 5px 8px;
          }
          .ob-spread span:first-child {
            font-size: 13px !important;
          }
          .ob-spread span:last-child {
            font-size: 10px !important;
          }
        }
      `}</style>
    </div>
  )
}
