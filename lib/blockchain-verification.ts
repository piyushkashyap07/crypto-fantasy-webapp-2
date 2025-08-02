// BSC RPC endpoints for transaction verification
const BSC_RPC_ENDPOINTS = [
  "https://bsc-dataseed1.binance.org/",
  "https://bsc-dataseed2.binance.org/",
  "https://bsc-dataseed3.binance.org/",
  "https://bsc-dataseed4.binance.org/",
]

// USDT contract address on BSC
const USDT_CONTRACT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"

interface TransactionReceipt {
  status: string
  blockNumber: string
  transactionHash: string
  from: string
  to: string
  value: string
  logs: any[]
}

interface USDTTransferEvent {
  from: string
  to: string
  value: string
  transactionHash: string
  blockNumber: string
}

// Get transaction receipt from BSC
async function getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
  for (const rpcUrl of BSC_RPC_ENDPOINTS) {
    try {
      console.log(`🔍 Checking transaction ${txHash} on ${rpcUrl}`)

      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getTransactionReceipt",
          params: [txHash],
          id: 1,
        }),
      })

      const data = await response.json()

      if (data.result) {
        console.log(`✅ Transaction receipt found:`, data.result)
        return data.result
      }
    } catch (error) {
      console.error(`❌ Error fetching from ${rpcUrl}:`, error)
      continue
    }
  }

  console.log(`⚠️ Transaction ${txHash} not found on any RPC endpoint`)
  return null
}

// Parse USDT transfer events from transaction logs
function parseUSDTTransferEvents(receipt: TransactionReceipt): USDTTransferEvent[] {
  const transferEvents: USDTTransferEvent[] = []

  // USDT Transfer event signature: Transfer(address,address,uint256)
  const transferEventSignature = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

  receipt.logs.forEach((log) => {
    if (
      log.address.toLowerCase() === USDT_CONTRACT_ADDRESS.toLowerCase() &&
      log.topics[0] === transferEventSignature &&
      log.topics.length >= 3
    ) {
      const from = "0x" + log.topics[1].slice(26) // Remove padding
      const to = "0x" + log.topics[2].slice(26) // Remove padding
      const value = log.data // Amount in wei

      transferEvents.push({
        from: from.toLowerCase(),
        to: to.toLowerCase(),
        value,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
      })
    }
  })

  return transferEvents
}

// Convert hex value to decimal USDT amount
function hexToUSDTAmount(hexValue: string): number {
  const wei = BigInt(hexValue)
  const decimals = 18 // USDT has 18 decimals on BSC
  const divisor = BigInt(10 ** decimals)
  const amount = Number(wei) / Number(divisor)
  return amount
}

// Verify USDT payment on BSC blockchain
export async function verifyUSDTPayment(
  txHash: string,
  expectedFrom: string,
  expectedTo: string,
  expectedAmount: number,
  tolerancePercent = 1, // 1% tolerance for amount
): Promise<{
  isValid: boolean
  actualAmount?: number
  error?: string
  confirmations?: number
}> {
  try {
    console.log(`🔍 Verifying USDT payment:`)
    console.log(`📝 TX Hash: ${txHash}`)
    console.log(`👤 Expected From: ${expectedFrom}`)
    console.log(`🎯 Expected To: ${expectedTo}`)
    console.log(`💰 Expected Amount: ${expectedAmount} USDT`)

    // Get transaction receipt
    const receipt = await getTransactionReceipt(txHash)

    if (!receipt) {
      return {
        isValid: false,
        error: "Transaction not found on blockchain",
      }
    }

    // Check if transaction was successful
    if (receipt.status !== "0x1") {
      return {
        isValid: false,
        error: "Transaction failed on blockchain",
      }
    }

    // Parse USDT transfer events
    const transferEvents = parseUSDTTransferEvents(receipt)

    if (transferEvents.length === 0) {
      return {
        isValid: false,
        error: "No USDT transfer events found in transaction",
      }
    }

    // Find matching transfer event
    const matchingTransfer = transferEvents.find(
      (event) =>
        event.from.toLowerCase() === expectedFrom.toLowerCase() && event.to.toLowerCase() === expectedTo.toLowerCase(),
    )

    if (!matchingTransfer) {
      console.log(`❌ No matching transfer found`)
      console.log(`🔍 Available transfers:`, transferEvents)
      return {
        isValid: false,
        error: `No USDT transfer found from ${expectedFrom} to ${expectedTo}`,
      }
    }

    // Verify amount
    const actualAmount = hexToUSDTAmount(matchingTransfer.value)
    const tolerance = expectedAmount * (tolerancePercent / 100)
    const amountDifference = Math.abs(actualAmount - expectedAmount)

    console.log(`💰 Actual amount: ${actualAmount} USDT`)
    console.log(`📊 Amount difference: ${amountDifference} USDT`)
    console.log(`📏 Tolerance: ${tolerance} USDT`)

    if (amountDifference > tolerance) {
      return {
        isValid: false,
        actualAmount,
        error: `Amount mismatch. Expected: ${expectedAmount} USDT, Actual: ${actualAmount} USDT`,
      }
    }

    // Get current block number to calculate confirmations
    let confirmations = 0
    try {
      const currentBlockResponse = await fetch(BSC_RPC_ENDPOINTS[0], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
      })

      const currentBlockData = await currentBlockResponse.json()
      if (currentBlockData.result) {
        const currentBlock = Number.parseInt(currentBlockData.result, 16)
        const txBlock = Number.parseInt(receipt.blockNumber, 16)
        confirmations = currentBlock - txBlock + 1
      }
    } catch (error) {
      console.error("Error getting confirmations:", error)
    }

    console.log(`✅ Payment verified successfully!`)
    console.log(`🔗 Confirmations: ${confirmations}`)

    return {
      isValid: true,
      actualAmount,
      confirmations,
    }
  } catch (error) {
    console.error(`💥 Error verifying payment:`, error)
    return {
      isValid: false,
      error: `Verification failed: ${error.message}`,
    }
  }
}

// Check if wallet has made any USDT transactions to recipient
export async function checkWalletUSDTTransactions(
  walletAddress: string,
  recipientAddress: string,
  minAmount: number,
  fromBlock = "latest", // Can specify block number or "latest"
): Promise<{
  hasValidTransaction: boolean
  transactions: Array<{
    hash: string
    amount: number
    blockNumber: string
    timestamp?: number
  }>
}> {
  try {
    console.log(`🔍 Checking USDT transactions from ${walletAddress} to ${recipientAddress}`)

    // This is a simplified check - in production you might want to use BSCScan API
    // or index recent transactions for better performance

    return {
      hasValidTransaction: false,
      transactions: [],
    }
  } catch (error) {
    console.error("Error checking wallet transactions:", error)
    return {
      hasValidTransaction: false,
      transactions: [],
    }
  }
}

// Get BSC transaction details for display
export async function getTransactionDetails(txHash: string): Promise<{
  hash: string
  status: string
  from: string
  to: string
  value: string
  gasUsed: string
  blockNumber: string
  confirmations: number
  bscScanUrl: string
} | null> {
  try {
    const receipt = await getTransactionReceipt(txHash)
    if (!receipt) return null

    // Get current block for confirmations
    let confirmations = 0
    try {
      const currentBlockResponse = await fetch(BSC_RPC_ENDPOINTS[0], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
      })

      const currentBlockData = await currentBlockResponse.json()
      if (currentBlockData.result) {
        const currentBlock = Number.parseInt(currentBlockData.result, 16)
        const txBlock = Number.parseInt(receipt.blockNumber, 16)
        confirmations = currentBlock - txBlock + 1
      }
    } catch (error) {
      console.error("Error getting confirmations:", error)
    }

    return {
      hash: receipt.transactionHash,
      status: receipt.status === "0x1" ? "Success" : "Failed",
      from: receipt.from,
      to: receipt.to,
      value: receipt.value,
      gasUsed: receipt.gasUsed || "0",
      blockNumber: receipt.blockNumber,
      confirmations,
      bscScanUrl: `https://bscscan.com/tx/${receipt.transactionHash}`,
    }
  } catch (error) {
    console.error("Error getting transaction details:", error)
    return null
  }
}
