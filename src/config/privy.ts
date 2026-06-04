import type { PrivyClientConfig } from '@privy-io/react-auth'
import { arcTestnet } from './chain'

export const privyConfig: PrivyClientConfig = {
  defaultChain: arcTestnet,
  supportedChains: [arcTestnet],
  loginMethods: ['email', 'wallet'],
  appearance: {
    theme: 'dark',
    accentColor: '#0052FF',
  },
}
