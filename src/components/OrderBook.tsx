import { useState, useEffect } from 'react'
import { useTradeStore } from '../store/useTradeStore'

import { useTradeRecords, useOrders } from '../hooks/useGoldsky'
import { keccak256, toHex } from 'viem'

export type OrderBookTab = 'orderbook' | 'trades'

interface OrderBookProps {
  forcedTab?: OrderBookTab
  hideTabs?: boolean
}

export default function OrderBook({ forcedTab, hideTabs }: OrderBookProps = {}) {
  const { activeMarketId, markets } = useTradeStore()
  const { trades } = useTradeRecords() // Global trades
  const { orders } = useOrders() // Global pending orders
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

  const activeMarketPairId = activeMarket ? keccak256(toHex(activeMarket.pair)) : ''
  const realRecentTrades = trades.filter(t => t.pairId === activeMarketPairId).slice(0, 50)
  
  const marketOrders = orders.filter(o => o.pairId === activeMarketPairId)
  
  const asksRaw = marketOrders.filter(o => !o.isLong).sort((a, b) => b.triggerPrice - a.triggerPrice)
  const bidsRaw = marketOrders.filter(o => o.isLong).sort((a, b) => b.triggerPrice - a.triggerPrice)

  const asks = asksRaw.map(ask => ({
    price: ask.triggerPrice,
    size: ask.triggerPrice > 0 ? ask.sizeUsd / ask.triggerPrice : 0,
    total: 0
  }))
  let currentAskTotal = 0
  for (let i = asks.length - 1; i >= 0; i--) {
    currentAskTotal += asks[i].size
    asks[i].total = currentAskTotal
  }

  const bids = bidsRaw.map(bid => ({
    price: bid.triggerPrice,
    size: bid.triggerPrice > 0 ? bid.sizeUsd / bid.triggerPrice : 0,
    total: 0
  }))
  let currentBidTotal = 0
  for (let i = 0; i < bids.length; i++) {
    currentBidTotal += bids[i].size
    bids[i].total = currentBidTotal
  }

  const maxAskTotal = Math.max(...asks.map((a) => a.total), 0.01)
  const maxBidTotal = Math.max(...bids.map((b) => b.total), 0.01)
  const hasOrders = asks.length > 0 && bids.length > 0
  const lowestAsk = asks.length > 0 ? asks[asks.length - 1].price : 0
  const highestBid = bids.length > 0 ? bids[0].price : 0
  const spreadDiff = hasOrders ? lowestAsk - highestBid : 0
  const spreadPct = hasOrders && highestBid > 0 ? (spreadDiff / highestBid) * 100 : 0

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
              {asks.length === 0 ? (
                <div style={{ padding: 12, textAlign: 'center', color: 'var(--color-text3)', fontSize: 11 }}>No pending Short orders</div>
              ) : asks.map((ask, i) => (
                <div key={`ask-${i}`} className="ob-row ask">
                  <div className="ob-depth-bar ask-bar" style={{ width: `${(ask.total / maxAskTotal) * 100}%` }} />
                  <span className="font-mono" style={{ color: '#E05252' }}>{formatPrice(ask.price)}</span>
                  <span className="font-mono" style={{ color: 'var(--color-text1)' }}>{ask.size.toFixed(4)}</span>
                  <span className="font-mono" style={{ color: 'var(--color-text3)' }}>{ask.total.toFixed(4)}</span>
                </div>
              ))}
            </div>

            {/* Spread */}
            <div className="ob-spread">
              <span className="font-mono" style={{ color: 'var(--color-text3)' }}>Spread</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="font-mono" style={{ color: 'var(--color-text1)' }}>{spreadDiff.toFixed(2)}</span>
                <span className="font-mono" style={{ color: 'var(--color-text3)' }}>{spreadPct.toFixed(3)}%</span>
              </div>
            </div>

            {/* Bids */}
            <div className="ob-bids">
              {bids.length === 0 ? (
                <div style={{ padding: 12, textAlign: 'center', color: 'var(--color-text3)', fontSize: 11 }}>No pending Long orders</div>
              ) : bids.map((bid, i) => (
                <div key={`bid-${i}`} className="ob-row bid">
                  <div className="ob-depth-bar bid-bar" style={{ width: `${(bid.total / maxBidTotal) * 100}%` }} />
                  <span className="font-mono" style={{ color: '#3FB06A' }}>{formatPrice(bid.price)}</span>
                  <span className="font-mono" style={{ color: 'var(--color-text1)' }}>{bid.size.toFixed(4)}</span>
                  <span className="font-mono" style={{ color: 'var(--color-text3)' }}>{bid.total.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'trades' && (
          <>
            <div className="ob-header trades-header">
              <span>Price</span>
              <span>Size</span>
              <span>Time</span>
            </div>
            <div className="trades-list">
              {realRecentTrades.length === 0 ? (
                <div style={{ padding: 12, textAlign: 'center', color: 'var(--color-text3)', fontSize: 12 }}>No recent trades</div>
              ) : realRecentTrades.map((t) => {
                const color = t.action === 'Open' ? '#3FB06A' : t.action === 'Liquidate' ? '#F7931A' : '#E05252';
                return (
                  <div key={t.id} className="ob-row trade-row">
                    <span className="font-mono" style={{ color }}>{formatPrice(t.price)}</span>
                    <span className="font-mono" style={{ color: 'var(--color-text1)' }}>{(t.sizeUsd / t.price).toFixed(4)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <span className="font-mono" style={{ color: 'var(--color-text3)' }}>{formatTime(t.timestamp)}</span>
                      <a href={`https://explorer.arc.network/tx/${t.txHash}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    </div>
                  </div>
                )
              })}
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
          border: 1px solid var(--color-border);
          border-radius: 8px;
        }
        .ob-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-border);
        }
        .ob-tab {
          flex: 1;
          padding: 12px 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text3);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 200ms;
          text-align: center;
        }
        .ob-tab:hover { color: var(--color-text2); }
        .ob-tab.active {
          color: #fff;
          border-bottom-color: #fff;
        }
        .ob-content {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .ob-header {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          padding: 6px 12px;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-text3);
          border-bottom: 1px solid var(--color-border);
        }
        .ob-header span { text-align: center; }
        .ob-row {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          height: 34px;
          align-items: center;
          padding: 0 12px;
          font-size: 12px;
          position: relative;
          transition: background-color 100ms;
        }
        .ob-row:hover { background-color: var(--color-bg2); }
        .ob-row span { text-align: center; z-index: 1; }
        .ob-row div:nth-child(3) { z-index: 1; justify-content: center; }
        .ob-depth-bar {
          position: absolute;
          right: 0;
          top: 0;
          height: 100%;
          transition: width 300ms ease;
        }
        .ask-bar { background-color: rgba(224, 82, 82, 0.08); }
        .bid-bar { background-color: rgba(63, 176, 106, 0.08); }
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
          height: 34px;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          font-size: 13px;
          background-color: var(--color-bg2);
          border-top: 1px solid var(--color-border);
          border-bottom: 1px solid var(--color-border);
        }
        .trade-row {
          grid-template-columns: 1.2fr 1fr 1fr;
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
