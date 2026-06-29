const { createWalletClient, createPublicClient, http, parseAbi } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')
const { arcTestnet } = require('viem/chains')
require('dotenv').config({ path: require('path').join(__dirname, '.env') })

const VAULT_ADDRESS = '0x64b5a121D7a0CAcAB2F0fde5957768CfF9745FaE'

const vaultAbi = parseAbi([
  'function setTieredLockups(uint256 _degenSeconds, uint256 _primeSeconds) external'
])

async function main() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY)
  
  const client = createWalletClient({
    account,
    chain: {
      ...arcTestnet,
      rpcUrls: {
        default: { http: ['https://rpc.testnet.arc.network'] }
      }
    },
    transport: http()
  })

  const publicClient = createPublicClient({
    chain: {
      ...arcTestnet,
      rpcUrls: {
        default: { http: ['https://rpc.testnet.arc.network'] }
      }
    },
    transport: http()
  })

  console.log(`Restoring Lockup for Vault: ${VAULT_ADDRESS}`)
  
  // 2 Days = 172800 seconds, 5 Days = 432000 seconds
  const { request } = await publicClient.simulateContract({
    account,
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: 'setTieredLockups',
    args: [172800n, 432000n]
  })

  const hash = await client.writeContract(request)
  console.log(`Transaction broadcasted: ${hash}`)
  
  await publicClient.waitForTransactionReceipt({ hash })
  console.log('✅ Vault lockup successfully restored to 2 & 5 Days!')
}

main().catch(console.error)
