import { useEffect, useRef, useMemo } from 'react'
import { createChart, ColorType, AreaSeries } from 'lightweight-charts'
import type { IChartApi, Time } from 'lightweight-charts'
import { useTradeStore } from '../store/useTradeStore'
import { useArcWallet } from '../hooks/useArcWallet'

export default function Portfolio() {
  const { positions } = useTradeStore()
  const { isConnected, truncatedAddress, balance } = useArcWallet()
  const chartRef = useRef<HTMLDivElement>(null)
  const chartApiRef = useRef<IChartApi | null>(null)

  const openPos = positions.filter(p=>p.status==='open')

  const totalPnl = positions.reduce((s,p)=>s+p.pnl,0)
  const wins = positions.filter(p=>p.pnl>0).length
  const winRate = positions.length?((wins/positions.length)*100).toFixed(1):'0.0'
  const totalVol = positions.reduce((s,p)=>s+p.entryPrice*p.size,0)
  const bestTrade = positions.length? Math.max(...positions.map(p=>p.pnl)):0
  const equity = balance + positions.filter(p=>p.status==='open').reduce((s,p)=>s+p.collateral+p.pnl,0)

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
      layout:{ background:{type:ColorType.Solid,color:'#0d1424'}, textColor:'#8899b0', fontFamily:"'IBM Plex Mono',monospace", fontSize:11 },
      grid:{ vertLines:{color:'rgba(255,255,255,0.03)'}, horzLines:{color:'rgba(255,255,255,0.03)'} },
      rightPriceScale:{ borderColor:'rgba(255,255,255,0.06)' },
      timeScale:{ borderColor:'rgba(255,255,255,0.06)' },
      width: chartRef.current.clientWidth, height:250,
    })
    const series = chart.addSeries(AreaSeries, {
      topColor:'rgba(0,82,255,0.3)', bottomColor:'rgba(0,82,255,0.02)', lineColor:'#0052FF', lineWidth:2,
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

  const usedCollateral = openPos.reduce((s,p)=>s+p.collateral,0)
  const availableCollateral = balance
  const healthPct = usedCollateral+availableCollateral>0 ? (usedCollateral/(usedCollateral+availableCollateral))*100 : 0

  return (
    <div className="portfolio-container">
      <div className="portfolio-header">
        <div>
          <h1 style={{ fontSize:28,fontWeight:600,letterSpacing:'-0.02em',marginBottom:4 }}>Portfolio</h1>
          {isConnected && <span className="font-mono" style={{ fontSize:13,color:'var(--color-text3)' }}>{truncatedAddress}</span>}
        </div>
        <div style={{ textAlign:'right' }}>
          <div className="label" style={{ marginBottom:4 }}>Total Equity</div>
          <div className="font-mono" style={{ fontSize:24,fontWeight:600 }}>{equity.toFixed(2)} USDC</div>
        </div>
      </div>

      {/* PnL Chart */}
      <div className="panel" style={{ marginBottom:24,overflow:'hidden' }}>
        <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--color-border)',fontWeight:600,fontSize:14 }}>PnL (30 Days)</div>
        <div ref={chartRef} style={{ height:250 }} />
      </div>

      {/* Stats */}
      <div className="portfolio-stats">
        {[
          ['Total PnL',`${totalPnl>=0?'+':''}${totalPnl.toFixed(2)} USDC`,totalPnl>=0],
          ['Win Rate',`${winRate}%`,true],
          ['Total Volume',`${totalVol.toFixed(2)} USDC`,true],
          ['Best Trade',`+${bestTrade.toFixed(2)} USDC`,true],
        ].map(([label,value,positive])=>(
          <div key={label as string} className="panel" style={{ padding:16,textAlign:'center' }}>
            <div className="label" style={{ marginBottom:8 }}>{label}</div>
            <div className="font-mono" style={{ fontSize:16,fontWeight:600,color:positive?'var(--color-green)':'var(--color-red)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Collateral Health */}
      <div className="panel" style={{ padding:20,marginBottom:24 }}>
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
          <span style={{ fontSize:13,fontWeight:500 }}>Collateral Health</span>
          <span className="font-mono" style={{ fontSize:12,color:'var(--color-text2)' }}>{usedCollateral.toFixed(2)} / {(usedCollateral+availableCollateral).toFixed(2)} USDC</span>
        </div>
        <div style={{ height:8,background:'var(--color-bg2)',borderRadius:4,overflow:'hidden' }}>
          <div style={{ height:'100%',width:`${healthPct}%`,borderRadius:4,transition:'width 300ms',
            background: healthPct>80?'var(--color-red)':healthPct>50?'#f0b90b':'var(--color-green)' }} />
        </div>
      </div>

      {/* Positions table */}
      <div className="panel" style={{ overflow:'hidden' }}>
        <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--color-border)',fontWeight:600,fontSize:14 }}>Positions</div>
        {positions.length===0 ? (
          <div style={{ padding:40,textAlign:'center',color:'var(--color-text3)',fontSize:13 }}>No positions yet</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--color-border)' }}>
                  {['Market','Side','Size','Entry','Mark','PnL','Leverage','Status'].map(h=>(
                    <th key={h} className="label" style={{ padding:'8px 12px',textAlign:'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map(p=>(
                  <tr key={p.id} style={{ borderBottom:'1px solid var(--color-border)' }}>
                    <td style={{ padding:'8px 12px',fontWeight:500 }}>{p.pair}</td>
                    <td style={{ padding:'8px 12px' }}><span className={p.side==='long'?'badge badge-green':'badge badge-red'} style={{ fontSize:9,padding:'1px 6px' }}>{p.side.toUpperCase()}</span></td>
                    <td className="font-mono" style={{ padding:'8px 12px' }}>{p.size.toFixed(4)}</td>
                    <td className="font-mono" style={{ padding:'8px 12px' }}>{p.entryPrice.toFixed(2)}</td>
                    <td className="font-mono" style={{ padding:'8px 12px' }}>{p.markPrice.toFixed(2)}</td>
                    <td className={`font-mono ${p.pnl>=0?'text-green':'text-red'}`} style={{ padding:'8px 12px',fontWeight:500 }}>{p.pnl>=0?'+':''}{p.pnl.toFixed(2)}</td>
                    <td className="font-mono" style={{ padding:'8px 12px' }}>{p.leverage}x</td>
                    <td style={{ padding:'8px 12px' }}><span className="badge" style={{ fontSize:9,padding:'1px 6px' }}>{p.status.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .portfolio-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 24px;
        }
        .portfolio-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }
        .portfolio-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .portfolio-container {
            padding: 20px 14px;
          }
          .portfolio-container h1 {
            font-size: 22px !important;
          }
          .portfolio-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .portfolio-header > div:last-child {
            text-align: left;
          }
          .portfolio-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  )
}
