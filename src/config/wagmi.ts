import { createConfig } from '@privy-io/wagmi'
import { http } from 'wagmi'
import { arcTestnet } from './chain'

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(import.meta.env.VITE_ARC_RPC || 'https://rpc.testnet.arc.io'),
  },
})
