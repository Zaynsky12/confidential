import { useState, useRef, useEffect, useMemo } from 'react'
import { createChart, ColorType, AreaSeries } from 'lightweight-charts'
import type { IChartApi, Time } from 'lightweight-charts'
import { useTradeStore } from '../store/useTradeStore'
import { useArcWallet } from '../hooks/useArcWallet'


export default function Vault() {
  const { vaultBalance, vaultTVL, vaultAPY, vaultDeposits, depositToVault, withdrawFromVault, setWalletModalOpen } = useTradeStore()
  const { isConnected, balance } = useArcWallet()
  const [activeAction, setActiveAction] = useState<'Deposit' | 'Withdraw'>('Deposit')
  const [amt, setAmt] = useState('')
  const [activeTab, setActiveTab] = useState('Activity')
  
  const chartRef = useRef<HTMLDivElement>(null)
  const chartApiRef = useRef<IChartApi | null>(null)
  const [chartTimeframe, setChartTimeframe] = useState('30d')

  const tabs = ['Activity', 'Positions', 'Trade History', 'Funding History']

  const handleAction = () => {
    if (!isConnected) { setWalletModalOpen(true); return }
    const amount = Number(amt)
    if (activeAction === 'Deposit' && amount > 0 && amount <= balance) {
      depositToVault(amount)
      setAmt('')
    } else if (activeAction === 'Withdraw' && amount > 0 && amount <= vaultBalance) {
      withdrawFromVault(amount)
      setAmt('')
    }
  }

  const formatTime = (ts: number) => new Date(ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})

  // Mock 30-day Vault TVL data
  const tvlData = useMemo(()=>{
    const data = []
    const now = Math.floor(Date.now()/1000)
    let currentTVL = vaultTVL * 0.8 // start lower
    for(let i=29;i>=0;i--){
      currentTVL += (Math.random()-0.3)*100000 // generally goes up
      data.push({ time: (now - i*86400) as Time, value: +currentTVL.toFixed(2) })
    }
    // ensure last is current
    data[data.length-1].value = vaultTVL
    return data
  },[vaultTVL])

  useEffect(()=>{
    if(!chartRef.current) return
    const chart = createChart(chartRef.current,{
      layout:{ background:{type:ColorType.Solid,color:'transparent'}, textColor:'#848e9c', fontFamily:"'Inter', sans-serif", fontSize:11 },
      grid:{ vertLines:{color:'rgba(255,255,255,0.03)'}, horzLines:{color:'rgba(255,255,255,0.03)'} },
      rightPriceScale:{ borderColor:'rgba(255,255,255,0.06)' },
      timeScale:{ borderColor:'rgba(255,255,255,0.06)' },
      width: chartRef.current.clientWidth, height:320,
    })
    const series = chart.addSeries(AreaSeries, {
      topColor:'rgba(255,255,255,0.15)', bottomColor:'rgba(255,255,255,0.0)', lineColor:'#ffffff', lineWidth:2,
    })
    series.setData(tvlData)
    chart.timeScale().fitContent()
    chartApiRef.current = chart
    const ro = new ResizeObserver(entries=>{
      for(const e of entries) chart.applyOptions({width:e.contentRect.width})
    })
    ro.observe(chartRef.current)
    return ()=>{ ro.disconnect(); chart.remove() }
  },[tvlData])

  return (
    <div className="vault-container">

      <div className="vault-header">
        <h1 style={{ fontSize:32,fontWeight:600,letterSpacing:'-0.02em',margin:0 }}>USDC Yield Vault</h1>
        <div style={{ display:'flex', gap:12, marginTop:12 }}>
          <span className="badge badge-green" style={{ fontSize:13,padding:'4px 12px' }}>{vaultAPY}% APY</span>
          <span className="badge" style={{ fontSize:13,padding:'4px 12px' }}>Protocol Vault</span>
        </div>
        
        {/* Mobile Key Stats Card */}
        <div className="mobile-only" style={{ marginTop: 24, padding: '16px', background: 'var(--color-bg1)', borderRadius: '8px', border: '1px solid var(--color-border)', justifyContent: 'space-between' }}>
           <div>
             <div style={{ color: 'var(--color-text2)', fontSize: 13, marginBottom: 4 }}>Vault TVL</div>
             <div className="font-mono" style={{ fontSize: 20, fontWeight: 600 }}>US${(vaultTVL / 1e6).toFixed(2)}M</div>
           </div>
           <div style={{ textAlign: 'right' }}>
             <div style={{ color: 'var(--color-text2)', fontSize: 13, marginBottom: 4 }}>Lockup Period</div>
             <div className="font-mono" style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text1)' }}>3 Days</div>
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="vault-main-grid">
        
        {/* LEFT COLUMN */}
        <div className="vault-left desktop-only">
          {/* Chart Panel */}
          <div className="chart-panel">
            <div className="chart-header">
              <div>
                <div style={{ color:'var(--color-text2)', fontSize:13, marginBottom:4 }}>Vault TVL</div>
                <div className="font-mono" style={{ fontSize:24, fontWeight:600 }}>US${(vaultTVL).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
              </div>
              <div className="chart-controls">
                <div className="control-group">
                  {['24h','7d','30d','90d','All'].map(tf => (
                    <button key={tf} className={`control-btn ${chartTimeframe===tf?'active':''}`} onClick={()=>setChartTimeframe(tf)}>{tf}</button>
                  ))}
                </div>
              </div>
            </div>
            <div ref={chartRef} className="chart-container" />
          </div>

          {/* Overview Panel */}
          <div className="overview-panel" style={{ marginTop: 24 }}>
            <div className="panel-header">Performance Metrics</div>
            <div className="overview-list-grid">
              {[
                ['TVL', `US$${(vaultTVL/1e6).toFixed(2)}M`, 'var(--color-text1)'],
                ['APR (7-day)', `${vaultAPY}%`, 'var(--color-green)'],
                ['All Time Return', '+14.2%', 'var(--color-green)'],
                ['Max Drawdown', '-2.14%', 'var(--color-text1)'],
                ['Sharpe Ratio', '2.84', 'var(--color-text1)'],
                ['Weekly Win Rate', '88.5%', 'var(--color-text1)'],
                ['Management Fee', '0.00%', 'var(--color-text1)'],
                ['Performance Fee', '10.00%', 'var(--color-text1)'],
                ['Lockup Period', '3 Days', 'var(--color-text1)'],
                ['Your Deposit', `US$${vaultBalance.toFixed(2)}`, 'var(--color-accent)'],
              ].map(([label, value, color]) => (
                <div key={label} className="overview-item">
                  <span className="overview-label">{label}</span>
                  <span className="overview-value font-mono" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (ACTION CARD) */}
        <div className="vault-right">
          <div className="action-card sticky-card">
            <div style={{ display: 'flex', background: 'var(--color-bg0)', borderRadius: 8, padding: 4, margin: '20px 20px 0', border: '1px solid var(--color-border)' }}>
              <button 
                onClick={()=>{setActiveAction('Deposit'); setAmt('')}}
                style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: 'none', background: activeAction === 'Deposit' ? 'var(--color-accent)' : 'transparent', color: activeAction === 'Deposit' ? '#fff' : 'var(--color-text3)', fontWeight: 600, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Deposit
              </button>
              <button 
                onClick={()=>{setActiveAction('Withdraw'); setAmt('')}}
                style={{ flex: 1, padding: '10px 0', borderRadius: 6, border: 'none', background: activeAction === 'Withdraw' ? 'var(--color-bg3)' : 'transparent', color: activeAction === 'Withdraw' ? '#fff' : 'var(--color-text3)', fontWeight: 600, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Withdraw
              </button>
            </div>
            
            <div className="action-body">
              {activeAction === 'Deposit' && (
                <div className="warning-banner">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                  <span>Funds are locked for 3 days after deposit to prevent front-running.</span>
                </div>
              )}

              <div className="input-group">
                <div className="input-header">
                  <span style={{ color:'var(--color-text2)', fontSize:13 }}>Amount</span>
                  <span style={{ color:'var(--color-text3)', fontSize:13 }}>
                    {activeAction === 'Deposit' ? 'Wallet:' : 'Vault:'} <span className="font-mono text-white">{activeAction==='Deposit'?balance.toFixed(2):vaultBalance.toFixed(2)} USDC</span>
                  </span>
                </div>
                <div className="input-box">
                  <input type="number" placeholder="0.00" value={amt} onChange={e=>setAmt(e.target.value)} className="font-mono" />
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button className="max-btn" onClick={()=>setAmt(activeAction==='Deposit'?String(balance):String(vaultBalance))}>MAX</button>
                    <span style={{ fontWeight:600, fontSize:14 }}>USDC</span>
                  </div>
                </div>
              </div>

              {activeAction === 'Deposit' && Number(amt) > 0 && (
                <div className="est-yield">
                  <span>Est. Annual Yield</span>
                  <span className="font-mono text-green">+US${(Number(amt)*(vaultAPY/100)).toFixed(2)}</span>
                </div>
              )}

              <button className="submit-btn" onClick={handleAction}>
                {!isConnected ? 'Connect Wallet' : activeAction}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM TABS */}
      <div className="vault-bottom">
        <div className="tab-scroll-container">
          <div className="tabs-row">
            {tabs.map(tab => (
              <button key={tab} className={`pt-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        
        <div className="tab-content">
          {activeTab === 'Activity' ? (
            <div style={{ overflowX:'auto' }}>
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Amount</th>
                    <th>Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {vaultDeposits.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign:'center', padding:'40px 0', color:'var(--color-text3)' }}>No activity yet</td></tr>
                  ) : vaultDeposits.map(d=>(
                    <tr key={d.id}>
                      <td style={{ color:'var(--color-text2)' }}>{formatTime(d.timestamp)}</td>
                      <td><span className={d.action==='deposit'?'badge badge-green':'badge badge-red'} style={{ fontSize:10,padding:'2px 8px' }}>{d.action.toUpperCase()}</span></td>
                      <td className="font-mono">{d.amount.toFixed(2)} USDC</td>
                      <td className="font-mono text-accent">{d.txHash.slice(0,8)}...{d.txHash.slice(-6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div style={{ color: 'var(--color-text3)', fontSize:14 }}>No data yet</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .vault-container {
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
        .vault-breadcrumbs {
          font-size: 13px;
          margin-bottom: 24px;
        }
        .vault-header {
          margin-bottom: 40px;
        }

        /* Main Grid */
        .vault-main-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          margin-bottom: 32px;
          align-items: start;
        }

        .mobile-only {
          display: none !important;
        }

        /* Chart Panel */
        .chart-panel {
          border: 1px solid var(--color-border);
          border-radius: 8px;
          background: var(--color-bg1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }
        .chart-header {
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid var(--color-border);
        }
        .chart-controls {
          display: flex;
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
          height: 320px;
          padding-top: 16px;
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
          padding: 16px 24px;
          font-size: 16px;
          font-weight: 600;
          border-bottom: 1px solid var(--color-border);
        }
        .overview-list-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px 32px;
          padding: 20px 24px;
        }
        .overview-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }
        .overview-label {
          color: var(--color-text2);
          border-bottom: 1px dashed rgba(255,255,255,0.2);
          padding-bottom: 2px;
        }

        /* Right Column Action Card */
        .sticky-card {
          position: sticky;
          top: 84px; /* 60px topbar + 24px padding */
        }
        .action-card {
          border: 1px solid var(--color-border);
          border-radius: 8px;
          background: var(--color-bg1);
          overflow: hidden;
        }
        .action-body {
          padding: 20px;
        }
        .warning-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: rgba(240, 185, 11, 0.1);
          border: 1px solid rgba(240, 185, 11, 0.2);
          color: #f0b90b;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 13px;
          line-height: 1.4;
          margin-bottom: 24px;
        }
        .warning-banner svg {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .input-group {
          margin-bottom: 24px;
        }
        .input-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          flex-wrap: wrap;
          gap: 4px;
        }
        .input-box {
          display: flex;
          align-items: center;
          background: var(--color-bg0);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          padding: 12px 16px;
          transition: border-color 0.2s;
        }
        .input-box:focus-within {
          border-color: var(--color-text2);
        }
        .input-box input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--color-text1);
          font-size: 20px;
          outline: none;
          min-width: 0;
          width: 100%;
        }
        .max-btn {
          background: var(--color-bg2);
          border: none;
          color: var(--color-accent);
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .est-yield {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--color-text2);
          margin-bottom: 24px;
          padding-top: 16px;
          border-top: 1px dashed var(--color-border);
          flex-wrap: wrap;
          gap: 4px;
        }
        .submit-btn {
          width: 100%;
          background: var(--color-text1);
          color: var(--color-bg0);
          border: none;
          border-radius: 12px;
          padding: 16px 0;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .submit-btn:hover {
          opacity: 0.9;
        }

        /* Bottom Section */
        .vault-bottom {
          border: 1px solid var(--color-border);
          border-radius: 8px;
          background: var(--color-bg1);
          overflow: hidden;
        }
        .tab-scroll-container {
          overflow-x: auto;
          scrollbar-width: none;
          border-bottom: 1px solid var(--color-border);
        }
        .tab-scroll-container::-webkit-scrollbar {
          display: none;
        }
        .tabs-row {
          display: flex;
          padding: 0 16px;
          gap: 24px;
        }
        .pt-tab {
          background: transparent;
          border: none;
          color: var(--color-text3);
          font-size: 14px;
          font-weight: 500;
          padding: 16px 0;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .pt-tab:hover {
          color: var(--color-text2);
        }
        .pt-tab.active {
          color: var(--color-text1);
          border-bottom-color: #ffffff;
        }
        .tab-content {
          min-height: 200px;
        }
        .empty-state {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
        }
        .portfolio-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .portfolio-table th {
          text-align: left;
          padding: 14px 24px;
          color: var(--color-text3);
          font-weight: 500;
          border-bottom: 1px solid var(--color-border);
          white-space: nowrap;
        }
        .portfolio-table td {
          padding: 14px 24px;
          border-bottom: 1px solid var(--color-border);
          white-space: nowrap;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .vault-main-grid {
            grid-template-columns: 1fr;
          }
          .sticky-card {
            position: static;
          }
        }
        @media (max-width: 768px) {
          .vault-main-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
            width: 100%;
          }
          .action-card {
            width: 100%;
            border-left: none;
            border-right: none;
            border-radius: 0;
          }
          .action-body {
            padding: 16px;
          }
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: flex !important;
          }
          .vault-container {
            padding: 16px;
            overflow-x: hidden;
            padding-bottom: 100px;
          }
          .vault-header h1 {
            font-size: 24px !important;
          }
          .chart-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          .chart-controls {
            width: 100%;
          }
          .control-group {
            width: 100%;
            overflow-x: auto;
          }
          .control-btn {
            flex: 1;
            white-space: nowrap;
            text-align: center;
          }
          .overview-list-grid {
            grid-template-columns: 1fr;
          }
          .tabs-row {
            gap: 16px;
            padding: 0 12px;
          }
          .pt-tab {
            font-size: 13px;
            padding: 12px 0;
          }
        }
      `}</style>
    </div>
  )
}

