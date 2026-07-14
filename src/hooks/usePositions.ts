import { useReadContracts } from 'wagmi'
import { CONTRACTS, ABIS } from '../config/contracts'
import { formatUnits } from 'viem'
import { useMemo } from 'react'

export function usePositions(address?: string) {
  // 1. Read indices 0..99 from userPositions(address, index)
  const indexContracts = useMemo(() => {
    if (!address) return []
    return Array.from({ length: 100 }).map((_, index) => ({
      address: CONTRACTS.TRADING as any,
      abi: ABIS.TRADING as any,
      functionName: 'userPositions',
      args: [address, BigInt(index)],
    }))
  }, [address])

  const { data: idResults, refetch: refetchIds, isLoading: isIdsLoading } = useReadContracts({
    contracts: indexContracts,
    query: {
      enabled: !!address,
      refetchInterval: 3000,
    }
  })

  // 2. Extract successful position IDs
  const positionIds = useMemo(() => {
    if (!idResults) return []
    return idResults
      .filter((res: any) => res.status === 'success' && res.result !== undefined)
      .map((res: any) => res.result as bigint)
  }, [idResults])

  // 3. Fetch position details for each ID
  const detailContracts = useMemo(() => {
    return positionIds.map((id) => ({
      address: CONTRACTS.TRADING as any,
      abi: ABIS.TRADING as any,
      functionName: 'positions',
      args: [id],
    }))
  }, [positionIds])

  const { data: positionsData, refetch: refetchDetails, isLoading: isDetailsLoading } = useReadContracts({
    contracts: detailContracts,
    query: {
      enabled: positionIds.length > 0,
      refetchInterval: 3000,
    }
  })

  // 4. Parse position details
  const positions = useMemo(() => {
    if (!positionsData || positionIds.length === 0) return []
    
    return positionsData
      .map((res: any, index: number) => {
        if (res.status !== 'success' || !res.result) return null
        const pos: any = res.result
        const isOpen = pos[9] as boolean
        if (!isOpen) return null // Only show open positions
        
        return {
          id: positionIds[index].toString(),
          positionId: positionIds[index].toString(), // Include string ID
          pairId: pos[0],
          trader: pos[1],
          isLong: pos[2],
          sizeUsd: Number(formatUnits(pos[3], 6)),
          collateral: Number(formatUnits(pos[4], 6)),
          entryPrice: Number(formatUnits(pos[5], 18)),
          leverage: Number(pos[6]),
          liquidationPrice: Number(formatUnits(pos[7], 18)),
          openedAt: Number(pos[8]) * 1000,
          isOpen: isOpen,
          tpPrice: Number(formatUnits(pos[10], 18)),
          slPrice: Number(formatUnits(pos[11], 18)),
        }
      })
      .filter(Boolean) as any[]
  }, [positionsData, positionIds])

  const refetchAll = () => {
    refetchIds()
    refetchDetails()
  }

  return { 
    positions, 
    isLoading: isIdsLoading || isDetailsLoading, 
    refetchPositions: refetchAll 
  }
}

export function useOrders(address?: string) {
  // 1. Read indices 0..99 from userOrders(address, index)
  const indexContracts = useMemo(() => {
    if (!address) return []
    return Array.from({ length: 100 }).map((_, index) => ({
      address: CONTRACTS.TRADING as any,
      abi: ABIS.TRADING as any,
      functionName: 'userOrders',
      args: [address, BigInt(index)],
    }))
  }, [address])

  const { data: idResults, refetch: refetchIds, isLoading: isIdsLoading } = useReadContracts({
    contracts: indexContracts,
    query: {
      enabled: !!address,
      refetchInterval: 3000,
    }
  })

  // 2. Extract successful order IDs
  const orderIds = useMemo(() => {
    if (!idResults) return []
    return idResults
      .filter((res: any) => res.status === 'success' && res.result !== undefined)
      .map((res: any) => res.result as bigint)
  }, [idResults])

  // 3. Fetch order details for each ID
  const detailContracts = useMemo(() => {
    return orderIds.map((id) => ({
      address: CONTRACTS.TRADING as any,
      abi: ABIS.TRADING as any,
      functionName: 'pendingOrders',
      args: [id],
    }))
  }, [orderIds])

  const { data: ordersData, refetch: refetchDetails, isLoading: isDetailsLoading } = useReadContracts({
    contracts: detailContracts,
    query: {
      enabled: orderIds.length > 0,
      refetchInterval: 3000,
    }
  })

  // 4. Parse order details
  const orders = useMemo(() => {
    if (!ordersData || orderIds.length === 0) return []
    
    return ordersData
      .map((res: any, index: number) => {
        if (res.status !== 'success' || !res.result) return null
        const order: any = res.result
        const isActive = order[8] as boolean
        if (!isActive) return null // Only show active orders
        
        return {
          id: orderIds[index].toString(),
          orderId: Number(orderIds[index]),
          pairId: order[0],
          trader: order[1],
          isLong: order[2],
          sizeUsd: Number(formatUnits(order[3], 6)),
          collateral: Number(formatUnits(order[4], 6)),
          leverage: Number(order[5]),
          triggerPrice: Number(formatUnits(order[6], 18)),
          orderType: Number(order[7]),
          isActive: isActive,
          createdAt: Number(order[9]) * 1000,
          positionId: Number(order[10]),
          feePaid: Number(formatUnits(order[11], 6)),
          executionFee: Number(formatUnits(order[12], 18)),
          tpPrice: Number(formatUnits(order[13], 18)),
          slPrice: Number(formatUnits(order[14], 18)),
        }
      })
      .filter(Boolean) as any[]
  }, [ordersData, orderIds])

  const refetchAll = () => {
    refetchIds()
    refetchDetails()
  }

  return { 
    orders, 
    isLoading: isIdsLoading || isDetailsLoading, 
    refetchOrders: refetchAll 
  }
}

