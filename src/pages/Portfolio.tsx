import { useEffect, useRef, useMemo, useState } from 'react'
import { createChart, ColorType, AreaSeries } from 'lightweight-charts'
import type { IChartApi, Time } from 'lightweight-charts'
import { useTradeStore } from '../store/useTradeStore'
import { useArcWallet } from '../hooks/useArcWallet'
import Positions from '../components/Positions'
export default function Portfolio() {
  const { positions } = useTradeStore()
  const { balance } = useArcWallet()
  const chartRef = useRef<HTMLDivElement>(null)
  const chartApiRef = useRef<IChartApi | null>(null)

  const [chartMetric, setChartMetric] = useState('PnL')
  const [chartTimeframe, setChartTimeframe] = useState('30d')

  const openPos = positions.filter(p=>p.status==='open')
  const totalPnl = positions.reduce((s,p)=>s+p.pnl,0)
  const wins = positions.filter(p=>p.pnl>0).length
  const winRate = positions.length?((wins/positions.length)*100).toFixed(1):'0.0'
  const totalVol = positions.reduce((s,p)=>s+p.entryPrice*p.size,0)
  const bestTrade = positions.length? Math.max(...positions.map(p=>p.pnl)):0
  const equity = balance + openPos.reduce((s,p)=>s+p.collateral+p.pnl,0)

  // Mock 30-day PnL data
  const pnlData = useMemo(()=>{
    const data = []
    const now = Math.floor(Date.now()/1000)
    let cumPnl = 0
    for(let i=29;i>=0;i--){
      cumPnl += (Math.random()-0.45)*50
      data.push({ time: (now - i*86400) as Time, value: +cumPnl.toFixed(2) })
    }
    return data
  },[])

  useEffect(()=>{
    if(!chartRef.current) return
    const chart = createChart(chartRef.current,{
      layout:{ background:{type:ColorType.Solid,color:'transparent'}, textColor:'#848e9c', fontFamily:"'Inter', sans-serif", fontSize:11 },
      grid:{ vertLines:{color:'rgba(255,255,255,0.03)'}, horzLines:{color:'rgba(255,255,255,0.03)'} },
      rightPriceScale:{ borderColor:'rgba(255,255,255,0.06)' },
      timeScale:{ borderColor:'rgba(255,255,255,0.06)' },
      width: chartRef.current.clientWidth, height:280,
    })
    const series = chart.addSeries(AreaSeries, {
      topColor:'rgba(255,255,255,0.15)', bottomColor:'rgba(255,255,255,0.0)', lineColor:'#ffffff', lineWidth:2,
    })
    series.setData(pnlData)
    chart.timeScale().fitContent()
    chartApiRef.current = chart
    const ro = new ResizeObserver(entries=>{
      for(const e of entries) chart.applyOptions({width:e.contentRect.width})
    })
    ro.observe(chartRef.current)
    return ()=>{ ro.disconnect(); chart.remove() }
  },[pnlData])

  return (
    <div className="portfolio-container">
      {/* DESKTOP LAYOUT (Hidden on Mobile) */}
      <div className="portfolio-desktop-only">
        {/* HEADER */}
        <div className="portfolio-header">
          <h1 style={{ fontSize:32,fontWeight:600,letterSpacing:'-0.02em',margin:0 }}>Portfolio</h1>
        </div>

        {/* STATS ROW */}
        <div className="portfolio-stats-grid">
          <div className="stat-card">
            <div className="stat-label">Portfolio Value</div>
            <div className="stat-value font-mono">US${equity.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">PnL</div>
            <div className={`stat-value font-mono ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>
              {totalPnl >= 0 ? '+' : ''}US${totalPnl.toFixed(2)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">30 Day Volume</div>
            <div className="stat-value font-mono">US${totalVol.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Fees (Taker / Maker)</div>
            <div className="stat-value font-mono" style={{ cursor: 'pointer', transition: 'color 0.2s' }}>0.0340% / 0.0110%</div>
          </div>
        </div>

        {/* MID SECTION */}
        <div className="portfolio-mid-grid">
          {/* LEFT: OVERVIEW */}
          <div className="overview-panel">
            <div className="panel-header">Overview</div>
            <div className="overview-list">
              {[
                ['All Time Return', `${totalPnl>=0?'+':''}${totalPnl.toFixed(2)} USDC`, totalPnl>=0?'var(--color-green)':'var(--color-red)'],
                ['Volume', `${totalVol.toFixed(2)} USDC`, 'var(--color-text1)'],
                ['Best Trade', `${bestTrade>0?'+':''}${bestTrade.toFixed(2)} USDC`, bestTrade>0?'var(--color-green)':'var(--color-text1)'],
                ['Trading Portfolio', `${equity.toFixed(2)} USDC`, 'var(--color-text1)'],
                ['Vault Allocation', '0.00 USDC', 'var(--color-text1)'],
                ['Sharpe Ratio', '0.00', 'var(--color-text1)'],
                ['Max Drawdown', '0.00%', 'var(--color-text1)'],
                ['Weekly Win Rate (12w)', `${winRate}%`, 'var(--color-text1)'],
                ['Avg. Cash Position', 'US$0.00', 'var(--color-text1)'],
                ['Avg. Leverage', '0.00x', 'var(--color-text1)'],
                ['Cross-margin Ratio', '0.00%', 'var(--color-text1)'],
                ['Cross-account Position', '0.00 USDC', 'var(--color-text1)'],
              ].map(([label, value, color]) => (
                <div key={label} className="overview-item">
                  <span className="overview-label">{label}</span>
                  <span className="overview-value font-mono" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: CHART */}
          <div className="chart-panel">
            <div className="chart-header">
              <div>
                <div style={{ color:'var(--color-text2)', fontSize:13, marginBottom:4 }}>Profit/Loss</div>
                <div className="font-mono" style={{ fontSize:20, fontWeight:600 }}>US${totalPnl.toFixed(2)}</div>
              </div>
              <div className="chart-controls">
                <div className="control-group">
                  <button className={`control-btn ${chartMetric==='PnL'?'active':''}`} onClick={()=>setChartMetric('PnL')}>PnL</button>
                  <button className={`control-btn ${chartMetric==='Portfolio Val.'?'active':''}`} onClick={()=>setChartMetric('Portfolio Val.')}>Portfolio Val.</button>
                </div>
                <div className="control-group">
                  {['24h','7d','30d','90d','All'].map(tf => (
                    <button key={tf} className={`control-btn ${chartTimeframe===tf?'active':''}`} onClick={()=>setChartTimeframe(tf)}>{tf}</button>
                  ))}
                </div>
              </div>
            </div>
            <div ref={chartRef} className="chart-container" />
          </div>
        </div>
      </div>

      {/* MOBILE ACCOUNT OVERVIEW (Hidden on Desktop) */}
      <div className="portfolio-mobile-only mobile-account-overview-card">
        <div className="mobile-overview-row"><span className="label">Equity</span><span className="value">${equity.toFixed(2)}</span></div>
        <div className="mobile-overview-row"><span className="label">Balance</span><span className="value">${balance.toFixed(2)}</span></div>
        <div className="mobile-overview-row"><span className="label">PnL (Unrealized)</span><span className={`value ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>${totalPnl.toFixed(2)}</span></div>
        <div className="mobile-overview-row"><span className="label">Funding Cost (Unrealized)</span><span className="value">$0.00</span></div>
        <div className="mobile-overview-row"><span className="label">Cross-margin Ratio</span><span className="value">0.0000%</span></div>
        <div className="mobile-overview-row"><span className="label">Maintenance Margin</span><span className="value">$0.00</span></div>
      </div>

      {/* BOTTOM SECTION: TABS & TABLES */}
      <div className="portfolio-bottom">
        <Positions />
      </div>

      <style>{`
        .portfolio-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
          min-height: calc(100vh - 60px);
          background: var(--color-bg0);
          color: var(--color-text1);
          box-sizing: border-box;
          min-width: 0;
        }
        .portfolio-header {
          margin-bottom: 32px;
        }

        /* Stats Grid */
        .portfolio-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          padding: 20px;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          background: var(--color-bg1);
        }
        .stat-label {
          color: var(--color-text2);
          font-size: 13px;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 600;
        }

        /* Mid Section Grid */
        .portfolio-mid-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        /* Overview Panel */
        .overview-panel {
          border: 1px solid var(--color-border);
          border-radius: 8px;
          background: var(--color-bg1);
          display: flex;
          flex-direction: column;
        }
        .panel-header {
          padding: 16px 20px;
          font-size: 15px;
          font-weight: 600;
          border-bottom: 1px solid var(--color-border);
        }
        .overview-list {
          display: flex;
          flex-direction: column;
          padding: 12px 20px;
          gap: 12px;
        }
        .overview-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }
        .overview-label {
          color: var(--color-text2);
          border-bottom: 1px dashed rgba(255,255,255,0.2);
          padding-bottom: 2px;
          cursor: help;
        }
        .overview-value {
          font-weight: 500;
        }

        /* Chart Panel */
        .chart-panel {
          border: 1px solid var(--color-border);
          border-radius: 8px;
          background: var(--color-bg1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .chart-header {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid var(--color-border);
        }
        .chart-controls {
          display: flex;
          gap: 16px;
        }
        .control-group {
          display: flex;
          background: var(--color-bg0);
          border-radius: 6px;
          padding: 2px;
          border: 1px solid var(--color-border);
        }
        .control-btn {
          background: transparent;
          border: none;
          color: var(--color-text3);
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .control-btn.active {
          background: var(--color-bg2);
          color: var(--color-text1);
        }
        .chart-container {
          flex: 1;
          height: 280px;
          padding-top: 16px;
        }

        .portfolio-bottom {
          border: 1px solid var(--color-border);
          border-radius: 8px;
          background: var(--color-bg1);
          overflow: hidden;
        }
        .portfolio-bottom .positions-container {
          border-top: none;
          background: transparent;
        }

        .portfolio-mobile-only {
          display: none;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .portfolio-mid-grid {
            grid-template-columns: 250px 1fr;
          }
        }
        @media (max-width: 768px) {
          .portfolio-desktop-only {
            display: none !important;
          }
          .portfolio-mobile-only {
            display: block;
          }
          .portfolio-container {
            padding: 16px 0;
            overflow-x: hidden;
            padding-bottom: 0;
          }
          .mobile-account-overview-card {
            background: var(--color-bg1);
            border: 1px solid var(--color-border);
            border-radius: 8px;
            padding: 16px;
            margin: 0 16px 20px 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .mobile-overview-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
          }
          .mobile-overview-row .label {
            color: var(--color-text2);
          }
          .mobile-overview-row .value {
            color: var(--color-text1);
            font-family: 'JetBrains Mono', monospace;
          }
          /* Retain default portfolio-bottom card styles (border and bg1) on mobile */
        }

        @media (max-width: 480px) {
          .portfolio-stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

