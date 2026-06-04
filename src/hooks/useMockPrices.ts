import { useEffect, useRef } from 'react'
import { useTradeStore } from '../store/useTradeStore'

export function useMockPrices() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useTradeStore()

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const state = useTradeStore.getState()

      state.markets.forEach((market) => {
        const volatility = market.price > 1000 ? 0.0001 : market.price > 100 ? 0.0002 : 0.0004
        const change = (Math.random() - 0.495) * market.price * volatility
        const newPrice = +(market.price + change).toFixed(2)
        state.updateMarketPrice(market.id, Math.max(0.01, newPrice))
      })

      // Refresh order book for active market
      state.refreshOrderBook()

      // Add a random recent trade
      const activeMarket = state.markets.find((m) => m.id === state.activeMarketId)
      if (activeMarket) {
        const side = Math.random() > 0.5 ? 'buy' : 'sell'
        state.addRecentTrade({
          id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          time: Date.now(),
          side: side as 'buy' | 'sell',
          price: +(activeMarket.price + (Math.random() - 0.5) * activeMarket.price * 0.0005).toFixed(2),
          size: +(Math.random() * 3 + 0.01).toFixed(4),
        })
      }

      // Update position PnL
      state.updatePositionPnl()
    }, 2000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])
}
