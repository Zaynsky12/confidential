import ConfidentialTradingABI from '../abis/ConfidentialTrading.json'
import ConfidentialVaultABI from '../abis/ConfidentialVault.json'
import ConfidentialCoreABI from '../abis/ConfidentialCore.json'
import ERC20ABI from '../abis/ERC20.json'

// Arc Testnet Smart Contract Addresses
export const CONTRACTS = {
  USDC: '0x3600000000000000000000000000000000000000',
  CORE: '0x87F27e1D09aFe69E7B29acc44c18a81FF5113906',
  VAULT: '0xCCee0942115B632dFb0aA50BD1cd034217Bf2D10',
  TRADING: '0xf3197099C3931e79ebD8db7D0eECe16838582a52',
  ORACLE: '0x15720Eb0B565E82D0D7aaE0cA677A3A2dC389fC0',
} as const

// Typed ABIs for Wagmi
export const ABIS = {
  USDC: ERC20ABI,
  CORE: (ConfidentialCoreABI as any).abi || ConfidentialCoreABI,
  VAULT: (ConfidentialVaultABI as any).abi || ConfidentialVaultABI,
  TRADING: (ConfidentialTradingABI as any).abi || ConfidentialTradingABI,
} as const
