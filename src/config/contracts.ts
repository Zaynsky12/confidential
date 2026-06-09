import ConfidentialTradingABI from '../abis/ConfidentialTrading.json'
import ConfidentialVaultABI from '../abis/ConfidentialVault.json'
import ConfidentialCoreABI from '../abis/ConfidentialCore.json'
import ERC20ABI from '../abis/ERC20.json'

// Arc Testnet Smart Contract Addresses
export const CONTRACTS = {
  USDC: '0x3600000000000000000000000000000000000000',
  CORE: '0xf1b590af6ee5b08d25785e015bac5fde147199ba',
  VAULT: '0x5735ad3f37dd4d438c29a5544618086e71ea09f3',
  TRADING: '0xbfa4e7b5d7eccab483a166338132ba2d9abad4c3',
  ORACLE: '0xf004ab1ea65151e1215b918077665c7d29e122c8',
} as const

// Typed ABIs for Wagmi
export const ABIS = {
  USDC: ERC20ABI,
  CORE: ConfidentialCoreABI.abi,
  VAULT: ConfidentialVaultABI.abi,
  TRADING: ConfidentialTradingABI.abi,
} as const
