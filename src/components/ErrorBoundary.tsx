import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#0b0e11',
          color: '#fff',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{
            background: 'rgba(229, 95, 72, 0.1)',
            border: '1px solid rgba(229, 95, 72, 0.3)',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600 }}>
              Something went wrong
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '0 0 16px' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                // Clear persisted state that might be corrupt
                try {
                  localStorage.removeItem('arc-trade-storage')
                  localStorage.removeItem('privy:token')
                  localStorage.removeItem('privy:refresh_token')
                  localStorage.removeItem('privy:id_token')
                  localStorage.removeItem('privy:session')
                } catch {}
                window.location.reload()
              }}
              style={{
                background: '#e55f48',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                marginRight: '8px',
              }}
            >
              Clear Cache & Reload
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
          <details style={{ marginTop: '16px', color: 'rgba(255,255,255,0.3)', fontSize: '12px', maxWidth: '480px', width: '100%' }}>
            <summary style={{ cursor: 'pointer' }}>Technical Details</summary>
            <pre style={{ textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: '8px' }}>
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}
