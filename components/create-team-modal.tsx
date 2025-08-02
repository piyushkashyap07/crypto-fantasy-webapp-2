"use client"

import { useState, useEffect, useMemo } from "react"
import { X, Search, Plus, Minus } from "lucide-react"
import { getTop200Cryptocurrencies, searchCryptocurrencies, type CryptoCurrency } from "@/lib/coingecko"
import { createTeam } from "@/lib/teams"

interface CreateTeamModalProps {
  onClose: () => void
  onSuccess: () => void
  userUID: string
}

export default function CreateTeamModal({ onClose, onSuccess, userUID }: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [allCryptos, setAllCryptos] = useState<CryptoCurrency[]>([])
  const [filteredCryptos, setFilteredCryptos] = useState<CryptoCurrency[]>([])
  const [selectedTokens, setSelectedTokens] = useState<CryptoCurrency[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  const totalPoints = useMemo(() => {
    return selectedTokens.reduce((sum, token) => sum + token.points, 0)
  }, [selectedTokens])

  const remainingPoints = 250 - totalPoints
  const canAddMore = selectedTokens.length < 11 && remainingPoints > 0

  useEffect(() => {
    loadCryptocurrencies()
  }, [])

  useEffect(() => {
    if (Array.isArray(allCryptos)) {
      const results = searchCryptocurrencies(searchQuery, allCryptos)
      setFilteredCryptos(Array.isArray(results) ? results : [])
    } else {
      setFilteredCryptos([])
    }
  }, [searchQuery, allCryptos])

  const loadCryptocurrencies = async () => {
    try {
      setLoading(true)
      const cryptos = await getTop200Cryptocurrencies()
      setAllCryptos(cryptos)
      setFilteredCryptos(cryptos)
    } catch (error: any) {
      setError("Failed to load cryptocurrency data. Please try again.")
      console.error("Error loading cryptocurrencies:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTokenSelect = (token: CryptoCurrency) => {
    if (selectedTokens.find((t) => t.id === token.id)) {
      setSelectedTokens((prev) => prev.filter((t) => t.id !== token.id))
    } else {
      if (selectedTokens.length >= 11) {
        setError("You can only select 11 tokens maximum.")
        return
      }

      if (totalPoints + token.points > 250) {
        setError(`Adding this token would exceed the 250 point limit. You have ${remainingPoints} points remaining.`)
        return
      }

      setSelectedTokens((prev) => [...prev, token])
      setError("")
    }
  }

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setError("Please enter a team name.")
      return
    }

    if (selectedTokens.length !== 11) {
      setError("You must select exactly 11 tokens.")
      return
    }

    if (totalPoints > 250) {
      setError("Total points cannot exceed 250.")
      return
    }

    try {
      setCreating(true)
      setError("")

      await createTeam(userUID, teamName.trim(), selectedTokens)

      alert("Team created successfully!")
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Team creation error:", error)
      if (error.message.includes("already taken")) {
        setError(error.message)
      } else if (error.message.includes("duplicate key")) {
        setError(`Team name "${teamName.trim()}" is already taken. Please choose a different name.`)
      } else {
        setError(error.message || "Failed to create team. Please try again.")
      }
    } finally {
      setCreating(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toFixed(2)}`
  }

  const formatPercentage = (percentage: number) => {
    const formatted = percentage?.toFixed(2) || "0.00"
    return `${percentage >= 0 ? "+" : ""}${formatted}%`
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">Create New Team</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-6 min-h-0">
          {/* Team Name Input */}
          <div className="mb-4 flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter your team name"
              maxLength={50}
            />
          </div>

          {/* Search Input */}
          <div className="mb-4 flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Cryptocurrency</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Search by name or symbol..."
              />
            </div>
          </div>

          {/* Team Stats */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg flex-shrink-0">
            <div className="flex justify-between items-center text-sm">
              <span>
                Selected Tokens: <strong>{selectedTokens.length}/11</strong>
              </span>
              <span>
                Total Points:{" "}
                <strong className={totalPoints > 250 ? "text-red-600" : "text-gray-800"}>{totalPoints}/250</strong>
              </span>
              <span>
                Remaining:{" "}
                <strong className={remainingPoints < 0 ? "text-red-600" : "text-green-600"}>{remainingPoints}</strong>
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex-shrink-0">
              {error}
            </div>
          )}

          {/* Cryptocurrency List - PROPERLY SCROLLABLE */}
          <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden min-h-0">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <div className="h-full overflow-y-scroll">
                <div className="p-4 space-y-2">
                  {Array.isArray(filteredCryptos) && filteredCryptos.length > 0 ? (
                    filteredCryptos.map((crypto) => {
                      const isSelected = selectedTokens.find((t) => t.id === crypto.id)
                      const canSelect = canAddMore || isSelected
                      const wouldExceedPoints = !isSelected && totalPoints + crypto.points > 250

                      return (
                        <div
                          key={crypto.id}
                          onClick={() => canSelect && !wouldExceedPoints && handleTokenSelect(crypto)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-red-50 border-red-200 ring-2 ring-red-500"
                              : canSelect && !wouldExceedPoints
                                ? "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                : "bg-gray-100 border-gray-200 cursor-not-allowed opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full text-xs font-bold">
                                #{crypto.market_cap_rank}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">{crypto.name}</div>
                                <div className="text-sm text-gray-600">{crypto.symbol}</div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-semibold text-gray-800">{formatPrice(crypto.current_price)}</div>
                              <div
                                className={`text-sm ${crypto.price_change_percentage_1h_in_currency >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {formatPercentage(crypto.price_change_percentage_1h_in_currency)}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-bold text-red-600">{crypto.points} pts</div>
                              <div className="text-xs text-gray-500">
                                {isSelected ? (
                                  <Minus className="w-4 h-4 text-red-600" />
                                ) : (
                                  <Plus className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {Array.isArray(allCryptos) && allCryptos.length > 0
                        ? "No cryptocurrencies match your search"
                        : "No cryptocurrency data available"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={creating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreateTeam}
            disabled={creating || selectedTokens.length !== 11 || !teamName.trim() || totalPoints > 250}
            className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Creating..." : "Create Team"}
          </button>
        </div>
      </div>
    </div>
  )
}
