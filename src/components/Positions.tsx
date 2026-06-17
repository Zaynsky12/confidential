import { useState } from 'react'
import { keccak256, toHex } from 'viem'
import { useTradeStore } from '../store/useTradeStore'
import { useArcWallet } from '../hooks/useArcWallet'
import { useConfidentialTrading } from '../hooks/useConfidentialTrading'
import { usePositions, useOrders, useTradeRecords } from '../hooks/useGoldsky'

import SharePnLModal, { type SharePositionData } from './SharePnLModal'

type Tab = 'balances' | 'positions' | 'orders' | 'trades'

export default function Positions() {
  const { markets } = useTradeStore()
  const { isConnected, balance, address } = useArcWallet()
  const [tab, setTab] = useState<Tab>('positions')
  const [selectedShare, setSelectedShare] = useState<SharePositionData | null>(null)

  const formatPrice = (p: number) => {
    if (!p) return '0.00'
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    if (p >= 1) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 })
    return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 10 })
  }

  // Read from smart contract & Goldsky
  const { positions: activePositions } = usePositions(address || undefined)
  const { closePosition, cancelOrder } = useConfidentialTrading()
  const { orders: openOrders, isLoading: isOrdersLoading } = useOrders(address || undefined)
  const { trades: closedPositions, isLoading: isTradesLoading } = useTradeRecords(address || undefined)

  // Use on-chain positions for open positions tab
  const openPositions = activePositions

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'balances', label: 'Balances' },
    { id: 'positions', label: 'Positions' },
    { id: 'orders', label: 'Orders' },
    { id: 'trades', label: 'Trades' }
  ]

  return (
    <div className="positions-container">
      {/* Tabs */}
      <div className="pos-tabs">
        {TABS.map(t => (
          <button 
            key={t.id} 
            className={`pos-tab ${tab === t.id ? 'active' : ''}`} 
            onClick={() => setTab(t.id)}
          >
            {t.label} 
            {t.id === 'positions' && openPositions.length > 0 && <span className="tab-count">{openPositions.length}</span>}
            {t.id === 'orders' && openOrders.length > 0 && <span className="tab-count">{openOrders.length}</span>}
          </button>
        ))}
      </div>

      <div className="pos-content">
        {tab === 'balances' ? (
          <div className="pos-table-wrapper">
            {!isConnected ? (
              <div className="pos-empty">Please connect wallet to view balances</div>
            ) : (
              <>
                <div className="pos-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr', minWidth: '100%' }}>
                  <span>Asset</span>
                  <span>Total</span>
                  <span>Available</span>
                  <span>Value (USD)</span>
                </div>
                <div className="pos-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr', minWidth: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src="/usdc.png" alt="USDC" style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600 }}>USDC</span>
                  </div>
                  <span className="font-mono">{balance.toFixed(2)}</span>
                  <span className="font-mono">{balance.toFixed(2)}</span>
                  <span className="font-mono">${balance.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        ) : tab === 'positions' ? (
          <div className="pos-table-wrapper">
            {!isConnected ? (
              <div className="pos-empty">Please connect wallet to view positions</div>
            ) : (
              <>
                <div className="pos-header" style={{ gridTemplateColumns: "120px 100px 100px 120px 120px 120px 100px 200px", minWidth: "980px" }}>
                  <span style={{ textAlign: 'left' }}>Market</span>
                  <span style={{ textAlign: 'left' }}>Side</span>
                  <span style={{ textAlign: 'left' }}>Size</span>
                  <span style={{ textAlign: 'left' }}>Entry Price</span>
                  <span style={{ textAlign: 'left' }}>Mark Price</span>
                  <span style={{ textAlign: 'left' }}>Liq. Price</span>
                  <span style={{ textAlign: 'left' }}>Margin</span>
                  <span style={{ textAlign: 'center' }}>PnL</span>
                </div>
                {openPositions.length === 0 ? (
                  <div className="pos-empty">No open positions</div>
                ) : (
                  openPositions.map((p) => {
                    // Match pairId (Hash) to actual market to get live price and pair name
                    const matchedMarket = markets.find(m => keccak256(toHex(m.pair)) === p.pairId)
                    const pairName = matchedMarket ? matchedMarket.pair : p.pairId.slice(0, 10) + '...'
                    
                    const markPrice = matchedMarket ? matchedMarket.price : p.entryPrice
                    const sizeBaseAsset = p.sizeUsd / p.entryPrice // Calculate approx base asset size to calculate exact PnL
                    
                    // PnL Math
                    const pnl = matchedMarket 
                      ? (p.isLong ? (markPrice - p.entryPrice) * sizeBaseAsset : (p.entryPrice - markPrice) * sizeBaseAsset) 
                      : 0
                    
                    const pnlPercent = p.collateral > 0 ? (pnl / p.collateral) * 100 : 0
                    
                    return (
                      <div key={p.id} className="pos-row" style={{ gridTemplateColumns: "120px 100px 100px 120px 120px 120px 100px 200px", minWidth: "980px" }}>
                        <span style={{ fontWeight: 600, textAlign: 'left' }}>{pairName}</span>
                        <span className={p.isLong ? 'text-green' : 'text-red'} style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 600, textAlign: 'left' }}>
                          {p.isLong ? 'long' : 'short'} {p.leverage}x
                        </span>
                        <span className="font-mono" style={{ textAlign: 'left' }}>{p.sizeUsd.toFixed(2)}</span>
                        <span className="font-mono" style={{ textAlign: 'left' }}>${formatPrice(p.entryPrice)}</span>
                        <span className="font-mono" style={{ textAlign: 'left' }}>${formatPrice(markPrice)}</span>
                        <span className="font-mono" style={{ color: 'var(--color-text2)', textAlign: 'left' }}>${formatPrice(p.liquidationPrice)}</span>
                        <span className="font-mono" style={{ textAlign: 'left' }}>${p.collateral.toFixed(2)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingRight: '4px' }}>
                          <span className={`font-mono ${pnl >= 0 ? 'text-green' : 'text-red'}`} style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button 
                              className="btn-share"
                              onClick={() => setSelectedShare({
                                pair: pairName,
                                side: p.isLong ? 'long' : 'short',
                                leverage: Number(p.leverage),
                                entryPrice: p.entryPrice,
                                markPrice: markPrice,
                                pnlPercent: pnlPercent,
                                pnlUsd: pnl
                              })}
                              title="Share PnL"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button onClick={() => closePosition(BigInt(p.positionId), matchedMarket?.pythPriceId || '')} className="btn-close">
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </>
            )}
          </div>
        ) : tab === 'orders' ? (
          <div className="pos-table-wrapper">
            {!isConnected ? (
              <div className="pos-empty">Please connect wallet to view open orders</div>
            ) : (
              <>
                <div className="pos-header" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) 100px' }}>
                  <span>Time</span>
                  <span>Market</span>
                  <span>Side</span>
                  <span>Type</span>
                  <span>Size</span>
                  <span>Price</span>
                  <span>Filled</span>
                  <span></span>
                </div>
                {isOrdersLoading ? (
                  <div className="pos-empty">Loading orders from Goldsky...</div>
                ) : openOrders.length === 0 ? (
                  <div className="pos-empty">No open orders</div>
                ) : (
                  openOrders.map((o) => {
                    const matchedMarket = markets.find(m => keccak256(toHex(m.pair)) === o.pairId)
                    const pairName = matchedMarket ? matchedMarket.pair : o.pairId.slice(0, 10) + '...'
                    return (
                    <div key={o.id} className="pos-row" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) 100px' }}>
                      <span style={{ color: 'var(--color-text3)' }}>{formatTime(o.createdAt)}</span>
                      <span style={{ fontWeight: 600 }}>{pairName}</span>
                      <span className={o.isLong ? 'text-green' : 'text-red'} style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 600 }}>
                        {o.isLong ? 'long' : 'short'}
                      </span>
                      <span style={{ textTransform: 'capitalize' }}>
                        {o.orderType === 0 ? 'Limit' : o.orderType === 1 ? 'Stop' : o.orderType === 4 ? 'TWAP' : 'Market'}
                      </span>
                      <span className="font-mono">{o.sizeUsd.toFixed(2)}</span>
                      <span className="font-mono">${formatPrice(o.triggerPrice)}</span>
                      <span className="font-mono">0.00%</span>
                      <button onClick={() => cancelOrder(BigInt(o.orderId))} className="btn-close">
                        Cancel
                      </button>
                    </div>
                  )})
                )}
              </>
            )}
          </div>
        ) : tab === 'trades' ? (
          <div className="pos-table-wrapper">
            {!isConnected ? (
              <div className="pos-empty">Please connect wallet to view history</div>
            ) : (
              <>
                <div className="pos-header" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)' }}>
                  <span>Time</span>
                  <span>Market</span>
                  <span>Action</span>
                  <span>Size</span>
                  <span>Price</span>
                  <span>Tx Hash</span>
                </div>
                {isTradesLoading ? (
                  <div className="pos-empty">Loading history from Goldsky...</div>
                ) : closedPositions.length === 0 ? (
                  <div className="pos-empty">No trade history</div>
                ) : (
                  closedPositions.map((p) => {
                    const matchedMarket = markets.find(m => keccak256(toHex(m.pair)) === p.pairId)
                    const pairName = matchedMarket ? matchedMarket.pair : p.pairId.slice(0, 10) + '...'
                    return (
                    <div key={p.id} className="pos-row" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)' }}>
                      <span style={{ color: 'var(--color-text3)' }}>{formatTime(p.timestamp)}</span>
                      <span style={{ fontWeight: 600 }}>{pairName}</span>
                      <span className={p.action === 'Open' ? 'text-green' : 'text-red'} style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 600 }}>
                        {p.action}
                      </span>
                      <span className="font-mono">{p.sizeUsd.toFixed(2)}</span>
                      <span className="font-mono">${formatPrice(p.price)}</span>
                      <span className="font-mono text-accent">
                        <a href={`https://explorer.arc.network/tx/${p.txHash}`} target="_blank" rel="noreferrer" style={{color:'inherit',textDecoration:'none'}}>View Tx</a>
                      </span>
                    </div>
                  )})
                )}
              </>
            )}
          </div>
        ) : null}
      </div>

      <style>{`
        .positions-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-bg0);
          border-top: 1px solid var(--color-border);
        }
        .pos-tabs {
          display: flex;
          background: var(--color-bg1);
          border-bottom: 1px solid var(--color-border);
          padding: 0 8px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .pos-tabs::-webkit-scrollbar { display: none; }
        .pos-tab {
          padding: 8px 10px;
          font-size: 11px;
          font-weight: 500;
          color: var(--color-text3);
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 150ms;
        }
        .pos-tab:hover {
          color: var(--color-text1);
        }
        .pos-tab.active {
          color: var(--color-text1);
          border-bottom-color: var(--color-accent);
        }
        .tab-count {
          background: var(--color-bg3);
          color: var(--color-text1);
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
        }
        .pos-content {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .pos-empty {
          padding: 32px 16px;
          text-align: center;
          color: var(--color-text3);
          font-size: 13px;
        }
        .pos-table-wrapper {
          flex: 1;
          overflow-y: auto;
          overflow-x: auto;
          min-height: 0;
        }
        .pos-header {
          display: grid;
          grid-template-columns: minmax(0,1.2fr) minmax(0,0.8fr) minmax(0,1fr) minmax(0,1.3fr) minmax(0,1.3fr) minmax(0,1.3fr) minmax(0,1fr) minmax(0,1.5fr) 110px;
          padding: 8px 16px;
          font-size: 11px;
          color: var(--color-text3);
          border-bottom: 1px solid var(--color-border);
          min-width: 1050px;
        }
        .pos-row {
          display: grid;
          grid-template-columns: minmax(0,1.2fr) minmax(0,0.8fr) minmax(0,1fr) minmax(0,1.3fr) minmax(0,1.3fr) minmax(0,1.3fr) minmax(0,1fr) minmax(0,1.5fr) 110px;
          padding: 10px 16px;
          font-size: 12px;
          align-items: center;
          border-bottom: 1px solid var(--color-border);
          min-width: 1050px;
          transition: background-color 150ms;
        }
        .pos-row:hover {
          background-color: var(--color-bg2);
        }
        .btn-close {
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text2);
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          transition: all 150ms;
        }
        .btn-close:hover {
          background: var(--color-bg2);
          color: var(--color-text1);
          border-color: var(--color-text3);
        }
        .btn-share {
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text2);
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 150ms;
        }
        .btn-share:hover {
          background: var(--color-bg2);
          color: var(--color-text1);
          border-color: var(--color-text3);
        }

        @media (max-width: 768px) {
          .positions-container {
            height: auto;
            min-height: 160px;
            display: flex !important;
            flex-direction: column;
          }
          .pos-tabs {
            display: flex !important;
            justify-content: space-between;
            width: 100%;
            flex-shrink: 0;
            min-height: 36px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            border-top: 2px solid var(--color-border);
            border-bottom: 1px solid var(--color-border);
            background: var(--color-bg1);
          }
          .pos-content {
            overflow: visible;
            flex-shrink: 0;
          }
          .pos-table-wrapper {
            overflow-x: auto;
            overflow-y: visible;
            -webkit-overflow-scrolling: touch;
          }
          .pos-tab {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 10px 2px;
            font-size: 12px;
            white-space: nowrap;
          }
          .tab-count {
            flex-shrink: 0;
          }
          .pos-header, .pos-row {
            padding: 8px 12px;
          }
        }
      `}</style>

      {/* Share Modal */}
      <SharePnLModal 
        isOpen={!!selectedShare} 
        onClose={() => setSelectedShare(null)} 
        position={selectedShare} 
      />
    </div>
  )
}








