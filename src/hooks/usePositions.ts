import { useReadContract, useReadContracts } from 'wagmi'
import { CONTRACTS, ABIS } from '../config/contracts'
import { formatUnits } from 'viem'
import { useEffect, useState } from 'react'

export function usePositions(address?: string) {
  const [activePositions, setActivePositions] = useState<any[]>([])

  // 1. Get position IDs
  const { data: positionIds, refetch: refetchIds } = useReadContract({
    address: CONTRACTS.TRADING,
    abi: ABIS.TRADING,
    functionName: 'getUserPositionIds',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 3000,
    }
  })

  // 2. Fetch all position details
  const { data: positionsData, refetch: refetchDetails } = useReadContracts({
    contracts: (positionIds as bigint[] || []).map((id) => ({
      address: CONTRACTS.TRADING as any,
      abi: ABIS.TRADING as any,
      functionName: 'getPosition',
      args: [id],
    })) as any,
    query: {
      refetchInterval: 3000,
    }
  })

  useEffect(() => {
    if (positionsData && positionIds) {
      const parsed = positionsData
        .map((res, index) => {
          if (!res.result) return null
          const pos: any = res.result
          if (!pos.isOpen) return null // Only show open positions
          
          return {
            id: (positionIds as bigint[])[index].toString(),
            pairId: pos.pairId,
            isLong: pos.isLong,
            sizeUsd: Number(formatUnits(pos.sizeUsd, 6)),
            collateral: Number(formatUnits(pos.collateral, 6)),
            entryPrice: Number(formatUnits(pos.entryPrice, 18)),
            leverage: Number(pos.leverage),
            liquidationPrice: Number(formatUnits(pos.liquidationPrice, 18)),
            openedAt: Number(pos.openedAt) * 1000,
          }
        })
        .filter(Boolean)
      
      setActivePositions(parsed)
    }
  }, [positionsData, positionIds])

  const refetchAll = () => {
    refetchIds()
    refetchDetails()
  }

  return { activePositions, refetchPositions: refetchAll }
}
