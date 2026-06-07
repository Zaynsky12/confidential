import { useEffect, useRef } from 'react'
import { useTradeStore } from '../store/useTradeStore'

let tvScriptLoadingPromise: Promise<void> | null = null

const getTVSymbol = (pythSymbol: string) => {
  if (pythSymbol.startsWith('Crypto.')) {
    const parts = pythSymbol.split('.')
    const cleanPair = parts[parts.length - 1].replace('/', '')
    return `PYTH:${cleanPair}`
  }
  
  if (pythSymbol.startsWith('Equity.US.')) {
    const parts = pythSymbol.split('.')
    const symbol = parts[2].split('/')[0] // e.g. "AAPL"
    if (symbol === 'SPY') return 'AMEX:SPY'
    return `NASDAQ:${symbol}`
  }

  if (pythSymbol.startsWith('Metal.')) {
    const parts = pythSymbol.split('.')
    const symbol = parts[1].replace('/', '') // e.g. "XAUUSD"
    return `OANDA:${symbol}`
  }

  if (pythSymbol.startsWith('FX.')) {
    const parts = pythSymbol.split('.')
    const symbol = parts[1].replace('/', '') // e.g. "EURUSD"
    return `OANDA:${symbol}`
  }

  // Fallback
  const parts = pythSymbol.split('.')
  const cleanPair = parts[parts.length - 1].replace('/', '')
  return `BINANCE:${cleanPair}`
}

export default function PriceChart() {
  const { markets, activeMarketId } = useTradeStore()
  const activeMarket = markets.find((m) => m.id === activeMarketId)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeMarket || !chartContainerRef.current) return;

    const tvSymbol = getTVSymbol(activeMarket.pythSymbol)

    const createWidget = () => {
      // Clear container before recreating
      if (chartContainerRef.current) {
        chartContainerRef.current.innerHTML = '';
      }

      if ('TradingView' in window) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: "30",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          enable_publishing: false,
          backgroundColor: "#0b1016",
          gridColor: "rgba(255, 255, 255, 0.04)",
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: "tv_chart_container",
          toolbar_bg: "#0b1016",
          favorites: {
            intervals: ["5", "30", "D", "M"]
          },
          timeframes: [
            { text: "5m", resolution: "5", description: "5 Minutes" },
            { text: "30m", resolution: "30", description: "30 Minutes" },
            { text: "1d", resolution: "D", description: "1 Day" },
            { text: "1M", resolution: "M", description: "1 Month" }
          ],
          disabled_features: [
            "header_symbol_search",
            "header_compare"
          ],
          studies_overrides: {
            "volume.volume.color.0": "rgba(224, 82, 82, 0.4)",
            "volume.volume.color.1": "rgba(63, 176, 106, 0.4)"
          },
          overrides: {
            "mainSeriesProperties.candleStyle.upColor": "#3FB06A",
            "mainSeriesProperties.candleStyle.downColor": "#E05252",
            "mainSeriesProperties.candleStyle.borderUpColor": "#3FB06A",
            "mainSeriesProperties.candleStyle.borderDownColor": "#E05252",
            "mainSeriesProperties.candleStyle.wickUpColor": "#3FB06A",
            "mainSeriesProperties.candleStyle.wickDownColor": "#E05252",
            "paneProperties.background": "#0b1016",
            "paneProperties.vertGridProperties.color": "rgba(255, 255, 255, 0)",
            "paneProperties.horzGridProperties.color": "rgba(255, 255, 255, 0.02)",
            "scalesProperties.textColor": "rgba(255, 255, 255, 0.4)",
            "scalesProperties.lineColor": "rgba(255, 255, 255, 0.06)",
          }
        });
      }
    };

    if (!tvScriptLoadingPromise) {
      tvScriptLoadingPromise = new Promise((resolve) => {
        const script = document.createElement('script');
        script.id = 'tradingview-widget-loading-script';
        script.src = 'https://s3.tradingview.com/tv.js';
        script.type = 'text/javascript';
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    }

    tvScriptLoadingPromise.then(() => createWidget());

  }, [activeMarket?.pythSymbol]);

  if (!activeMarket) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg1)', position: 'relative' }}>
      <div id="tv_chart_container" ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
