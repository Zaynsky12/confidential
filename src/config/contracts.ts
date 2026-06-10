import ConfidentialTradingABI from '../abis/ConfidentialTrading.json'
import ConfidentialVaultABI from '../abis/ConfidentialVault.json'
import ConfidentialCoreABI from '../abis/ConfidentialCore.json'
import ERC20ABI from '../abis/ERC20.json'

// Arc Testnet Smart Contract Addresses
export const CONTRACTS = {
  USDC: '0x3600000000000000000000000000000000000000',
  CORE: '0x2f1f40a9ac9728b3377165fbf7520539669ea4da',
  VAULT: '0x7aab49563a2dd6e3320ae98dbe22444bd65bc84f',
  TRADING: '0xc35ca2227833b07f69a56a32feb0a4cc2130b2a8',
  ORACLE: '0x2138f5930b60a6011b3edd57461d1023311d0d17',
} as const

// Typed ABIs for Wagmi
export const ABIS = {
  USDC: ERC20ABI,
  CORE: ConfidentialCoreABI.abi,
  VAULT: ConfidentialVaultABI.abi,
  TRADING: ConfidentialTradingABI.abi,
} as const
