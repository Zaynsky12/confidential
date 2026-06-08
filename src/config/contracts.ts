import ConfidentialTradingABI from '../abis/ConfidentialTrading.json'
import ConfidentialVaultABI from '../abis/ConfidentialVault.json'
import ConfidentialCoreABI from '../abis/ConfidentialCore.json'
import ERC20ABI from '../abis/ERC20.json'

// Arc Testnet Smart Contract Addresses
export const CONTRACTS = {
  USDC: '0x3600000000000000000000000000000000000000',
  CORE: '0xe7713624d3dd7d7c2e360de47114401c31f1dd76',
  VAULT: '0xb38ed2873e8e74486cbbfeb646ddaf73238ec958',
  TRADING: '0x6b6de0047bbddad1d8b3b18b34a115b482650e9c',
  ORACLE: '0x04bdb3a7ea3bcf895c6e7e8495f8cf11602fc3f4',
} as const

// Typed ABIs for Wagmi
export const ABIS = {
  USDC: ERC20ABI,
  CORE: ConfidentialCoreABI,
  VAULT: ConfidentialVaultABI,
  TRADING: ConfidentialTradingABI,
} as const
