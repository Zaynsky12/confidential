import { useState, useEffect, useMemo } from 'react'
import { useTradeStore } from '../store/useTradeStore'
import { useTradeRecords } from '../hooks/useGoldsky'
import { keccak256, toHex } from 'viem'

export type OrderBookTab = 'orderbook' | 'trades'

interface OrderBookProps {
  forcedTab?: OrderBookTab
  hideTabs?: boolean
}

export default function OrderBook({ forcedTab, hideTabs }: OrderBookProps = {}) {
  const { activeMarketId, markets } = useTradeStore()
  const { trades } = useTradeRecords()
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
  
  // Virtual Order Book (VOB) Generation
  // Ini menyimulasikan kedalaman pasar (depth) berdasarkan harga Oracle saat ini
  // untuk menampilkan kurva slippage (VOB) ala gTrade.
  const { asks, bids, maxTotal } = useMemo(() => {
    if (!activeMarket || !activeMarket.price) return { asks: [], bids: [], maxTotal: 0 }
    
    const currentPrice = activeMarket.price
    
    // Spread disinkronkan dengan estetika gTrade (GNS) di kisaran 0.0101%
    // Karena bid dan ask ditarik setengah jarak dari harga tengah,
    // maka step per level adalah 0.00505% (0.0000505) agar total spread menjadi ~0.0101%
    const priceStepPct = 0.0000505
    
    const baseLiquidityUsd = 100000 // Base liquidity scaling factor
    
    const genAsks = []
    const genBids = []
    
    let cumulativeAskSize = 0
    let cumulativeBidSize = 0

    // Generate 8 levels of depth to fit nicely in the UI without overflowing
    for (let i = 1; i <= 8; i++) {
      // Asks (Sellers above current price)
      const askPrice = currentPrice * (1 + (priceStepPct * i))
      // Size increases exponentially as we get further from price to simulate bonding curve
      const askSizeUsd = baseLiquidityUsd * Math.pow(1.2, i) * (Math.random() * 0.4 + 0.8)
      const askSizeBase = askSizeUsd / askPrice
      cumulativeAskSize += askSizeBase
      
      genAsks.push({
        price: askPrice,
        size: askSizeBase,
        total: cumulativeAskSize
      })

      // Bids (Buyers below current price)
      const bidPrice = currentPrice * (1 - (priceStepPct * i))
      const bidSizeUsd = baseLiquidityUsd * Math.pow(1.2, i) * (Math.random() * 0.4 + 0.8)
      const bidSizeBase = bidSizeUsd / bidPrice
      cumulativeBidSize += bidSizeBase

      genBids.push({
        price: bidPrice,
        size: bidSizeBase,
        total: cumulativeBidSize
      })
    }
    
    // Reverse asks so lowest ask is at the bottom (closest to spread)
    genAsks.reverse()
    
    const max = Math.max(cumulativeAskSize, cumulativeBidSize, 0.01)
    
    return { asks: genAsks, bids: genBids, maxTotal: max }
  }, [activeMarket?.price]) // Re-generate when price changes

  const lowestAsk = asks.length > 0 ? asks[asks.length - 1].price : 0
  const highestBid = bids.length > 0 ? bids[0].price : 0
  const spreadDiff = lowestAsk > 0 && highestBid > 0 ? lowestAsk - highestBid : 0
  const spreadPct = highestBid > 0 ? (spreadDiff / highestBid) * 100 : 0

  return (
    <div className="orderbook-wrapper">
      {/* Tabs */}
      {!hideTabs && (
        <div className="ob-tabs">
          <button className={`ob-tab ${tab === 'orderbook' ? 'active' : ''}`} onClick={() => setTab('orderbook')}>
            VOB
          </button>
          <button className={`ob-tab ${tab === 'trades' ? 'active' : ''}`} onClick={() => setTab('trades')}>
            Trades
          </button>
        </div>
      )}

      <div className="ob-content">
        {tab === 'orderbook' && (
          <>
            {/* Header */}
            <div className="ob-header">
              <span>Price</span>
              <span>Size</span>
              <span>Total</span>
            </div>

            {/* Asks (reversed — lowest ask at bottom) */}
            <div className="ob-asks">
              {asks.length === 0 ? (
                <div style={{ padding: 12, textAlign: 'center', color: 'var(--color-text3)', fontSize: 11 }}>Waiting for price...</div>
              ) : asks.map((ask, i) => (
                <div key={`ask-${i}`} className="ob-row ask">
                  <div className="ob-depth-bar ask-bar" style={{ width: `${(ask.total / maxTotal) * 100}%` }} />
                  <span className="font-mono" style={{ color: '#E05252' }}>{formatPrice(ask.price)}</span>
                  <span className="font-mono" style={{ color: 'var(--color-text1)' }}>{ask.size.toFixed(4)}</span>
                  <span className="font-mono" style={{ color: 'var(--color-text3)' }}>{ask.total.toFixed(4)}</span>
                </div>
              ))}
            </div>

            {/* Spread / Mark Price */}
            <div className="ob-spread">
              <span className="font-mono" style={{ color: '#60a5fa', fontWeight: 600 }}>{activeMarket ? `$${formatPrice(activeMarket.price)}` : '---'}</span>
              <span className="font-mono">Spread</span>
              <span className="font-mono">{spreadPct > 0 ? spreadPct.toFixed(3) : '0.000'}%</span>
            </div>

            {/* Bids */}
            <div className="ob-bids">
              {bids.length === 0 ? (
                <div style={{ padding: 12, textAlign: 'center', color: 'var(--color-text3)', fontSize: 11 }}>Waiting for price...</div>
              ) : bids.map((bid, i) => (
                <div key={`bid-${i}`} className="ob-row bid">
                  <div className="ob-depth-bar bid-bar" style={{ width: `${(bid.total / maxTotal) * 100}%` }} />
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', zIndex: 1 }}>
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
          overflow-y: hidden;
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
          position: sticky;
          top: 0;
          background-color: var(--color-bg1);
          z-index: 10;
          flex-shrink: 0;
        }
        .ob-header span:first-child { text-align: left; }
        .ob-header span:nth-child(2) { text-align: center; }
        .ob-header span:last-child { text-align: right; }
        
        .ob-row.ask > span:nth-child(2), .ob-row.bid > span:nth-child(2), .ob-row.trade-row > span:nth-child(1) { text-align: left; }
        .ob-row.ask > span:nth-child(3), .ob-row.bid > span:nth-child(3), .ob-row.trade-row > span:nth-child(2) { text-align: center; }
        .ob-row.ask > span:nth-child(4), .ob-row.bid > span:nth-child(4) { text-align: right; }
        .ob-row {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          height: 30px;
          align-items: center;
          padding: 0 12px;
          font-size: 11px;
          position: relative;
          transition: background-color 100ms;
        }
        .ob-row:hover { background-color: var(--color-bg2); }
        .ob-row span { z-index: 1; }
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
          flex: 1;
          justify-content: flex-end;
          min-height: 0;
          overflow: hidden;
        }
        .ob-bids {
          display: flex;
          flex-direction: column;
          flex: 1;
          justify-content: flex-start;
          min-height: 0;
          overflow: hidden;
        }
        .ob-spread {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          align-items: center;
          padding: 8px 12px;
          background-color: rgba(96, 165, 250, 0.05);
          border-top: 1px solid var(--color-border);
          border-bottom: 1px solid var(--color-border);
          z-index: 2;
        }
        .ob-spread > span:nth-child(1) { text-align: left; }
        .ob-spread > span:nth-child(2) { text-align: center; color: var(--color-text3); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .ob-spread > span:nth-child(3) { text-align: right; color: var(--color-text3); font-size: 11px; }
        .trade-row {
          grid-template-columns: 1.2fr 1fr 1fr;
          height: 30px;
        }
        .trades-list {
          flex: 1;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .ob-content {
            overflow-y: auto;
          }
          .ob-header {
            font-size: 10px;
            padding: 2px 8px;
          }
          .ob-row {
            font-size: 11px;
            padding: 2px 8px;
            height: 22px;
          }
          .trade-row {
            font-size: 10px;
            height: 26px;
          }
          .ob-tab {
            font-size: 11px;
            padding: 8px 4px;
          }
          .ob-spread {
            height: 28px;
            padding: 4px 8px;
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
