import { useState, useEffect } from 'react'
import { useConfidentialTrading } from '../hooks/useConfidentialTrading'

export interface EditTpSlData {
  positionId: number
  pair: string
  isLong: boolean
  currentTp: number
  currentSl: number
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

        <div style={{ fontSize: 13, color: '#8e8e93' }}>
          Market: <span style={{ color: '#fff', fontWeight: 500 }}>{data.pair}</span> 
          <span className={data.isLong ? 'text-green' : 'text-red'} style={{ marginLeft: 8, textTransform: 'uppercase', fontSize: 11, fontWeight: 600 }}>{data.isLong ? 'LONG' : 'SHORT'}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#8e8e93' }}>Take Profit Price</span>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg0)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px' }}>
              <input type="number" placeholder="0.00" value={tpPrice} onChange={e => setTpPrice(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'var(--font-mono)' }} />
              <span style={{ fontSize: 12, color: '#8e8e93' }}>USD</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#8e8e93' }}>Stop Loss Price</span>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg0)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px' }}>
              <input type="number" placeholder="0.00" value={slPrice} onChange={e => setSlPrice(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'var(--font-mono)' }} />
              <span style={{ fontSize: 12, color: '#8e8e93' }}>USD</span>
            </div>
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
