import ConfidentialTradingABI from '../abis/ConfidentialTrading.json'
import ConfidentialVaultABI from '../abis/ConfidentialVault.json'
import ConfidentialCoreABI from '../abis/ConfidentialCore.json'
import ERC20ABI from '../abis/ERC20.json'

// Arc Testnet Smart Contract Addresses
export const CONTRACTS = {
  USDC: '0x3600000000000000000000000000000000000000',
  CORE: '0x481529b51EE0d6D39A185130A0a21C8e996Ee9D3',
  VAULT: '0x3E31b55226cfcd3E18037AE71EA1cbfa2FAFd8d7',
  TRADING: '0xd9f796201d93dC5eb499B0044a675cB24eB550f9',
  ORACLE: '0x2138f5930b60a6011b3edd57461d1023311d0d17',
} as const

// Typed ABIs for Wagmi
export const ABIS = {
  USDC: ERC20ABI,
  CORE: ConfidentialCoreABI.abi,
  VAULT: ConfidentialVaultABI,
  TRADING: ConfidentialTradingABI,
} as const
