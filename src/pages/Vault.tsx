import { useState } from 'react'
import { useTradeStore } from '../store/useTradeStore'
import { useArcWallet } from '../hooks/useArcWallet'

export default function Vault() {
  const { vaultBalance, vaultTVL, vaultAPY, vaultDeposits, depositToVault, withdrawFromVault, setWalletModalOpen } = useTradeStore()
  const { isConnected, balance } = useArcWallet()
  const [depositAmt, setDepositAmt] = useState('')
  const [withdrawAmt, setWithdrawAmt] = useState('')


  const earnings = vaultBalance * 0.0042 // mock earnings

  const handleDeposit = () => {
    if (!isConnected) { setWalletModalOpen(true); return }
    const amt = Number(depositAmt)
    if (amt > 0 && amt <= balance) { depositToVault(amt); setDepositAmt('') }
  }

  const handleWithdraw = () => {
    if (!isConnected) { setWalletModalOpen(true); return }
    const amt = Number(withdrawAmt)
    if (amt > 0 && amt <= vaultBalance) { withdrawFromVault(amt); setWithdrawAmt('') }
  }

  const formatTime = (ts: number) => new Date(ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})

  return (
    <div className="vault-container">
      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:32 }}>
        <h1 style={{ fontSize:28,fontWeight:600,letterSpacing:'-0.02em' }}>USDC Yield Vault</h1>
        <span className="badge badge-green" style={{ fontSize:13,padding:'4px 12px' }}>{vaultAPY}% APY</span>
      </div>

      {/* Deposit / Withdraw cards */}
      <div className="vault-cards">
        {/* Deposit */}
        <div className="panel" style={{ padding:24 }}>
          <h3 style={{ fontSize:15,fontWeight:600,marginBottom:16 }}>Deposit USDC</h3>
          <div style={{ display:'flex',alignItems:'center',background:'var(--color-bg2)',border:'1px solid var(--color-border)',borderRadius:6,padding:'0 12px',marginBottom:8 }}>
            <input type="number" placeholder="0.00" value={depositAmt} onChange={e=>setDepositAmt(e.target.value)}
              className="font-mono" style={{ flex:1,padding:'10px 0',fontSize:16,background:'transparent',color:'var(--color-text1)' }} />
            <span style={{ fontSize:12,color:'var(--color-text3)',fontWeight:500 }}>USDC</span>
          </div>
          <div style={{ fontSize:12,color:'var(--color-text3)',marginBottom:16 }}>
            Wallet balance: <span className="font-mono" style={{ color:'var(--color-text2)' }}>{isConnected?balance.toFixed(2):'—'} USDC</span>
          </div>
          <button className="btn btn-primary" style={{ width:'100%',padding:10 }} onClick={handleDeposit}>
            {isConnected ? 'Deposit' : 'Connect Wallet'}
          </button>
          {Number(depositAmt) > 0 && (
            <div style={{ fontSize:12,color:'var(--color-text3)',marginTop:12,textAlign:'center' }}>
              Est. daily yield: <span className="font-mono text-green">{(Number(depositAmt)*(vaultAPY/100)/365).toFixed(4)} USDC</span>
            </div>
          )}
        </div>

        {/* Withdraw */}
        <div className="panel" style={{ padding:24 }}>
          <h3 style={{ fontSize:15,fontWeight:600,marginBottom:16 }}>Withdraw</h3>
          <div style={{ display:'flex',alignItems:'center',background:'var(--color-bg2)',border:'1px solid var(--color-border)',borderRadius:6,padding:'0 12px',marginBottom:8 }}>
            <input type="number" placeholder="0.00" value={withdrawAmt} onChange={e=>setWithdrawAmt(e.target.value)}
              className="font-mono" style={{ flex:1,padding:'10px 0',fontSize:16,background:'transparent',color:'var(--color-text1)' }} />
            <button onClick={()=>setWithdrawAmt(String(vaultBalance))}
              style={{ fontSize:11,color:'var(--color-accent)',cursor:'pointer',fontWeight:500,background:'none',border:'none' }}>Max</button>
          </div>
          <div style={{ fontSize:12,color:'var(--color-text3)',marginBottom:16 }}>
            Vault share: <span className="font-mono" style={{ color:'var(--color-text2)' }}>{vaultBalance.toFixed(2)} USDC</span>
          </div>
          <button className="btn btn-outline" style={{ width:'100%',padding:10 }} onClick={handleWithdraw}>
            {isConnected ? 'Withdraw' : 'Connect Wallet'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="vault-stats">
        {[
          ['TVL',`$${(vaultTVL/1e6).toFixed(2)}M`],
          ['APY (7-day)',`${vaultAPY}%`],
          ['Your Deposit',`${vaultBalance.toFixed(2)} USDC`],
          ['Your Earnings',`${earnings.toFixed(4)} USDC`],
        ].map(([label,value])=>(
          <div key={label as string} className="panel" style={{ padding:16,textAlign:'center' }}>
            <div className="label" style={{ marginBottom:8 }}>{label}</div>
            <div className="font-mono" style={{ fontSize:18,fontWeight:600 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Activity */}
      <div className="panel" style={{ overflow:'hidden' }}>
        <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--color-border)',fontWeight:600,fontSize:14 }}>Vault Activity</div>
        {vaultDeposits.length===0 ? (
          <div style={{ padding:40,textAlign:'center',color:'var(--color-text3)',fontSize:13 }}>No activity yet</div>
        ) : (
          <div style={{ maxHeight:300,overflowY:'auto' }}>
            {vaultDeposits.map(d=>(
              <div key={d.id} className="vault-activity-row" style={{ display:'grid',gridTemplateColumns:'1fr 0.8fr 1fr 1.5fr',padding:'10px 20px',borderBottom:'1px solid var(--color-border)',fontSize:12,alignItems:'center' }}>
                <span style={{ color:'var(--color-text3)' }}>{formatTime(d.timestamp)}</span>
                <span className={d.action==='deposit'?'badge badge-green':'badge badge-red'} style={{ fontSize:10,padding:'1px 8px',justifySelf:'start' }}>
                  {d.action.toUpperCase()}
                </span>
                <span className="font-mono">{d.amount.toFixed(2)} USDC</span>
                <span className="font-mono" style={{ color:'var(--color-text3)',fontSize:11 }}>{d.txHash.slice(0,10)}...{d.txHash.slice(-6)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .vault-container {
          max-width: 960px;
          margin: 0 auto;
          padding: 40px 24px;
        }
        .vault-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 32px;
        }
        .vault-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 32px;
        }

        @media (max-width: 768px) {
          .vault-container {
            padding: 20px 14px;
          }
          .vault-container h1 {
            font-size: 22px !important;
          }
          .vault-cards {
            grid-template-columns: 1fr;
          }
          .vault-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          .vault-activity-row {
            grid-template-columns: 1fr 1fr !important;
            gap: 6px;
            padding: 10px 14px !important;
          }
        }
      `}</style>
    </div>
  )
}
