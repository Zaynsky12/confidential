import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { CONTRACTS, ABIS } from '../config/contracts'
import { useUSDCApproval } from './useUSDCApproval'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

export function useConfidentialVault() {
  const { address } = useAccount()
  const { writeContractAsync, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const { isApproved, approveInfinite, isApproving } = useUSDCApproval(CONTRACTS.VAULT)

  useEffect(() => {
    if (isSuccess) {
      toast.success('Vault Transaction Successful!')
    }
  }, [isSuccess])

  // Read Vault TVL (Total Assets)
  const { data: totalAssets, refetch: refetchTvl } = useReadContract({
    address: CONTRACTS.VAULT,
    abi: ABIS.VAULT,
    functionName: 'totalAssets',
  })

  // Read User cVAULT balance
  const { data: cVaultBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.VAULT,
    abi: ABIS.VAULT,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Read user pending withdrawals
  const { data: withdrawalInfo, refetch: refetchWithdrawal } = useReadContract({
    address: CONTRACTS.VAULT,
    abi: ABIS.VAULT,
    functionName: 'withdrawals',
    args: address ? [address] : undefined,
  })

  const deposit = async (amountUsdc: number) => {
    try {
      if (!isApproved(amountUsdc)) {
        await approveInfinite()
      }

      toast.loading('Depositing to Vault...', { id: 'deposit' })
      const amountUnits = parseUnits(amountUsdc.toString(), 6)

      const tx = await writeContractAsync({
        address: CONTRACTS.VAULT as any,
        abi: ABIS.VAULT as any,
        functionName: 'deposit',
        args: [amountUnits, address],
      } as any)
      toast.dismiss('deposit')
      return tx
    } catch (error: any) {
      toast.dismiss('deposit')
      toast.error(error.shortMessage || 'Failed to deposit')
      throw error
    }
  }

  const requestWithdrawal = async (amountCVault: number) => {
    try {
      toast.loading('Requesting Withdrawal...', { id: 'withdraw' })
      const amountUnits = parseUnits(amountCVault.toString(), 6)

      const tx = await writeContractAsync({
        address: CONTRACTS.VAULT as any,
        abi: ABIS.VAULT as any,
        functionName: 'requestWithdrawal',
        args: [amountUnits],
      } as any)
      toast.dismiss('withdraw')
      return tx
    } catch (error: any) {
      toast.dismiss('withdraw')
      toast.error(error.shortMessage || 'Failed to request withdrawal')
      throw error
    }
  }

  const completeWithdrawal = async () => {
    try {
      toast.loading('Completing Withdrawal...', { id: 'complete' })
      const tx = await writeContractAsync({
        address: CONTRACTS.VAULT as any,
        abi: ABIS.VAULT as any,
        functionName: 'completeWithdrawal',
      } as any)
      toast.dismiss('complete')
      return tx
    } catch (error: any) {
      toast.dismiss('complete')
      toast.error(error.shortMessage || 'Failed to complete withdrawal')
      throw error
    }
  }

  return {
    deposit,
    requestWithdrawal,
    completeWithdrawal,
    tvlUsd: totalAssets ? Number(formatUnits(totalAssets as bigint, 6)) : 0,
    userCVault: cVaultBalance ? Number(formatUnits(cVaultBalance as bigint, 6)) : 0,
    withdrawalInfo: withdrawalInfo as any,
    isPending: isPending || isConfirming || isApproving,
    refetchAll: () => {
      refetchTvl()
      refetchBalance()
      refetchWithdrawal()
    }
  }
}
