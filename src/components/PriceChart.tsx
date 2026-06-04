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
      <div className="chart-header-stats">
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>{activeMarket.pair.replace('/', '-')}</span>
          <span className="badge-accent" style={{ padding: '2px 6px', fontSize: 11, borderRadius: 4, fontWeight: 600 }}>40x</span>
        </div>
        
        <div className="chart-stat-item desktop-only">
          <span className="chart-stat-label">Mark</span>
          <span className="font-mono chart-stat-value" style={{ color: 'var(--color-accent)' }}>{fp(activeMarket.price)}</span>
        </div>

        <div className="chart-stat-item desktop-only">
          <span className="chart-stat-label">Oracle</span>
          <span className="font-mono chart-stat-value">{fp(activeMarket.price * 1.0001)}</span>
        </div>

        <div className="chart-stat-item desktop-only">
          <span className="chart-stat-label">24h Change</span>
          <span className={`font-mono chart-stat-value ${activeMarket.change24h >= 0 ? 'text-green' : 'text-red'}`}>
            {activeMarket.change24h >= 0 ? '+' : ''}{activeMarket.change24h.toFixed(2)}%
          </span>
        </div>

        <div className="chart-stat-item chart-stat-mobile-col">
          <span className="chart-stat-label">24h Volume</span>
          <span className="font-mono chart-stat-value">{fv(activeMarket.volume24h)}</span>
        </div>

        <div className="chart-stat-item chart-stat-mobile-col">
          <span className="chart-stat-label">Open Interest</span>
          <span className="font-mono chart-stat-value">{fv(activeMarket.openInterest)}</span>
        </div>

        <div className="chart-stat-item chart-stat-mobile-col mobile-only">
          <span className="chart-stat-label">Funding / Countdown</span>
          <span className="font-mono chart-stat-value">
            <span style={{ color: 'var(--color-green)' }}>0.0011%</span> <span style={{ color: 'var(--color-text1)' }}>00:48:11</span>
          </span>
        </div>
      </div>

      {/* HL-style Timeframes & Indicators Bar */}
      <div className="chart-timeframes">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* Main Timeframes */}
          <div style={{ display: 'flex', gap: 12 }}>
            {TIMEFRAMES.map((tf) => (
              <button key={tf} onClick={() => setSelectedTimeframe(tf)}
                style={{ fontSize: 13, fontWeight: selectedTimeframe === tf ? 600 : 500, cursor: 'pointer', transition: 'color 150ms', border: 'none', background: 'none', padding: 0,
                  color: selectedTimeframe === tf ? '#e29931' : 'var(--color-text2)' }}>
                {tf}
              </button>
            ))}
          </div>
          
          <button style={{ background: 'none', border: 'none', color: 'var(--color-text3)', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--color-border)', margin: '0 8px' }} />

        <div className="chart-tools">
          <button className="tool-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="5" width="6" height="14" rx="1"/><path d="M12 2v3"/><path d="M12 19v3"/></svg>
          </button>
          
          <div style={{ width: 1, height: 16, background: 'var(--color-border)', margin: '0 8px' }} />
          
          <button className="tool-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg>
          </button>
          
          <button className="tool-btn text-btn" style={{ marginLeft: 4 }}>
            Show Outliers
          </button>
        </div>

        <div style={{ flex: 1 }} />
        
        <button className="tool-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
        </button>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} style={{ flex: 1, minHeight: 300 }} />

      <style>{`
        .chart-header-stats {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-border);
          flex-wrap: wrap;
          gap: 24px;
          font-size: 13px;
          flex-shrink: 0;
        }
        .chart-stat-item {
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .chart-stat-label {
          color: var(--color-text3);
          font-size: 11px;
          margin-bottom: 2px;
          white-space: nowrap;
        }
        .chart-stat-value {
          font-weight: 500;
          font-size: 13px;
          white-space: nowrap;
        }
        .chart-timeframes {
          display: flex;
          align-items: center;
          padding: 6px 16px;
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }
        .chart-tools {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .tool-btn {
          display: flex;
          align-items: center;
          background: none;
          border: none;
          color: var(--color-text3);
          cursor: pointer;
          padding: 2px;
        }
        .tool-btn.text-btn {
          color: #a4b3d1;
          font-size: 13px;
        }

        /* ═══ Tablet Responsiveness ═══ */
        @media (max-width: 1024px) {
          .desktop-only { display: none !important; }
          .chart-header-stats {
            flex-wrap: nowrap;
            overflow-x: auto;
            -ms-overflow-style: none;
            scrollbar-width: none;
            padding: 10px 12px;
            gap: 16px;
          }
          .chart-header-stats::-webkit-scrollbar {
            display: none;
          }
          .chart-timeframes {
            overflow-x: auto;
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .chart-timeframes::-webkit-scrollbar {
            display: none;
          }
        }

        /* ═══ Mobile Responsiveness ═══ */
        @media (max-width: 768px) {
          .chart-header-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            padding: 12px 16px;
            gap: 16px;
          }
          .chart-stat-item {
            align-items: flex-start;
          }
          .chart-stat-label {
            font-size: 12px;
            margin-bottom: 4px;
            color: var(--color-text3);
          }
          .chart-stat-value {
            font-size: 14px;
            color: var(--color-text1);
          }
          .chart-timeframes {
            padding: 8px 16px;
          }
          .chart-timeframes button {
            font-size: 13px !important;
          }
        }
      `}</style>
    </div>
  )
}
