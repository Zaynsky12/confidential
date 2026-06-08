import { useAccount, useDisconnect, useReadContract, useBalance } from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import { formatUnits } from 'viem'
import { CONTRACTS, ABIS } from '../config/contracts'
import { arcTestnet } from '../config/chain'
import { useTradeStore } from '../store/useTradeStore'

export function useArcWallet() {
  const { address: wagmiAddress, isConnected: wagmiConnected, chainId } = useAccount()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const { authenticated, user, logout: privyLogout, login } = usePrivy()


  const privyAddress = user?.wallet?.address
  const privyEmail = user?.email?.address
  const address = wagmiAddress || privyAddress
  const isConnected = wagmiConnected || authenticated

  // Balance from chain (USDC)
  const { data: balanceData } = useReadContract({
    address: CONTRACTS.USDC as any,
    abi: ABIS.USDC as any,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Native balance (for debugging)
  const { data: nativeBalance } = useBalance({ address: address as any })

  // Use chain balance if available, else 0
  const balance = typeof balanceData !== 'undefined' ? Number(formatUnits(balanceData as bigint, 6)) : 0
  
  if (address) {
    console.log('[DEBUG] Native Balance:', nativeBalance?.formatted, nativeBalance?.symbol)
    console.log('[DEBUG] ERC20 USDC Balance:', balance)
  }

  const isWrongNetwork = isConnected && chainId !== arcTestnet.id

  const truncatedAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : privyEmail
      ? privyEmail.length > 15 ? `${privyEmail.slice(0, 12)}...` : privyEmail
      : 'Loading...'

  const connect = () => {
    login()
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
