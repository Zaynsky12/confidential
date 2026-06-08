import { useState, useEffect, useRef } from 'react'
import { useTradeStore } from '../store/useTradeStore'

import { useLoginWithEmail, usePrivy } from '@privy-io/react-auth'

type Tab = 'wallet' | 'email'
type EmailStep = 'input' | 'otp' | 'loading'

const WALLETS = [
  { id:'metamask', name:'MetaMask', desc:'Connect using MetaMask', featured:false,
    icon: <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#1a1a2e"/><path d="M24 8l-7 5.2 1.3-3L24 8z" fill="#E2761B"/><path d="M8 8l6.9 5.3L13.7 10.2 8 8z" fill="#E4761B"/><path d="M22 20.8l-1.9 2.9 4-1.1 1.1-3.9-3.2 2.1zM6.8 18.7l1.1 3.9 4 1.1-1.9-2.9-3.2-2.1z" fill="#E4761B"/></svg> },
  { id:'rabby', name:'Rabby Wallet', desc:'Multi-chain DeFi wallet', featured:false,
    icon: <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#7C6DEB"/><circle cx="16" cy="14" r="6" fill="#fff" opacity="0.9"/><ellipse cx="16" cy="22" rx="8" ry="3" fill="#fff" opacity="0.6"/></svg> },
  { id:'ledger', name:'Ledger', desc:'Hardware wallet', featured:false,
    icon: <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#000"/><rect x="8" y="8" width="10" height="16" rx="2" fill="none" stroke="#fff" strokeWidth="1.5"/><rect x="18" y="18" width="6" height="6" rx="1" fill="#fff"/></svg> },
  { id:'walletconnect', name:'WalletConnect', desc:'Scan QR code', featured:false,
    icon: <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#3B99FC"/><path d="M10.5 13c3-3 7.8-3 10.8 0" stroke="#fff" strokeWidth="1.5"/><path d="M12.5 16c2-2 5-2 7 0" stroke="#fff" strokeWidth="1.5"/><circle cx="16" cy="19" r="1.5" fill="#fff"/></svg> },
]

export default function WalletModal() {
  const { isWalletModalOpen, setWalletModalOpen } = useTradeStore()
  const [activeTab, setActiveTab] = useState<Tab>('wallet')
  const [emailStep, setEmailStep] = useState<EmailStep>('input')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['','','','','',''])
  const otpRefs = useRef<(HTMLInputElement|null)[]>([])
  const { login } = usePrivy()

  const { sendCode, loginWithCode } = useLoginWithEmail({
    onComplete: () => {
      setWalletModalOpen(false)
      setTimeout(() => {
        setActiveTab('wallet')
        setEmailStep('input')
        setEmail('')
        setOtp(['','','','','',''])
      }, 300)
    },
    onError: (error) => {
      console.error('Privy Login Error:', error)
      setEmailStep('input') // Fallback on error
    }
  })

  useEffect(()=>{
    if(!isWalletModalOpen){ setActiveTab('wallet'); setEmailStep('input'); setEmail(''); setOtp(['','','','','','']) }
  },[isWalletModalOpen])

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{ if(e.key==='Escape') setWalletModalOpen(false) }
    document.addEventListener('keydown',h); return ()=>document.removeEventListener('keydown',h)
  },[setWalletModalOpen])

  if(!isWalletModalOpen) return null

  const handleWallet = ()=>{
    setWalletModalOpen(false)
    login() // Delegate to Privy's native modal
  }

  const handleOtpChange = (i:number,v:string)=>{
    if(!/^\d*$/.test(v)) return
    const n=[...otp]; n[i]=v.slice(-1); setOtp(n)
    if(v&&i<5) otpRefs.current[i+1]?.focus()
  }



  return (
    <div onClick={()=>setWalletModalOpen(false)}
      style={{ position:'fixed',inset:0,zIndex:2000,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeIn 150ms ease' }}>
      <div onClick={e=>e.stopPropagation()} className="wallet-modal-content animate-fade-in-up">
        {/* Header */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px 0' }}>
          <h2 style={{ fontSize:18,fontWeight:600 }}>Connect to Confidential</h2>
          <button onClick={()=>setWalletModalOpen(false)} style={{ width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6,cursor:'pointer',color:'var(--color-text3)',transition:'all 200ms',background:'none',border:'none' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex',padding:'16px 24px 0',borderBottom:'1px solid var(--color-border)' }}>
          {(['wallet','email'] as Tab[]).map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)}
              style={{ flex:1,padding:10,fontSize:14,fontWeight:500,cursor:'pointer',textAlign:'center',transition:'all 200ms',borderBottom: activeTab===t?'2px solid var(--color-accent)':'2px solid transparent',
                color: activeTab===t?'var(--color-text1)':'var(--color-text3)',background:'none',border:'none',borderBottomStyle:'solid',borderBottomWidth:2,borderBottomColor: activeTab===t?'var(--color-accent)':'transparent' }}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding:'20px 24px',overflowY:'auto',minHeight:200 }}>
          {activeTab==='wallet' && (
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              {WALLETS.map(w=>(
                <button key={w.id} onClick={()=>handleWallet()}
                  style={{ display:'flex',alignItems:'center',gap:14,padding:'12px 14px',borderRadius:8,cursor:'pointer',transition:'all 200ms',textAlign:'left',width:'100%',
                    border: w.featured?'1px solid rgba(0,82,255,0.3)':'1px solid transparent',
                    background: w.featured?'rgba(0,82,255,0.05)':'transparent',color:'var(--color-text1)' }}>
                  <div style={{ flexShrink:0 }}>{w.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14,fontWeight:500,display:'flex',alignItems:'center',gap:8 }}>
                      {w.name}
                      {w.featured && <span className="badge badge-accent" style={{ fontSize:9,padding:'1px 6px' }}>Recommended</span>}
                    </div>
                    <div style={{ fontSize:12,color:'var(--color-text3)',marginTop:2 }}>{w.desc}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0,opacity:0.4 }}><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              ))}
            </div>
          )}

          {activeTab==='email' && emailStep==='input' && (
            <div style={{ display:'flex',flexDirection:'column', gap:'16px' }}>
              <p style={{ fontSize:16, fontWeight: 'normal', color:'var(--color-text1)' }}>
                Log in or sign up
              </p>
              <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} autoFocus
                style={{ width:'100%',padding:'12px 16px',background:'transparent',border:'1px solid var(--color-border-strong)',borderRadius:12,fontSize:15,color:'var(--color-text1)', outline: 'none' }} 
              />
              <button className="btn btn-primary" style={{ width:'100%',padding:'12px',borderRadius:12,fontSize:15,fontWeight:600,background:'var(--color-text1)',color:'var(--color-bg0)',opacity:email.includes('@')?1:0.5, border:'none', cursor:email.includes('@')?'pointer':'not-allowed' }} onClick={async ()=>{ if(email.includes('@')){ setEmailStep('loading'); try { await sendCode({email}); setEmailStep('otp'); } catch(e) { /* error handled by onError */ } } }}>
                Continue with email
              </button>
              <div style={{ textAlign:'center', marginTop: '8px' }}>
                 <span style={{ fontSize: 12, color: 'var(--color-text3)' }}>By continuing, you agree to our Terms of Service.</span>
              </div>
            </div>
          )}

          {activeTab==='email' && emailStep==='otp' && (
            <div className="animate-slide-in-right" style={{ display:'flex',flexDirection:'column' }}>
              <p style={{ fontSize:20,fontWeight:600,color:'var(--color-text1)',marginBottom:8 }}>Check your email</p>
              <p style={{ fontSize:14,color:'var(--color-text2)',marginBottom:24,lineHeight:1.5 }}>
                We sent a verification code to <strong>{email}</strong>
              </p>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8,marginBottom:24 }}>
                {otp.map((d,i)=>(
                  <input key={i} ref={el=>{otpRefs.current[i]=el}} type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={e=>handleOtpChange(i,e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Backspace'&&!otp[i]&&i>0) otpRefs.current[i-1]?.focus() }}
                    className="font-mono" autoFocus={i===0}
                    style={{ width:'100%',height:48,textAlign:'center',fontSize:20,background:'transparent',border:'1px solid var(--color-border-strong)',borderRadius:12,color:'var(--color-text1)', outline:'none' }} />
                ))}
              </div>
              <button className="btn btn-primary" style={{ width:'100%',padding:'12px',borderRadius:12,fontSize:15,fontWeight:600,background:'var(--color-text1)',color:'var(--color-bg0)',marginBottom:16,opacity:otp.every(d=>d)?1:0.5, border:'none' }}
                onClick={()=>{ if(otp.every(d=>d)){ setEmailStep('loading'); loginWithCode({code: otp.join('')}); } }}>
                Submit
              </button>
              <button className="btn btn-ghost" style={{ width:'100%',fontSize:13, color:'var(--color-text2)' }} onClick={async ()=>{ setEmailStep('loading'); try { await sendCode({email}); setEmailStep('otp'); } catch(e) { } }}>Resend code</button>
            </div>
          )}

          {activeTab==='email' && emailStep==='loading' && (
            <div style={{ textAlign:'center',padding:'40px 20px' }}>
              <div style={{ width:40,height:40,border:'3px solid var(--color-border-strong)',borderTopColor:'var(--color-text1)',borderRadius:'50%',margin:'0 auto',animation:'spin 0.8s linear infinite' }} />
              <p style={{ fontSize:15,fontWeight:500,color:'var(--color-text1)',marginTop:20 }}>Logging in...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 24px',borderTop:'1px solid var(--color-border)',textAlign:'center',fontSize:11,color:'var(--color-text3)',letterSpacing:0.5 }}>
          Confidential L1 · Chain ID 5042002 · Testnet
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        .wallet-modal-content {
          width: 420px;
          max-height: 90vh;
          background: var(--color-bg2);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          box-shadow: var(--shadow-modal);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        @media (max-width: 480px) {
          .wallet-modal-content {
            width: calc(100% - 24px);
            max-width: 420px;
            border-radius: 12px;
            max-height: 85vh;
          }
        }
      `}</style>
    </div>
  )
}
