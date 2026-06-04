import { useMemo, useRef, useCallback } from 'react'
import type { CandleData } from '../types'

const TIMEFRAME_SECONDS: Record<string, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
  '1W': 604800,
  '1M': 2592000,
}

function generateCandles(basePrice: number, count: number, intervalSeconds: number): CandleData[] {
  const candles: CandleData[] = []
  const now = Math.floor(Date.now() / 1000)
  let price = basePrice * (0.85 + Math.random() * 0.15)

  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * intervalSeconds
    const tfMult = Math.sqrt(intervalSeconds / 3600) || 1
    const baseVol = basePrice > 1000 ? 0.0015 : basePrice > 100 ? 0.002 : 0.003
    const volatility = baseVol * tfMult
    const change = (Math.random() - 0.495) * price * volatility
    const open = price
    const close = +(price + change).toFixed(2)
    const highExtra = Math.random() * Math.abs(change) * 0.8
    const lowExtra = Math.random() * Math.abs(change) * 0.8
    const high = +(Math.max(open, close) + highExtra).toFixed(2)
    const low = +(Math.min(open, close) - lowExtra).toFixed(2)
    const volume = +(Math.random() * 1000 * tfMult + 100).toFixed(2)

    candles.push({ time, open, high, low, close, volume })
    price = close
  }

  return candles
}

export function useMockCandles(basePrice: number, timeframe: string) {
  const candlesRef = useRef<CandleData[]>([])
  const lastPriceRef = useRef(basePrice)
  const lastTimeframeRef = useRef(timeframe)

  // Generate initial candles
  const initialCandles = useMemo(() => {
    const intervalSeconds = TIMEFRAME_SECONDS[timeframe] || 3600
    const candles = generateCandles(basePrice, 1500, intervalSeconds)
    candlesRef.current = candles
    lastPriceRef.current = candles[candles.length - 1]?.close ?? basePrice
    lastTimeframeRef.current = timeframe
    return candles
  }, [basePrice > 1000 ? Math.floor(basePrice / 100) : Math.floor(basePrice), timeframe])

  // Generate new candle
  const appendCandle = useCallback((currentPrice: number): CandleData => {
    const intervalSeconds = TIMEFRAME_SECONDS[timeframe] || 3600
    const now = Math.floor(Date.now() / 1000)
    const lastCandle = candlesRef.current[candlesRef.current.length - 1]

    if (lastCandle && now - lastCandle.time < intervalSeconds) {
      // Update existing candle
      const updated = {
        ...lastCandle,
        close: currentPrice,
        high: Math.max(lastCandle.high, currentPrice),
        low: Math.min(lastCandle.low, currentPrice),
        volume: +(lastCandle.volume + Math.random() * 10).toFixed(2),
      }
      candlesRef.current[candlesRef.current.length - 1] = updated
      return updated
    } else {
      // New candle
      const open = lastCandle?.close ?? currentPrice
      const newCandle: CandleData = {
        time: now,
        open,
        high: Math.max(open, currentPrice),
        low: Math.min(open, currentPrice),
        close: currentPrice,
        volume: +(Math.random() * 500 + 50).toFixed(2),
      }
      candlesRef.current.push(newCandle)
      if (candlesRef.current.length > 2000) {
        candlesRef.current = candlesRef.current.slice(-1500)
      }
      return newCandle
    }
  }, [timeframe])

  return { initialCandles, appendCandle, candlesRef }
}
