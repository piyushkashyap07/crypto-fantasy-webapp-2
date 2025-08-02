import { createThirdwebClient, getContract } from "thirdweb"
import { defineChain } from "thirdweb/chains"

// ThirdWeb client configuration
export const client = createThirdwebClient({
  clientId: "764499667b9a3f2f6df108083c5bf0f1",
})

// Define BSC chain manually
export const bscChain = defineChain({
  id: 56,
  name: "BNB Smart Chain",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  rpc: "https://bsc-dataseed.binance.org/",
  blockExplorers: [
    {
      name: "BscScan",
      url: "https://bscscan.com",
    },
  ],
})

// BEP20 USDT contract address on BSC
export const USDT_CONTRACT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"

// Default recipient wallet address
export const DEFAULT_RECIPIENT_WALLET = "0xbb5C95B0555b9DE5EEf6DAacEC0fAC734E87e898"

// Get USDT contract
export const getUSDTContract = () => {
  return getContract({
    client,
    chain: bscChain,
    address: USDT_CONTRACT_ADDRESS,
  })
}

// USDT has 18 decimals on BSC
export const USDT_DECIMALS = 18

// Convert USDT amount to wei (multiply by 10^18)
export const toUSDTWei = (amount: number): bigint => {
  return BigInt(Math.floor(amount * Math.pow(10, USDT_DECIMALS)))
}

// Convert wei to USDT amount (divide by 10^18)
export const fromUSDTWei = (wei: bigint): number => {
  return Number(wei) / Math.pow(10, USDT_DECIMALS)
}
