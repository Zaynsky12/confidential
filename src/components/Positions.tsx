import { useState, useMemo } from 'react'
import { useTradeStore } from '../store/useTradeStore'
import { useArcWallet } from '../hooks/useArcWallet'

type Tab = 'balances' | 'positions' | 'orders' | 'trades'

export default function Positions() {
  const { positions, orders, closePosition, cancelOrder } = useTradeStore()
  const { isConnected, balance } = useArcWallet()
  const [tab, setTab] = useState<Tab>('positions')

  const openPositions = useMemo(() => positions.filter((p) => p.status === 'open'), [positions])
  const closedPositions = useMemo(() => positions.filter((p) => p.status === 'closed'), [positions])
  const openOrders = useMemo(() => orders.filter((o) => o.status === 'open'), [orders])

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
                <div className="pos-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr' }}>
                  <span>Asset</span>
                  <span>Total</span>
                  <span>Available</span>
                  <span>Value (USD)</span>
                </div>
                <div className="pos-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr' }}>
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
                <div className="pos-header">
                  <span>Market</span>
                  <span>Side</span>
                  <span>Size</span>
                  <span>Entry Price</span>
                  <span>Mark Price</span>
                  <span>Liq. Price</span>
                  <span>Margin</span>
                  <span>PnL</span>
                  <span></span>
                </div>
                {openPositions.length === 0 ? (
                  <div className="pos-empty">No open positions</div>
                ) : (
                  openPositions.map((p) => (
                    <div key={p.id} className="pos-row">
                      <span style={{ fontWeight: 600 }}>{p.pair}</span>
                      <span className={p.side === 'long' ? 'text-green' : 'text-red'} style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 600 }}>
                        {p.side} {p.leverage}x
                      </span>
                      <span className="font-mono">{p.size.toFixed(4)}</span>
                      <span className="font-mono">${p.entryPrice.toFixed(2)}</span>
                      <span className="font-mono">${p.markPrice.toFixed(2)}</span>
                      <span className="font-mono" style={{ color: 'var(--color-text2)' }}>${p.liquidationPrice.toFixed(2)}</span>
                      <span className="font-mono">${p.collateral.toFixed(2)}</span>
                      <span className={`font-mono ${p.pnl >= 0 ? 'text-green' : 'text-red'}`} style={{ fontWeight: 500 }}>
                        {p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)} ({p.pnl >= 0 ? '+' : ''}{p.pnlPercent.toFixed(2)}%)
                      </span>
                      <button onClick={() => closePosition(p.id)} className="btn-close">
                        Close
                      </button>
                    </div>
                  ))
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
                <div className="pos-header" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr auto' }}>
                  <span>Time</span>
                  <span>Market</span>
                  <span>Side</span>
                  <span>Type</span>
                  <span>Size</span>
                  <span>Price</span>
                  <span>Filled</span>
                  <span></span>
                </div>
                {openOrders.length === 0 ? (
                  <div className="pos-empty">No open orders</div>
                ) : (
                  openOrders.map((o) => (
                    <div key={o.id} className="pos-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr auto' }}>
                      <span style={{ color: 'var(--color-text3)' }}>{formatTime(o.timestamp)}</span>
                      <span style={{ fontWeight: 600 }}>{o.pair}</span>
                      <span className={o.side === 'long' ? 'text-green' : 'text-red'} style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 600 }}>
                        {o.side}
                      </span>
                      <span style={{ textTransform: 'capitalize' }}>{o.type}</span>
                      <span className="font-mono">{o.size.toFixed(4)}</span>
                      <span className="font-mono">${o.price.toFixed(2)}</span>
                      <span className="font-mono">0.00%</span>
                      <button onClick={() => cancelOrder(o.id)} className="btn-close">
                        Cancel
                      </button>
                    </div>
                  ))
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
                <div className="pos-header" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr' }}>
                  <span>Time Closed</span>
                  <span>Market</span>
                  <span>Side</span>
                  <span>Size</span>
                  <span>Entry Price</span>
                  <span>Close Price</span>
                  <span>Realized PnL</span>
                </div>
                {closedPositions.length === 0 ? (
                  <div className="pos-empty">No trade history</div>
                ) : (
                  closedPositions.map((p) => (
                    <div key={p.id} className="pos-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr' }}>
                      <span style={{ color: 'var(--color-text3)' }}>{p.closedAt ? formatTime(p.closedAt) : '—'}</span>
                      <span style={{ fontWeight: 600 }}>{p.pair}</span>
                      <span className={p.side === 'long' ? 'text-green' : 'text-red'} style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 600 }}>
                        {p.side}
                      </span>
                      <span className="font-mono">{p.size.toFixed(4)}</span>
                      <span className="font-mono">${p.entryPrice.toFixed(2)}</span>
                      <span className="font-mono">${p.markPrice.toFixed(2)}</span>
                      <span className={`font-mono ${p.pnl >= 0 ? 'text-green' : 'text-red'}`} style={{ fontWeight: 500 }}>
                        {p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)}
                      </span>
                    </div>
                  ))
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
          grid-template-columns: 1fr 0.8fr 1fr 1fr 1fr 1fr 1fr 1.5fr auto;
          padding: 8px 16px;
          font-size: 11px;
          color: var(--color-text3);
          border-bottom: 1px solid var(--color-border);
          min-width: 800px;
        }
        .pos-row {
          display: grid;
          grid-template-columns: 1fr 0.8fr 1fr 1fr 1fr 1fr 1fr 1.5fr auto;
          padding: 10px 16px;
          font-size: 12px;
          align-items: center;
          border-bottom: 1px solid var(--color-border);
          min-width: 800px;
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

        @media (max-width: 768px) {
          .positions-container {
            height: auto;
            min-height: 160px;
            display: flex !important;
            flex-direction: column;
          }
          .pos-tabs {
            display: flex !important;
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
            padding: 10px 12px;
            font-size: 12px;
          }
          .pos-header, .pos-row {
            padding: 8px 12px;
          }
        }
      `}</style>
    </div>
  )
}
