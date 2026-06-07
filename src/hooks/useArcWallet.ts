import { useAccount, useBalance, useDisconnect } from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import { formatUnits } from 'viem'
import { arcTestnet } from '../config/chain'
import { useTradeStore } from '../store/useTradeStore'

export function useArcWallet() {
  const { address: wagmiAddress, isConnected: wagmiConnected, chainId } = useAccount()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const { authenticated, user, logout: privyLogout } = usePrivy()
  const { mockBalance, setWalletModalOpen } = useTradeStore()

  const privyAddress = user?.wallet?.address
  const privyEmail = user?.email?.address
  const address = wagmiAddress || privyAddress
  const isConnected = wagmiConnected || authenticated

  // Balance from chain
  const { data: balanceData } = useBalance({
    address: address as any,
    chainId: arcTestnet.id,
  })

  // Use chain balance if available, else mock
  const balance = balanceData ? Number(formatUnits(balanceData.value, balanceData.decimals)) : isConnected ? mockBalance : mockBalance

  const isWrongNetwork = isConnected && chainId !== arcTestnet.id

  const truncatedAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : privyEmail
      ? privyEmail.length > 15 ? `${privyEmail.slice(0, 12)}...` : privyEmail
      : 'Loading...'

  const connect = () => {
    setWalletModalOpen(true)
  }

  const disconnect = async () => {
    wagmiDisconnect()
    await privyLogout()
  }

  return {
    address,
    isConnected,
    balance,
    isWrongNetwork,
    truncatedAddress,
    connect,
    disconnect,
    ready: true,
    chainId,
  }
}
