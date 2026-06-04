import { useEffect, useRef } from 'react'
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries } from 'lightweight-charts'
import type { IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts'
import { useTradeStore } from '../store/useTradeStore'
import { useMockCandles } from '../hooks/useMockCandles'

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d', '1W', '1M']

export default function PriceChart() {
  const { markets, activeMarketId, selectedTimeframe, setSelectedTimeframe } = useTradeStore()
  const activeMarket = markets.find((m) => m.id === activeMarketId)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  const basePrice = activeMarket?.price ?? 67000
  const { initialCandles, appendCandle } = useMockCandles(basePrice, selectedTimeframe)

  // Create chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b1016' },
        textColor: 'rgba(255,255,255,0.4)',
        fontFamily: "'Inter', ui-sans-serif, system-ui",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0)' }, // Hidden vertical lines
        horzLines: { color: 'rgba(255,255,255,0.02)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(255,255,255,0.1)', width: 1, style: 2, labelBackgroundColor: '#1a2640' },
        horzLine: { color: 'rgba(255,255,255,0.1)', width: 1, style: 2, labelBackgroundColor: '#1a2640' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 10,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    })

    // v5 API: use addSeries with CandlestickSeries type
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#2ebd85',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#2ebd85',
      wickDownColor: '#f6465d',
    })

    const chartData: CandlestickData[] = initialCandles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))

    const volumeData = initialCandles.map((c) => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(46, 189, 133, 0.4)' : 'rgba(246, 70, 93, 0.4)',
    }))

    // Add volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: 'rgba(255,255,255,0.1)',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // set as an overlay
    })
    
    chart.priceScale('').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    series.setData(chartData)
    volumeSeries.setData(volumeData)
    chart.timeScale().scrollToPosition(0, false)

    chartRef.current = chart
    seriesRef.current = series

    // Save volume series to update it live
    ;(seriesRef as any).currentVolume = volumeSeries

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        chart.applyOptions({ width, height })
      }
    })
    ro.observe(chartContainerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [activeMarketId, selectedTimeframe])

  // Live candle updates
  useEffect(() => {
    const interval = setInterval(() => {
      const market = useTradeStore.getState().markets.find((m) => m.id === activeMarketId)
      if (!market || !seriesRef.current) return
      const candle = appendCandle(market.price)
      seriesRef.current.update({
        time: candle.time as Time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })
      if ((seriesRef as any).currentVolume) {
        ;(seriesRef as any).currentVolume.update({
          time: candle.time as Time,
          value: candle.volume,
          color: candle.close >= candle.open ? 'rgba(46, 189, 133, 0.4)' : 'rgba(246, 70, 93, 0.4)',
        })
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [activeMarketId, appendCandle])

  if (!activeMarket) return null

  const fp = (p: number) => p >= 10000 ? p.toLocaleString('en-US', { maximumFractionDigits: 1 }) : p >= 100 ? p.toFixed(2) : p.toFixed(3)
  const fv = (v: number) => v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${(v / 1e3).toFixed(2)}K`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg1)' }}>
      {/* HL-style Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 24, fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>{activeMarket.pair.replace('/', '-')}</span>
          <span className="badge-accent" style={{ padding: '2px 6px', fontSize: 11, borderRadius: 4, fontWeight: 600 }}>40x</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'var(--color-text3)', fontSize: 11, marginBottom: 2 }}>Mark</span>
          <span className="font-mono" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>{fp(activeMarket.price)}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'var(--color-text3)', fontSize: 11, marginBottom: 2 }}>Oracle</span>
          <span className="font-mono" style={{ fontWeight: 500 }}>{fp(activeMarket.price * 1.0001)}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'var(--color-text3)', fontSize: 11, marginBottom: 2 }}>24h Change</span>
          <span className={`font-mono ${activeMarket.change24h >= 0 ? 'text-green' : 'text-red'}`} style={{ fontWeight: 500 }}>
            {activeMarket.change24h >= 0 ? '+' : ''}{activeMarket.change24h.toFixed(2)}%
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'var(--color-text3)', fontSize: 11, marginBottom: 2 }}>24h Volume</span>
          <span className="font-mono" style={{ fontWeight: 500 }}>{fv(activeMarket.volume24h)}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'var(--color-text3)', fontSize: 11, marginBottom: 2 }}>Open Interest</span>
          <span className="font-mono" style={{ fontWeight: 500 }}>{fv(activeMarket.openInterest)}</span>
        </div>
      </div>

      {/* HL-style Timeframes & Indicators Bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 16px', borderBottom: '1px solid var(--color-border)', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {TIMEFRAMES.map((tf) => (
            <button key={tf} onClick={() => setSelectedTimeframe(tf)}
              style={{ fontSize: 13, fontWeight: selectedTimeframe === tf ? 600 : 500, cursor: 'pointer', transition: 'color 150ms', border: 'none', background: 'none', padding: 0,
                color: selectedTimeframe === tf ? 'var(--color-text1)' : 'var(--color-text3)' }}>
              {tf}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 14, background: 'var(--color-border)' }} />
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--color-text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
          Indicators
        </button>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} style={{ flex: 1, minHeight: 300 }} />
    </div>
  )
}
