import { createConfig } from '@privy-io/wagmi'
import { http } from 'wagmi'
import { arcTestnet } from './chain'

const rpcUrl = import.meta.env.VITE_ARC_RPC || 'https://rpc.testnet.arc.network'

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(rpcUrl, {
      timeout: 30_000,
      retryCount: 5,
      retryDelay: 1500,
      batch: true,
    }),
  },
})
