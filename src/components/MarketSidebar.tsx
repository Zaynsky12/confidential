import { useState, useMemo } from 'react'
import { useTradeStore } from '../store/useTradeStore'

interface MarketSidebarProps {
  onClose?: () => void
}

export default function MarketSidebar({ onClose }: MarketSidebarProps = {}) {
  const { markets, activeMarketId, setActiveMarket } = useTradeStore()
  const [search, setSearch] = useState('')

  const cryptoMarkets = useMemo(
    () => markets.filter((m) => m.category === 'crypto' && m.pair.toLowerCase().includes(search.toLowerCase())),
    [markets, search]
  )

  const rwaMarkets = useMemo(
    () => markets.filter((m) => m.category === 'rwa' && m.pair.toLowerCase().includes(search.toLowerCase())),
    [markets, search]
  )

  const formatVolume = (v: number) => {
    if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
    return `$${v.toFixed(0)}`
  }

  const formatPrice = (price: number) => {
    if (price >= 10000) return price.toFixed(1)
    if (price >= 100) return price.toFixed(2)
    if (price >= 1) return price.toFixed(3)
    return price.toFixed(4)
  }

  return (
    <aside className="market-sidebar">
      {/* Search */}
      <div className="sidebar-search">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'var(--color-text3)' }}>
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Search markets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sidebar-search-input"
        />
      </div>

      {/* Crypto Perps */}
      <div className="sidebar-section">
        <div className="label" style={{ padding: '8px 16px 6px' }}>Crypto Perps</div>
        {cryptoMarkets.map((m) => {
          const isActive = m.id === activeMarketId
          const priceDirection = m.price > m.prevPrice ? 'up' : m.price < m.prevPrice ? 'down' : ''
          return (
            <button
              key={m.id}
              className={`market-item ${isActive ? 'active' : ''}`}
              onClick={() => { setActiveMarket(m.id); onClose?.(); }}
            >
              <div className="market-item-left">
                <span className="market-pair">{m.pair}</span>
                <span className="market-volume">{formatVolume(m.volume24h)}</span>
              </div>
              <div className="market-item-right">
                <span className={`market-price font-mono ${priceDirection === 'up' ? 'price-up' : priceDirection === 'down' ? 'price-down' : ''}`}>
                  {formatPrice(m.price)}
                </span>
                <span className={`market-change font-mono ${m.change24h >= 0 ? 'text-green' : 'text-red'}`}>
                  {m.change24h >= 0 ? '+' : ''}{m.change24h.toFixed(2)}%
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* RWA Perps */}
      <div className="sidebar-section">
        <div className="label" style={{ padding: '12px 16px 6px' }}>RWA Perps</div>
        {rwaMarkets.map((m) => {
          const isActive = m.id === activeMarketId
          const priceDirection = m.price > m.prevPrice ? 'up' : m.price < m.prevPrice ? 'down' : ''
          return (
            <button
              key={m.id}
              className={`market-item ${isActive ? 'active' : ''}`}
              onClick={() => { setActiveMarket(m.id); onClose?.(); }}
            >
              <div className="market-item-left">
                <span className="market-pair">{m.pair}</span>
                <span className="market-volume">{formatVolume(m.volume24h)}</span>
              </div>
              <div className="market-item-right">
                <span className={`market-price font-mono ${priceDirection === 'up' ? 'price-up' : priceDirection === 'down' ? 'price-down' : ''}`}>
                  {formatPrice(m.price)}
                </span>
                <span className={`market-change font-mono ${m.change24h >= 0 ? 'text-green' : 'text-red'}`}>
                  {m.change24h >= 0 ? '+' : ''}{m.change24h.toFixed(2)}%
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <style>{`
        .market-sidebar {
          width: 100%;
          height: 100%;
          background-color: var(--color-bg1);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .sidebar-search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          margin: 12px 16px;
          background-color: var(--color-bg2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }
        .sidebar-search-input {
          width: 100%;
          font-size: 12px;
          color: var(--color-text1);
          background: transparent;
        }
        .sidebar-search-input::placeholder {
          color: var(--color-text3);
        }
        .sidebar-section {
          display: flex;
          flex-direction: column;
        }
        .market-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          cursor: pointer;
          transition: background-color 150ms;
          border-left: 2px solid transparent;
          width: 100%;
          text-align: left;
          color: var(--color-text1);
        }
        .market-item:hover {
          background-color: var(--color-bg2);
        }
        .market-item.active {
          background-color: var(--color-bg2);
          border-left-color: var(--color-accent);
        }
        .market-item-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .market-pair {
          font-size: 13px;
          font-weight: 500;
        }
        .market-volume {
          font-size: 10px;
          color: var(--color-text3);
        }
        .market-item-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .market-price {
          font-size: 13px;
          font-weight: 500;
        }
        .market-change {
          font-size: 11px;
        }

        @media (max-width: 768px) {
          .market-item {
            padding: 12px; /* larger touch target */
          }
          .market-pair {
            font-size: 14px;
          }
          .sidebar-search {
            margin: 12px;
            padding: 10px 14px;
          }
        }
      `}</style>
    </aside>
  )
}
