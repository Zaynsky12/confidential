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
    collateralUsd: number,
    tpPriceUsd: number = 0,
    slPriceUsd: number = 0,
    triggerPriceUsd: number = 0
  ) => {
    try {
      const fee = sizeUsd * 0.0004
      const totalRequired = collateralUsd + fee
      
      if (!isApproved(totalRequired)) {
        await approveInfinite()
        await new Promise(res => setTimeout(res, 5000))
      }

      toast.loading('Creating Market Order...', { id: 'trade' })

      const { keccak256, toHex } = await import('viem')
      const pairId = keccak256(toHex(pairName))
      const sizeUnits = parseUnits(sizeUsd.toFixed(6), 6)
      const tpUnits = tpPriceUsd > 0 ? parseUnits(tpPriceUsd.toFixed(18), 18) : 0n
      const slUnits = slPriceUsd > 0 ? parseUnits(slPriceUsd.toFixed(18), 18) : 0n
      const triggerUnits = triggerPriceUsd > 0 ? parseUnits(triggerPriceUsd.toFixed(18), 18) : 0n

      const tx = await writeContractAsync({
        address: CONTRACTS.TRADING as any,
        abi: ABIS.TRADING as any,
        functionName: 'placeOrder',
        args: [
          pairId,
          isLong,
          sizeUnits,
          BigInt(leverage),
          triggerUnits, // Used for market order slippage check
          2,  // orderType 2 = market_open
          false, // reduceOnly false for open
          tpUnits,
          slUnits
        ],
        value: EXECUTION_FEE,
      } as any)

      toast.dismiss('trade')
      toast.success('Market Order requested! Keeper will execute shortly.')
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
    reduceOnly: boolean,
    tpPriceUsd: number = 0,
    slPriceUsd: number = 0
  ) => {
    try {
      const collateralUsd = sizeUsd / leverage
      // fee calculation logic depends on orderType (0 = maker, 1 = taker)
      const feeRate = orderType === 0 ? 0.0002 : 0.0004
      const totalRequired = collateralUsd + (sizeUsd * feeRate)
      
      if (!isApproved(totalRequired)) {
        await approveInfinite()
        await new Promise(res => setTimeout(res, 5000))
      }

      toast.loading('Placing Pending Order...', { id: 'order' })

      const { keccak256, toHex } = await import('viem')
      const pairId = keccak256(toHex(pairName))

      const sizeUnits = parseUnits(sizeUsd.toFixed(6), 6)
      const priceUnits = parseUnits(triggerPriceUsd.toFixed(18), 18)
      const tpUnits = tpPriceUsd > 0 ? parseUnits(tpPriceUsd.toFixed(18), 18) : 0n
      const slUnits = slPriceUsd > 0 ? parseUnits(slPriceUsd.toFixed(18), 18) : 0n

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
          reduceOnly,
          tpUnits,
          slUnits
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

  // Create TWAP Order
  const createTwapOrder = async (
    pairName: string,
    isLong: boolean,
    totalSizeUsd: number,
    leverage: number,
    slices: number,
    intervalSec: number,
    tpPriceUsd: number = 0,
    slPriceUsd: number = 0
  ) => {
    try {
      const collateralUsd = totalSizeUsd / leverage
      const totalRequired = collateralUsd + (totalSizeUsd * 0.0004)
      
      if (!isApproved(totalRequired)) {
        await approveInfinite()
        await new Promise(res => setTimeout(res, 5000))
      }

      toast.loading('Creating TWAP Order...', { id: 'twap' })

      const { keccak256, toHex } = await import('viem')
      const pairId = keccak256(toHex(pairName))

      const sizeUnits = parseUnits(totalSizeUsd.toFixed(6), 6)
      const tpUnits = tpPriceUsd > 0 ? parseUnits(tpPriceUsd.toFixed(18), 18) : 0n
      const slUnits = slPriceUsd > 0 ? parseUnits(slPriceUsd.toFixed(18), 18) : 0n

      const tx = await writeContractAsync({
        address: CONTRACTS.TRADING as any,
        abi: ABIS.TRADING as any,
        functionName: 'createTwapOrder',
        args: [
          pairId,
          isLong,
          sizeUnits,
          BigInt(leverage),
          BigInt(slices),
          BigInt(intervalSec),
          tpUnits,
          slUnits
        ],
        value: EXECUTION_FEE,
      } as any)

      toast.dismiss('twap')
      toast.success('TWAP Order created successfully!')
      return tx
    } catch (error: any) {
      toast.dismiss('twap')
      toast.error(error.shortMessage || 'Failed to create TWAP order')
      throw error
    }
  }

  return {
    openPosition,
    closePosition,
    placeOrder,
    createTwapOrder,
    isTxPending: isPending || isConfirming || isApproving,
  }
}
