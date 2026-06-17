import { useState, useEffect } from 'react'
import { gql } from 'graphql-request'
import { gqlClient } from '../config/graphql'
import { formatUnits } from 'viem'

export interface IndexerDeposit {
  id: string
  user: string
  action: string
  amount: number
  shares: number
  timestamp: number
  txHash: string
}

export function useVaultHistory(userAddress?: string) {
  const [deposits, setDeposits] = useState<IndexerDeposit[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory(isPolling = false) {
      try {
        if (!isPolling) setIsLoading(true)
        let query: string
        let variables: any = {}

        if (userAddress) {
          query = gql`
            query GetUserDeposits($user: Bytes!) {
              vaultDeposits(where: { user: $user }, orderBy: timestamp, orderDirection: desc) {
                id
                user
                action
                amount
                shares
                timestamp
                txHash
              }
            }
          `
          variables = { user: userAddress.toLowerCase() }
        } else {
          query = gql`
            query GetAllDeposits {
              vaultDeposits(orderBy: timestamp, orderDirection: desc) {
                id
                user
                action
                amount
                shares
                timestamp
                txHash
              }
            }
          `
        }

        const data: any = await gqlClient.request(query, variables)
        
        const formatted = data.vaultDeposits.map((d: any) => ({
          ...d,
          amount: Number(formatUnits(BigInt(d.amount), 6)),
          shares: Number(formatUnits(BigInt(d.shares), 6)),
          timestamp: Number(d.timestamp) * 1000 // Convert to ms
        }))

        setDeposits(formatted)
      } catch (e) {
        console.error("Goldsky Fetch Error:", e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
    
    // Poll every 10 seconds
    const interval = setInterval(() => fetchHistory(true), 10000)
    return () => clearInterval(interval)
  }, [userAddress])

  return { deposits, isLoading }
}

export interface IndexerPosition {
  id: string
  positionId: number
  trader: string
  pairId: string
  isLong: boolean
  sizeUsd: number
  entryPrice: number
  leverage: number
  collateral: number
  liquidationPrice: number
  isOpen: boolean
  openedAt: number
  closedAt?: number
  exitPrice?: number
  pnl?: number
  tpPrice?: number
  slPrice?: number
}

export function usePositions(userAddress?: string) {
  const [positions, setPositions] = useState<IndexerPosition[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPositions(isPolling = false) {
      try {
        if (!isPolling) setIsLoading(true)
        if (!userAddress) {
          setPositions([])
          return
        }

        const query = gql`
          query GetUserPositions($user: Bytes!) {
            positions(where: { trader: $user, isOpen: true }, orderBy: openedAt, orderDirection: desc) {
              id
              positionId
              trader
              pairId
              isLong
              sizeUsd
              entryPrice
              leverage
              collateral
              liquidationPrice
              isOpen
              openedAt
              tpPrice
              slPrice
            }
          }
        `
        
        const data: any = await gqlClient.request(query, { user: userAddress.toLowerCase() })
        
        const formatted = data.positions.map((p: any) => ({
          ...p,
          positionId: Number(p.positionId),
          sizeUsd: Number(formatUnits(BigInt(p.sizeUsd), 6)),
          entryPrice: Number(formatUnits(BigInt(p.entryPrice), 18)),
          leverage: Number(p.leverage),
          collateral: Number(formatUnits(BigInt(p.collateral), 6)),
          liquidationPrice: Number(formatUnits(BigInt(p.liquidationPrice), 18)),
          openedAt: Number(p.openedAt) * 1000,
          tpPrice: p.tpPrice ? Number(formatUnits(BigInt(p.tpPrice), 18)) : 0,
          slPrice: p.slPrice ? Number(formatUnits(BigInt(p.slPrice), 18)) : 0
        }))

        setPositions(formatted)
      } catch (e) {
        console.error("Goldsky Fetch Positions Error:", e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPositions()
    const interval = setInterval(() => fetchPositions(true), 5000) // Poll every 5s for fast trading updates
    return () => clearInterval(interval)
  }, [userAddress])

  return { positions, isLoading }
}

export function useClosedPositions(userAddress?: string) {
  const [closedPositions, setClosedPositions] = useState<IndexerPosition[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPositions(isPolling = false) {
      try {
        if (!isPolling) setIsLoading(true)
        if (!userAddress) {
          setClosedPositions([])
          return
        }

        const query = gql`
          query GetUserClosedPositions($user: Bytes!) {
            positions(where: { trader: $user, isOpen: false }, orderBy: closedAt, orderDirection: desc) {
              id
              positionId
              trader
              pairId
              isLong
              sizeUsd
              entryPrice
              leverage
              collateral
              liquidationPrice
              isOpen
              openedAt
              closedAt
              pnl
            }
          }
        `
        
        const data: any = await gqlClient.request(query, { user: userAddress.toLowerCase() })
        
        const formatted = data.positions.map((p: any) => ({
          ...p,
          positionId: Number(p.positionId),
          sizeUsd: Number(formatUnits(BigInt(p.sizeUsd), 6)),
          entryPrice: Number(formatUnits(BigInt(p.entryPrice), 18)),
          leverage: Number(p.leverage),
          collateral: Number(formatUnits(BigInt(p.collateral), 6)),
          liquidationPrice: Number(formatUnits(BigInt(p.liquidationPrice), 18)),
          openedAt: Number(p.openedAt) * 1000,
          closedAt: Number(p.closedAt) * 1000,
          pnl: p.pnl ? Number(formatUnits(BigInt(p.pnl), 6)) : 0
        }))

        setClosedPositions(formatted)
      } catch (e) {
        console.error("Goldsky Fetch Closed Positions Error:", e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPositions()
    const interval = setInterval(() => fetchPositions(true), 15000)
    return () => clearInterval(interval)
  }, [userAddress])

  return { closedPositions, isLoading }
}

export interface IndexerOrder {
  id: string
  orderId: number
  trader: string
  pairId: string
  orderType: number
  triggerPrice: number
  sizeUsd: number
  leverage: number
  collateral: number
  isLong: boolean
  isActive: boolean
  createdAt: number
}

export function useOrders(userAddress?: string) {
  const [orders, setOrders] = useState<IndexerOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders(isPolling = false) {
      try {
        if (!isPolling) setIsLoading(true)
        if (!userAddress) {
          const query = gql`
            query GetAllOrders {
              orders(where: { isActive: true }, first: 100, orderBy: triggerPrice, orderDirection: desc) {
                id
                orderId
                trader
                pairId
                orderType
                triggerPrice
                sizeUsd
                leverage
                collateral
                isLong
                isActive
                createdAt
              }
            }
          `
          const data: any = await gqlClient.request(query)
          const formatted = data.orders.map((o: any) => ({
            ...o,
            orderId: Number(o.orderId),
            triggerPrice: Number(formatUnits(BigInt(o.triggerPrice), 18)),
            sizeUsd: Number(formatUnits(BigInt(o.sizeUsd), 6)),
            leverage: Number(o.leverage),
            collateral: Number(formatUnits(BigInt(o.collateral), 6)),
            createdAt: Number(o.createdAt) * 1000
          }))
          setOrders(formatted)
          setIsLoading(false)
          return
        }

        const query = gql`
          query GetUserOrders($user: Bytes!) {
            orders(where: { trader: $user, isActive: true }, orderBy: createdAt, orderDirection: desc) {
              id
              orderId
              trader
              pairId
              orderType
              triggerPrice
              sizeUsd
              leverage
              collateral
              isLong
              isActive
              createdAt
            }
          }
        `
        
        const data: any = await gqlClient.request(query, { user: userAddress.toLowerCase() })
        
        const formatted = data.orders.map((o: any) => ({
          ...o,
          orderId: Number(o.orderId),
          triggerPrice: Number(formatUnits(BigInt(o.triggerPrice), 18)),
          sizeUsd: Number(formatUnits(BigInt(o.sizeUsd), 6)),
          leverage: Number(o.leverage),
          collateral: Number(formatUnits(BigInt(o.collateral), 6)),
          createdAt: Number(o.createdAt) * 1000
        }))

        setOrders(formatted)
      } catch (e) {
        console.error("Goldsky Fetch Orders Error:", e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
    const interval = setInterval(() => fetchOrders(true), 5000)
    return () => clearInterval(interval)
  }, [userAddress])

  return { orders, isLoading }
}

export interface IndexerTradeRecord {
  id: string
  trader: string
  pairId: string
  action: string
  sizeUsd: number
  price: number
  timestamp: number
  txHash: string
}

export function useTradeRecords(userAddress?: string) {
  const [trades, setTrades] = useState<IndexerTradeRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchTrades(isPolling = false) {
      try {
        if (!isPolling) setIsLoading(true)
        if (!userAddress) {
          const query = gql`
            query GetAllTrades {
              tradeRecords(first: 50, orderBy: timestamp, orderDirection: desc) {
                id
                trader
                pairId
                action
                sizeUsd
                price
                timestamp
                txHash
              }
            }
          `
          const data: any = await gqlClient.request(query)
          const formatted = data.tradeRecords.map((t: any) => ({
            ...t,
            sizeUsd: Number(formatUnits(BigInt(t.sizeUsd), 6)),
            price: Number(formatUnits(BigInt(t.price), 18)),
            timestamp: Number(t.timestamp) * 1000
          }))
          setTrades(formatted)
          setIsLoading(false)
          return
        }

        const query = gql`
          query GetUserTrades($user: Bytes!) {
            tradeRecords(where: { trader: $user }, orderBy: timestamp, orderDirection: desc) {
              id
              trader
              pairId
              action
              sizeUsd
              price
              timestamp
              txHash
            }
          }
        `
        
        const data: any = await gqlClient.request(query, { user: userAddress.toLowerCase() })
        
        const formatted = data.tradeRecords.map((t: any) => ({
          ...t,
          sizeUsd: Number(formatUnits(BigInt(t.sizeUsd), 6)),
          price: Number(formatUnits(BigInt(t.price), 18)),
          timestamp: Number(t.timestamp) * 1000
        }))

        setTrades(formatted)
      } catch (e) {
        console.error("Goldsky Fetch Trades Error:", e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrades()
    const interval = setInterval(() => fetchTrades(true), 10000)
    return () => clearInterval(interval)
  }, [userAddress])

  return { trades, isLoading }
}

export function useAll24hVolumes() {
  const [volumes, setVolumes] = useState<Record<string, number>>({})

  useEffect(() => {
    async function fetchVolumes() {
      try {
        // Get start of yesterday (UTC)
        const yesterday = Math.floor(Date.now() / 1000) - 86400
        const query = gql`
          query GetAllVolumes($date: Int!) {
            pairDayDatas(where: { date_gte: $date }, first: 1000) {
              pairId
              volumeUsd
            }
          }
        `
        const data: any = await gqlClient.request(query, { date: yesterday })
        
        const volMap: Record<string, number> = {}
        data.pairDayDatas.forEach((d: any) => {
          const pid = d.pairId.toLowerCase()
          const vol = Number(formatUnits(BigInt(d.volumeUsd), 6))
          volMap[pid] = (volMap[pid] || 0) + vol
        })
        setVolumes(volMap)
      } catch (e) {
        console.error("Goldsky Fetch Volumes Error:", e)
      }
    }
    
    fetchVolumes()
    const interval = setInterval(fetchVolumes, 30000)
    return () => clearInterval(interval)
  }, [])

  return volumes
}
