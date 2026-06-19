import { useState, useEffect } from 'react'
import { useConfidentialTrading } from '../hooks/useConfidentialTrading'

export interface EditMarginData {
  positionId: number
  pair: string
  pythPriceId: string
  isLong: boolean
  currentMargin: number
}

interface EditMarginModalProps {
  isOpen: boolean
  onClose: () => void
  data: EditMarginData | null
}

export default function EditMarginModal({ isOpen, onClose, data }: EditMarginModalProps) {
  const { addCollateral, removeCollateral, isTxPending } = useConfidentialTrading()
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<'add' | 'remove'>('add')

  useEffect(() => {
    if (!isOpen) {
      setAmount('')
      setMode('add')
    }
  }, [isOpen])

  if (!isOpen || !data) return null

  const handleSubmit = async () => {
    try {
      const amt = Number(amount)
      if (amt <= 0) return

      if (mode === 'add') {
        await addCollateral(BigInt(data.positionId), amt)
      } else {
        await removeCollateral(BigInt(data.positionId), amt, data.pythPriceId)
      }
      onClose()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
      <div className="animate-fade-in" style={{ background: '#121214', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '340px', border: '1px solid #2c2c2e', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>Edit Margin</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ fontSize: 13, color: '#8e8e93' }}>
          Market: <span style={{ color: '#fff', fontWeight: 500 }}>{data.pair}</span> 
          <span className={data.isLong ? 'text-green' : 'text-red'} style={{ marginLeft: 8, textTransform: 'uppercase', fontSize: 11, fontWeight: 600 }}>{data.isLong ? 'LONG' : 'SHORT'}</span>
        </div>

        <div style={{ display: 'flex', background: 'var(--color-bg1)', borderRadius: 8, padding: 4 }}>
          <button 
            style={{ flex: 1, padding: '6px 0', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', background: mode === 'add' ? 'var(--color-bg3)' : 'transparent', color: mode === 'add' ? '#fff' : '#8e8e93', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setMode('add')}
          >
            Add Margin
          </button>
          <button 
            style={{ flex: 1, padding: '6px 0', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', background: mode === 'remove' ? 'var(--color-bg3)' : 'transparent', color: mode === 'remove' ? '#fff' : '#8e8e93', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setMode('remove')}
          >
            Remove Margin
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8e8e93' }}>
            <span>Amount</span>
            <span>Current: ${data.currentMargin.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg0)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px' }}>
            <input 
              type="number" 
              placeholder="0.00" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'var(--font-mono)' }} 
            />
            <span style={{ fontSize: 12, color: '#8e8e93' }}>USDC</span>
          </div>
        </div>

        {mode === 'add' ? (
          <div style={{ fontSize: 12, color: '#8e8e93', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', lineHeight: '1.5' }}>
            <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Tip:</span> Adding margin lowers your leverage and moves your liquidation price further away, making your position safer.
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#8e8e93', background: 'rgba(255,77,79,0.05)', border: '1px solid rgba(255,77,79,0.1)', padding: '12px', borderRadius: '8px', lineHeight: '1.5' }}>
            <span style={{ color: '#ff4d4f', fontWeight: 600 }}>Important:</span> Removing margin increases your leverage. The system will reject this if your new leverage exceeds the max limit (e.g., 100x) or if your remaining margin falls below $5. Accrued fees will be deducted first.
          </div>
        )}

        <button 
          onClick={handleSubmit} 
          disabled={isTxPending || !amount || Number(amount) <= 0}
          style={{ width: '100%', padding: '12px', background: isTxPending || !amount || Number(amount) <= 0 ? 'var(--color-bg3)' : 'var(--color-accent)', color: isTxPending || !amount || Number(amount) <= 0 ? '#8e8e93' : '#000', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: isTxPending || !amount || Number(amount) <= 0 ? 'not-allowed' : 'pointer', transition: 'background 0.2s', marginTop: 8 }}
        >
          {isTxPending ? 'Processing...' : 'Confirm'}
        </button>
      </div>
    </div>
  )
}
