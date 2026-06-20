import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { CONTRACTS, ABIS } from '../config/contracts'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useUSDCApproval } from './useUSDCApproval'
import { useTradeStore } from '../store/useTradeStore'

const fetchPythVaa = async (pythPriceId: string) => {
  const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${pythPriceId}`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch Pyth VAA")
  const data = await res.json()
  return data.binary.data.map((hex: string) => `0x${hex}`)
}

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
    acceptablePriceUsd: number = 0
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
      const acceptablePriceUnits = acceptablePriceUsd > 0 ? parseUnits(acceptablePriceUsd.toFixed(18), 18) : 0n

      const market = useTradeStore.getState().markets.find(m => m.pair === pairName)
      if (!market) throw new Error("Market not found")
      
      const updateData = await fetchPythVaa(market.pythPriceId)
      const pythFee = parseUnits('0.001', 18) // 0.001 ARC for Pyth update fee

      const tx = await writeContractAsync({
        address: CONTRACTS.TRADING as any,
        abi: ABIS.TRADING as any,
        functionName: 'placeMarketOrder',
        args: [
          pairId,
          isLong,
          sizeUnits,
          BigInt(leverage),
          tpUnits,
          slUnits,
          acceptablePriceUnits,
          updateData
        ],
        value: pythFee,
      } as any)

      toast.dismiss('trade')
      toast.success('Market Order executed successfully!')
      return tx
    } catch (error: any) {
      toast.dismiss('trade')
      toast.error(error.shortMessage || 'Failed to request position')
      throw error
    }
  }

  // Close Position
  const closePosition = async (positionId: bigint, pythPriceId: string) => {
    try {
      if (!pythPriceId) throw new Error("Pyth Price ID is required for instant close")
      toast.loading('Closing Position Instantly...', { id: 'close' })
      
      const updateData = await fetchPythVaa(pythPriceId)
      const pythFee = parseUnits('0.001', 18)

      const tx = await writeContractAsync({
        address: CONTRACTS.TRADING as any,
        abi: ABIS.TRADING as any,
        functionName: 'closePositionInstantly',
        args: [positionId, updateData],
        value: pythFee,
      } as any)
      
      toast.dismiss('close')
      toast.success('Position closed successfully!')
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

  // Cancel Order
  const cancelOrder = async (orderId: bigint) => {
    try {
      toast.loading('Cancelling Order...', { id: 'cancel' })
      const tx = await writeContractAsync({
        address: CONTRACTS.TRADING as any,
        abi: ABIS.TRADING as any,
        functionName: 'cancelOrder',
        args: [orderId],
      } as any)
      
      toast.dismiss('cancel')
      toast.success('Order cancelled successfully!')
      return tx
    } catch (error: any) {
      toast.dismiss('cancel')
      toast.error(error.shortMessage || 'Failed to cancel order')
      throw error
    }
  }

  // Update TP/SL
  const updateTpSl = async (positionId: bigint, tpPriceUsd: number, slPriceUsd: number) => {
    try {
      toast.loading('Updating TP/SL...', { id: 'updateTpSl' })
      const { parseUnits } = await import('viem')
      const tpUnits = tpPriceUsd > 0 ? parseUnits(tpPriceUsd.toFixed(18), 18) : 0n
      const slUnits = slPriceUsd > 0 ? parseUnits(slPriceUsd.toFixed(18), 18) : 0n

      const tx = await writeContractAsync({
        address: CONTRACTS.TRADING as any,
        abi: ABIS.TRADING as any,
        functionName: 'updateTpSl',
        args: [positionId, tpUnits, slUnits],
      } as any)
      
      toast.dismiss('updateTpSl')
      toast.success('TP/SL updated successfully!')
      return tx
    } catch (error: any) {
      toast.dismiss('updateTpSl')
      toast.error(error.shortMessage || 'Failed to update TP/SL')
      throw error
    }
  }

  // Add Collateral
  const addCollateral = async (positionId: bigint, amountUsd: number) => {
    try {
      if (!isApproved(amountUsd)) {
        await approveInfinite()
        await new Promise(res => setTimeout(res, 5000))
      }

      toast.loading('Adding Collateral...', { id: 'addCol' })
      const { parseUnits } = await import('viem')
      const amountUnits = parseUnits(amountUsd.toFixed(6), 6)

      const tx = await writeContractAsync({
        address: CONTRACTS.TRADING as any,
        abi: ABIS.TRADING as any,
        functionName: 'addCollateral',
        args: [positionId, amountUnits],
      } as any)
      
      toast.dismiss('addCol')
      toast.success('Collateral added successfully!')
      return tx
    } catch (error: any) {
      toast.dismiss('addCol')
      toast.error(error.shortMessage || 'Failed to add collateral')
      throw error
    }
  }

  // Remove Collateral
  const removeCollateral = async (positionId: bigint, amountUsd: number, pythPriceId: string) => {
    try {
      if (!pythPriceId) throw new Error("Pyth Price ID is required for removing collateral")
      toast.loading('Removing Collateral...', { id: 'rmCol' })
      const { parseUnits } = await import('viem')
      const amountUnits = parseUnits(amountUsd.toFixed(6), 6)
      const updateData = await fetchPythVaa(pythPriceId)
      const pythFee = parseUnits('0.001', 18)

      const tx = await writeContractAsync({
        address: CONTRACTS.TRADING as any,
        abi: ABIS.TRADING as any,
        functionName: 'removeCollateral',
        args: [positionId, amountUnits, updateData],
        value: pythFee,
      } as any)
      
      toast.dismiss('rmCol')
      toast.success('Collateral removed successfully!')
      return tx
    } catch (error: any) {
      toast.dismiss('rmCol')
      toast.error(error.shortMessage || 'Failed to remove collateral')
      throw error
    }
  }

  // Close Position Partial
  const closePositionPartial = async (positionId: bigint, closePercentBps: number, pythPriceId: string) => {
    try {
      if (!pythPriceId) throw new Error("Pyth Price ID is required for partial close")
      toast.loading('Closing Partial Position...', { id: 'closePartial' })
      
      const { parseUnits } = await import('viem')
      const updateData = await fetchPythVaa(pythPriceId)
      const pythFee = parseUnits('0.001', 18)

      const tx = await writeContractAsync({
        address: CONTRACTS.TRADING as any,
        abi: ABIS.TRADING as any,
        functionName: 'closePositionPartial',
        args: [positionId, BigInt(closePercentBps), updateData],
        value: pythFee,
      } as any)
      
      toast.dismiss('closePartial')
      toast.success('Partial position closed successfully!')
      return tx
    } catch (error: any) {
      toast.dismiss('closePartial')
      toast.error(error.shortMessage || 'Failed to request partial close')
      throw error
    }
  }

  // Increase Position
  const increasePosition = async (
    positionId: bigint, 
    additionalSizeUsd: number, 
    additionalLeverage: number,
    acceptablePriceUsd: number,
    pythPriceId: string
  ) => {
    try {
      if (!pythPriceId) throw new Error("Pyth Price ID is required for increasing position")
      
      const fee = additionalSizeUsd * 0.0004
      const collateral = additionalSizeUsd / additionalLeverage
      const totalRequired = collateral + fee
      
      if (!isApproved(totalRequired)) {
        await approveInfinite()
        await new Promise(res => setTimeout(res, 5000))
      }

      toast.loading('Increasing Position...', { id: 'increase' })
      
      const { parseUnits } = await import('viem')
      const sizeUnits = parseUnits(additionalSizeUsd.toFixed(6), 6)
      const acceptablePriceUnits = acceptablePriceUsd > 0 ? parseUnits(acceptablePriceUsd.toFixed(18), 18) : 0n
      const updateData = await fetchPythVaa(pythPriceId)
      const pythFee = parseUnits('0.001', 18)

      const tx = await writeContractAsync({
        address: CONTRACTS.TRADING as any,
        abi: ABIS.TRADING as any,
        functionName: 'increasePosition',
        args: [positionId, sizeUnits, BigInt(additionalLeverage), acceptablePriceUnits, updateData],
        value: pythFee,
      } as any)
      
      toast.dismiss('increase')
      toast.success('Position increased successfully!')
      return tx
    } catch (error: any) {
      toast.dismiss('increase')
      toast.error(error.shortMessage || 'Failed to request increase position')
      throw error
    }
  }

  return {
    openPosition,
    closePosition,
    placeOrder,
    createTwapOrder,
    cancelOrder,
    updateTpSl,
    addCollateral,
    removeCollateral,
    closePositionPartial,
    increasePosition,
    isTxPending: isPending || isConfirming || isApproving,
  }
}
