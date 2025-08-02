"use client"

import { useState } from "react"
import { X, Wallet } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DEFAULT_RECIPIENT_WALLET } from "@/lib/thirdweb"

interface EditRecipientModalProps {
  onClose: () => void
  prizePool: any
  onUpdate: () => void
}

export default function EditRecipientModal({ onClose, prizePool, onUpdate }: EditRecipientModalProps) {
  const [recipientWallet, setRecipientWallet] = useState(prizePool.recipient_wallet || DEFAULT_RECIPIENT_WALLET)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const validateWalletAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  const handleSave = async () => {
    if (!validateWalletAddress(recipientWallet)) {
      setError("Please enter a valid wallet address (0x...)")
      return
    }

    try {
      setLoading(true)
      setError("")

      const { error: updateError } = await supabase
        .from("prize_pools")
        .update({ recipient_wallet: recipientWallet })
        .eq("id", prizePool.id)

      if (updateError) {
        throw updateError
      }

      alert("Recipient wallet updated successfully!")
      onUpdate()
      onClose()
    } catch (error: any) {
      setError(error.message || "Failed to update recipient wallet")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setRecipientWallet(DEFAULT_RECIPIENT_WALLET)
    setError("")
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Edit Recipient Wallet</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">{prizePool.name}</h3>
            <div className="text-sm text-gray-600">
              Prize Pool: <span className="font-semibold">${prizePool.prize_pool_size}</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Wallet Address (BSC Network)
            </label>
            <input
              type="text"
              value={recipientWallet}
              onChange={(e) => setRecipientWallet(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="0x..."
              maxLength={42}
            />
            <div className="mt-2 text-xs text-gray-600">This wallet will receive USDT payments for this prize pool</div>
          </div>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Important:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Make sure this is a valid BSC (BEP20) wallet address</li>
                <li>This wallet will receive USDT payments from participants</li>
                <li>Double-check the address before saving</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t bg-gray-50">
          <button onClick={handleReset} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
            Reset to Default
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !validateWalletAddress(recipientWallet)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
