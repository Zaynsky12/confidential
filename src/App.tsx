import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Topbar from './components/Topbar'

import Trade from './pages/Trade'
import Vault from './pages/Vault'
import Portfolio from './pages/Portfolio'
import Home from './pages/Home'
import { usePythPrices } from './hooks/usePythPrices'

function PythPriceLoader() {
  usePythPrices()
  return null
}

export default function App() {
  const location = useLocation()
  const isHome = location.pathname === '/'

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
      {/* Only load Pyth prices on non-home pages to prevent trade state interference */}
      {!isHome && <PythPriceLoader />}
      {!isHome && <Topbar />}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: isHome ? 0 : 60 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/vaults" element={<Vault />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/referrals" element={<DummyPage title="Referrals" />} />
          <Route path="/points" element={<DummyPage title="Points" />} />
          <Route path="/leaderboard" element={<DummyPage title="Leaderboard" />} />
          {/* Catch-all: redirect any unknown route to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

    </>
  )
}
