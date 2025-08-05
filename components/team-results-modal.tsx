"use client"

import { useState, useEffect } from "react"
import { X, Trophy, DollarSign, Users, Award } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface TeamResult {
  id: string
  team_name: string
  user_uid: string
  final_rank: number
  prize_amount: number
  wallet_address: string
  tokens: any[]
}

interface TeamResultsModalProps {
  prizePoolId: string
  prizePoolName: string
  onClose: () => void
}

export default function TeamResultsModal({ 
  prizePoolId, 
  prizePoolName, 
  onClose 
}: TeamResultsModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamResults, setTeamResults] = useState<TeamResult[]>([])
  const [poolStats, setPoolStats] = useState<any>(null)

  useEffect(() => {
    fetchTeamResults()
  }, [prizePoolId])

  const fetchTeamResults = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get final rankings with team details
      const { data: rankings, error: rankingsError } = await supabase
        .from("final_rankings")
        .select(`
          id,
          user_uid,
          team_id,
          final_rank,
          prize_amount,
          teams!inner(
            team_name,
            tokens
          )
        `)
        .eq("prize_pool_id", prizePoolId)
        .order("final_rank", { ascending: true })

      if (rankingsError) {
        throw rankingsError
      }

      // Get wallet addresses for each participant
      const resultsWithWallets: TeamResult[] = []
      
      for (const ranking of rankings || []) {
        // Try to get wallet address from payments first
        const { data: payments } = await supabase
          .from("payments")
          .select("wallet_address")
          .eq("prize_pool_id", prizePoolId)
          .eq("user_uid", ranking.user_uid)
          .eq("status", "confirmed")
          .limit(1)

        let walletAddress = "Unknown"
        if (payments && payments.length > 0) {
          walletAddress = payments[0].wallet_address
        } else {
          // Try to get from participants table
          const { data: participants } = await supabase
            .from("prize_pool_participants")
            .select("wallet_address")
            .eq("prize_pool_id", prizePoolId)
            .eq("user_uid", ranking.user_uid)
            .limit(1)

          if (participants && participants.length > 0 && participants[0].wallet_address) {
            walletAddress = participants[0].wallet_address
          }
        }

        resultsWithWallets.push({
          id: ranking.id,
          team_name: ranking.teams.team_name,
          user_uid: ranking.user_uid,
          final_rank: ranking.final_rank,
          prize_amount: ranking.prize_amount,
          wallet_address: walletAddress,
          tokens: ranking.teams.tokens || []
        })
      }

      // Get pool statistics
      const { data: pool } = await supabase
        .from("prize_pools")
        .select("*")
        .eq("id", prizePoolId)
        .single()

      setTeamResults(resultsWithWallets)
      setPoolStats(pool)

    } catch (error: any) {
      console.error("❌ Error fetching team results:", error)
      setError(error.message || "Failed to fetch team results")
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Award className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 text-gray-400">{rank}</span>
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Team Results</h2>
            <p className="text-sm text-gray-600">{prizePoolName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 text-lg">Error loading team results</div>
              <div className="text-gray-500 text-sm mt-2">{error}</div>
            </div>
          ) : teamResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No team results found</div>
              <div className="text-gray-400 text-sm mt-2">This pool may not have finished yet</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pool Statistics */}
              {poolStats && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Pool Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Total Teams</div>
                      <div className="font-semibold">{teamResults.length}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Winners</div>
                      <div className="font-semibold">{teamResults.filter(t => t.prize_amount > 0).length}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Total Prize Pool</div>
                      <div className="font-semibold">{formatAmount(teamResults.reduce((sum, t) => sum + t.prize_amount, 0))}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Status</div>
                      <div className="font-semibold capitalize">{poolStats.status}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Team Results Table */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Final Standings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 border-b font-medium text-gray-700">Rank</th>
                        <th className="text-left p-3 border-b font-medium text-gray-700">Team Name</th>
                        <th className="text-left p-3 border-b font-medium text-gray-700">User ID</th>
                        <th className="text-left p-3 border-b font-medium text-gray-700">Prize Amount</th>
                        <th className="text-left p-3 border-b font-medium text-gray-700">Wallet Address</th>
                        <th className="text-left p-3 border-b font-medium text-gray-700">Tokens</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamResults.map((result, index) => (
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="p-3 border-b">
                            <div className="flex items-center space-x-2">
                              {getRankIcon(result.final_rank)}
                              <span className="font-medium">{result.final_rank}</span>
                            </div>
                          </td>
                          <td className="p-3 border-b font-medium">{result.team_name}</td>
                          <td className="p-3 border-b text-gray-600">{result.user_uid}</td>
                          <td className="p-3 border-b">
                            {result.prize_amount > 0 ? (
                              <span className="text-green-600 font-semibold">
                                {formatAmount(result.prize_amount)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-3 border-b">
                            <div className="font-mono text-sm text-gray-600 break-all">
                              {result.wallet_address}
                            </div>
                          </td>
                          <td className="p-3 border-b">
                            <div className="flex flex-wrap gap-1">
                              {result.tokens && result.tokens.length > 0 ? (
                                result.tokens.map((token: any, tokenIndex: number) => (
                                  <span
                                    key={tokenIndex}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                  >
                                    {token.symbol || token.name || 'Unknown'}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400 text-sm">No tokens</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Winners Summary */}
              {teamResults.filter(t => t.prize_amount > 0).length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">🏆 Winners Summary</h3>
                  <div className="space-y-2">
                    {teamResults
                      .filter(t => t.prize_amount > 0)
                      .sort((a, b) => a.final_rank - b.final_rank)
                      .map((winner) => (
                        <div key={winner.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getRankIcon(winner.final_rank)}
                            <span className="font-medium">{winner.team_name}</span>
                            <span className="text-gray-500">({winner.user_uid})</span>
                          </div>
                          <span className="font-semibold text-green-600">
                            {formatAmount(winner.prize_amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 