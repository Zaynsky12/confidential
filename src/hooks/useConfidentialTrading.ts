import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { CONTRACTS, ABIS } from '../config/contracts'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useUSDCApproval } from './useUSDCApproval'
import { useTradeStore } from '../store/useTradeStore'
import { usePublicClient } from 'wagmi'

export function useConfidentialTrading() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const publicClient = usePublicClient()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Fetch VAA from Hermes and required fee from contract
  const fetchPythVaa = async (pairName: string): Promise<{ updateData: string[], fee: bigint }> => {
    // 1. Get the Pyth ID from our trade store
    const market = useTradeStore.getState().markets.find(m => m.pair === pairName)
    if (!market || !market.pythPriceId) {
      throw new Error(`Pyth Price ID not found for ${pairName}`)
    }
    
    // 2. Fetch VAA from Hermes API
    const response = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${market.pythPriceId}`)
    if (!response.ok) {
      throw new Error('Hermes API error')
    }
    const data = await response.json()
    
    if (!data || !data.binary || !data.binary.data) {
      throw new Error('Failed to fetch Pyth VAA payload')
    }
    
    // Pyth SDK usually provides an array of hex strings without '0x'
    const updateData = data.binary.data.map((d: string) => d.startsWith('0x') ? d : '0x' + d)
    
    // 3. Read the required update fee from the Pyth Oracle Contract
    let fee = 1n // default 1 wei
    if (publicClient) {
      try {
        // Correct Pyth contract address for Arc Testnet
        const PYTH_ADDRESS = '0x2880aB155794e7179c9eE2e38200202908C17B43'
        const PYTH_ABI = [{"inputs":[{"internalType":"bytes[]","name":"updateData","type":"bytes[]"}],"name":"getUpdateFee","outputs":[{"internalType":"uint256","name":"feeAmount","type":"uint256"}],"stateMutability":"view","type":"function"}] as const;
        
        fee = await publicClient.readContract({
          address: PYTH_ADDRESS,
          abi: PYTH_ABI,
          functionName: 'getUpdateFee',
          args: [updateData]
        }) as bigint
      } catch (e) {
        console.warn('Failed to read dynamic Pyth fee, defaulting to 1 wei', e)
        fee = 1n
      }
    }
    
    return { updateData, fee }
  }

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

      toast.loading('Fetching Oracle Price...', { id: 'trade' })
      const { updateData, fee: oracleFee } = await fetchPythVaa(pairName)

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
          updateData
        ],
        value: oracleFee,
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
  const closePosition = async (positionId: bigint, pairName: string) => {
    try {
      toast.loading('Fetching Oracle Price...', { id: 'close' })
      const { updateData, fee: oracleFee } = await fetchPythVaa(pairName)

      toast.loading('Closing Position...', { id: 'close' })
      const tx = await writeContractAsync({
        address: CONTRACTS.TRADING as any,
        abi: ABIS.TRADING as any,
        functionName: 'closePosition',
        args: [positionId, updateData],
        value: oracleFee,
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

      toast.loading('Fetching Oracle Price...', { id: 'order' })
      const { updateData, fee: oracleFee } = await fetchPythVaa(pairName)

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
          updateData
        ],
        value: oracleFee,
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
