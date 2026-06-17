import { useState, useRef, useEffect, useMemo } from 'react'
import { createChart, ColorType, AreaSeries } from 'lightweight-charts'
import type { IChartApi, Time } from 'lightweight-charts'
import { useArcWallet } from '../hooks/useArcWallet'
import { useConfidentialVault } from '../hooks/useConfidentialVault'
import { useVaultHistory } from '../hooks/useGoldsky'
import { CONTRACTS } from '../config/contracts'

export default function Vault() {
  const { isConnected, balance, connect, isWrongNetwork, address } = useArcWallet()
  const { deposit, withdraw, tvlUsd, userCVault, userCVaultShares, canWithdraw, isPending, sharePrice, utilization, availableLiquidity } = useConfidentialVault()
  const { deposits: vaultDeposits, isLoading: isHistoryLoading } = useVaultHistory(address || undefined)
  const { deposits: globalDeposits } = useVaultHistory() // For global TVL chart

  const [activeAction, setActiveAction] = useState<'Deposit' | 'Withdraw'>('Deposit')
  const [amt, setAmt] = useState('')
  const [activeTab, setActiveTab] = useState('Vault Performance')
  
  const chartRef = useRef<HTMLDivElement>(null)
  const chartApiRef = useRef<IChartApi | null>(null)
  const [chartTimeframe, setChartTimeframe] = useState('30d')

  const tabs = ['Vault Performance', 'Your Activity']

  const handleAction = async () => {
    if (!isConnected || isWrongNetwork) { connect(); return }
    const amount = Number(amt)
    if (!amount || amount <= 0) return

    try {
      if (activeAction === 'Deposit') {
        await deposit(amount)
      } else {
        await withdraw(amount)
      }
      setAmt('')
    } catch (e) {
      console.error(e)
    }
  }

  const formatTime = (ts: number) => new Date(ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})

  const vaultVolume = useMemo(() => {
    if (!globalDeposits) return 0
    return globalDeposits.reduce((acc, d) => acc + d.amount, 0)
  }, [globalDeposits])

  // Calculate personal net deposits and earnings
  const { estEarnings } = useMemo(() => {
    if (!vaultDeposits || vaultDeposits.length === 0) return { netDeposits: 0, estEarnings: 0 }
    let net = 0
    for (const d of vaultDeposits) {
      if (d.action === 'deposit') net += d.amount
      else net -= d.amount
    }
    const est = userCVault > 0 ? userCVault - net : 0
    return { netDeposits: net, estEarnings: est }
  }, [vaultDeposits, userCVault])

  // Real Vault TVL data for chart
  const tvlData = useMemo(() => {
    if (!globalDeposits || globalDeposits.length === 0) {
      const now = Math.floor(Date.now() / 1000)
      return [
        { time: (now - 86400) as Time, value: 0 },
        { time: now as Time, value: 0 }
      ]
    }

    const sorted = [...globalDeposits].sort((a, b) => a.timestamp - b.timestamp)
    let currentTVL = 0
    const data = []
    
    data.push({ time: ((sorted[0].timestamp / 1000) - 86400) as Time, value: 0 })

    for (const d of sorted) {
      if (d.action === 'deposit') {
        currentTVL += d.amount
      } else {
        currentTVL -= d.amount
      }
      data.push({ time: (d.timestamp / 1000) as Time, value: +currentTVL.toFixed(2) })
    }

    if (tvlUsd > currentTVL) {
      data.push({ time: Math.floor(Date.now() / 1000) as Time, value: +tvlUsd.toFixed(2) })
    }

    return data
  }, [globalDeposits, tvlUsd])

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
    series.setData(tvlData)
    chart.timeScale().fitContent()
    chartApiRef.current = chart
    const ro = new ResizeObserver(entries=>{
      for(const e of entries) chart.applyOptions({width:e.contentRect.width})
    })
    ro.observe(chartRef.current)
    return ()=>{ ro.disconnect(); chart.remove() }
  },[tvlData, activeTab]) // Add activeTab to remount chart when tab switches

  useEffect(() => {
    if (!chartApiRef.current || !tvlData.length) return
    const chart = chartApiRef.current
    const now = Math.floor(Date.now() / 1000)
    let fromTime = 0
    if (chartTimeframe === '24h') fromTime = now - 86400
    else if (chartTimeframe === '7d') fromTime = now - 7 * 86400
    else if (chartTimeframe === '30d') fromTime = now - 30 * 86400
    else if (chartTimeframe === '90d') fromTime = now - 90 * 86400

    if (fromTime === 0) {
      chart.timeScale().fitContent()
    } else {
      chart.timeScale().setVisibleRange({ from: fromTime as Time, to: now as Time })
    }
  }, [chartTimeframe, tvlData])

  return (
    <div className="vault-container">
      {/* 1. VAULT HEADER STATS */}
      <div className="vault-stats-grid">
        <div className="stat-card">
          <div className="stat-label">Vault TVL</div>
          <div className="stat-value font-mono">US${tvlUsd >= 1e6 ? (tvlUsd / 1e6).toFixed(2) + 'M' : tvlUsd.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Vault Volume</div>
          <div className="stat-value font-mono">US${vaultVolume >= 1e6 ? (vaultVolume / 1e6).toFixed(2) + 'M' : vaultVolume.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
        </div>
      </div>

      {/* 2. DECIBEL-STYLE TABS */}
      <div className="decibel-tabs">
        <div className="tabs-row">
          {tabs.map(tab => (
            <button key={tab} className={`pt-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN GRID */}
      <div className="vault-main-grid">
        
        {/* LEFT COLUMN */}
        <div className="vault-left">
          
          {activeTab === 'Vault Performance' ? (
            <div className="decibel-performance-layout">
              {/* Left: Metrics List */}
              <div className="dp-metrics">
                <div className="dp-metrics-header">
                  <h2>Vault Performance</h2>
                </div>
                <div className="dp-list">
                  <div className="dp-item"><span className="dp-label">TVL</span><span className="dp-value">US${tvlUsd >= 1e6 ? (tvlUsd / 1e6).toFixed(2) + 'M' : tvlUsd.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
                  <div className="dp-item"><span className="dp-label">cUSDC Price</span><span className="dp-value font-mono">US${sharePrice?.toLocaleString(undefined, {minimumFractionDigits:4, maximumFractionDigits:4}) || '1.0000'}</span></div>
                  <div className="dp-item"><span className="dp-label">Vault Utilization</span><span className="dp-value font-mono">{(utilization || 0).toFixed(2)}%</span></div>
                  <div className="dp-item"><span className="dp-label">Available Liquidity</span><span className="dp-value font-mono">US${availableLiquidity >= 1e6 ? (availableLiquidity / 1e6).toFixed(2) + 'M' : (availableLiquidity || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
                  <div className="dp-item"><span className="dp-label">All Time Return</span><span className={`dp-value ${sharePrice >= 1 ? 'text-green' : 'text-red'}`}>{(sharePrice >= 1 ? '+' : '')}{((sharePrice - 1) * 100).toFixed(2)}%</span></div>
                  <div className="dp-item"><span className="dp-label">Vault Volume</span><span className="dp-value">US${vaultVolume >= 1e6 ? (vaultVolume / 1e6).toFixed(2) + 'M' : vaultVolume.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>

                  <div className="dp-item"><span className="dp-label">Lockup Period</span><span className="dp-value">7 Days</span></div>
                  <div className="dp-item">
                    <span className="dp-label">Vault Manager</span>
                    <span className="dp-value font-mono text-accent" style={{ fontSize: 13 }}>
                      <a href={`https://explorer.arc.network/address/${CONTRACTS.VAULT}`} target="_blank" rel="noreferrer" style={{color:'inherit',textDecoration:'none', display:'flex', alignItems:'center', gap:'4px'}}>
                        {CONTRACTS.VAULT.slice(0, 6)}...{CONTRACTS.VAULT.slice(-4)}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      </a>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Right: Chart Area */}
              <div className="dp-chart-area">
                <div className="dp-chart-header">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--color-text2)', fontSize: 14, marginBottom: 4 }}>Vault TVL</span>
                    <span className="font-mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text1)' }}>
                      US${(tvlUsd).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                    </span>
                  </div>
                  <div className="chart-controls">
                    <div className="control-group">
                      {['24h','7d','30d','90d','All'].map(tf => (
                        <button key={tf} className={`control-btn ${chartTimeframe===tf?'active':''}`} onClick={()=>setChartTimeframe(tf)}>{tf}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div ref={chartRef} className="chart-container" style={{ flex: 1, minHeight: 280 }} />
              </div>
            </div>
          ) : activeTab === 'Your Activity' ? (
            <div className="vault-activity-container">
              {/* Personal Stats Grid */}
              <div className="personal-stats-grid">
                <div className="p-stat-card">
                  <div className="p-stat-label">Available</div>
                  <div className="p-stat-value font-mono">
                    {canWithdraw ? userCVaultShares.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) : '0.00'} <span className="p-stat-symbol">cUSDC</span>
                  </div>
                </div>
                <div className="p-stat-card">
                  <div className="p-stat-label">Locked</div>
                  <div className="p-stat-value font-mono">
                    {!canWithdraw ? userCVaultShares.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) : '0.00'} <span className="p-stat-symbol">cUSDC</span>
                  </div>
                </div>
                <div className="p-stat-card">
                  <div className="p-stat-label">Total Value</div>
                  <div className="p-stat-value font-mono">
                    {userCVault.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} <span className="p-stat-symbol">USDC</span>
                  </div>
                </div>
                <div className="p-stat-card">
                  <div className="p-stat-label">Est. Earnings</div>
                  <div className={`p-stat-value font-mono ${estEarnings > 0 ? 'text-green' : estEarnings < 0 ? 'text-red' : ''}`}>
                    {estEarnings > 0 ? '+' : ''}{estEarnings.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} <span className="p-stat-symbol">USDC</span>
                  </div>
                </div>
              </div>

              <div className="vault-panel-box mt-4">
                <div style={{ overflowX:'auto' }}>
                <table className="portfolio-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Action</th>
                      <th>USDC Amount</th>
                      <th>cUSDC Shares</th>
                      <th>Tx Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isHistoryLoading ? (
                      <tr><td colSpan={5} style={{ textAlign:'center', padding:'40px 0', color:'var(--color-text3)' }}>Loading from Goldsky...</td></tr>
                    ) : vaultDeposits.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign:'center', padding:'40px 0', color:'var(--color-text3)' }}>No activity yet</td></tr>
                    ) : vaultDeposits.map(d=>(
                      <tr key={d.id}>
                        <td style={{ color:'var(--color-text2)' }}>{formatTime(d.timestamp)}</td>
                        <td><span className={d.action==='deposit'?'badge badge-green':'badge badge-red'} style={{ fontSize:10,padding:'2px 8px' }}>{d.action.toUpperCase()}</span></td>
                        <td className="font-mono">{d.amount.toFixed(2)} USDC</td>
                        <td className="font-mono">{d.shares?.toFixed(2) || '0.00'} cUSDC</td>
                        <td className="font-mono text-accent">
                          <a href={`https://explorer.arc.network/tx/${d.txHash}`} target="_blank" rel="noreferrer" style={{color:'inherit',textDecoration:'none'}}>View Tx</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          ) : null}
        </div>

        {/* RIGHT COLUMN (ACTION CARD) */}
        <div className="vault-right">
          <div className="action-card sticky-card">
            <div className="action-tabs-container">
              <button 
                className={`action-tab-btn ${activeAction === 'Deposit' ? 'active' : ''}`}
                onClick={()=>{setActiveAction('Deposit'); setAmt('')}}
              >
                Deposit
              </button>
              <button 
                className={`action-tab-btn ${activeAction === 'Withdraw' ? 'active' : ''}`}
                onClick={()=>{setActiveAction('Withdraw'); setAmt('')}}
              >
                Withdraw
              </button>
            </div>
            
            <div className="action-body">
              <div className="decibel-disclaimer">
                {activeAction === 'Deposit' ? (
                  <>Deposit USDC to receive cUSDC, an ERC-20 token representing your share of the vault. Liquidity providers earn fees from every trade placed on the platform as a reward for serving as the counterparty. The cUSDC token automatically accumulates these fees in real-time.</>
                ) : (
                  <>
                    <strong style={{ color: 'var(--color-text1)', marginBottom: '8px', display: 'block' }}>Withdrawals</strong>
                    To ensure the stability of the vault and protect against front-running attacks, all deposits are subject to a 7-day lockup period.<br/><br/>
                    Once your 7-day lockup period has expired, your cUSDC becomes "Available" and you can withdraw it for USDC at any time based on the current exchange rate.<br/><br/>
                    <span style={{ color: 'var(--color-text1)' }}>Note: Making a new deposit will reset the 7-day lockup timer for your entire balance.</span>
                  </>
                )}
              </div>

              <div className="input-group">
                <div className="input-header">
                  <span style={{ color:'var(--color-text2)', fontSize:13 }}>{activeAction === 'Deposit' ? 'Pay' : 'Withdraw'}</span>
                  <span style={{ color:'var(--color-text3)', fontSize:13 }}>
                    {activeAction === 'Deposit' ? 'Wallet:' : 'Vault:'} <span className="font-mono text-white">{activeAction==='Deposit'?balance.toFixed(2):userCVaultShares.toFixed(2)} {activeAction==='Deposit'?'USDC':'cUSDC'}</span>
                  </span>
                </div>
                <div className="input-box">
                  <input type="number" placeholder="0.00" value={amt} onChange={e=>setAmt(e.target.value)} className="font-mono" />
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button className="max-btn" onClick={()=>setAmt(activeAction==='Deposit'?String(balance):String(userCVaultShares))}>MAX</button>
                    <span style={{ fontWeight:600, fontSize:14 }}>{activeAction === 'Deposit' ? 'USDC' : 'cUSDC'}</span>
                  </div>
                </div>
              </div>

              <div className="receive-section" style={{ background: 'var(--color-bg0)', borderRadius: 8, padding: '12px 16px', marginBottom: 12, border: '1px solid var(--color-border)' }}>
                <div style={{ color: 'var(--color-text2)', fontSize: 13, marginBottom: 8 }}>You receive</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-mono" style={{ fontSize: 20, color: 'var(--color-text1)' }}>
                    {activeAction === 'Deposit' ? (Number(amt) / (sharePrice || 1) || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) : (Number(amt) * (sharePrice || 1) || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{activeAction === 'Deposit' ? 'cUSDC' : 'USDC'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text2)', marginBottom: 16 }}>
                <span>Exchange Rate</span>
                <span className="font-mono">1 cUSDC = {sharePrice.toFixed(4)} USDC</span>
              </div>

              <button className="submit-btn" disabled={isPending || (!amt && !isWrongNetwork && isConnected) || (Number(amt) <= 0 && !isWrongNetwork && isConnected)} onClick={handleAction} style={{ opacity: (isPending || (!amt && !isWrongNetwork && isConnected)) ? 0.5 : 1 }}>
                {isPending ? 'Processing...' : !isConnected ? 'Connect an account first' : isWrongNetwork ? 'Switch to Arc Testnet' : activeAction}
              </button>
            </div>
          </div>
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

        /* Header Stats */
        .vault-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
          max-width: 600px; /* Don't stretch too wide on desktop */
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
          font-size: 18px;
          font-weight: 600;
        }

        /* Tabs */
        .decibel-tabs {
          border-bottom: 1px solid var(--color-border);
          margin-bottom: 32px;
        }
        .tabs-row {
          display: flex;
          gap: 32px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tabs-row::-webkit-scrollbar {
          display: none;
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

        /* Main Grid */
        .vault-main-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
          align-items: start;
        }

        /* Vault Performance Layout (Left) */
        .decibel-performance-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 32px;
        }

        .dp-metrics {
          display: flex;
          flex-direction: column;
        }
        .dp-metrics-header {
          margin-bottom: 24px;
        }
        .dp-metrics-header h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: var(--color-text1);
        }
        .dp-list {
          display: flex;
          flex-direction: column;
        }
        .dp-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px dashed rgba(255,255,255,0.05);
          font-size: 14px;
        }
        .dp-item:last-child {
          border-bottom: none;
        }
        .dp-label {
          color: var(--color-text2);
        }
        .dp-value {
          font-weight: 500;
          text-align: right;
        }

        .dp-chart-area {
          display: flex;
          flex-direction: column;
        }
        .dp-chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        /* General Panel Box for other tabs */
        .vault-left {
          min-width: 0;
          width: 100%;
        }
        .vault-right {
          min-width: 0;
          width: 100%;
        }
        .vault-panel-box {
          background: transparent;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          overflow: hidden;
        }

        /* Action Card */
        .sticky-card {
          position: sticky;
          top: 84px; /* 60px topbar + 24px */
        }
        .action-card {
          background: var(--color-bg1);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          overflow: hidden;
        }
        .action-tabs-container {
          display: flex;
          background: var(--color-bg0);
          border-radius: 8px;
          padding: 4px;
          margin: 20px 20px 0;
          border: 1px solid var(--color-border);
        }
        .action-tab-btn {
          flex: 1;
          padding: 12px 0;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--color-text3);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-tab-btn.active {
          background: var(--color-bg3);
          color: #fff;
        }
        .action-body {
          padding: 20px;
        }
        .decibel-disclaimer {
          font-size: 13px;
          color: var(--color-text2);
          line-height: 1.5;
          margin-bottom: 16px;
        }

        /* Controls & Inputs */
        .chart-controls {
          display: flex;
        }
        .control-group {
          display: flex;
          background: var(--color-bg1);
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

        .input-group {
          margin-bottom: 16px;
        }
        .input-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
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
        }
        .submit-btn {
          width: 100%;
          background: var(--color-accent);
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 14px 0;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .submit-btn:hover {
          opacity: 0.9;
        }

        .text-green { color: var(--color-green); }
        .text-red { color: var(--color-red); }

        /* Tables */
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

        /* Personal Stats Grid in Your Activity */
        .vault-activity-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .personal-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .p-stat-card {
          background: var(--color-bg1);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
        }
        .p-stat-label {
          color: var(--color-text2);
          font-size: 13px;
          margin-bottom: 8px;
        }
        .p-stat-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text1);
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .p-stat-symbol {
          font-size: 12px;
          color: var(--color-text3);
          font-family: 'Inter', sans-serif;
          font-weight: 500;
        }
        .mt-4 {
          margin-top: 16px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .vault-main-grid {
            grid-template-columns: 1fr;
          }
          .decibel-performance-layout {
            grid-template-columns: 1fr;
          }
          .personal-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .sticky-card {
            position: static;
          }
        }
        @media (max-width: 768px) {
          .vault-container {
            padding: 16px 12px;
          }
          .tabs-row {
            justify-content: center;
          }
          .vault-stats-grid {
            grid-template-columns: 1fr; /* Stack stats on mobile */
            gap: 12px;
          }
          .stat-card {
            padding: 16px;
            text-align: center;
          }
          .dp-chart-header {
            align-items: center;
          }
          .dp-metrics-header {
            margin-bottom: 16px;
          }
          .dp-metrics-header h2 {
            font-size: 16px;
          }
          .dp-item {
            padding: 6px 0;
            font-size: 13px;
          }
          .control-btn {
            padding: 4px 6px;
            font-size: 10px;
          }
          .pt-tab {
            font-size: 13px;
            padding: 12px 0;
          }
          .action-tabs-container {
            margin: 16px 16px 0;
          }
          .action-tab-btn {
            padding: 10px 0;
            font-size: 13px;
          }
          .action-body {
            padding: 16px;
          }
          .decibel-disclaimer {
            font-size: 12px;
            margin-bottom: 16px;
          }
          .input-group {
            margin-bottom: 16px;
          }
          .input-box {
            padding: 10px 12px;
          }
          .submit-btn {
            padding: 12px 0;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
}
