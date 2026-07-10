import { useState, useEffect } from 'react'
import { useConfidentialTrading } from '../hooks/useConfidentialTrading'

export interface EditTpSlData {
  positionId: number
  pair: string
  isLong: boolean
  currentTp: number
  currentSl: number
  entryPrice?: number
  leverage?: number
}

interface EditTpSlModalProps {
  isOpen: boolean
  onClose: () => void
  data: EditTpSlData | null
}

export default function EditTpSlModal({ isOpen, onClose, data }: EditTpSlModalProps) {
  const { updateTpSl, isTxPending } = useConfidentialTrading()
  const [tpPrice, setTpPrice] = useState('')
  const [slPrice, setSlPrice] = useState('')

  useEffect(() => {
    if (isOpen && data) {
      setTpPrice(data.currentTp > 0 ? data.currentTp.toString() : '')
      setSlPrice(data.currentSl > 0 ? data.currentSl.toString() : '')
    }
  }, [isOpen, data])

  if (!isOpen || !data) return null

  const handleTpPercent = (percent: number) => {
    if (!data?.entryPrice) return
    const lev = data.leverage || 10
    const movePct = percent / lev / 100
    const targetPrice = data.isLong 
      ? data.entryPrice * (1 + movePct) 
      : data.entryPrice * (1 - movePct)
    setTpPrice(targetPrice < 10 ? targetPrice.toFixed(4) : targetPrice.toFixed(2))
  }

  const handleSlPercent = (percent: number) => {
    if (!data?.entryPrice) return
    const lev = data.leverage || 10
    const movePct = percent / lev / 100
    const targetPrice = data.isLong 
      ? data.entryPrice * (1 - movePct) 
      : data.entryPrice * (1 + movePct)
    setSlPrice(targetPrice < 10 ? targetPrice.toFixed(4) : targetPrice.toFixed(2))
  }

  const calcRoe = (priceStr: string) => {
    const p = Number(priceStr)
    if (!p || !data?.entryPrice) return null
    const diff = data.isLong ? (p - data.entryPrice) : (data.entryPrice - p)
    const roe = (diff / data.entryPrice) * (data.leverage || 1) * 100
    return roe
  }

  const tpRoe = calcRoe(tpPrice)
  const slRoe = calcRoe(slPrice)

  const handleSubmit = async () => {
    try {
      const tp = Number(tpPrice) || 0
      const sl = Number(slPrice) || 0
      await updateTpSl(BigInt(data.positionId), tp, sl)
      onClose()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
      <div className="animate-fade-in" style={{ background: '#121214', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '340px', border: '1px solid #2c2c2e', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>Edit TP / SL</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ fontSize: 13, color: '#8e8e93', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div>
            Market: <span style={{ color: '#fff', fontWeight: 500 }}>{data.pair}</span> 
            <span className={data.isLong ? 'text-green' : 'text-red'} style={{ marginLeft: 8, textTransform: 'uppercase', fontSize: 11, fontWeight: 600 }}>{data.isLong ? 'LONG' : 'SHORT'}</span>
          </div>
          {data.entryPrice && (
            <div style={{ fontSize: 12, color: '#8e8e93' }}>
              Entry: <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>${data.entryPrice < 10 ? data.entryPrice.toFixed(4) : data.entryPrice.toFixed(2)}</span>
              {data.leverage && <span style={{ color: '#8e8e93', marginLeft: 4 }}>({data.leverage}x)</span>}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#8e8e93' }}>Take Profit Price</span>
              {data.entryPrice && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {[25, 50, 100, 300].map(p => (
                    <span 
                      key={p} 
                      onClick={() => handleTpPercent(p)} 
                      style={{ fontSize: 10, cursor: 'pointer', color: '#4BFF99', background: 'rgba(75, 255, 153, 0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 600, transition: 'background 0.2s' }}
                    >
                      {p}%
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg0)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px' }}>
              <input type="number" placeholder="0.00" value={tpPrice} onChange={e => setTpPrice(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'var(--font-mono)' }} />
              <span style={{ fontSize: 12, color: '#8e8e93' }}>USD</span>
            </div>
            {tpRoe !== null && (
              <div style={{ fontSize: 11, color: tpRoe >= 0 ? '#4BFF99' : '#ff4b4b', textAlign: 'right' }}>
                Est. ROE: {tpRoe >= 0 ? '+' : ''}{tpRoe.toFixed(1)}%
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#8e8e93' }}>Stop Loss Price</span>
              {data.entryPrice && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {[10, 25, 50, 75].map(p => (
                    <span 
                      key={p} 
                      onClick={() => handleSlPercent(p)} 
                      style={{ fontSize: 10, cursor: 'pointer', color: '#ff4b4b', background: 'rgba(255, 75, 75, 0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 600, transition: 'background 0.2s' }}
                    >
                      -{p}%
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg0)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px' }}>
              <input type="number" placeholder="0.00" value={slPrice} onChange={e => setSlPrice(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'var(--font-mono)' }} />
              <span style={{ fontSize: 12, color: '#8e8e93' }}>USD</span>
            </div>
            {slRoe !== null && (
              <div style={{ fontSize: 11, color: slRoe >= 0 ? '#4BFF99' : '#ff4b4b', textAlign: 'right' }}>
                Est. ROE: {slRoe >= 0 ? '+' : ''}{slRoe.toFixed(1)}%
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={isTxPending}
          style={{ width: '100%', padding: '12px', background: isTxPending ? 'var(--color-bg3)' : 'var(--color-accent)', color: isTxPending ? '#8e8e93' : '#000', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: isTxPending ? 'not-allowed' : 'pointer', transition: 'background 0.2s', marginTop: 8 }}
        >
          {isTxPending ? 'Updating...' : 'Confirm Update'}
        </button>
      </div>
    </div>
  )
}
