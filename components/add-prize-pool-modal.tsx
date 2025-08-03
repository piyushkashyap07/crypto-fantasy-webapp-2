"use client"

import type React from "react"

import { useState } from "react"
import { X, Plus, Minus } from "lucide-react"
import { createPrizePool } from "@/lib/admin-auth"

interface PrizeDistribution {
  rankFrom: number
  rankTo: number
  amount?: number
  percentage?: number
}

interface AddPrizePoolModalProps {
  onClose: () => void
}

export default function AddPrizePoolModal({ onClose }: AddPrizePoolModalProps) {
  const [formData, setFormData] = useState({
    serialNumber: "",
    prizePoolName: "",
    entryFee: "",
    numberOfParticipants: "",
    duration: "",
    durationType: "minutes",
  })
  const [distributionType, setDistributionType] = useState<"fixed" | "percentage">("percentage")
  const [distributions, setDistributions] = useState<PrizeDistribution[]>([{ rankFrom: 1, rankTo: 1 }])
  const [adminCut, setAdminCut] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  const prizePoolSize =
    formData.entryFee && formData.numberOfParticipants
      ? Number.parseFloat(formData.entryFee) * Number.parseInt(formData.numberOfParticipants)
      : 0

  const calculateTotalDistribution = () => {
    if (distributionType === "fixed") {
      return distributions.reduce((sum, dist) => sum + (dist.amount || 0), 0) + adminCut
    } else {
      return distributions.reduce((sum, dist) => sum + (dist.percentage || 0), 0) + adminCut
    }
  }

  const addDistribution = () => {
    const lastDist = distributions[distributions.length - 1]
    setDistributions([...distributions, { rankFrom: lastDist.rankTo + 1, rankTo: lastDist.rankTo + 1 }])
  }

  const removeDistribution = (index: number) => {
    if (distributions.length > 1) {
      setDistributions(distributions.filter((_, i) => i !== index))
    }
  }

  const updateDistribution = (index: number, field: keyof PrizeDistribution, value: number) => {
    const updated = [...distributions]
    updated[index] = { ...updated[index], [field]: value }
    setDistributions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let durationInMinutes = Number.parseInt(formData.duration)

      if (formData.durationType === "hours") {
        durationInMinutes = durationInMinutes * 60
      } else if (formData.durationType === "days") {
        durationInMinutes = durationInMinutes * 24 * 60
      }

      // Validate distribution
      const total = calculateTotalDistribution()
      if (distributionType === "fixed" && total > prizePoolSize) {
        alert("Total distribution exceeds prize pool size!")
        return
      }
      if (distributionType === "percentage" && total > 100) {
        alert("Total percentage exceeds 100%!")
        return
      }

      const prizePoolData = {
        serial_number: formData.serialNumber,
        name: formData.prizePoolName,
        entry_fee: Number.parseFloat(formData.entryFee),
        max_participants: Number.parseInt(formData.numberOfParticipants),
        current_participants: 0,
        duration_minutes: durationInMinutes,
        prize_pool_size: prizePoolSize,
        status: "upcoming",
        distribution_type: distributionType,
        distribution_config: {
          distributions,
          admin_cut: adminCut,
        },
      }

      await createPrizePool(prizePoolData)
      alert("Prize pool created successfully!")
      onClose()
      
      // Trigger a page refresh to show the new pool
      window.location.reload()
    } catch (error: any) {
      console.error("Error creating prize pool:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const renderFixedDistribution = () => (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-800">Fixed Dollar Distribution</h4>
      {distributions.map((dist, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <label className="block text-sm text-gray-600">
              Rank {dist.rankFrom}
              {dist.rankFrom !== dist.rankTo && ` - ${dist.rankTo}`}
            </label>
            <input
              type="number"
              value={dist.amount || ""}
              onChange={(e) => updateDistribution(index, "amount", Number.parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="$0.00"
              step="0.01"
            />
          </div>
          {index > 0 && (
            <button type="button" onClick={() => removeDistribution(index)} className="text-red-600 hover:text-red-700">
              <Minus className="w-4 h-4" />
            </button>
          )}
          {index === distributions.length - 1 && (
            <button type="button" onClick={addDistribution} className="text-green-600 hover:text-green-700">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <div className="p-3 bg-yellow-50 rounded-lg">
        <label className="block text-sm text-gray-600 mb-1">Admin Cut ($)</label>
        <input
          type="number"
          value={adminCut}
          onChange={(e) => setAdminCut(Number.parseFloat(e.target.value) || 0)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          placeholder="$0.00"
          step="0.01"
        />
      </div>
      <div className="text-sm text-gray-600">
        Total: ${calculateTotalDistribution().toFixed(2)} / ${prizePoolSize.toFixed(2)}
      </div>
    </div>
  )

  const renderPercentageDistribution = () => (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-800">Percentage Distribution</h4>

      {/* Top 3 ranks */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-gray-700">Top 3 Ranks</h5>
        {[1, 2, 3].map((rank) => {
          const dist = distributions.find((d) => d.rankFrom === rank) || distributions[rank - 1]
          return (
            <div key={rank} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              <label className="w-16 text-sm text-gray-600">Rank {rank}</label>
              <input
                type="number"
                value={dist?.percentage || ""}
                onChange={(e) => {
                  const updated = [...distributions]
                  if (!updated[rank - 1]) updated[rank - 1] = { rankFrom: rank, rankTo: rank }
                  updated[rank - 1].percentage = Number.parseFloat(e.target.value) || 0
                  setDistributions(updated)
                }}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="0%"
                step="0.01"
                max="100"
              />
            </div>
          )
        })}
      </div>

      {/* Rank ranges */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-gray-700">Rank Ranges</h5>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-gray-50 rounded">
            <label className="block text-xs text-gray-600 mb-1">
              4th to 25% (Rank 4-{Math.floor(Number.parseInt(formData.numberOfParticipants || "0") * 0.25)})
            </label>
            <input
              type="number"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="0%"
              step="0.01"
            />
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <label className="block text-xs text-gray-600 mb-1">25% to 50%</label>
            <input
              type="number"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="0%"
              step="0.01"
            />
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <label className="block text-xs text-gray-600 mb-1">50% to 70%</label>
            <input
              type="number"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="0%"
              step="0.01"
            />
          </div>
          <div className="p-2 bg-yellow-50 rounded">
            <label className="block text-xs text-gray-600 mb-1">Admin Cut (%)</label>
            <input
              type="number"
              value={adminCut}
              onChange={(e) => setAdminCut(Number.parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="0%"
              step="0.01"
              max="100"
            />
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-600">Total: {calculateTotalDistribution().toFixed(2)}%</div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Add Prize Pool</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="PP001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entry Fee ($)</label>
              <input
                type="number"
                name="entryFee"
                value={formData.entryFee}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="10.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prize Pool Name</label>
            <input
              type="text"
              name="prizePoolName"
              value={formData.prizePoolName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Web Development Challenge"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Participants</label>
              <input
                type="number"
                name="numberOfParticipants"
                value={formData.numberOfParticipants}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="100"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="30"
                  min="1"
                  required
                />
                <select
                  name="durationType"
                  value={formData.durationType}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Prize Pool Size (Auto-calculated)</div>
            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-semibold">
              ${prizePoolSize.toFixed(2)}
            </div>
          </div>

          {/* Distribution Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Prize Distribution Method</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="fixed"
                  checked={distributionType === "fixed"}
                  onChange={(e) => setDistributionType(e.target.value as "fixed")}
                  className="mr-2"
                />
                Fixed Dollar Distribution
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="percentage"
                  checked={distributionType === "percentage"}
                  onChange={(e) => setDistributionType(e.target.value as "percentage")}
                  className="mr-2"
                />
                Percentage Method
              </label>
            </div>
          </div>

          {/* Distribution Configuration */}
          {distributionType === "fixed" ? renderFixedDistribution() : renderPercentageDistribution()}

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Prize Pool"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
