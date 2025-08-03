"use client"

import { useState } from "react"
import { X, Search, Wallet, Hash, AlertCircle, CheckCircle } from "lucide-react"
import { findUserByWalletAddress, findUserByTransactionHash, recoverUserSession, UserRecoveryData } from "@/lib/user-recovery"

interface UserRecoveryModalProps {
  onClose: () => void
  onRecoverySuccess: () => void
}

export default function UserRecoveryModal({ onClose, onRecoverySuccess }: UserRecoveryModalProps) {
  const [searchType, setSearchType] = useState<"wallet" | "transaction">("wallet")
  const [searchValue, setSearchValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [recoveryData, setRecoveryData] = useState<UserRecoveryData | null>(null)
  const [recoverySuccess, setRecoverySuccess] = useState(false)

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError("Please enter a wallet address or transaction hash")
      return
    }

    setLoading(true)
    setError("")
    setRecoveryData(null)

    try {
      let data: UserRecoveryData | null = null

      if (searchType === "wallet") {
        data = await findUserByWalletAddress(searchValue.trim())
      } else {
        data = await findUserByTransactionHash(searchValue.trim())
      }

      if (data) {
        setRecoveryData(data)
      } else {
        setError(`No account found with this ${searchType === "wallet" ? "wallet address" : "transaction hash"}`)
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during recovery")
    } finally {
      setLoading(false)
    }
  }

  const handleRecover = async () => {
    if (!recoveryData) return

    setLoading(true)
    try {
      const success = await recoverUserSession(recoveryData)
      if (success) {
        setRecoverySuccess(true)
        setTimeout(() => {
          onRecoverySuccess()
          onClose()
        }, 2000)
      } else {
        setError("Failed to recover account. Please try again.")
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during recovery")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Recover Account</h2>
              <p className="text-sm text-gray-600">Find your account using wallet or transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {recoverySuccess ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Account Recovered!</h3>
              <p className="text-gray-600">Your account has been successfully recovered.</p>
            </div>
          ) : (
            <>
              {/* Search Type Toggle */}
                             <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
                 <button
                   onClick={() => setSearchType("wallet")}
                   className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                     searchType === "wallet" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-blue-600"
                   }`}
                 >
                   <Wallet className="w-4 h-4 inline mr-2" />
                   Wallet Address
                 </button>
                 <button
                   onClick={() => setSearchType("transaction")}
                   className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                     searchType === "transaction" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-blue-600"
                   }`}
                 >
                   <Hash className="w-4 h-4 inline mr-2" />
                   Transaction Hash
                 </button>
               </div>

              {/* Search Input */}
                             <div className="mb-6">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   {searchType === "wallet" ? "Wallet Address" : "Transaction Hash"}
                 </label>
                 <input
                   type="text"
                   value={searchValue}
                   onChange={(e) => setSearchValue(e.target.value)}
                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                   placeholder="0x..."
                 />
               </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-6">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  {error}
                </div>
              )}

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={loading || !searchValue.trim()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search Account</span>
                  </>
                )}
              </button>

              {/* Recovery Results */}
              {recoveryData && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Account Found!</h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>User ID: @{recoveryData.user_uid}</p>
                    <p>Teams: {recoveryData.teams.length}</p>
                    <p>Payments: {recoveryData.payments.length}</p>
                    <p>Contests Joined: {recoveryData.participants.length}</p>
                  </div>
                  <button
                    onClick={handleRecover}
                    disabled={loading}
                    className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Recovering..." : "Recover This Account"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
} 