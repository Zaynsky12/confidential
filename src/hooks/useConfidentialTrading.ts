import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { CONTRACTS, ABIS } from '../config/contracts'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useUSDCApproval } from './useUSDCApproval'

export function useConfidentialTrading() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })



  // Hook for USDC Approval specifically for Trading Contract
  const { 
    isApproved, 
    approveInfinite, 
    isApproving 
  } = useUSDCApproval(CONTRACTS.TRADING)

  useEffect(() => {
    if (isSuccess) {
      toast.success('Trading Transaction Successful!')
    }
  }, [isSuccess])

  const EXECUTION_FEE = parseUnits('0.013', 6) // 0.013 USDC for keeper gas

  // Open Market Position
  const openPosition = async (
    pairName: string, 
    isLong: boolean, 
    sizeUsd: number, 
    leverage: number, 
    collateralUsd: number
  ) => {
    try {
      const fee = sizeUsd * 0.0004
      const totalRequired = collateralUsd + fee
      
      if (!isApproved(totalRequired)) {
        await approveInfinite()
        await new Promise(res => setTimeout(res, 5000))
      }

      toast.loading('Creating Order Request...', { id: 'trade' })

      const { keccak256, toHex } = await import('viem')
      const pairId = keccak256(toHex(pairName))
      const sizeUnits = parseUnits(sizeUsd.toFixed(6), 6)

      const tx = await writeContractAsync({
        address: CONTRACTS.TRADING as any,
        abi: ABIS.TRADING as any,
        functionName: 'createOpenRequest',
        args: [
          pairId,
          isLong,
          sizeUnits,
          BigInt(leverage)
        ],
        value: EXECUTION_FEE,
      } as any)

      toast.dismiss('trade')
      toast.success('Order requested! Keeper will execute shortly.')
      return tx
    } catch (error: any) {
      toast.dismiss('trade')
      toast.error(error.shortMessage || 'Failed to request position')
      throw error
    }
  }

  // Close Position
  const closePosition = async (positionId: bigint) => {
    try {
      toast.loading('Creating Close Request...', { id: 'close' })
      const tx = await writeContractAsync({
        address: CONTRACTS.TRADING as any,
        abi: ABIS.TRADING as any,
        functionName: 'createCloseRequest',
        args: [positionId],
        value: EXECUTION_FEE,
      } as any)
      
      toast.dismiss('close')
      toast.success('Close requested! Keeper will execute shortly.')
      return tx
    } catch (error: any) {
      toast.dismiss('close')
      toast.error(error.shortMessage || 'Failed to request close')
      throw error
    }
  }

  // Place Limit/Stop Order
  const placeOrder = async (
    pairName: string,
    isLong: boolean,
    sizeUsd: number,
    leverage: number,
    triggerPriceUsd: number,
    orderType: number, // 0 = limit, 1 = stop
    reduceOnly: boolean
  ) => {
    try {
      const collateralUsd = sizeUsd / leverage
      const totalRequired = collateralUsd + (sizeUsd * 0.0004)
      
      if (!isApproved(totalRequired)) {
        await approveInfinite()
        await new Promise(res => setTimeout(res, 5000))
      }

      toast.loading('Placing Pending Order...', { id: 'order' })

      const { keccak256, toHex } = await import('viem')
      const pairId = keccak256(toHex(pairName))

      const sizeUnits = parseUnits(sizeUsd.toFixed(6), 6)
      const priceUnits = parseUnits(triggerPriceUsd.toFixed(18), 18)

      const tx = await writeContractAsync({
        address: CONTRACTS.TRADING as any,
        abi: ABIS.TRADING as any,
        functionName: 'placeOrder',
        args: [
          pairId,
          isLong,
          sizeUnits,
          BigInt(leverage),
          priceUnits,
          orderType,
          reduceOnly
        ],
        value: EXECUTION_FEE,
      } as any)

      toast.dismiss('order')
      toast.success('Order placed successfully!')
      return tx
    } catch (error: any) {
      toast.dismiss('order')
      toast.error(error.shortMessage || 'Failed to place order')
      throw error
    }
  }

  return {
    openPosition,
    closePosition,
    placeOrder,
    isTxPending: isPending || isConfirming || isApproving,
  }
}
