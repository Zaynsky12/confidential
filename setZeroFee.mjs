import { createWalletClient, http, publicActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const RPC_URL = 'https://rpc.testnet.arc.network'
const PRIVATE_KEY = '0xb9c19de91f3b552d22fafc73a94913e17706f69291fd525a70fd125ba9b9569b'
const TRADING_CONTRACT = '0x788E7b0be4BaAA89143F3C14CE34A606659A306c'

const abi = [
  {
    "type": "function",
    "name": "setRolloverFeePerHour",
    "inputs": [{ "name": "_fee", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
]

async function main() {
  console.log("Setting Zero Borrow Fee (Reya Architecture)...")
  
  const account = privateKeyToAccount(PRIVATE_KEY)
  const client = createWalletClient({
    account,
    transport: http(RPC_URL)
  }).extend(publicActions)

  try {
    console.log("Sending transaction...")
    const hash = await client.writeContract({
      address: TRADING_CONTRACT,
      abi: abi,
      functionName: 'setRolloverFeePerHour',
      args: [0n],
      gas: 100000n,
    })
    
    console.log("Transaction Hash:", hash)
    console.log("Waiting for confirmation...")
    
    const receipt = await client.waitForTransactionReceipt({ hash })
    console.log("Success! Borrow Fee is now 0%.")
  } catch (e) {
    console.error("Error setting fee:", e.message)
  }
}

main()
