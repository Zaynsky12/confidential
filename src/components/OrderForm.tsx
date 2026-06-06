import { useState, useMemo, useEffect } from 'react'
import { useTradeStore } from '../store/useTradeStore'
import { useArcWallet } from '../hooks/useArcWallet'
import type { OrderSide, OrderType } from '../types'

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
  const [marginMode, setMarginMode] = useState<'cross' | 'isolated'>('cross')

  useEffect(() => {
    setSide(initialSide)
  }, [initialSide])
  const [price, setPrice] = useState('')
  const [size, setSize] = useState('')
  const [sizePercent, setSizePercent] = useState<number>(0)
  const [leverage, setLeverage] = useState(10)
  const [isLeverageModalOpen, setIsLeverageModalOpen] = useState(false)
  const [tempLeverage, setTempLeverage] = useState<number | string>('')
  const [reduceOnly, setReduceOnly] = useState(false)
  const [showTpSl, setShowTpSl] = useState(false)
  const [takeProfit, setTakeProfit] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [inputCurrency, setInputCurrency] = useState<'BASE' | 'USD'>('BASE')
  const isCustomLeverage = ![1, 10, 20, 40].includes(leverage)

  const effectivePrice = orderType === 'market' ? (activeMarket?.price ?? 0) : Number(price) || 0
  const sizeNum = Number(size) || 0
  
  const baseSize = inputCurrency === 'BASE' ? sizeNum : (effectivePrice ? sizeNum / effectivePrice : 0)
  const usdSize = inputCurrency === 'USD' ? sizeNum : (sizeNum * effectivePrice)

  const orderSummary = useMemo(() => {
    if (!effectivePrice || !sizeNum) return null
    const notional = usdSize
    const collateral = notional / leverage
    const fees = notional * 0.0005
    const liqMul = side === 'long' ? 1 - 0.9 / leverage : 1 + 0.9 / leverage
    return {
      collateral: collateral.toFixed(2),
      notional: notional.toFixed(2),
      liqPrice: (effectivePrice * liqMul).toFixed(2),
      fees: fees.toFixed(2),
    }
  }, [effectivePrice, sizeNum, leverage, side, usdSize])

  const handleSizePercentChange = (percent: number) => {
    setSizePercent(percent)
    if (!activeMarket || !effectivePrice || !isConnected || balance <= 0) return
    const maxNotional = balance * leverage
    
    if (inputCurrency === 'USD') {
      const newSize = ((maxNotional * percent) / 100).toFixed(2)
      setSize(newSize === '0.00' ? '' : newSize)
    } else {
      const maxBaseAsset = maxNotional / effectivePrice
      const newSize = ((maxBaseAsset * percent) / 100).toFixed(4)
      setSize(newSize === '0.0000' ? '' : newSize)
    }
  }

  const handleSizeChange = (val: string) => {
    setSize(val)
    if (!activeMarket || !effectivePrice || !isConnected || balance <= 0) return
    const maxNotional = balance * leverage
    const valNum = Number(val) || 0
    
    if (inputCurrency === 'USD') {
      if (maxNotional > 0) setSizePercent(Math.min(100, (valNum / maxNotional) * 100))
    } else {
      const maxBaseAsset = maxNotional / effectivePrice
      if (maxBaseAsset > 0) setSizePercent(Math.min(100, (valNum / maxBaseAsset) * 100))
    }
  }

  const toggleCurrency = (currency: 'BASE' | 'USD') => {
    if (currency === inputCurrency) return
    setInputCurrency(currency)
    if (!sizeNum) return
    if (currency === 'USD') setSize(usdSize.toFixed(2))
    else setSize(baseSize.toFixed(4))
  }

  const handleSubmit = () => {
    if (!isConnected) { setWalletModalOpen(true); return }
    if (!activeMarket || !sizeNum) return
    placeOrder({ marketId: activeMarket.id, pair: activeMarket.pair, side, type: orderType, price: effectivePrice, size: baseSize, leverage })
    setSize(''); setPrice(''); setSizePercent(0)
  }

  if (!activeMarket) return null

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16,background:'transparent', color:'#fff', fontFamily:'Inter, sans-serif' }}>
      
      {/* Mobile Modal Header */}
      {onClose && (
        <div className="mobile-only" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{activeMarket.pair}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer', padding: 4 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Main Trade Card */}
      <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--color-bg1)' }}>

      {/* Top Bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13 }}>
        <span style={{ color:'#8e8e93' }}>Available to trade</span>
        <span style={{ fontWeight:600 }}>${balance.toFixed(2)} USDC</span>
      </div>

      {/* Long / Short */}
      <div style={{ display:'flex', background:'var(--color-bg2)', border:'1px solid var(--color-border)', borderRadius:8, padding:2, marginTop: 4 }}>
        <button onClick={()=>setSide('long')} style={{ flex:1, padding:'6px 0', borderRadius:6, border:'none', background:side==='long'?'var(--color-green)':'transparent', color:side==='long'?'#000':'#8e8e93', fontWeight:600, fontSize:14, cursor:'pointer', transition:'all 0.2s' }}>Long</button>
        <button onClick={()=>setSide('short')} style={{ flex:1, padding:'6px 0', borderRadius:6, border:'none', background:side==='short'?'#e55f48':'transparent', color:side==='short'?'#fff':'#8e8e93', fontWeight:600, fontSize:14, cursor:'pointer', transition:'all 0.2s' }}>Short</button>
      </div>

      {/* Margin & Order Type Dropdowns */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <div style={{ background:'var(--color-bg2)', border:'1px solid var(--color-border)', borderRadius:6, padding:'6px 12px', display:'flex', flexDirection:'column', gap:2, position:'relative' }}>
          <span style={{ fontSize:11, color:'#8e8e93' }}>Margin</span>
          <select value={marginMode} onChange={e=>setMarginMode(e.target.value as any)} style={{ background:'transparent', border:'none', color:'#fff', fontSize:13, fontWeight:500, outline:'none', appearance:'none', padding:0, cursor:'pointer', width:'100%' }}>
            <option value="cross" style={{ background: 'var(--color-bg0)', color: 'var(--color-text1)' }}>Cross</option>
            <option value="isolated" style={{ background: 'var(--color-bg0)', color: 'var(--color-text1)' }}>Isolated</option>
          </select>
          <svg style={{ position:'absolute', right:12, top:'50%', pointerEvents:'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div style={{ background:'var(--color-bg2)', border:'1px solid var(--color-border)', borderRadius:6, padding:'6px 12px', display:'flex', flexDirection:'column', gap:2, position:'relative' }}>
          <span style={{ fontSize:11, color:'#8e8e93' }}>Order Type</span>
          <select value={orderType} onChange={e=>setOrderType(e.target.value as any)} style={{ background:'transparent', border:'none', color:'#fff', fontSize:13, fontWeight:500, outline:'none', appearance:'none', padding:0, cursor:'pointer', width:'100%' }}>
            <option value="market" style={{ background: 'var(--color-bg0)', color: 'var(--color-text1)' }}>Market</option>
            <option value="limit" style={{ background: 'var(--color-bg0)', color: 'var(--color-text1)' }}>Limit</option>
            <option value="twap" style={{ background: 'var(--color-bg0)', color: 'var(--color-text1)' }}>TWAP</option>
            <option value="stop market" style={{ background: 'var(--color-bg0)', color: 'var(--color-text1)' }}>Stop Market</option>
            <option value="stop limit" style={{ background: 'var(--color-bg0)', color: 'var(--color-text1)' }}>Stop Limit</option>
          </select>
          <svg style={{ position:'absolute', right:12, top:'50%', pointerEvents:'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </div>

      {/* Leverage */}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <span style={{ fontSize:12, color:'#8e8e93', fontWeight:500 }}>Leverage</span>
        <div style={{ display:'flex', gap:4 }}>
          {[1, 10, 20, 40].map(l => (
            <button key={l} onClick={()=>setLeverage(l)} style={{ flex:1, background:leverage===l?'var(--color-bg3)':'var(--color-bg2)', border:'1px solid', borderColor:leverage===l?'var(--color-border-strong)':'var(--color-border)', color:'#fff', padding:'6px 0', borderRadius:6, fontSize:13, fontWeight:500, cursor:'pointer' }}>{l}x</button>
          ))}
          <div 
            onClick={() => {
              setTempLeverage(leverage)
              setIsLeverageModalOpen(true)
            }}
            style={{ 
              flex: 1.2, 
              background: isCustomLeverage ? 'var(--color-bg3)' : 'var(--color-bg2)', 
              borderRadius: 6, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '0 8px', 
              border: isCustomLeverage ? '1px solid var(--color-border-strong)' : '1px solid var(--color-border)', 
              cursor: 'pointer' 
            }}
          >
             <span style={{ fontSize:13, color: isCustomLeverage ? '#fff' : '#8e8e93', fontWeight: isCustomLeverage ? 500 : 400 }}>
               {isCustomLeverage ? `${leverage}x` : 'Custom'}
             </span>
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>
      </div>

      {/* Current Position */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12 }}>
        <span style={{ color:'#8e8e93' }}>Current Position</span>
        <span style={{ fontWeight:500 }}>
          {inputCurrency === 'BASE' ? `0.0000 ${activeMarket.baseAsset}` : '$0.00'}
        </span>
      </div>

      {/* Order Size Input */}
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        <div style={{ display:'flex', alignItems:'center', background:'var(--color-bg0)', border:(!sizeNum)?'1px solid var(--color-red)':'1px solid var(--color-border)', borderRadius:8, padding:'6px 10px', transition:'border 0.2s' }}>
          <span style={{ fontSize:13, color:'#8e8e93', marginRight:8, whiteSpace:'nowrap' }}>Order Size</span>
          <input type="number" placeholder="0" value={size} onChange={e=>handleSizeChange(e.target.value)} style={{ flex:1, background:'transparent', border:'none', color:'#fff', fontSize:14, outline:'none', minWidth:0 }} />
          <div style={{ display:'flex', background:'var(--color-bg2)', borderRadius:4, padding:2, marginLeft:8 }}>
            <span 
              onClick={() => toggleCurrency('BASE')}
              style={{ padding:'2px 6px', fontSize:11, cursor:'pointer', color: inputCurrency === 'BASE' ? '#fff' : '#8e8e93', background: inputCurrency === 'BASE' ? 'var(--color-bg3)' : 'transparent', borderRadius:2 }}
            >{activeMarket.baseAsset}</span>
            <span 
              onClick={() => toggleCurrency('USD')}
              style={{ padding:'2px 6px', fontSize:11, cursor:'pointer', color: inputCurrency === 'USD' ? '#fff' : '#8e8e93', background: inputCurrency === 'USD' ? 'var(--color-bg3)' : 'transparent', borderRadius:2 }}
            >USD</span>
          </div>
        </div>
        {(!sizeNum) && (
          <div style={{ color:'#e55f48', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            Must be at least 0.00002
          </div>
        )}
      </div>

      {/* Percent Slider */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <input type="range" min={0} max={100} value={sizePercent} onChange={e=>handleSizePercentChange(Number(e.target.value))} style={{ flex:1, accentColor:'#eab308' }} />
        <div style={{ border:'1px solid var(--color-border)', borderRadius:6, padding:'4px 8px', fontSize:12, display:'flex', alignItems:'center', gap:2, background:'var(--color-bg2)' }}>
          <span>{sizePercent.toFixed(0)}</span>
          <span style={{ color:'#8e8e93' }}>%</span>
        </div>
      </div>

      {/* Checkboxes */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
          <input type="checkbox" checked={reduceOnly} onChange={()=>setReduceOnly(!reduceOnly)} style={{ accentColor:'#8e8e93', width:14, height:14, cursor:'pointer', background:'var(--color-bg2)', border:'1px solid var(--color-border)', borderRadius:4 }} />
          <span style={{ fontSize:12, color:'#8e8e93', borderBottom:'1px dashed var(--color-border)', paddingBottom:2 }}>Reduce Only</span>
        </label>
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
          <input type="checkbox" checked={showTpSl} onChange={()=>setShowTpSl(!showTpSl)} style={{ accentColor:'#8e8e93', width:14, height:14, cursor:'pointer', background:'var(--color-bg2)', border:'1px solid var(--color-border)', borderRadius:4 }} />
          <span style={{ fontSize:12, color:'#8e8e93', borderBottom:'1px dashed var(--color-border)', paddingBottom:2 }}>Take Profit / Stop Loss</span>
        </label>

        {showTpSl && (
          <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4, animationDuration: '200ms' }}>
            <div style={{ display:'flex', flexDirection:'column', background:'var(--color-bg0)', border:'1px solid var(--color-border)', borderRadius:8, padding:'6px 10px' }}>
              <span style={{ fontSize:11, color:'#8e8e93', marginBottom:2 }}>Take Profit</span>
              <div style={{ display:'flex', alignItems:'center' }}>
                <input type="number" placeholder="0.00" value={takeProfit} onChange={e=>setTakeProfit(e.target.value)} style={{ flex:1, background:'transparent', border:'none', color:'#fff', fontSize:14, outline:'none', minWidth:0, fontFamily: 'var(--font-mono)' }} />
                <span style={{ fontSize:11, color:'#8e8e93' }}>USD</span>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', background:'var(--color-bg0)', border:'1px solid var(--color-border)', borderRadius:8, padding:'6px 10px' }}>
              <span style={{ fontSize:11, color:'#8e8e93', marginBottom:2 }}>Stop Loss</span>
              <div style={{ display:'flex', alignItems:'center' }}>
                <input type="number" placeholder="0.00" value={stopLoss} onChange={e=>setStopLoss(e.target.value)} style={{ flex:1, background:'transparent', border:'none', color:'#fff', fontSize:14, outline:'none', minWidth:0, fontFamily: 'var(--font-mono)' }} />
                <span style={{ fontSize:11, color:'#8e8e93' }}>USD</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button onClick={handleSubmit} style={{ 
        width:'100%', padding:'12px', borderRadius:8, border:'none', 
        background: (!isConnected || !sizeNum) ? 'var(--color-bg3)' : (side === 'long' ? 'var(--color-green)' : 'var(--color-red)'), 
        color: (!isConnected || !sizeNum) ? '#8e8e93' : (side === 'long' ? '#000' : '#fff'), 
        fontSize:14, fontWeight:600, cursor:(!isConnected||!sizeNum)?'not-allowed':'pointer',
        marginTop: 4
      }}>
        {!isConnected ? 'Connect Wallet' : `Place ${activeMarket.baseAsset} Order`}
      </button>
      {/* Summary Stats */}
      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 11 }}>
        <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#8e8e93' }}>Leverage</span><span style={{ color:'#60a5fa' }}>{leverage}x</span></div>
        <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#8e8e93' }}>Order Value</span><span style={{ color:'#60a5fa' }}>{baseSize ? baseSize.toFixed(4) : 0} {activeMarket.baseAsset} / {orderSummary?.notional || 0} USD</span></div>
        <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#8e8e93' }}>Est. Liq. Price</span><span style={{ borderBottom:'1px dashed #555' }}>N/A</span></div>
        <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#8e8e93' }}>Margin Required</span><span>${orderSummary?.collateral || '0.00'}</span></div>
        <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#8e8e93' }}>Slippage</span><span style={{ borderBottom:'1px dashed #555' }}>0.00% / 8%</span></div>
        <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#8e8e93' }}>Fees</span><span style={{ borderBottom:'1px dashed #555' }}>0.034% / 0.011%</span></div>
      </div>
      </div>

      {/* Account Overview (Hidden on Mobile) */}
      <div className="account-overview-box" style={{ border:'1px solid var(--color-border)', borderRadius:'8px', padding:'16px', display:'flex', flexDirection:'column', gap:'8px', fontSize:11, background:'var(--color-bg1)' }}>
        <div style={{ fontWeight:600, marginBottom:2, fontSize:12 }}>Account Overview</div>
        <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#8e8e93' }}>Equity</span><span>${balance.toFixed(2)}</span></div>
        <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#8e8e93' }}>Balance</span><span>${balance.toFixed(2)}</span></div>
        <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#8e8e93' }}>PnL (Unrealized)</span><span>$0.00</span></div>
        <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#8e8e93' }}>Funding Cost (Unrealized)</span><span>$0.00</span></div>
        <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#8e8e93' }}>Cross-margin Ratio</span><span>0.0000%</span></div>
        <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'#8e8e93' }}>Maintenance Margin</span><span>$0.00</span></div>
      </div>

      {/* Adjust Leverage Modal */}
      {isLeverageModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
          <div className="animate-fade-in" style={{ background: '#121214', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '340px', border: '1px solid #2c2c2e', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: '#fff' }}>Adjust Leverage</h3>
            
            <div style={{ background: '#000', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', border: '1px solid #2c2c2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <input 
                type="number"
                min="1" max="40"
                value={tempLeverage}
                onChange={(e) => setTempLeverage(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '15px', outline: 'none', width: '32px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}
              />
              <span style={{ color: '#8e8e93', fontSize: '15px', fontWeight: 500, marginLeft: '2px' }}>x</span>
            </div>

            <div style={{ marginBottom: '32px', position: 'relative' }}>
              <input 
                type="range" 
                min="1" max="40" 
                value={Number(tempLeverage) || 1} 
                onChange={(e) => setTempLeverage(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#fbbf24', height: '4px', cursor: 'pointer' }} 
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8e8e93', marginTop: '12px', fontWeight: 500 }}>
                <span>1x</span>
                <span>40x</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setIsLeverageModalOpen(false)}
                style={{ flex: 1, padding: '14px', background: '#3a3a3c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const val = Math.min(40, Math.max(1, Number(tempLeverage) || 1));
                  setLeverage(val);
                  setIsLeverageModalOpen(false);
                }}
                style={{ flex: 1, padding: '14px', background: '#fbbf24', color: '#000', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .account-overview-box {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
