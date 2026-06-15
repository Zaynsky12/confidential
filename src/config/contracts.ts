import ConfidentialTradingABI from '../abis/ConfidentialTrading.json'
import ConfidentialVaultABI from '../abis/ConfidentialVault.json'
import ConfidentialCoreABI from '../abis/ConfidentialCore.json'
import ERC20ABI from '../abis/ERC20.json'

// Arc Testnet Smart Contract Addresses
export const CONTRACTS = {
  USDC: '0x3600000000000000000000000000000000000000',
  CORE: '0x87000e8eA781B9fdBEaF0A479386efD5b38C2da9',
  VAULT: '0x6e70367215F067632d3a94EB9a7A3f63C21A680C',
  TRADING: '0x92361Ea75DdFdc7F7aa89AA0917D1B9a3A2c77C0',
  ORACLE: '0x2138f5930b60a6011b3edd57461d1023311d0d17',
} as const

// Typed ABIs for Wagmi
export const ABIS = {
  USDC: ERC20ABI,
  CORE: (ConfidentialCoreABI as any).abi || ConfidentialCoreABI,
  VAULT: (ConfidentialVaultABI as any).abi || ConfidentialVaultABI,
  TRADING: (ConfidentialTradingABI as any).abi || ConfidentialTradingABI,
} as const
