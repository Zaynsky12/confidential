import ConfidentialTradingABI from '../abis/ConfidentialTradingV1.json'
import ConfidentialVaultABI from '../abis/ConfidentialVaultV1.json'
import ConfidentialCoreABI from '../abis/ConfidentialCoreV1.json'
import ERC20ABI from '../abis/ERC20.json'

// Arc Testnet Smart Contract Addresses
export const CONTRACTS = {
  USDC: '0x3600000000000000000000000000000000000000',
  CORE: '0x31fCE291cd6b8d73617822cdB49bF9859E2dff1E',
  VAULT: '0x21996fe6f66b62B86E01Dc925fb3b02d20c85e18',
  TRADING: '0x9Bd8339125dBCbd796DEe5eEaD5ba8A88EeF20Ff',
  ORACLE: '0x897b9947185079B42d94CbbF332192CEFd9ACCFA',
} as const

// Typed ABIs for Wagmi
export const ABIS = {
  USDC: ERC20ABI,
  CORE: (ConfidentialCoreABI as any).abi || ConfidentialCoreABI,
  VAULT: (ConfidentialVaultABI as any).abi || ConfidentialVaultABI,
  TRADING: (ConfidentialTradingABI as any).abi || ConfidentialTradingABI,
} as const
