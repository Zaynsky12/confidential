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

  // Read User cVAULT shares
  const { data: sharesData, refetch: refetchShares } = useReadContract({
    address: CONTRACTS.VAULT,
    abi: ABIS.VAULT,
    functionName: 'shares',
    args: address ? [address] : undefined,
  })

  // Read User balance in USDC value
  const { data: underlyingBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.VAULT,
    abi: ABIS.VAULT,
    functionName: 'balanceOfUnderlying',
    args: address ? [address] : undefined,
  })

  // Read Share Price
  const { data: sharePriceData, refetch: refetchSharePrice } = useReadContract({
    address: CONTRACTS.VAULT,
    abi: ABIS.VAULT,
    functionName: 'sharePrice',
  })

  // Read Utilization
  const { data: utilizationData, refetch: refetchUtilization } = useReadContract({
    address: CONTRACTS.VAULT,
    abi: ABIS.VAULT,
    functionName: 'utilization',
  })

  // Read Available Liquidity
  const { data: availableLiquidityData, refetch: refetchAvailableLiquidity } = useReadContract({
    address: CONTRACTS.VAULT,
    abi: ABIS.VAULT,
    functionName: 'availableLiquidity',
  })

  // Read if user can withdraw (lockup expired)
  const { data: canWithdrawData, refetch: refetchCanWithdraw } = useReadContract({
    address: CONTRACTS.VAULT,
    abi: ABIS.VAULT,
    functionName: 'canWithdraw',
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
        args: [amountUnits],
      } as any)
      toast.dismiss('deposit')
      return tx
    } catch (error: any) {
      toast.dismiss('deposit')
      toast.error(error.shortMessage || 'Failed to deposit')
      throw error
    }
  }

  const withdraw = async (amountShares: number) => {
    try {
      if (!sharesData) throw new Error("Vault balances not loaded")
      
      const sharesNum = Number(formatUnits(sharesData as bigint, 6))
      if (amountShares > sharesNum) throw new Error("Insufficient cUSDC balance")

      toast.loading('Withdrawing from Vault...', { id: 'withdraw' })

      let shareAmount: bigint
      // If user is withdrawing MAX or close to MAX, burn all shares to avoid dust
      if (amountShares >= sharesNum * 0.999) {
        shareAmount = sharesData as bigint
      } else {
        shareAmount = parseUnits(amountShares.toString(), 6)
      }

      const tx = await writeContractAsync({
        address: CONTRACTS.VAULT as any,
        abi: ABIS.VAULT as any,
        functionName: 'withdraw',
        args: [shareAmount],
      } as any)
      
      toast.dismiss('withdraw')
      return tx
    } catch (error: any) {
      toast.dismiss('withdraw')
      toast.error(error.shortMessage || 'Failed to withdraw')
      throw error
    }
  }

  return {
    deposit,
    withdraw,
    tvlUsd: totalAssets ? Number(formatUnits(totalAssets as bigint, 6)) : 0,
    userCVault: underlyingBalance ? Number(formatUnits(underlyingBalance as bigint, 6)) : 0,
    userCVaultShares: sharesData ? Number(formatUnits(sharesData as bigint, 6)) : 0,
    canWithdraw: !!canWithdrawData,
    sharePrice: sharePriceData ? Number(formatUnits(sharePriceData as bigint, 6)) : 1,
    utilization: utilizationData ? Number(utilizationData as bigint) / 100 : 0, // basis points to percentage
    availableLiquidity: availableLiquidityData ? Number(formatUnits(availableLiquidityData as bigint, 6)) : 0,
    isPending: isPending || isConfirming || isApproving,
    refetchAll: () => {
      refetchTvl()
      refetchShares()
      refetchBalance()
      refetchSharePrice()
      refetchUtilization()
      refetchAvailableLiquidity()
      refetchCanWithdraw()
    }
  }
}
