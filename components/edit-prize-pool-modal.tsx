"use client"

import { useState, useEffect } from "react"
import { X, Edit, Trophy } from "lucide-react"
import { updatePrizePool } from "@/lib/admin-auth"

interface EditPrizePoolModalProps {
  prizePool: any
  onClose: () => void
  onUpdate: () => void
}

export default function EditPrizePoolModal({ 
  prizePool, 
  onClose, 
  onUpdate 
}: EditPrizePoolModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    prize_pool_size: 0,
    entry_fee: 0,
    max_participants: 0,
    duration_minutes: 0,
    recipient_wallet: "",
    description: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (prizePool) {
      setFormData({
        name: prizePool.name || "",
        prize_pool_size: prizePool.prize_pool_size || 0,
        entry_fee: prizePool.entry_fee || 0,
        max_participants: prizePool.max_participants || 0,
        duration_minutes: prizePool.duration_minutes || 0,
        recipient_wallet: prizePool.recipient_wallet || "",
        description: prizePool.description || ""
      })
    }
  }, [prizePool])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error("Prize pool name is required")
      }
      if (formData.prize_pool_size <= 0) {
        throw new Error("Prize pool size must be greater than 0")
      }
      if (formData.entry_fee < 0) {
        throw new Error("Entry fee cannot be negative")
      }
      if (formData.max_participants <= 0) {
        throw new Error("Maximum participants must be greater than 0")
      }
      if (formData.duration_minutes <= 0) {
        throw new Error("Duration must be greater than 0")
      }
      if (!formData.recipient_wallet.trim()) {
        throw new Error("Recipient wallet address is required")
      }

      // Update the prize pool
      await updatePrizePool(prizePool.id, formData)
      
      alert("Prize pool updated successfully!")
      onUpdate()
      onClose()
    } catch (error: any) {
      console.error("Error updating prize pool:", error)
      setError(error.message || "Failed to update prize pool")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Edit className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Edit Prize Pool</h2>
              <p className="text-sm text-gray-600">Update prize pool details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prize Pool Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prize Pool Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter prize pool name"
                required
              />
            </div>

            {/* Prize Pool Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prize Pool Size (USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.prize_pool_size}
                  onChange={(e) => handleInputChange("prize_pool_size", parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            {/* Entry Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entry Fee (USDT) *
              </label>
              <input
                type="number"
                value={formData.entry_fee}
                onChange={(e) => handleInputChange("entry_fee", parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Max Participants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Participants *
              </label>
              <input
                type="number"
                value={formData.max_participants}
                onChange={(e) => handleInputChange("max_participants", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="10"
                min="1"
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => handleInputChange("duration_minutes", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="60"
                min="1"
                required
              />
            </div>

            {/* Recipient Wallet */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Wallet Address *
              </label>
              <input
                type="text"
                value={formData.recipient_wallet}
                onChange={(e) => handleInputChange("recipient_wallet", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
                placeholder="0x..."
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter prize pool description..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  <span>Update Prize Pool</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 