import { useState } from 'react'
import { useArcWallet } from '../hooks/useArcWallet'
import { useTradeStore } from '../store/useTradeStore'

const CHAINS = [
  { id:'ethereum', name:'Ethereum', icon:'Ξ', color:'#627EEA' },
  { id:'base', name:'Base', icon:'B', color:'#0052FF' },
  { id:'solana', name:'Solana', icon:'◎', color:'#9945FF' },
  { id:'polygon', name:'Polygon', icon:'⬡', color:'#8247E5' },
]

interface MockBridge { id:string; from:string; to:string; amount:number; status:string; time:number; tx:string }

export default function Bridge() {
  const { isConnected } = useArcWallet()
  const { setWalletModalOpen } = useTradeStore()
  const [fromChain, setFromChain] = useState('ethereum')
  const [amount, setAmount] = useState('')
  const [bridges, setBridges] = useState<MockBridge[]>([])

  const fromInfo = CHAINS.find(c=>c.id===fromChain)!
  const estTime = fromChain==='solana'?'~2 min':'~15 min'
  const estFee = '0.50'

  const handleBridge = () => {
    if(!isConnected){ setWalletModalOpen(true); return }
    const amt = Number(amount)
    if(amt<=0) return
    setBridges(prev=>[{
      id: `br-${Date.now()}`, from:fromInfo.name, to:'Arc Testnet', amount:amt,
      status:'completed', time:Date.now(), tx:`0x${Math.random().toString(16).slice(2,42)}`
    },...prev])
    setAmount('')
  }

  return (
    <div className="bridge-container">
      <h1 style={{ fontSize:28,fontWeight:600,letterSpacing:'-0.02em',marginBottom:8 }}>Bridge USDC to Arc</h1>
      <p style={{ fontSize:14,color:'var(--color-text2)',marginBottom:32 }}>
        Transfer USDC via Circle's Cross-Chain Transfer Protocol (CCTP)
      </p>

      <div className="panel" style={{ padding:24,marginBottom:24 }}>
        {/* From */}
        <div style={{ marginBottom:20 }}>
        <div style={{ marginBottom:20 }}>
          <label className="label" style={{ marginBottom:8,display:'block' }}>From</label>
          <div className="bridge-chains">
            {CHAINS.map(c=>(
              <button key={c.id} onClick={()=>setFromChain(c.id)}
                style={{ padding:'12px 8px',borderRadius:8,cursor:'pointer',textAlign:'center',transition:'all 200ms',
                  background: fromChain===c.id?'var(--color-bg3)':'var(--color-bg2)',
                  border: fromChain===c.id?'1px solid var(--color-accent)':'1px solid var(--color-border)',
                  color:'var(--color-text1)' }}>
                <div style={{ fontSize:20,marginBottom:4 }}>{c.icon}</div>
                <div style={{ fontSize:11,fontWeight:500 }}>{c.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div style={{ textAlign:'center',padding:'4px 0',color:'var(--color-text3)' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M6 12l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* To */}
        <div style={{ marginBottom:20 }}>
          <label className="label" style={{ marginBottom:8,display:'block' }}>To</label>
          <div style={{ padding:'12px 16px',borderRadius:8,background:'var(--color-bg2)',border:'1px solid var(--color-accent)',display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:32,height:32,borderRadius:8,background:'#0052FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff' }}>A</div>
            <div>
              <div style={{ fontSize:14,fontWeight:500 }}>Arc Testnet</div>
              <div style={{ fontSize:11,color:'var(--color-text3)' }}>Chain ID: 5042002</div>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div style={{ marginBottom:20 }}>
          <label className="label" style={{ marginBottom:8,display:'block' }}>Amount (USDC)</label>
          <div style={{ display:'flex',alignItems:'center',background:'var(--color-bg2)',border:'1px solid var(--color-border)',borderRadius:6,padding:'0 12px' }}>
            <input type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)}
              className="font-mono" style={{ flex:1,padding:'12px 0',fontSize:18,background:'transparent',color:'var(--color-text1)' }} />
            <span style={{ fontSize:13,color:'var(--color-text3)',fontWeight:500 }}>USDC</span>
          </div>
        </div>

        {/* Info */}
        <div style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderTop:'1px solid var(--color-border)',marginBottom:12 }}>
          <span style={{ fontSize:12,color:'var(--color-text3)' }}>Estimated time</span>
          <span className="font-mono" style={{ fontSize:12,color:'var(--color-text2)' }}>{estTime}</span>
        </div>
        <div style={{ display:'flex',justifyContent:'space-between',padding:'0 0 16px',borderBottom:'1px solid var(--color-border)',marginBottom:16 }}>
          <span style={{ fontSize:12,color:'var(--color-text3)' }}>Bridge fee</span>
          <span className="font-mono" style={{ fontSize:12,color:'var(--color-text2)' }}>{estFee} USDC</span>
        </div>

        <button className="btn btn-primary" style={{ width:'100%',padding:12,fontWeight:600 }} onClick={handleBridge}>
          {isConnected ? 'Bridge via CCTP' : 'Connect Wallet'}
        </button>
      </div>

      {/* Recent bridges */}
      {bridges.length>0 && (
        <div className="panel" style={{ overflow:'hidden',marginBottom:24 }}>
          <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--color-border)',fontWeight:600,fontSize:14 }}>Recent Bridges</div>
          {bridges.map(b=>(
            <div key={b.id} className="bridge-history-row">
              <span style={{ color:'var(--color-text3)' }}>{new Date(b.time).toLocaleTimeString()}</span>
              <span>{b.from} → Arc</span>
              <span className="font-mono">{b.amount.toFixed(2)} USDC</span>
              <span className="badge badge-green" style={{ fontSize:9,padding:'1px 6px',justifySelf:'end' }}>COMPLETED</span>
            </div>
          ))}
        </div>
      )}

      <a href="https://developers.circle.com/stablecoins/cctp-getting-started" target="_blank" rel="noopener noreferrer"
        style={{ fontSize:13,color:'var(--color-accent)',textDecoration:'none',display:'flex',alignItems:'center',gap:6 }}>
        Learn more about Circle CCTP →
      </a>

      <style>{`
        .bridge-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 60px 24px;
        }
        .bridge-chains {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        .bridge-history-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          padding: 10px 20px;
          border-bottom: 1px solid var(--color-border);
          font-size: 12px;
          align-items: center;
        }

        @media (max-width: 768px) {
          .bridge-container {
            padding: 24px 16px;
          }
          .bridge-chains {
            grid-template-columns: repeat(2, 1fr);
          }
          .bridge-history-row {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .bridge-history-row > span:nth-child(3),
          .bridge-history-row > span:nth-child(4) {
            text-align: left;
            justify-self: start;
          }
        }
      `}</style>
    </div>
  )
}
