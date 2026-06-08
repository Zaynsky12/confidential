import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, maxUint256 } from 'viem'
import { CONTRACTS, ABIS } from '../config/contracts'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

export function useUSDCApproval(spenderAddress: `0x${string}`) {
  const { address, isConnected } = useAccount()

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
      toast.success('USDC Approval Successful!')
      refetch()
    }
  }, [isSuccess, refetch])

  // Helper to check if approval is needed for a specific amount
  // amountUsdc is expected to be a number (e.g. 100 for $100)
  const isApproved = (amountUsdc: number) => {
    if (!allowance) return false
    const required = parseUnits(amountUsdc.toString(), 6) // USDC has 6 decimals
    return (allowance as bigint) >= required
  }

  // Request infinite approval
  const approveInfinite = async () => {
    try {
      toast.loading('Requesting approval...', { id: 'approve' })
      const tx = await writeContractAsync({
        address: CONTRACTS.USDC,
        abi: ABIS.USDC,
        functionName: 'approve',
        args: [spenderAddress, maxUint256],
      })
      toast.dismiss('approve')
      return tx
    } catch (error) {
      toast.dismiss('approve')
      toast.error('Approval failed or rejected')
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
