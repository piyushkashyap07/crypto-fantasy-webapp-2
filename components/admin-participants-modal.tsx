"use client"

import { useState, useEffect } from "react"
import { X, Users, Search, ExternalLink, Loader, AlertCircle, RefreshCw } from "lucide-react"
import { getPrizePoolParticipants, type ParticipantWithPayment } from "@/lib/payments"

interface AdminParticipantsModalProps {
  onClose: () => void
  prizePool: any
}

export default function AdminParticipantsModal({ onClose, prizePool }: AdminParticipantsModalProps) {
  const [participants, setParticipants] = useState<ParticipantWithPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadParticipants()
  }, [prizePool.id])

  const loadParticipants = async () => {
    try {
      setLoading(true)
      setError("")
      console.log("🔍 Loading participants for prize pool:", prizePool.id)

      const data = await getPrizePoolParticipants(prizePool.id)
      console.log("✅ Loaded participants:", data)

      setParticipants(data)
    } catch (error: any) {
      console.error("❌ Error loading participants:", error)
      setError(error.message || "Failed to load participants")
    } finally {
      setLoading(false)
    }
  }

  const filteredParticipants = participants.filter((participant) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      participant.user_uid?.toLowerCase().includes(searchLower) ||
      participant.teams?.team_name?.toLowerCase().includes(searchLower) ||
      participant.payment_details?.wallet_address?.toLowerCase().includes(searchLower) ||
      participant.payment_details?.transaction_hash?.toLowerCase().includes(searchLower)
    )
  })

  const formatWalletAddress = (address: string) => {
    if (!address || address === "Unknown") return "Unknown"
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTransactionHash = (hash: string) => {
    if (!hash || hash === "N/A") return "N/A"
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return "Unknown"
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Prize Pool Participants</h2>
              <p className="text-sm text-gray-600">{prizePool.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by user ID, team name, wallet address, or transaction hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading participants...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 text-center mb-4">{error}</p>
              <button
                onClick={loadParticipants}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? "No participants match your search" : "No participants yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{filteredParticipants.length}</div>
                  <div className="text-sm text-blue-800">{searchTerm ? "Filtered" : "Total"} Participants</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredParticipants.reduce((sum, p) => sum + (p.payment_details?.amount_usdt || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-green-800">Total USDT Collected</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(filteredParticipants.map((p) => p.teams?.team_name)).size}
                  </div>
                  <div className="text-sm text-purple-800">Unique Teams</div>
                </div>
              </div>

              {/* Participants List */}
              <div className="space-y-3">
                {filteredParticipants.map((participant) => (
                  <div key={participant.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* User & Team Info */}
                      <div>
                        <div className="text-sm font-medium text-gray-800 mb-1">User & Team</div>
                        <div className="text-xs text-gray-600 mb-1">ID: {participant.user_uid?.slice(0, 8)}...</div>
                        <div className="text-sm font-semibold text-blue-600">
                          {participant.teams?.team_name || "Unknown Team"}
                        </div>
                      </div>

                      {/* Wallet Info */}
                      <div>
                        <div className="text-sm font-medium text-gray-800 mb-1">Wallet Address</div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono text-gray-700">
                            {formatWalletAddress(participant.payment_details?.wallet_address || "Unknown")}
                          </span>
                          {participant.payment_details?.wallet_address &&
                            participant.payment_details.wallet_address !== "Unknown" && (
                              <a
                                href={`https://bscscan.com/address/${participant.payment_details.wallet_address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                        </div>
                      </div>

                      {/* Transaction Info */}
                      <div>
                        <div className="text-sm font-medium text-gray-800 mb-1">Transaction</div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-mono text-gray-700">
                            {formatTransactionHash(participant.payment_details?.transaction_hash || "N/A")}
                          </span>
                          {participant.payment_details?.transaction_hash &&
                            participant.payment_details.transaction_hash !== "N/A" && (
                              <a
                                href={`https://bscscan.com/tx/${participant.payment_details.transaction_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                        </div>
                        <div className="text-xs text-green-600 font-semibold">
                          {participant.payment_details?.amount_usdt || 0} USDT
                        </div>
                      </div>

                      {/* Status & Date */}
                      <div>
                        <div className="text-sm font-medium text-gray-800 mb-1">Status & Date</div>
                        <div
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-1 ${
                            participant.payment_details?.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : participant.payment_details?.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {participant.payment_details?.status || "unknown"}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatDate(participant.payment_details?.confirmed_at || participant.joined_at)}
                        </div>
                      </div>
                    </div>

                    {/* Team Tokens (if available) */}
                    {participant.teams?.tokens && participant.teams.tokens.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm font-medium text-gray-800 mb-2">Team Portfolio</div>
                        <div className="flex flex-wrap gap-2">
                          {participant.teams.tokens.slice(0, 5).map((token: any, index: number) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {token.symbol}
                            </span>
                          ))}
                          {participant.teams.tokens.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{participant.teams.tokens.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {searchTerm
              ? `Showing ${filteredParticipants.length} of ${participants.length} participants`
              : `Total: ${participants.length} participants`}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
