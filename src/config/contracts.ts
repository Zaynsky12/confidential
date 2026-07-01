import ConfidentialTradingABI from '../abis/ConfidentialTrading.json'
import ConfidentialVaultABI from '../abis/ConfidentialVault.json'
import ConfidentialCoreABI from '../abis/ConfidentialCore.json'
import ConfidentialP2PABI from '../abis/ConfidentialP2P.json'
import ERC20ABI from '../abis/ERC20.json'

// Arc Testnet Smart Contract Addresses
export const CONTRACTS = {
  USDC: '0x3600000000000000000000000000000000000000',
  CORE: '0xA338ffE519f43582a9b17e10F0B07857B18Ca4FE',
  VAULT: '0x3ccE71906724AE466A377a0011A0A7d06e708666',
  TRADING: '0x51468799Ad7B61B011677E0408252b38Ed10442E',
  P2P: '0x0000000000000000000000000000000000000000',
  ORACLE: '0x897b9947185079B42d94CbbF332192CEFd9ACCFA',
} as const

// Typed ABIs for Wagmi
export const ABIS = {
  USDC: ERC20ABI,
  CORE: (ConfidentialCoreABI as any).abi || ConfidentialCoreABI,
  VAULT: (ConfidentialVaultABI as any).abi || ConfidentialVaultABI,
  TRADING: (ConfidentialTradingABI as any).abi || ConfidentialTradingABI,
  P2P: (ConfidentialP2PABI as any).abi || ConfidentialP2PABI,
} as const
