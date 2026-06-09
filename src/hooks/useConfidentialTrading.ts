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

  // Open Market Position
  const openPosition = async (
    pairName: string, 
    isLong: boolean, 
    sizeUsd: number, 
    leverage: number, 
    collateralUsd: number
  ) => {
    try {
      // 1. Check Approval
      // We check if we have enough allowance for the collateral + fees
      // Trading fee is 0.04%. So total required is slightly more than collateral.
      const fee = sizeUsd * 0.0004
      const totalRequired = collateralUsd + fee
      
      if (!isApproved(totalRequired)) {
        await approveInfinite()
        // Wait for allowance state to catch up across RPC nodes
        await new Promise(res => setTimeout(res, 5000))
      }

      toast.loading('Opening Position...', { id: 'trade' })

      // Convert to bytes32 pairId
      // In JS, keccak256(abi.encodePacked(pairName))
      // viem has a helper for this
      const { keccak256, toHex } = await import('viem')
      const pairId = keccak256(toHex(pairName))

      const sizeUnits = parseUnits(sizeUsd.toFixed(6), 6) // USDC 6 decimals

      const tx = await writeContractAsync({
        address: CONTRACTS.TRADING as any,
        abi: ABIS.TRADING as any,
        functionName: 'openPosition',
        args: [
          pairId,
          isLong,
          sizeUnits,
          BigInt(leverage),
          [] // empty pythUpdateData for MockOracle
        ],
        value: 0n,
      } as any)

      toast.dismiss('trade')
      return tx
    } catch (error: any) {
      toast.dismiss('trade')
      toast.error(error.shortMessage || 'Failed to open position')
      console.error(error)
      throw error
    }
  }

  // Close Position
  const closePosition = async (positionId: bigint) => {
    try {
      toast.loading('Closing Position...', { id: 'close' })
      const tx = await writeContractAsync({
        address: CONTRACTS.TRADING as any,
        abi: ABIS.TRADING as any,
        functionName: 'closePosition',
        args: [positionId, []], // empty pythUpdateData
        value: 0n,
      } as any)
      toast.dismiss('close')
      return tx
    } catch (error: any) {
      toast.dismiss('close')
      toast.error(error.shortMessage || 'Failed to close position')
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

      toast.loading('Placing Order...', { id: 'order' })

      const { keccak256, toHex } = await import('viem')
      const pairId = keccak256(toHex(pairName))

      const sizeUnits = parseUnits(sizeUsd.toFixed(6), 6)
      const priceUnits = parseUnits(triggerPriceUsd.toFixed(18), 18) // Oracle uses 18 decimals

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
          [] // empty pythUpdateData
        ],
        value: 0n,
      } as any)

      toast.dismiss('order')
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
