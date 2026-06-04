import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { http, createConfig } from 'wagmi'
import { arcTestnet } from './config/chain'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

// Use wagmi directly (without Privy wrapper) so the app works 
// even without a valid Privy App ID. When Privy is configured,
// swap to @privy-io/wagmi imports.
const wagmiConfig = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(import.meta.env.VITE_ARC_RPC || 'https://rpc.testnet.arc.io'),
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
