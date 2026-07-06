import ConfidentialTradingABI from '../abis/ConfidentialTradingV1.json'
import ConfidentialVaultABI from '../abis/ConfidentialVaultV1.json'
import ConfidentialCoreABI from '../abis/ConfidentialCoreV1.json'
import ERC20ABI from '../abis/ERC20.json'

// Arc Testnet Smart Contract Addresses
export const CONTRACTS = {
  USDC: '0x3600000000000000000000000000000000000000',
  CORE: '0xA4F4e1C8032cC6529921Fc8193D8eE8836b72A5F',
  VAULT: '0x1bb2A085D327F9fd153eE2ed5c4bC065a394B8e1',
  TRADING: '0xF9e4Cd48F830fc06341Fe9d17B6650B6d6a3aF22',
  ORACLE: '0x897b9947185079B42d94CbbF332192CEFd9ACCFA',
} as const

// Typed ABIs for Wagmi
export const ABIS = {
  USDC: ERC20ABI,
  CORE: (ConfidentialCoreABI as any).abi || ConfidentialCoreABI,
  VAULT: (ConfidentialVaultABI as any).abi || ConfidentialVaultABI,
  TRADING: (ConfidentialTradingABI as any).abi || ConfidentialTradingABI,
} as const
