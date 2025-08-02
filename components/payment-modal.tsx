"use client"

import { useState, useEffect } from "react"
import { X, Wallet, AlertCircle, CheckCircle, Loader, ExternalLink, RefreshCw } from "lucide-react"
import { ConnectButton, useActiveAccount, useSendTransaction } from "thirdweb/react"
import { prepareContractCall } from "thirdweb"
import { client, getUSDTContract, toUSDTWei, DEFAULT_RECIPIENT_WALLET, bscChain } from "@/lib/thirdweb"
import { recordPayment, confirmPayment, checkWalletPaymentStatus } from "@/lib/payments"

interface PaymentModalProps {
  onClose: () => void
  onSuccess: () => void
  prizePool: any
  team: any
  userUID: string
}

export default function PaymentModal({ onClose, onSuccess, prizePool, team, userUID }: PaymentModalProps) {
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "checking" | "preparing" | "pending" | "confirming" | "success" | "error"
  >("idle")
  const [error, setError] = useState("")
  const [transactionHash, setTransactionHash] = useState("")
  const [confirmationDetails, setConfirmationDetails] = useState<any>(null)
  const [retryCount, setRetryCount] = useState(0)

  const account = useActiveAccount()
  const { mutate: sendTransaction } = useSendTransaction()

  const entryFeeUSDT = prizePool.entry_fee
  const recipientWallet = prizePool.recipient_wallet || DEFAULT_RECIPIENT_WALLET

  // Check if wallet has already paid when account connects
  useEffect(() => {
    if (account?.address) {
      checkExistingPayment()
    }
  }, [account?.address])

  // Enhanced confirmation polling with blockchain verification
  useEffect(() => {
    if (paymentStatus === "confirming" && transactionHash) {
      let pollCount = 0
      const maxPolls = 40 // 2 minutes total (3s * 40)

      const pollInterval = setInterval(async () => {
        pollCount++
        console.log(`🔄 Polling for confirmation (${pollCount}/${maxPolls})...`)

        try {
          const result = await confirmPayment(transactionHash)

          if (result.isConfirmed) {
            console.log("✅ Payment confirmed!")
            setConfirmationDetails(result.details)
            setPaymentStatus("success")
            clearInterval(pollInterval)

            // AUTO-REFRESH: Trigger page refresh after success
            setTimeout(() => {
              onSuccess()
              onClose()
              // Force page refresh to update participant counts
              window.location.reload()
            }, 2000)
          } else if (result.error && result.error.includes("failed")) {
            // Transaction failed on blockchain
            setError(result.error)
            setPaymentStatus("error")
            clearInterval(pollInterval)
          } else if (result.error && result.error.includes("already joined")) {
            // Team already joined
            setError(result.error)
            setPaymentStatus("error")
            clearInterval(pollInterval)
          } else if (pollCount >= maxPolls) {
            // Timeout - but don't mark as error, let user manually verify
            setError("Confirmation taking longer than expected. Please check BSCScan or try manual verification.")
            setPaymentStatus("error")
            clearInterval(pollInterval)
          }
        } catch (error) {
          console.error("Error during confirmation polling:", error)
          if (pollCount >= maxPolls) {
            setError("Unable to confirm payment automatically. Please check BSCScan.")
            setPaymentStatus("error")
            clearInterval(pollInterval)
          }
        }
      }, 3000) // Poll every 3 seconds

      return () => clearInterval(pollInterval)
    }
  }, [paymentStatus, transactionHash, onSuccess, onClose])

  const checkExistingPayment = async () => {
    if (!account?.address) return

    try {
      setPaymentStatus("checking")
      console.log("🔍 Checking if wallet has already paid...")

      const paymentStatus = await checkWalletPaymentStatus(account.address, prizePool.id)

      if (paymentStatus.hasPaid) {
        console.log("✅ Wallet has already paid for this prize pool")
        setPaymentStatus("success")
        setTransactionHash(paymentStatus.transactionHash || "")
        setConfirmationDetails(paymentStatus.paymentDetails)

        setTimeout(() => {
          onSuccess()
          onClose()
          // Force page refresh to update participant counts
          window.location.reload()
        }, 2000)
      } else {
        setPaymentStatus("idle")
      }
    } catch (error) {
      console.error("Error checking existing payment:", error)
      setPaymentStatus("idle")
    }
  }

  const handlePayment = async () => {
    if (!account) {
      setError("Please connect your wallet first")
      return
    }

    try {
      setPaymentStatus("preparing")
      setError("")
      setRetryCount(0)

      console.log("🔄 Preparing USDT payment...")
      console.log("💰 Amount:", entryFeeUSDT, "USDT")
      console.log("📍 Recipient:", recipientWallet)
      console.log("👤 From:", account.address)

      // Get USDT contract
      const usdtContract = getUSDTContract()

      // Convert amount to wei (USDT has 18 decimals on BSC)
      const amountWei = toUSDTWei(entryFeeUSDT)
      console.log("🔢 Amount in wei:", amountWei.toString())

      // Prepare the transfer transaction
      const transaction = prepareContractCall({
        contract: usdtContract,
        method: "function transfer(address to, uint256 amount) returns (bool)",
        params: [recipientWallet, amountWei],
      })

      setPaymentStatus("pending")

      // Send the transaction
      sendTransaction(transaction, {
        onSuccess: async (result) => {
          console.log("✅ Transaction sent:", result.transactionHash)
          setTransactionHash(result.transactionHash)

          // Record payment in database
          try {
            await recordPayment({
              prizePoolId: prizePool.id,
              userUID,
              teamId: team.id,
              walletAddress: account.address,
              transactionHash: result.transactionHash,
              amountUSDT: entryFeeUSDT,
              recipientWallet,
            })

            setPaymentStatus("confirming")
          } catch (dbError) {
            console.error("❌ Error recording payment:", dbError)
            setPaymentStatus("error")
            setError("Payment sent but failed to record. Please contact support with your transaction hash.")
          }
        },
        onError: (error) => {
          console.error("❌ Transaction failed:", error)
          setPaymentStatus("error")

          if (error.message.includes("insufficient funds")) {
            setError("Insufficient USDT balance or BNB for gas fees. Please add funds to your wallet.")
          } else if (error.message.includes("user rejected")) {
            setError("Transaction was rejected. Please try again.")
          } else {
            setError(error.message || "Transaction failed. Please try again.")
          }
        },
      })
    } catch (error: any) {
      console.error("💥 Payment error:", error)
      setPaymentStatus("error")
      setError(error.message || "Failed to process payment. Please try again.")
    }
  }

  const handleManualVerification = async () => {
    if (!transactionHash) return

    try {
      setPaymentStatus("confirming")
      setError("")
      setRetryCount((prev) => prev + 1)

      console.log(`🔄 Manual verification attempt ${retryCount + 1}`)

      const result = await confirmPayment(transactionHash)

      if (result.isConfirmed) {
        setConfirmationDetails(result.details)
        setPaymentStatus("success")
        setTimeout(() => {
          onSuccess()
          onClose()
          // Force page refresh to update participant counts
          window.location.reload()
        }, 2000)
      } else {
        setPaymentStatus("error")
        setError(result.error || "Verification failed. Please check your transaction on BSCScan.")
      }
    } catch (error: any) {
      setPaymentStatus("error")
      setError(`Verification failed: ${error.message}`)
    }
  }

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case "checking":
        return <Loader className="w-6 h-6 animate-spin text-blue-600" />
      case "preparing":
      case "pending":
        return <Loader className="w-6 h-6 animate-spin text-blue-600" />
      case "confirming":
        return <Loader className="w-6 h-6 animate-spin text-yellow-600" />
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case "error":
        return <AlertCircle className="w-6 h-6 text-red-600" />
      default:
        return <Wallet className="w-6 h-6 text-gray-600" />
    }
  }

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case "checking":
        return "Checking payment status..."
      case "preparing":
        return "Preparing transaction..."
      case "pending":
        return "Please confirm the transaction in your wallet"
      case "confirming":
        return "Verifying payment on blockchain..."
      case "success":
        return "Payment verified! Joining prize pool..."
      case "error":
        return error || "Payment failed"
      default:
        return `Pay ${entryFeeUSDT} USDT to join this prize pool`
    }
  }

  const isProcessing = ["checking", "preparing", "pending", "confirming", "success"].includes(paymentStatus)

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Join Prize Pool</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={isProcessing}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Prize Pool Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">{prizePool.name}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                Team: <span className="font-medium">{team.team_name}</span>
              </div>
              <div>
                Entry Fee: <span className="font-bold text-red-600">{entryFeeUSDT} USDT</span>
              </div>
              <div>
                Prize Pool: <span className="font-medium">${prizePool.prize_pool_size}</span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="mb-6 flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="font-medium text-gray-800">{getStatusMessage()}</div>
              {transactionHash && (
                <div className="flex items-center space-x-2 mt-1">
                  <div className="text-xs text-gray-600">
                    TX: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                  </div>
                  <a
                    href={`https://bscscan.com/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Connect Wallet</label>
            <ConnectButton
              client={client}
              chain={bscChain}
              theme="light"
              connectModal={{
                size: "wide",
                title: "Connect Wallet to Pay",
                showThirdwebBranding: false,
              }}
            />
          </div>

          {/* Payment Info */}
          {account && paymentStatus === "idle" && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Payment Details:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Token: USDT (BEP20) on BSC Network</li>
                    <li>Amount: {entryFeeUSDT} USDT</li>
                    <li>Network: Binance Smart Chain</li>
                    <li>Make sure you have enough USDT and BNB for gas</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Error Message with Manual Verification Option */}
          {error && paymentStatus === "error" && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="mb-2">{error}</p>
                  {transactionHash && (
                    <div className="space-y-2">
                      <p className="text-xs">If you believe the payment was successful, you can verify it manually:</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleManualVerification}
                          className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors flex items-center space-x-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Verify Payment</span>
                        </button>
                        <a
                          href={`https://bscscan.com/tx/${transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View on BSCScan</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Success Details */}
          {paymentStatus === "success" && confirmationDetails && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Payment Verified Successfully!</p>
                  <div className="text-xs space-y-1">
                    {confirmationDetails.actualAmount && <p>Amount: {confirmationDetails.actualAmount} USDT</p>}
                    {confirmationDetails.confirmations && <p>Confirmations: {confirmationDetails.confirmations}</p>}
                    <p className="text-green-700 font-medium">Page will refresh automatically...</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isProcessing}
          >
            {paymentStatus === "success" ? "Close" : "Cancel"}
          </button>
          {paymentStatus === "idle" && (
            <button
              onClick={handlePayment}
              disabled={!account || isProcessing}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pay {entryFeeUSDT} USDT
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
