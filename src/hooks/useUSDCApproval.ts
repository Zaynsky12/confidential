import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { parseUnits, maxUint256 } from 'viem'
import { CONTRACTS, ABIS } from '../config/contracts'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

export function useUSDCApproval(spenderAddress: `0x${string}`) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()

  // Read current allowance
  const { data: allowance, refetch } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ABIS.USDC,
    functionName: 'allowance',
    args: address ? [address, spenderAddress] : undefined,
    query: {
      enabled: isConnected && !!address,
    }
  })

  // Write contract for approval
  const { writeContractAsync, data: hash, isPending } = useWriteContract()

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    if (isSuccess) {
      refetch()
    }
  }, [isSuccess, refetch])

  // Helper to check if approval is needed for a specific amount
  // amountUsdc is expected to be a number (e.g. 100 for $100)
  const isApproved = (amountUsdc: number) => {
    if (!allowance) return false
    const required = parseUnits(amountUsdc.toFixed(6), 6) // USDC has 6 decimals
    return (allowance as bigint) >= required
  }

  // Request infinite approval
  const approveInfinite = async () => {
    try {
      toast.loading('⚡ Approving USDC... Please sign in wallet', { id: 'approve' })
      const tx = await writeContractAsync({
        address: CONTRACTS.USDC as any,
        abi: ABIS.USDC as any,
        functionName: 'approve',
        args: [spenderAddress, maxUint256],
      } as any)
      
      toast.loading('⏳ Waiting for blockchain confirmation...', { id: 'approve' })
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx })
      }
      
      toast.success('✨ USDC Approved Successfully', { id: 'approve' })
      refetch() // Fetch the updated allowance immediately
      return tx
    } catch (error) {
      toast.error('❌ Approval failed or rejected', { id: 'approve' })
      console.error('Approval error:', error)
      throw error
    }
  }

  return {
    allowance: allowance as bigint | undefined,
    isApproved,
    approveInfinite,
    isApproving: isPending || isConfirming,
    refetchAllowance: refetch
  }
}
