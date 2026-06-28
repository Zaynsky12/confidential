import ConfidentialTradingABI from '../abis/ConfidentialTrading.json'
import ConfidentialVaultABI from '../abis/ConfidentialVault.json'
import ConfidentialCoreABI from '../abis/ConfidentialCore.json'
import ConfidentialP2PABI from '../abis/ConfidentialP2P.json'
import ERC20ABI from '../abis/ERC20.json'

// Arc Testnet Smart Contract Addresses
export const CONTRACTS = {
  USDC: '0x3600000000000000000000000000000000000000',
  CORE: '0x3396f443b8D0D144C831cf7EB4b0cAE5c3BaBd27',
  VAULT: '0x64b5a121D7a0CAcAB2F0fde5957768CfF9745FaE',
  TRADING: '0x84a8B259d4c07eB042C046Cf5C95Db59a9407e40',
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
