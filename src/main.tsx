import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { http, createConfig } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { arcTestnet } from './config/chain'
import App from './App'
import './index.css'
import './i18n'

const queryClient = new QueryClient()

const wagmiConfig = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(import.meta.env.VITE_ARC_RPC || 'https://rpc.testnet.arc.network'),
  },
  connectors: [
    injected(),
    walletConnect({ projectId: '3fcc6bba6f1de962d911bb5b5c3dba68' }) // placeholder public project ID
  ]
})

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'insert-your-privy-app-id-here'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet'],
        defaultChain: arcTestnet,
        supportedChains: [arcTestnet],
        appearance: {
          theme: 'dark',
          accentColor: '#0052FF',
          logo: '/logo.png', // Updated logo
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          }
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  </React.StrictMode>,
)
