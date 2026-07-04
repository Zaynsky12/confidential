import ConfidentialTradingABI from '../abis/ConfidentialTrading.json'
import ConfidentialVaultABI from '../abis/ConfidentialVault.json'
import ConfidentialCoreABI from '../abis/ConfidentialCore.json'
import ERC20ABI from '../abis/ERC20.json'

// Arc Testnet Smart Contract Addresses
export const CONTRACTS = {
  USDC: '0x3600000000000000000000000000000000000000',
  CORE: '0xcD3355e8837A516e264EB2b7dd97549c775f1e5d',
  VAULT: '0x3eB8A13e01B989693bA6D9885317Ef66890c359C',
  TRADING: '0x4B7291445eE8eD0d3f12c511843078f8B8c4d9Bd',
  ORACLE: '0x897b9947185079B42d94CbbF332192CEFd9ACCFA',
} as const

// Typed ABIs for Wagmi
export const ABIS = {
  USDC: ERC20ABI,
  CORE: (ConfidentialCoreABI as any).abi || ConfidentialCoreABI,
  VAULT: (ConfidentialVaultABI as any).abi || ConfidentialVaultABI,
  TRADING: (ConfidentialTradingABI as any).abi || ConfidentialTradingABI,
} as const
