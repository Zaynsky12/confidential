import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits, parseAbi } from 'viem'
import { CONTRACTS } from '../config/contracts'
import { useUSDCApproval } from './useUSDCApproval'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

const vaultAbi = parseAbi([
  'function deposit(uint256 amount, bool isDegen) external',
  'function withdraw(uint256 shareAmount, bool isDegen) external',
  'function totalDegenAssets() external view returns (uint256)',
  'function totalPrimeAssets() external view returns (uint256)',
  'function degenSharePrice() external view returns (uint256)',
  'function primeSharePrice() external view returns (uint256)',
  'function utilization() external view returns (uint256)',
  'function availableLiquidity() external view returns (uint256)',
  'function balanceOfUnderlying(address user, bool isDegen) external view returns (uint256)',
  'function sharesOf(address user, bool isDegen) external view returns (uint256)',
  'function canWithdraw(address user, bool isDegen) external view returns (bool)'
])

export function useConfidentialVault() {
  const { address } = useAccount()
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const { isApproved, approveInfinite, isApproving } = useUSDCApproval(CONTRACTS.VAULT)

  // Auto-refetch all data after successful transaction
  const refetchAll = () => {
    refDegenAssets(); refPrimeAssets(); refDegenPrice(); refPrimePrice();
    refDegenShares(); refPrimeShares(); refDegenBal(); refPrimeBal();
    refUtil(); refAvailLiq(); refCanWdDegen(); refCanWdPrime();
  }

  useEffect(() => {
    if (isSuccess) {
      toast.success('Vault Transaction Successful!')
      refetchAll()
    }
  }, [isSuccess])

  // --- Degen Tranche Reads ---
  const { data: degenAssets, refetch: refDegenAssets } = useReadContract({
    address: CONTRACTS.VAULT, abi: vaultAbi, functionName: 'totalDegenAssets'
  })
  const { data: degenSharePrice, refetch: refDegenPrice } = useReadContract({
    address: CONTRACTS.VAULT, abi: vaultAbi, functionName: 'degenSharePrice'
  })
  const { data: userDegenShares, refetch: refDegenShares } = useReadContract({
    address: CONTRACTS.VAULT, abi: vaultAbi, functionName: 'sharesOf', args: address ? [address, true] : undefined
  })
  const { data: userDegenUnderlying, refetch: refDegenBal } = useReadContract({
    address: CONTRACTS.VAULT, abi: vaultAbi, functionName: 'balanceOfUnderlying', args: address ? [address, true] : undefined
  })

  // --- Prime Tranche Reads ---
  const { data: primeAssets, refetch: refPrimeAssets } = useReadContract({
    address: CONTRACTS.VAULT, abi: vaultAbi, functionName: 'totalPrimeAssets'
  })
  const { data: primeSharePrice, refetch: refPrimePrice } = useReadContract({
    address: CONTRACTS.VAULT, abi: vaultAbi, functionName: 'primeSharePrice'
  })
  const { data: userPrimeShares, refetch: refPrimeShares } = useReadContract({
    address: CONTRACTS.VAULT, abi: vaultAbi, functionName: 'sharesOf', args: address ? [address, false] : undefined
  })
  const { data: userPrimeUnderlying, refetch: refPrimeBal } = useReadContract({
    address: CONTRACTS.VAULT, abi: vaultAbi, functionName: 'balanceOfUnderlying', args: address ? [address, false] : undefined
  })

  const { data: utilization, refetch: refUtil } = useReadContract({
    address: CONTRACTS.VAULT, abi: vaultAbi, functionName: 'utilization'
  })
  const { data: availableLiquidityData, refetch: refAvailLiq } = useReadContract({
    address: CONTRACTS.VAULT, abi: vaultAbi, functionName: 'availableLiquidity'
  })
  const { data: canWithdrawDegen, refetch: refCanWdDegen } = useReadContract({
    address: CONTRACTS.VAULT, abi: vaultAbi, functionName: 'canWithdraw', args: address ? [address, true] : undefined
  })
  const { data: canWithdrawPrime, refetch: refCanWdPrime } = useReadContract({
    address: CONTRACTS.VAULT, abi: vaultAbi, functionName: 'canWithdraw', args: address ? [address, false] : undefined
  })

  const deposit = async (amountUsdc: number, isDegen: boolean) => {
    try {
      if (!isApproved(amountUsdc)) await approveInfinite()
      toast.loading(`Depositing to ${isDegen ? 'Degen' : 'Prime'} Vault...`, { id: 'deposit' })
      const tx = await writeContractAsync({
        address: CONTRACTS.VAULT as any, abi: vaultAbi as any, functionName: 'deposit',
        args: [parseUnits(amountUsdc.toString(), 6), isDegen],
      } as any)
      toast.dismiss('deposit')
      return tx
    } catch (e: any) {
      toast.dismiss('deposit')
      toast.error(e.shortMessage || 'Failed to deposit')
      throw e
    }
  }

  const withdraw = async (amountShares: number, isDegen: boolean) => {
    try {
      toast.loading(`Withdrawing from ${isDegen ? 'Degen' : 'Prime'} Vault...`, { id: 'withdraw' })
      
      const sharesData = isDegen ? userDegenShares : userPrimeShares
      if (!sharesData) throw new Error("Shares not loaded")
      
      const sharesNum = Number(formatUnits(sharesData as bigint, 6))
      if (amountShares > sharesNum) throw new Error("Insufficient shares")

      let shareAmount: bigint
      if (amountShares >= sharesNum * 0.999) {
        shareAmount = sharesData as bigint
      } else {
        shareAmount = parseUnits(amountShares.toString(), 6)
      }

      const tx = await writeContractAsync({
        address: CONTRACTS.VAULT as any, abi: vaultAbi as any, functionName: 'withdraw',
        args: [shareAmount, isDegen],
      } as any)
      
      toast.dismiss('withdraw')
      return tx
    } catch (e: any) {
      toast.dismiss('withdraw')
      toast.error(e.shortMessage || 'Failed to withdraw')
      throw e
    }
  }

  return {
    deposit, withdraw,
    degenTvlUsd: degenAssets ? Number(formatUnits(degenAssets as bigint, 6)) : 0,
    primeTvlUsd: primeAssets ? Number(formatUnits(primeAssets as bigint, 6)) : 0,
    degenSharePrice: degenSharePrice ? Number(formatUnits(degenSharePrice as bigint, 6)) : 1,
    primeSharePrice: primeSharePrice ? Number(formatUnits(primeSharePrice as bigint, 6)) : 1,
    userDegenShares: userDegenShares ? Number(formatUnits(userDegenShares as bigint, 6)) : 0,
    userPrimeShares: userPrimeShares ? Number(formatUnits(userPrimeShares as bigint, 6)) : 0,
    userDegenUsd: userDegenUnderlying ? Number(formatUnits(userDegenUnderlying as bigint, 6)) : 0,
    userPrimeUsd: userPrimeUnderlying ? Number(formatUnits(userPrimeUnderlying as bigint, 6)) : 0,
    utilization: utilization ? Number(utilization as bigint) / 100 : 0,
    availableLiquidity: availableLiquidityData ? Number(formatUnits(availableLiquidityData as bigint, 6)) : 0,
    canWithdrawDegen: !!canWithdrawDegen,
    canWithdrawPrime: !!canWithdrawPrime,
    isPending: isPending || isConfirming || isApproving,
    refetchAll
  }
}
