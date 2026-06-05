import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Market, Order, Position, RecentTrade, VaultDeposit, OrderBookEntry } from '../types'

const INITIAL_MARKETS: Market[] = [
  // Crypto Perps
  { id: 'btc-usdc', pair: 'BTC/USDC', baseAsset: 'BTC', quoteAsset: 'USDC', category: 'crypto', price: 67432.50, prevPrice: 67432.50, change24h: 2.34, volume24h: 1_284_500_000, high24h: 68100, low24h: 66200, openInterest: 425_000_000 },
  { id: 'eth-usdc', pair: 'ETH/USDC', baseAsset: 'ETH', quoteAsset: 'USDC', category: 'crypto', price: 3542.80, prevPrice: 3542.80, change24h: 1.87, volume24h: 842_300_000, high24h: 3620, low24h: 3480, openInterest: 312_000_000 },
  { id: 'sol-usdc', pair: 'SOL/USDC', baseAsset: 'SOL', quoteAsset: 'USDC', category: 'crypto', price: 178.45, prevPrice: 178.45, change24h: -0.92, volume24h: 324_100_000, high24h: 183, low24h: 175.2, openInterest: 98_000_000 },
  { id: 'link-usdc', pair: 'LINK/USDC', baseAsset: 'LINK', quoteAsset: 'USDC', category: 'crypto', price: 18.72, prevPrice: 18.72, change24h: 3.41, volume24h: 45_600_000, high24h: 19.2, low24h: 17.9, openInterest: 28_000_000 },
  { id: 'arb-usdc', pair: 'ARB/USDC', baseAsset: 'ARB', quoteAsset: 'USDC', category: 'crypto', price: 1.24, prevPrice: 1.24, change24h: -1.56, volume24h: 18_200_000, high24h: 1.28, low24h: 1.21, openInterest: 12_000_000 },
  // RWA Perps
  { id: 'aapl-usdc', pair: 'AAPL/USDC', baseAsset: 'AAPL', quoteAsset: 'USDC', category: 'rwa', price: 198.50, prevPrice: 198.50, change24h: 0.75, volume24h: 52_000_000, high24h: 200.1, low24h: 196.8, openInterest: 35_000_000 },
  { id: 'tsla-usdc', pair: 'TSLA/USDC', baseAsset: 'TSLA', quoteAsset: 'USDC', category: 'rwa', price: 245.30, prevPrice: 245.30, change24h: -2.18, volume24h: 68_000_000, high24h: 252, low24h: 242.5, openInterest: 42_000_000 },
  { id: 'gold-usdc', pair: 'GOLD/USDC', baseAsset: 'GOLD', quoteAsset: 'USDC', category: 'rwa', price: 2345.60, prevPrice: 2345.60, change24h: 0.45, volume24h: 120_000_000, high24h: 2360, low24h: 2330, openInterest: 85_000_000 },
  { id: 'spy-usdc', pair: 'SPY/USDC', baseAsset: 'SPY', quoteAsset: 'USDC', category: 'rwa', price: 528.40, prevPrice: 528.40, change24h: 0.62, volume24h: 95_000_000, high24h: 531, low24h: 526, openInterest: 62_000_000 },
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

function generateRecentTrades(price: number): RecentTrade[] {
  const trades: RecentTrade[] = []
  const now = Date.now()
  for (let i = 0; i < 20; i++) {
    const side = Math.random() > 0.5 ? 'buy' : 'sell'
    const tradePrice = price + (Math.random() - 0.5) * price * 0.001
    trades.push({
      id: `trade-${now}-${i}`,
      time: now - i * 3000 - Math.random() * 2000,
      side,
      price: +tradePrice.toFixed(2),
      size: +(Math.random() * 2 + 0.01).toFixed(4),
    })
  }
  return trades
}

interface TradeStore {
  // Markets
  markets: Market[]
  activeMarketId: string
  setActiveMarket: (id: string) => void
  updateMarketPrice: (id: string, price: number) => void

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
  isWalletModalOpen: boolean
  setWalletModalOpen: (open: boolean) => void
  selectedTimeframe: string
  setSelectedTimeframe: (tf: string) => void

  // Mock wallet balance
  mockBalance: number
}

export const useTradeStore = create<TradeStore>()(
  persist(
    (set, get) => ({
      // Markets
      markets: INITIAL_MARKETS,
  activeMarketId: 'btc-usdc',
  setActiveMarket: (id) => {
    set({ activeMarketId: id })
    get().refreshOrderBook()
  },
  updateMarketPrice: (id, price) => {
    set((state) => ({
      markets: state.markets.map((m) =>
        m.id === id
          ? {
              ...m,
              prevPrice: m.price,
              price,
              change24h: +((price - m.low24h) / m.low24h * 100 - 50 + m.change24h * 0.95).toFixed(2),
              high24h: Math.max(m.high24h, price),
              low24h: Math.min(m.low24h, price),
            }
          : m
      ),
    }))
  },

  // Order Book
  orderBook: generateOrderBook(67432.50),
  refreshOrderBook: () => {
    const market = get().markets.find((m) => m.id === get().activeMarketId)
    if (market) {
      set({ orderBook: generateOrderBook(market.price) })
    }
  },

  // Recent Trades
  recentTrades: generateRecentTrades(67432.50),
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
  isWalletModalOpen: false,
  setWalletModalOpen: (open) => set({ isWalletModalOpen: open }),
  selectedTimeframe: '1h',
  setSelectedTimeframe: (tf) => set({ selectedTimeframe: tf }),

  // Mock wallet balance
  mockBalance: 1200,
}), { name: 'arc-trade-storage' }))
