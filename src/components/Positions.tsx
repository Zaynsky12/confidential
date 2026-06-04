import { useTradeStore } from '../store/useTradeStore'

export default function Positions() {
  const { positions, closePosition } = useTradeStore()
  const openPositions = positions.filter((p) => p.status === 'open')

  if (openPositions.length === 0) {
    return (
      <div style={{ padding:'20px 12px',textAlign:'center',color:'var(--color-text3)',fontSize:13,background:'var(--color-bg1)',borderTop:'1px solid var(--color-border)' }}>
        No open positions
      </div>
    )
  }

  return (
    <div style={{ background:'var(--color-bg1)',borderTop:'1px solid var(--color-border)',overflow:'auto' }}>
      <div style={{ padding:'8px 12px',borderBottom:'1px solid var(--color-border)' }}>
        <span className="label">Open Positions</span>
      </div>
      {openPositions.map((p) => (
        <div key={p.id} style={{ display:'grid',gridTemplateColumns:'1fr 0.6fr 0.8fr 0.8fr 0.8fr auto',alignItems:'center',padding:'6px 12px',fontSize:12,borderBottom:'1px solid var(--color-border)',gap:4, minWidth: '400px' }}>
          <span style={{ fontWeight:500 }}>{p.pair}</span>
          <span className={p.side==='long'?'badge badge-green':'badge badge-red'} style={{ fontSize:9,padding:'1px 6px',justifySelf:'start' }}>
            {p.side.toUpperCase()}
          </span>
          <span className="font-mono">{p.size.toFixed(4)}</span>
          <span className="font-mono">{p.entryPrice.toFixed(2)}</span>
          <span className={`font-mono ${p.pnl>=0?'text-green':'text-red'}`} style={{ fontWeight:500 }}>
            {p.pnl>=0?'+':''}{p.pnl.toFixed(2)}
          </span>
          <button onClick={()=>closePosition(p.id)}
            style={{ padding:'2px 8px',fontSize:10,color:'var(--color-red)',background:'transparent',borderRadius:4,cursor:'pointer',border:'1px solid var(--color-border)',transition:'all 150ms' }}>
            Close
          </button>
        </div>
      ))}
    </div>
  )
}
