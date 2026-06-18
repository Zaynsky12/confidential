import ConfidentialTradingABI from '../abis/ConfidentialTrading.json'
import ConfidentialVaultABI from '../abis/ConfidentialVault.json'
import ConfidentialCoreABI from '../abis/ConfidentialCore.json'
import ERC20ABI from '../abis/ERC20.json'

// Arc Testnet Smart Contract Addresses
export const CONTRACTS = {
  USDC: '0x3600000000000000000000000000000000000000',
  CORE: '0xa40580Eb283725dCf42CE74735e7Cc324aE56F7f',
  VAULT: '0x346f3C584cc1b7ae7B7dE817ec38AbF542Af3AdE',
  TRADING: '0xa88D80a6a748E5e4185157C16d250e72A181DF5A',
  ORACLE: '0xe0E76F817494e624d3CDdAC1218fCDe9624f65d3',
} as const

// Typed ABIs for Wagmi
export const ABIS = {
  USDC: ERC20ABI,
  CORE: (ConfidentialCoreABI as any).abi || ConfidentialCoreABI,
  VAULT: (ConfidentialVaultABI as any).abi || ConfidentialVaultABI,
  TRADING: (ConfidentialTradingABI as any).abi || ConfidentialTradingABI,
} as const
