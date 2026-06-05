import { useState, useMemo, useEffect } from 'react'
import { useTradeStore } from '../store/useTradeStore'
import { useArcWallet } from '../hooks/useArcWallet'
import type { OrderSide, OrderType } from '../types'

const LEVERAGES = [1, 2, 5, 10, 20]

interface OrderFormProps {
  initialSide?: OrderSide
  onClose?: () => void
}

export default function OrderForm({ initialSide = 'long', onClose }: OrderFormProps) {
  const { markets, activeMarketId, placeOrder, setWalletModalOpen } = useTradeStore()
  const { isConnected, balance } = useArcWallet()
  const activeMarket = markets.find((m) => m.id === activeMarketId)

  const [orderType, setOrderType] = useState<OrderType>('market')
  const [side, setSide] = useState<OrderSide>(initialSide)

  useEffect(() => {
    setSide(initialSide)
  }, [initialSide])
  const [price, setPrice] = useState('')
  const [size, setSize] = useState('')
  const [leverage, setLeverage] = useState(5)
  const [reduceOnly, setReduceOnly] = useState(false)

  const effectivePrice = orderType === 'market' ? (activeMarket?.price ?? 0) : Number(price) || 0
  const sizeNum = Number(size) || 0

  const orderSummary = useMemo(() => {
    if (!effectivePrice || !sizeNum) return null
    const notional = effectivePrice * sizeNum
    const collateral = notional / leverage
    const fees = notional * 0.0005
    const liqMul = side === 'long' ? 1 - 0.9 / leverage : 1 + 0.9 / leverage
    return {
      collateral: collateral.toFixed(2),
      notional: notional.toFixed(2),
      liqPrice: (effectivePrice * liqMul).toFixed(2),
      fees: fees.toFixed(2),
    }
  }, [effectivePrice, sizeNum, leverage, side])

  const handleSubmit = () => {
    if (!isConnected) { setWalletModalOpen(true); return }
    if (!activeMarket || !sizeNum) return
    placeOrder({ marketId: activeMarket.id, pair: activeMarket.pair, side, type: orderType, price: effectivePrice, size: sizeNum, leverage })
    setSize(''); setPrice('')
  }

  if (!activeMarket) return null

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:12,padding:12,background:'var(--color-bg1)',height:'100%',overflowY:'auto' }}>
      {/* Mobile Modal Header */}
      {onClose && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{activeMarket.pair}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text3)', cursor: 'pointer', padding: 4 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Type tabs */}
      <div style={{ display:'flex',gap:2,background:'var(--color-bg2)',borderRadius:6,padding:2 }}>
        {(['market','limit','stop'] as OrderType[]).map(t=>(
          <button key={t} onClick={()=>setOrderType(t)}
            style={{ flex:1,padding:6,fontSize:12,fontWeight:500,borderRadius:4,cursor:'pointer',textAlign:'center',transition:'all 150ms',
              background: orderType===t?'var(--color-bg3)':'transparent', color: orderType===t?'var(--color-text1)':'var(--color-text3)',
              border:'none' }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* Side toggle */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:2,background:'var(--color-bg2)',borderRadius:6,padding:2 }}>
        <button onClick={()=>setSide('long')} style={{ padding:8,fontSize:13,fontWeight:600,borderRadius:4,cursor:'pointer',textAlign:'center',transition:'all 200ms',border:'none',
          background: side==='long'?'var(--color-green)':'transparent', color: side==='long'?'#070c18':'var(--color-text3)' }}>Long</button>
        <button onClick={()=>setSide('short')} style={{ padding:8,fontSize:13,fontWeight:600,borderRadius:4,cursor:'pointer',textAlign:'center',transition:'all 200ms',border:'none',
          background: side==='short'?'var(--color-red)':'transparent', color: side==='short'?'#fff':'var(--color-text3)' }}>Short</button>
      </div>

      {/* Price */}
      {orderType !== 'market' && (
        <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
          <label className="label">Price (USDC)</label>
          <div style={{ display:'flex',alignItems:'center',background:'var(--color-bg2)',border:'1px solid var(--color-border)',borderRadius:6,padding:'0 10px' }}>
            <input type="number" placeholder={activeMarket.price.toFixed(2)} value={price} onChange={e=>setPrice(e.target.value)}
              className="font-mono" style={{ flex:1,padding:'8px 0',fontSize:14,background:'transparent',color:'var(--color-text1)' }} />
            <span style={{ fontSize:11,color:'var(--color-text3)',fontWeight:500 }}>USDC</span>
          </div>
        </div>
      )}

      {/* Size */}
      <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
        <label className="label">Size ({activeMarket.baseAsset})</label>
        <div style={{ display:'flex',alignItems:'center',background:'var(--color-bg2)',border:'1px solid var(--color-border)',borderRadius:6,padding:'0 10px' }}>
          <input type="number" placeholder="0.00" value={size} onChange={e=>setSize(e.target.value)}
            className="font-mono" style={{ flex:1,padding:'8px 0',fontSize:14,background:'transparent',color:'var(--color-text1)' }} />
          <span style={{ fontSize:11,color:'var(--color-text3)',fontWeight:500 }}>{activeMarket.baseAsset}</span>
        </div>
      </div>

      {/* Reduce Only */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <span style={{ fontSize:12,color:'var(--color-text2)' }}>Reduce Only</span>
        <button onClick={()=>setReduceOnly(!reduceOnly)} style={{ width:36,height:20,borderRadius:9999,background:reduceOnly?'var(--color-accent)':'var(--color-bg3)',cursor:'pointer',position:'relative',transition:'background 200ms',border:'none' }}>
          <div style={{ width:16,height:16,borderRadius:'50%',background:'white',position:'absolute',top:2,left:reduceOnly?18:2,transition:'left 200ms' }} />
        </button>
      </div>

      {/* Leverage */}
      <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <label className="label">Leverage</label>
          <span className="font-mono" style={{ fontSize:14,fontWeight:600,color:'var(--color-accent)' }}>{leverage}x</span>
        </div>
        <input type="range" min={1} max={20} value={leverage} onChange={e=>setLeverage(Number(e.target.value))}
          style={{ width:'100%',accentColor:'var(--color-accent)',cursor:'pointer' }} />
        <div style={{ display:'flex',gap:4 }}>
          {LEVERAGES.map(l=>(
            <button key={l} onClick={()=>setLeverage(l)}
              style={{ flex:1,padding:4,fontSize:11,fontWeight:500,borderRadius:4,cursor:'pointer',textAlign:'center',transition:'all 150ms',border:'none',
                background: leverage===l?'rgba(0,82,255,0.15)':'var(--color-bg2)', color: leverage===l?'var(--color-accent)':'var(--color-text3)' }}>
              {l}x
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {orderSummary && (
        <div style={{ background:'var(--color-bg2)',borderRadius:6,padding:'10px 12px',display:'flex',flexDirection:'column',gap:6 }}>
          {[['Collateral',orderSummary.collateral+' USDC'],['Notional',orderSummary.notional+' USDC'],['Est. Liq.',orderSummary.liqPrice],['Fees (0.05%)',orderSummary.fees+' USDC']].map(([k,v])=>(
            <div key={k as string} style={{ display:'flex',justifyContent:'space-between',fontSize:12 }}>
              <span style={{ color:'var(--color-text3)' }}>{k}</span>
              <span className="font-mono" style={{ color:'var(--color-text2)' }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {isConnected && (
        <div style={{ display:'flex',justifyContent:'space-between',padding:'0 2px' }}>
          <span style={{ fontSize:11,color:'var(--color-text3)' }}>Available</span>
          <span className="font-mono" style={{ fontSize:11,color:'var(--color-text2)' }}>{balance.toFixed(2)} USDC</span>
        </div>
      )}

      <button onClick={handleSubmit}
        className={`btn ${!isConnected ? '' : side==='long'?'btn-green':'btn-red'}`}
        style={{ width:'100%',padding:12,fontWeight:600,borderRadius: !isConnected ? 999 : 6,
          ...(! isConnected ? { backgroundColor:'var(--color-green)',color:'#070c18' } : {}) }}>
        {!isConnected ? 'Connect Wallet' : `Place ${side==='long'?'Long':'Short'} Order`}
      </button>
    </div>
  )
}
