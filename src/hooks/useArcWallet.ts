import { useAccount, useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import { arcTestnet } from '../config/chain'
import { useTradeStore } from '../store/useTradeStore'

export function useArcWallet() {
  const { address, isConnected, chainId } = useAccount()
  const { mockBalance, setWalletModalOpen } = useTradeStore()

  // Balance from chain
  const { data: balanceData } = useBalance({
    address: address,
    chainId: arcTestnet.id,
  })

  // Use chain balance if available, else mock
  const balance = balanceData ? Number(formatUnits(balanceData.value, balanceData.decimals)) : isConnected ? mockBalance : mockBalance

  const isWrongNetwork = isConnected && chainId !== arcTestnet.id

  const truncatedAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : ''

  const connect = () => {
    setWalletModalOpen(true)
  }

  const disconnect = async () => {
    // Wagmi disconnect handled by connector
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
