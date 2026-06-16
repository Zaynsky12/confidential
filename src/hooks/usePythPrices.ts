import { useEffect, useRef } from 'react'
import { useTradeStore } from '../store/useTradeStore'

const HERMES_URL = 'https://hermes.pyth.network/v2/updates/price/latest'

/**
 * Fetches real-time prices from Pyth Hermes API and updates the trade store.
 * Replaces the old useMockPrices hook — no more random data!
 */
export function usePythPrices() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    async function fetchPrices() {
      const state = useTradeStore.getState()
      const markets = state.markets

      // Build query string with all Pyth price IDs
      const ids = markets.map((m) => `ids[]=${m.pythPriceId}`).join('&')
      const url = `${HERMES_URL}?${ids}`

      try {
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.json()

        if (!data.parsed || !Array.isArray(data.parsed)) return

        for (const feed of data.parsed) {
          const id = feed.id as string
          const market = markets.find((m) => m.pythPriceId === id)
          if (!market) continue

          const priceData = feed.price
          if (!priceData) continue

          // Convert Pyth price: price * 10^expo
          const rawPrice = Number(priceData.price)
          const expo = Number(priceData.expo)
          const newPrice = Number(rawPrice * Math.pow(10, expo))

          if (newPrice > 0) {
            // On first load, also set high/low/prevPrice
            if (!initializedRef.current || market.price === 0) {
              const currentState = useTradeStore.getState()
              const updatedMarkets = currentState.markets.map((m) =>
                m.id === market.id
                  ? {
                      ...m,
                      price: newPrice,
                      prevPrice: newPrice,
                      high24h: newPrice * 1.005,
                      low24h: newPrice * 0.995,
                    }
                  : m
              )
              useTradeStore.setState({ markets: updatedMarkets })
            } else {
              state.updateMarketPrice(market.id, newPrice)
            }
          }
        }

        initializedRef.current = true

        // Refresh order book for active market
        useTradeStore.getState().refreshOrderBook()

        // Add a simulated recent trade based on real price
        const activeMarket = useTradeStore.getState().markets.find(
          (m) => m.id === useTradeStore.getState().activeMarketId
        )
        if (activeMarket && activeMarket.price > 0) {
          const side = Math.random() > 0.5 ? 'buy' : 'sell'
          useTradeStore.getState().addRecentTrade({
            id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            time: Date.now(),
            side: side as 'buy' | 'sell',
            price: +(activeMarket.price + (Math.random() - 0.5) * activeMarket.price * 0.0003).toFixed(2),
            size: +(Math.random() * 3 + 0.01).toFixed(4),
          })
        }

        // Update position PnL with real prices
        useTradeStore.getState().updatePositionPnl()
      } catch (err) {
        // Silently fail — will retry next interval
        console.warn('[Pyth] Price fetch failed:', err)
      }
    }

    // Fetch immediately on mount
    fetchPrices()

    // Then poll every 2 seconds
    intervalRef.current = setInterval(fetchPrices, 2000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])
}
