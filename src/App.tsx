import { Routes, Route } from 'react-router-dom'
import Topbar from './components/Topbar'
import WalletModal from './components/WalletModal'
import Trade from './pages/Trade'
import Vault from './pages/Vault'
import Portfolio from './pages/Portfolio'
import { useMockPrices } from './hooks/useMockPrices'

export default function App() {
  useMockPrices()

  const DummyPage = ({ title }: { title: string }) => (
    <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-text3)' }}>
      <h2>{title}</h2>
      <p>Coming soon...</p>
    </div>
  )

  return (
    <>
      <Topbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
