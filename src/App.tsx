import { Routes, Route } from 'react-router-dom'
import Topbar from './components/Topbar'
import WalletModal from './components/WalletModal'
import Trade from './pages/Trade'
import Vault from './pages/Vault'
import Portfolio from './pages/Portfolio'
import Bridge from './pages/Bridge'
import { useMockPrices } from './hooks/useMockPrices'

export default function App() {
  useMockPrices()

  return (
    <>
      <Topbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Trade />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/bridge" element={<Bridge />} />
        </Routes>
      </main>
      <WalletModal />
    </>
  )
}
