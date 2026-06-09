import { useRef, useState } from 'react'
import * as htmlToImage from 'html-to-image'
import toast from 'react-hot-toast'

export interface SharePositionData {
  pair: string
  side: 'long' | 'short'
  leverage: number
  entryPrice: number
  markPrice: number
  pnlPercent: number
  pnlUsd: number
}

interface SharePnLModalProps {
  isOpen: boolean
  onClose: () => void
  position: SharePositionData | null
}

export default function SharePnLModal({ isOpen, onClose, position }: SharePnLModalProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  if (!isOpen || !position) return null

  const isProfit = position.pnlPercent >= 0
  const colorHex = isProfit ? '#00c087' : '#ff4d4d'

  const handleDownload = async () => {
    if (!cardRef.current) return
    setIsDownloading(true)
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2, // High resolution
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      })
      const link = document.createElement('a')
      link.download = `Confidential-PnL-${position.pair.replace('/', '')}.png`
      link.href = dataUrl
      link.click()
      toast.success('PnL Image Downloaded!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate image')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="share-modal-backdrop" onClick={onClose}>
      <div className="share-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h3>Share Position</h3>
          <button className="btn-close-modal" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* The Card to be captured */}
        <div className="share-card-wrapper">
          <div 
            ref={cardRef} 
            className="share-card"
            style={{
              position: 'relative',
              width: '400px',
              background: 'linear-gradient(135deg, #0b0e14 0%, #1a1e28 100%)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '24px',
              overflow: 'hidden',
              color: '#fff',
              fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif'
            }}
          >
            {/* Background Watermark */}
            <div style={{
              position: 'absolute',
              right: '-40px',
              bottom: '-40px',
              opacity: 0.05,
              pointerEvents: 'none'
            }}>
              <img src="/logo.png" alt="watermark" style={{ width: '250px', height: '250px', filter: 'grayscale(100%)' }} />
            </div>

            {/* Header (Brand + Logo) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
              <img src="/logo.png" alt="Confidential" style={{ width: 28, height: 28, backgroundColor: '#fff', borderRadius: '50%', padding: '2px' }} />
              <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>Confidential</span>
            </div>

            {/* Main PnL */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '52px', fontWeight: 800, color: colorHex, lineHeight: 1, letterSpacing: '-0.03em', textShadow: `0 0 40px ${colorHex}40` }}>
                {isProfit ? '+' : ''}{position.pnlPercent.toFixed(2)}%
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: colorHex, marginTop: '8px' }}>
                {isProfit ? '+' : ''}${Math.abs(position.pnlUsd).toFixed(2)}
              </div>
            </div>

            {/* Position Details */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <span style={{ fontSize: '20px', fontWeight: 700 }}>{position.pair}</span>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                backgroundColor: position.side === 'long' ? 'rgba(0,192,135,0.1)' : 'rgba(255,77,77,0.1)',
                color: position.side === 'long' ? '#00c087' : '#ff4d4d'
              }}>
                {position.side} {position.leverage}x
              </span>
            </div>

            {/* Prices */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#88909f', marginBottom: '4px', fontWeight: 500 }}>Entry Price</div>
                <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                  ${position.entryPrice.toFixed(4)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#88909f', marginBottom: '4px', fontWeight: 500 }}>Mark Price</div>
                <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                  ${position.markPrice.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#88909f' }}>
                <span style={{ fontSize: '12px', fontWeight: 500 }}>Confidential DEX</span>
              </div>
              {/* Fake QR for aesthetic */}
              <div style={{ width: 40, height: 40, backgroundColor: '#fff', padding: '4px', borderRadius: '4px', display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                {Array.from({length: 16}).map((_, i) => (
                  <div key={i} style={{ width: '6px', height: '6px', backgroundColor: Math.random() > 0.5 ? '#000' : 'transparent' }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="share-modal-actions">
          <button className="btn-download" onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? 'Generating...' : 'Download Image'}
            {!isDownloading && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .share-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 200ms ease;
        }
        .share-modal-container {
          background: var(--color-bg0);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: slideInUp 200ms cubic-bezier(0.16, 1, 0.3, 1);
          max-width: 90vw;
        }
        .share-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .share-modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text1);
        }
        .btn-close-modal {
          background: none;
          border: none;
          color: var(--color-text2);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-close-modal:hover {
          background: var(--color-bg2);
          color: var(--color-text1);
        }
        .share-card-wrapper {
          display: flex;
          justify-content: center;
          background: #000;
          padding: 32px;
          border-radius: 12px;
          border: 1px dashed var(--color-border-strong);
        }
        .share-modal-actions {
          display: flex;
          justify-content: stretch;
        }
        .btn-download {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--color-accent);
          color: #000;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 150ms;
        }
        .btn-download:hover:not(:disabled) {
          opacity: 0.9;
        }
        .btn-download:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 500px) {
          .share-card-wrapper {
            padding: 16px;
            transform: scale(0.85);
            transform-origin: center top;
            margin-bottom: -40px;
          }
        }
      `}</style>
    </div>
  )
}
