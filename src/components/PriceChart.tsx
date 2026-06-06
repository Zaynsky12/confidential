import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries } from 'lightweight-charts'
import type { IChartApi, ISeriesApi, CandlestickData, Time, MouseEventParams } from 'lightweight-charts'
import { useTradeStore } from '../store/useTradeStore'
import { usePythCandles } from '../hooks/usePythCandles'

const TIMEFRAMES = ['5m', '15m', '1h', '4h', 'D', 'W']
const BOTTOM_TFS = ['5y', '1y', '6m', '3m', '1m', '5d', '1d']

export default function PriceChart() {
  const { markets, activeMarketId, selectedTimeframe, setSelectedTimeframe } = useTradeStore()
  const activeMarket = markets.find((m) => m.id === activeMarketId)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  
  type HoveredCandleData = CandlestickData & { volume?: number }
  const [hoveredCandle, setHoveredCandle] = useState<HoveredCandleData | null>(null)

  const pythSymbol = activeMarket?.pythSymbol ?? 'Crypto.BTC/USD'
  const { initialCandles, appendCandle, loading } = usePythCandles(pythSymbol, selectedTimeframe)



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
        vertLines: { color: 'rgba(255,255,255,0)' },
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
        autoScale: true,
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

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#3FB06A',
      downColor: '#E05252',
      borderVisible: false,
      wickUpColor: '#3FB06A',
      wickDownColor: '#E05252',
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
      color: c.close >= c.open ? 'rgba(63, 176, 106, 0.4)' : 'rgba(224, 82, 82, 0.4)',
    }))

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: 'rgba(255,255,255,0.1)',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    })
    
    chart.priceScale('').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    series.setData(chartData)
    volumeSeries.setData(volumeData)
    chart.timeScale().scrollToPosition(0, false)

    chartRef.current = chart
    seriesRef.current = series
    ;(seriesRef as any).currentVolume = volumeSeries

    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      if (param.time && param.seriesData.size > 0) {
        const data = param.seriesData.get(series) as CandlestickData
        const volData = param.seriesData.get(volumeSeries) as any
        if (data) {
          setHoveredCandle({ ...data, volume: volData?.value })
        }
      } else {
        setHoveredCandle(null)
      }
    })

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
          color: candle.close >= candle.open ? 'rgba(63, 176, 106, 0.4)' : 'rgba(224, 82, 82, 0.4)',
        })
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [activeMarketId, appendCandle])

  if (!activeMarket) return null

  const latestCandle = initialCandles[initialCandles.length - 1]
  const displayCandle = hoveredCandle || {
    open: latestCandle?.open ?? activeMarket.price,
    high: latestCandle?.high ?? activeMarket.price,
    low: latestCandle?.low ?? activeMarket.price,
    close: latestCandle?.close ?? activeMarket.price,
    volume: latestCandle?.volume ?? 0
  }

  const getColor = (val1: number, val2: number) => val1 >= val2 ? '#3FB06A' : '#E05252'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg1)', position: 'relative' }}>
      
      {/* 1. TOP TOOLBAR */}
      <div className="chart-top-toolbar" style={{ display: 'flex', alignItems: 'center', padding: '6px 16px', borderBottom: '1px solid var(--color-border)', flexShrink: 0, gap: '16px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {TIMEFRAMES.map((tf) => (
            <button key={tf} onClick={() => setSelectedTimeframe(tf)}
              style={{ fontSize: 13, fontWeight: selectedTimeframe === tf ? 600 : 500, cursor: 'pointer', transition: 'color 150ms', border: 'none', background: 'none', padding: 0,
                color: selectedTimeframe === tf ? '#eab308' : 'var(--color-text3)' }}>
              {tf}
            </button>
          ))}
          <button style={{ background: 'none', border: 'none', color: 'var(--color-text3)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--color-border)' }} />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="tool-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="5" width="6" height="14" rx="1"/><path d="M12 2v3"/><path d="M12 19v3"/></svg>
          </button>
          <div style={{ width: 1, height: 16, background: 'var(--color-border)' }} />
          <button className="tool-btn text-btn desktop-only" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontStyle: 'italic', fontFamily: 'serif' }}>fx</span> Indicators
          </button>
          <button className="tool-btn text-btn desktop-only">
            Show Outliers
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="tool-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z"/><path d="M4 12h16M12 4v16"/></svg></button>
          <button className="tool-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg></button>
          <button className="tool-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><circle cx="12" cy="13" r="4"></circle></svg></button>
        </div>
      </div>

      {/* MIDDLE SECTION: Left Toolbar + Chart */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* 2. LEFT DRAWING TOOLBAR */}
        <div className="chart-left-toolbar desktop-only" style={{ width: '40px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: '16px', flexShrink: 0 }}>
          <button className="tool-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg></button>
          <button className="tool-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="7" x2="7" y2="17"></line><circle cx="18" cy="6" r="2"></circle><circle cx="6" cy="18" r="2"></circle></svg></button>
          <button className="tool-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line></svg></button>
          <button className="tool-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></button>
          <button className="tool-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg></button>
          <button className="tool-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg></button>
          <button className="tool-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg></button>
          <button className="tool-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="12" x2="16" y2="12"></line><line x1="12" y1="8" x2="12" y2="16"></line></svg></button>
        </div>

        {/* 3. MAIN CHART AREA */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* OHLC Overlay */}
          <div className="ohlc-overlay font-mono">
            <span style={{ color: 'var(--color-text1)', fontWeight: 600, marginRight: 8 }}>{activeMarket.pair.replace('-', '/')} · {selectedTimeframe} · ArcTrade</span>
            <span className="ohlc-item"><span className="ohlc-label">O</span><span style={{ color: getColor(displayCandle.open, displayCandle.close) }}>{displayCandle.open}</span></span>
            <span className="ohlc-item"><span className="ohlc-label">H</span><span style={{ color: getColor(displayCandle.high, displayCandle.open) }}>{displayCandle.high}</span></span>
            <span className="ohlc-item"><span className="ohlc-label">L</span><span style={{ color: getColor(displayCandle.low, displayCandle.open) }}>{displayCandle.low}</span></span>
            <span className="ohlc-item"><span className="ohlc-label">C</span><span style={{ color: getColor(displayCandle.close, displayCandle.open) }}>{displayCandle.close}</span></span>
            {/* Mock Price Change */}
            <span style={{ color: getColor(displayCandle.close, displayCandle.open), marginLeft: 8 }}>
              {displayCandle.close >= displayCandle.open ? '+' : '-'}{Math.abs(displayCandle.close - displayCandle.open).toFixed(1)} ({(Math.abs(displayCandle.close - displayCandle.open) / displayCandle.open * 100).toFixed(2)}%)
            </span>
          </div>
          
          {/* Volume Overlay */}
          <div style={{ position: 'absolute', bottom: '16px', left: '12px', zIndex: 10, fontSize: '11px', color: 'var(--color-text3)' }}>
            Volume <span style={{ color: getColor(displayCandle.close, displayCandle.open) }}>{displayCandle.volume ? displayCandle.volume.toFixed(0) : '563'}</span>
          </div>

          <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      {/* 4. BOTTOM TOOLBAR */}
      <div className="chart-bottom-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px', borderTop: '1px solid var(--color-border)', flexShrink: 0, fontSize: '12px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {BOTTOM_TFS.map(r => (
            <span key={r} style={{ color: r === '1d' ? '#eab308' : 'var(--color-text2)', cursor: 'pointer', fontWeight: 500 }}>{r}</span>
          ))}
          <button className="tool-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></button>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: 'var(--color-text3)' }}>
          <span>16:50:02 UTC+1</span>
          <span>%</span>
          <span>log</span>
          <span style={{ color: '#eab308', cursor: 'pointer' }}>auto</span>
        </div>
      </div>

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
          position: relative;
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
        .tf-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 8px;
          background: var(--color-bg2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-panel);
          display: flex;
          flex-direction: column;
          min-width: 80px;
          z-index: 100;
          overflow: hidden;
        }
        .tf-dropdown-item {
          padding: 10px 16px;
          background: none;
          border: none;
          text-align: left;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 150ms;
        }
        .tf-dropdown-item:hover {
          background-color: var(--color-bg3);
        }
        .ohlc-overlay {
          position: absolute;
          top: 8px;
          left: 12px;
          z-index: 10;
          display: flex;
          gap: 12px;
          font-size: 11px;
          pointer-events: none;
          background: rgba(11, 16, 22, 0.6);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .ohlc-item {
          display: flex;
          gap: 4px;
        }
        .ohlc-label {
          color: var(--color-text3);
        }

        /* ═══ Tablet Responsiveness ═══ */
        @media (max-width: 1024px) {
          .desktop-only { display: none !important; }
          .chart-top-toolbar, .chart-bottom-toolbar {
            overflow-x: auto;
            -ms-overflow-style: none;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          .chart-top-toolbar::-webkit-scrollbar, .chart-bottom-toolbar::-webkit-scrollbar {
            display: none;
          }
        }

        /* ═══ Mobile Responsiveness ═══ */
        @media (max-width: 768px) {
          .mobile-hidden {
            display: none !important;
          }
          .chart-top-toolbar {
            padding: 6px 12px !important;
            gap: 12px !important;
          }
          .chart-bottom-toolbar {
            padding: 4px 12px !important;
          }
          .ohlc-overlay {
            font-size: 10px;
            gap: 6px;
            max-width: calc(100vw - 24px);
            overflow-x: auto;
            -ms-overflow-style: none;
            scrollbar-width: none;
            white-space: nowrap;
          }
          .ohlc-overlay::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
