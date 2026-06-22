import ConfidentialTradingABI from '../abis/ConfidentialTrading.json'
import ConfidentialVaultABI from '../abis/ConfidentialVault.json'
import ConfidentialCoreABI from '../abis/ConfidentialCore.json'
import ConfidentialP2PABI from '../abis/ConfidentialP2P.json'
import ERC20ABI from '../abis/ERC20.json'

// Arc Testnet Smart Contract Addresses
export const CONTRACTS = {
  USDC: '0x3600000000000000000000000000000000000000',
  CORE: '0x3396f443b8D0D144C831cf7EB4b0cAE5c3BaBd27',
  VAULT: '0x718EbD82e2fB4f8D71D2C78cAF43171c1A656b08',
  TRADING: '0xf37fe2E9A552a0b2003324B293B2e6E4AD9C5645',
  P2P: '0x9D557c5Acc5a6B015C079273CE35D7FE44F74828',
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
