import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Topbar from './components/Topbar'
import WalletModal from './components/WalletModal'
import Trade from './pages/Trade'
import Vault from './pages/Vault'
import Portfolio from './pages/Portfolio'
import { usePythPrices } from './hooks/usePythPrices'

export default function App() {
  usePythPrices()

  const DummyPage = ({ title }: { title: string }) => (
    <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-text3)' }}>
      <h2>{title}</h2>
      <p>Coming soon...</p>
    </div>
  )

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1A1A1A',
          color: '#F2F2F2',
          border: '1px solid #333',
        }
      }} />
      <Topbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 60 }}>
        <Routes>
          <Route path="/" element={<Trade />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/referrals" element={<DummyPage title="Referrals" />} />
          <Route path="/points" element={<DummyPage title="Points" />} />
          <Route path="/leaderboard" element={<DummyPage title="Leaderboard" />} />
        </Routes>
      </main>
      <WalletModal />
    </>
  )
}
