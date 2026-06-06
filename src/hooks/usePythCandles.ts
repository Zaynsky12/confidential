import { useState, useEffect, useRef, useCallback } from 'react'
import type { CandleData } from '../types'

const BENCHMARKS_URL = 'https://benchmarks.pyth.network/v1/shims/tradingview/history'

// Map our timeframe strings to Pyth Benchmarks API resolution values
const TIMEFRAME_TO_RESOLUTION: Record<string, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1d': 'D',
  'D': 'D',
  '1W': 'W',
  'W': 'W',
  '1M': 'M',
}

// How many seconds each timeframe represents (for live candle updates)
const TIMEFRAME_SECONDS: Record<string, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
  'D': 86400,
  '1W': 604800,
  'W': 604800,
  '1M': 2592000,
}

/**
 * Fetches real historical candle data from Pyth Benchmarks API.
 * Replaces the old useMockCandles hook.
 */
export function usePythCandles(pythSymbol: string, timeframe: string) {
  const [candles, setCandles] = useState<CandleData[]>([])
  const [loading, setLoading] = useState(true)
  const candlesRef = useRef<CandleData[]>([])
  const prevKeyRef = useRef('')

  // Fetch historical candles
  useEffect(() => {
    const key = `${pythSymbol}-${timeframe}`
    if (key === prevKeyRef.current && candles.length > 0) return
    prevKeyRef.current = key

    let cancelled = false

    async function fetchCandles() {
      setLoading(true)
      const resolution = TIMEFRAME_TO_RESOLUTION[timeframe] || '60'
      const now = Math.floor(Date.now() / 1000)
      const intervalSec = TIMEFRAME_SECONDS[timeframe] || 3600
      // Fetch ~500 candles worth of history, but Pyth limits max range to 1 year
      const maxRangeSec = 31536000 // 1 year
      const requestedRangeSec = intervalSec * 500
      const from = now - Math.min(requestedRangeSec, maxRangeSec)

      const url = `${BENCHMARKS_URL}?symbol=${encodeURIComponent(pythSymbol)}&resolution=${resolution}&from=${from}&to=${now}`

      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()

        if (cancelled) return

        if (data.s === 'ok' && data.t && data.t.length > 0) {
          const newCandles: CandleData[] = data.t.map((t: number, i: number) => ({
            time: t,
            open: data.o[i],
            high: data.h[i],
            low: data.l[i],
            close: data.c[i],
            volume: data.v?.[i] ?? 0,
          }))

          candlesRef.current = newCandles
          setCandles(newCandles)
        } else {
          console.warn('[Pyth Candles] No data for', pythSymbol, timeframe, data.s)
          // Set empty so chart shows something
          candlesRef.current = []
          setCandles([])
        }
      } catch (err) {
        console.warn('[Pyth Candles] Fetch failed:', err)
        if (!cancelled) {
          candlesRef.current = []
          setCandles([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchCandles()

    return () => {
      cancelled = true
    }
  }, [pythSymbol, timeframe])

  // Update the latest candle with live price data
  const appendCandle = useCallback(
    (currentPrice: number): CandleData => {
      const intervalSec = TIMEFRAME_SECONDS[timeframe] || 3600
      const now = Math.floor(Date.now() / 1000)
      const lastCandle = candlesRef.current[candlesRef.current.length - 1]

      // Align 'now' to the exact grid boundary
      let currentBucket = Math.floor(now / intervalSec) * intervalSec;
      if (intervalSec === 604800) {
        // Pyth Weekly candles start on Monday. Unix epoch was Thursday. Offset is 4 days = 345600s
        currentBucket = Math.floor((now - 345600) / intervalSec) * intervalSec + 345600;
      }

      if (lastCandle && lastCandle.time === currentBucket) {
        // Update existing candle
        const updated: CandleData = {
          ...lastCandle,
          close: currentPrice,
          high: Math.max(lastCandle.high, currentPrice),
          low: Math.min(lastCandle.low, currentPrice),
          volume: +(lastCandle.volume + Math.random() * 5).toFixed(2),
        }
        candlesRef.current[candlesRef.current.length - 1] = updated
        return updated
      } else {
        // New candle, with perfectly aligned timestamp
        const open = lastCandle?.close ?? currentPrice
        const newCandle: CandleData = {
          time: currentBucket,
          open,
          high: Math.max(open, currentPrice),
          low: Math.min(open, currentPrice),
          close: currentPrice,
          volume: +(Math.random() * 200 + 20).toFixed(2),
        }
        candlesRef.current.push(newCandle)
        if (candlesRef.current.length > 2000) {
          candlesRef.current = candlesRef.current.slice(-1500)
        }
        return newCandle
      }
    },
    [timeframe]
  )

  return { initialCandles: candles, appendCandle, candlesRef, loading }
}
