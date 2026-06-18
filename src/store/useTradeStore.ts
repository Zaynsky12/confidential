import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Market, Order, Position, RecentTrade, VaultDeposit, OrderBookEntry } from '../types'

const INITIAL_MARKETS: Market[] = [
  // Crypto Perps
  { id: 'btc-usdc', pair: 'BTC/USDC', baseAsset: 'BTC', quoteAsset: 'USDC', category: 'crypto', pythPriceId: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', pythSymbol: 'Crypto.BTC/USD', price: 0, prevPrice: 0, change24h: 0, volume24h: 1284500000, high24h: 0, low24h: 0, openInterest: 425000000, maxLeverage: 100 },
  { id: 'eth-usdc', pair: 'ETH/USDC', baseAsset: 'ETH', quoteAsset: 'USDC', category: 'crypto', pythPriceId: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', pythSymbol: 'Crypto.ETH/USD', price: 0, prevPrice: 0, change24h: 0, volume24h: 842300000, high24h: 0, low24h: 0, openInterest: 312000000, maxLeverage: 100 },
  { id: 'sol-usdc', pair: 'SOL/USDC', baseAsset: 'SOL', quoteAsset: 'USDC', category: 'crypto', pythPriceId: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d', pythSymbol: 'Crypto.SOL/USD', price: 0, prevPrice: 0, change24h: 0, volume24h: 324100000, high24h: 0, low24h: 0, openInterest: 98000000, maxLeverage: 100 },
  { id: 'link-usdc', pair: 'LINK/USDC', baseAsset: 'LINK', quoteAsset: 'USDC', category: 'crypto', pythPriceId: '8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221', pythSymbol: 'Crypto.LINK/USD', price: 0, prevPrice: 0, change24h: 0, volume24h: 45600000, high24h: 0, low24h: 0, openInterest: 28000000, maxLeverage: 75 },
  { id: 'arb-usdc', pair: 'ARB/USDC', baseAsset: 'ARB', quoteAsset: 'USDC', category: 'crypto', pythPriceId: '3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5', pythSymbol: 'Crypto.ARB/USD', price: 0, prevPrice: 0, change24h: 0, volume24h: 18200000, high24h: 0, low24h: 0, openInterest: 12000000, maxLeverage: 75 },
  { id: 'doge-usdc', pair: 'DOGE/USDC', baseAsset: 'DOGE', quoteAsset: 'USDC', category: 'crypto', pythPriceId: 'dcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c', pythSymbol: 'Crypto.DOGE/USD', price: 0.16, prevPrice: 0.155, change24h: 3.2, volume24h: 850000000, high24h: 0, low24h: 0, openInterest: 150000000, maxLeverage: 50 },
  { id: 'pepe-usdc', pair: 'PEPE/USDC', baseAsset: 'PEPE', quoteAsset: 'USDC', category: 'crypto', pythPriceId: 'd69731a2e74ac1ce884fc3890f7ee324b6deb66147055249568869ed700882e4', pythSymbol: 'Crypto.PEPE/USD', price: 0.000010, prevPrice: 0.000009, change24h: 11.1, volume24h: 420000000, high24h: 0, low24h: 0, openInterest: 85000000, maxLeverage: 50 },
  { id: 'wif-usdc', pair: 'WIF/USDC', baseAsset: 'WIF', quoteAsset: 'USDC', category: 'crypto', pythPriceId: '4ca4beeca86f0d164160323817a4e42b10010a724c2217c6ee41b54cd4cc61fc', pythSymbol: 'Crypto.WIF/USD', price: 2.80, prevPrice: 3.00, change24h: -6.6, volume24h: 310000000, high24h: 0, low24h: 0, openInterest: 65000000, maxLeverage: 50 },
  { id: 'sui-usdc', pair: 'SUI/USDC', baseAsset: 'SUI', quoteAsset: 'USDC', category: 'crypto', pythPriceId: '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744', pythSymbol: 'Crypto.SUI/USD', price: 1.15, prevPrice: 1.10, change24h: 4.5, volume24h: 180000000, high24h: 0, low24h: 0, openInterest: 45000000, maxLeverage: 75 },
  { id: 'apt-usdc', pair: 'APT/USDC', baseAsset: 'APT', quoteAsset: 'USDC', category: 'crypto', pythPriceId: '03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5', pythSymbol: 'Crypto.APT/USD', price: 8.90, prevPrice: 8.85, change24h: 0.5, volume24h: 150000000, high24h: 0, low24h: 0, openInterest: 38000000, maxLeverage: 75 },
  { id: 'avax-usdc', pair: 'AVAX/USDC', baseAsset: 'AVAX', quoteAsset: 'USDC', category: 'crypto', pythPriceId: '93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7', pythSymbol: 'Crypto.AVAX/USD', price: 35.00, prevPrice: 36.50, change24h: -4.1, volume24h: 210000000, high24h: 0, low24h: 0, openInterest: 55000000, maxLeverage: 75 },
  { id: 'bnb-usdc', pair: 'BNB/USDC', baseAsset: 'BNB', quoteAsset: 'USDC', category: 'crypto', pythPriceId: '2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f', pythSymbol: 'Crypto.BNB/USD', price: 600.00, prevPrice: 590.00, change24h: 1.6, volume24h: 650000000, high24h: 0, low24h: 0, openInterest: 210000000, maxLeverage: 100 },
  { id: 'xrp-usdc', pair: 'XRP/USDC', baseAsset: 'XRP', quoteAsset: 'USDC', category: 'crypto', pythPriceId: 'ec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8', pythSymbol: 'Crypto.XRP/USD', price: 0.52, prevPrice: 0.53, change24h: -1.8, volume24h: 820000000, high24h: 0, low24h: 0, openInterest: 320000000, maxLeverage: 100 },
  { id: 'near-usdc', pair: 'NEAR/USDC', baseAsset: 'NEAR', quoteAsset: 'USDC', category: 'crypto', pythPriceId: 'c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750', pythSymbol: 'Crypto.NEAR/USD', price: 7.20, prevPrice: 6.80, change24h: 5.8, volume24h: 120000000, high24h: 0, low24h: 0, openInterest: 28000000, maxLeverage: 75 },
  // RWA Perps
  { id: 'aapl-usdc', pair: 'AAPL/USDC', baseAsset: 'AAPL', quoteAsset: 'USDC', category: 'rwa', pythPriceId: '49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688', pythSymbol: 'Equity.US.AAPL/USD', price: 0, prevPrice: 0, change24h: 0, volume24h: 52000000, high24h: 0, low24h: 0, openInterest: 35000000, maxLeverage: 50 },
  { id: 'tsla-usdc', pair: 'TSLA/USDC', baseAsset: 'TSLA', quoteAsset: 'USDC', category: 'rwa', pythPriceId: '16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1', pythSymbol: 'Equity.US.TSLA/USD', price: 0, prevPrice: 0, change24h: 0, volume24h: 68000000, high24h: 0, low24h: 0, openInterest: 42000000, maxLeverage: 50 },
  { id: 'gold-usdc', pair: 'GOLD/USDC', baseAsset: 'GOLD', quoteAsset: 'USDC', category: 'rwa', pythPriceId: '765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2', pythSymbol: 'Metal.XAU/USD', price: 0, prevPrice: 0, change24h: 0, volume24h: 120000000, high24h: 0, low24h: 0, openInterest: 85000000, maxLeverage: 125 },
  { id: 'silver-usdc', pair: 'SILVER/USDC', baseAsset: 'SILVER', quoteAsset: 'USDC', category: 'rwa', pythPriceId: 'f2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e', pythSymbol: 'Metal.XAG/USD', price: 0, prevPrice: 0, change24h: 0, volume24h: 64000000, high24h: 0, low24h: 0, openInterest: 32000000, maxLeverage: 125 },
  { id: 'spy-usdc', pair: 'SPY/USDC', baseAsset: 'SPY', quoteAsset: 'USDC', category: 'rwa', pythPriceId: '19e09bb805456ada3979a7d1cbb4b6d63babc3a0f8e8a9509f68afa5c4c11cd5', pythSymbol: 'Equity.US.SPY/USD', price: 0, prevPrice: 0, change24h: 0, volume24h: 95000000, high24h: 0, low24h: 0, openInterest: 62000000, maxLeverage: 50 },
  { id: 'nvda-usdc', pair: 'NVDA/USDC', baseAsset: 'NVDA', quoteAsset: 'USDC', category: 'rwa', pythPriceId: 'b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593', pythSymbol: 'Equity.US.NVDA/USD', price: 0, prevPrice: 0, change24h: 0, volume24h: 145000000, high24h: 0, low24h: 0, openInterest: 95000000, maxLeverage: 50 },
  // Forex Perps
  { id: 'eur-usdc', pair: 'EUR/USDC', baseAsset: 'EUR', quoteAsset: 'USDC', category: 'forex', pythPriceId: 'a995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b', pythSymbol: 'FX.EUR/USD', price: 0, prevPrice: 0, change24h: 0, volume24h: 310000000, high24h: 0, low24h: 0, openInterest: 180000000, maxLeverage: 125 },
  { id: 'gbp-usdc', pair: 'GBP/USDC', baseAsset: 'GBP', quoteAsset: 'USDC', category: 'forex', pythPriceId: '84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1', pythSymbol: 'FX.GBP/USD', price: 0, prevPrice: 0, change24h: 0, volume24h: 240000000, high24h: 0, low24h: 0, openInterest: 110000000, maxLeverage: 125 },
  { id: 'usdjpy-usdc', pair: 'USDJPY/USDC', baseAsset: 'USDJPY', quoteAsset: 'USDC', category: 'forex', pythPriceId: 'ef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52', pythSymbol: 'FX.USD/JPY', price: 0, prevPrice: 0, change24h: 0, volume24h: 420000000, high24h: 0, low24h: 0, openInterest: 260000000, maxLeverage: 125 },
]

function generateOrderBook(midPrice: number): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } {
  const spread = midPrice * 0.0002
  const bids: OrderBookEntry[] = []
  const asks: OrderBookEntry[] = []
  let bidTotal = 0
  let askTotal = 0

  for (let i = 0; i < 8; i++) {
    const bidPrice = midPrice - spread * (i + 1) - Math.random() * spread * 0.5
    const bidSize = +(Math.random() * 5 + 0.1).toFixed(4)
    bidTotal += bidSize
    bids.push({ price: +bidPrice.toFixed(2), size: bidSize, total: +bidTotal.toFixed(4) })

    const askPrice = midPrice + spread * (i + 1) + Math.random() * spread * 0.5
    const askSize = +(Math.random() * 5 + 0.1).toFixed(4)
    askTotal += askSize
    asks.unshift({ price: +askPrice.toFixed(2), size: askSize, total: +askTotal.toFixed(4) })
  }

  // Recalculate totals for asks (they are reversed)
  let runTotal = 0
  for (let i = asks.length - 1; i >= 0; i--) {
    runTotal += asks[i].size
    asks[i].total = +runTotal.toFixed(4)
  }

  return { bids, asks }
}



interface TradeStore {
  // Markets
  markets: Market[]
  activeMarketId: string
  watchlist: string[]
  setActiveMarket: (id: string) => void
  toggleWatchlist: (id: string) => void
  updateMarketPrice: (id: string, price: number, conf?: number) => void
  setMarketHistoricalPrices: (prices: Record<string, number>) => void

  // Order Book
  orderBook: { bids: OrderBookEntry[]; asks: OrderBookEntry[] }
  refreshOrderBook: () => void

  // Recent Trades
  recentTrades: RecentTrade[]
  addRecentTrade: (trade: RecentTrade) => void

  // Orders
  orders: Order[]
  placeOrder: (order: Omit<Order, 'id' | 'status' | 'timestamp'>) => void
  cancelOrder: (id: string) => void

  // Positions
  positions: Position[]
  addPosition: (position: Omit<Position, 'id' | 'openedAt' | 'status'>) => void
  closePosition: (id: string) => void
  updatePositionPnl: () => void

  // Vault
  vaultDeposits: VaultDeposit[]
  vaultBalance: number
  vaultTVL: number
  vaultAPY: number
  depositToVault: (amount: number) => void
  withdrawFromVault: (amount: number) => void

  // UI State
  isMarketSelectorOpen: boolean
  setMarketSelectorOpen: (open: boolean) => void
  selectedTimeframe: string
  setSelectedTimeframe: (tf: string) => void
  mobileNav: 'markets' | 'trade' | 'vaults' | 'account'
  setMobileNav: (nav: 'markets' | 'trade' | 'vaults' | 'account') => void

  // Mock wallet balance
  mockBalance: number
}

export const useTradeStore = create<TradeStore>()(
  persist(
    (set, get) => ({
      // Markets
      markets: INITIAL_MARKETS,
      activeMarketId: 'btc-usdc',
      watchlist: [],
      setActiveMarket: (id) => {
        set({ activeMarketId: id })
        get().refreshOrderBook()
      },
      toggleWatchlist: (id) => set((state) => ({
        watchlist: state.watchlist.includes(id) 
          ? state.watchlist.filter(w => w !== id) 
          : [...state.watchlist, id]
      })),
      updateMarketPrice: (id, price, conf) => {
        set((state) => ({
          markets: state.markets.map((m) =>
            m.id === id
              ? {
                  ...m,
                  // Do not overwrite prevPrice! It represents the 24h old price.
                  price,
                  conf: conf ?? m.conf,
                  change24h: m.prevPrice > 0 ? +(((price - m.prevPrice) / m.prevPrice) * 100).toFixed(2) : 0,
                  high24h: Math.max(m.high24h, price),
                  low24h: m.low24h > 0 ? Math.min(m.low24h, price) : price,
                }
              : m
          ),
        }))
      },
      setMarketHistoricalPrices: (prices) => {
        set((state) => ({
          markets: state.markets.map((m) => {
            const historicalPrice = prices[m.pythPriceId]
            if (historicalPrice) {
              return {
                ...m,
                prevPrice: historicalPrice,
                // Recalculate change24h immediately if we already have a current price
                change24h: m.price > 0 ? +(((m.price - historicalPrice) / historicalPrice) * 100).toFixed(2) : 0
              }
            }
            return m
          })
        }))
      },

      // Order Book
      orderBook: generateOrderBook(100),  // Placeholder — refreshed when Pyth prices load
      refreshOrderBook: () => {
        const market = get().markets.find((m) => m.id === get().activeMarketId)
        if (market) {
          set({ orderBook: generateOrderBook(market.price) })
        }
      },

      // Recent Trades
      recentTrades: [],  // Populated when Pyth prices start streaming
      addRecentTrade: (trade) => {
        set((state) => ({
          recentTrades: [trade, ...state.recentTrades.slice(0, 19)],
        }))
      },

      // Orders
      orders: [],
      placeOrder: (orderData) => {
        const id = `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const order: Order = {
          ...orderData,
          id,
          status: orderData.type === 'market' ? 'filled' : 'open',
          timestamp: Date.now(),
          filledAt: orderData.type === 'market' ? Date.now() : undefined,
        }
        set((state) => ({ orders: [order, ...state.orders] }))

        // For market orders, auto-create position
        if (order.type === 'market') {
          const market = get().markets.find((m) => m.id === order.marketId)
          if (market) {
            const collateral = (order.price * order.size) / order.leverage
            const liqMultiplier = order.side === 'long' ? 1 - 0.9 / order.leverage : 1 + 0.9 / order.leverage
            get().addPosition({
              marketId: order.marketId,
              pair: order.pair,
              side: order.side,
              size: order.size,
              entryPrice: order.price,
              markPrice: order.price,
              leverage: order.leverage,
              liquidationPrice: +(order.price * liqMultiplier).toFixed(2),
              pnl: 0,
              pnlPercent: 0,
              collateral: +collateral.toFixed(2),
            })
          }
        }
      },
      cancelOrder: (id) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, status: 'cancelled' as const } : o)),
        }))
      },

      // Positions
      positions: [],
      addPosition: (posData) => {
        const id = `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const position: Position = {
          ...posData,
          id,
          status: 'open',
          openedAt: Date.now(),
        }
        set((state) => ({ positions: [position, ...state.positions] }))
      },
      closePosition: (id) => {
        set((state) => ({
          positions: state.positions.map((p) =>
            p.id === id ? { ...p, status: 'closed' as const, closedAt: Date.now() } : p
          ),
        }))
      },
      updatePositionPnl: () => {
        const markets = get().markets
        set((state) => ({
          positions: state.positions.map((p) => {
            if (p.status === 'closed') return p
            const market = markets.find((m) => m.id === p.marketId)
            if (!market) return p
            const markPrice = market.price
            const pnl = p.side === 'long'
              ? (markPrice - p.entryPrice) * p.size
              : (p.entryPrice - markPrice) * p.size
            const pnlPercent = (pnl / p.collateral) * 100
            return { ...p, markPrice, pnl: +pnl.toFixed(2), pnlPercent: +pnlPercent.toFixed(2) }
          }),
        }))
      },

      // Vault
      vaultDeposits: [],
      vaultBalance: 0,
      vaultTVL: 12_450_000,
      vaultAPY: 8.42,
      depositToVault: (amount) => {
        const deposit: VaultDeposit = {
          id: `vd-${Date.now()}`,
          action: 'deposit',
          amount,
          timestamp: Date.now(),
          txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        }
        set((state) => ({
          vaultDeposits: [deposit, ...state.vaultDeposits],
          vaultBalance: state.vaultBalance + amount,
          vaultTVL: state.vaultTVL + amount,
          mockBalance: state.mockBalance - amount,
        }))
      },
      withdrawFromVault: (amount) => {
        const withdrawal: VaultDeposit = {
          id: `vd-${Date.now()}`,
          action: 'withdraw',
          amount,
          timestamp: Date.now(),
          txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        }
        set((state) => ({
          vaultDeposits: [withdrawal, ...state.vaultDeposits],
          vaultBalance: Math.max(0, state.vaultBalance - amount),
          vaultTVL: state.vaultTVL - amount,
          mockBalance: state.mockBalance + amount,
        }))
      },

      // UI State
      isMarketSelectorOpen: false,
      setMarketSelectorOpen: (open) => set({ isMarketSelectorOpen: open }),
      selectedTimeframe: '1h',
      setSelectedTimeframe: (tf) => set({ selectedTimeframe: tf }),
      mobileNav: 'markets',
      setMobileNav: (nav) => set({ mobileNav: nav }),

      // Mock wallet balance
      mockBalance: 1200,
    }), {
      name: 'arc-trade-storage',
      version: 8,
      partialize: (state) => ({
        // Only persist user-specific data, NOT live market data
        activeMarketId: state.activeMarketId,
        watchlist: state.watchlist,
        orders: state.orders,
        positions: state.positions,
        vaultDeposits: state.vaultDeposits,
        vaultBalance: state.vaultBalance,
        mockBalance: state.mockBalance,
        selectedTimeframe: state.selectedTimeframe,
      }),
      migrate: () => {
        // v8: Add watchlist state
        return {}
      },
}))
