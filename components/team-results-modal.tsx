"use client"

import { useState, useEffect } from "react"
import { X, Trophy, Copy, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface TeamResult {
  id: string
  team_name: string
  user_uid: string
  final_rank: number
  prize_amount: number
  wallet_address: string
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
  const [copied, setCopied] = useState(false)

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
            team_name
          )
        `)
        .eq("prize_pool_id", prizePoolId)
        .order("final_rank", { ascending: true })

      if (rankingsError) {
        throw rankingsError
      }

      // Get prize pool details for prize calculation
      const { data: prizePool } = await supabase
        .from("prize_pools")
        .select("prize_pool_size, distribution_type, distribution_config")
        .eq("id", prizePoolId)
        .single()

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

        // Calculate prize amount if not stored correctly
        let prizeAmount = ranking.prize_amount || 0
        
        // If prize amount is 0 or null, try to calculate it
        if (prizeAmount === 0 && prizePool) {
          prizeAmount = calculatePrizeAmount(ranking.final_rank, prizePool)
        }

        resultsWithWallets.push({
          id: ranking.id,
          team_name: (ranking.teams as any).team_name,
          user_uid: ranking.user_uid,
          final_rank: ranking.final_rank,
          prize_amount: prizeAmount,
          wallet_address: walletAddress
        })
      }

      setTeamResults(resultsWithWallets)

    } catch (error: any) {
      console.error("❌ Error fetching team results:", error)
      setError(error.message || "Failed to fetch team results")
    } finally {
      setLoading(false)
    }
  }

  const calculatePrizeAmount = (rank: number, prizePool: any): number => {
    if (!prizePool || !prizePool.distribution_config) return 0

    const { distribution_type, distribution_config, prize_pool_size } = prizePool
    const distributions = distribution_config.distributions || []

    if (distribution_type === "fixed") {
      const dist = distributions.find((d: any) => rank >= d.rankFrom && rank <= d.rankTo)
      return dist?.amount || 0
    } else {
      const dist = distributions.find((d: any) => rank >= d.rankFrom && rank <= d.rankTo)
      const percentage = dist?.percentage || 0
      return (prize_pool_size * percentage) / 100
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <span className="w-5 h-5 text-gray-400">🥈</span>
      case 3:
        return <span className="w-5 h-5 text-amber-600">🥉</span>
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

  const copyWalletAddressesAndAmounts = async () => {
    try {
      // Filter only participants with wallet addresses (regardless of prize amount)
      const validResults = teamResults.filter(result => 
        result.wallet_address !== "Unknown"
      )

      if (validResults.length === 0) {
        alert("No valid wallet addresses found to copy")
        return
      }

      // Format: wallet_address,prize_amount (include 0 amounts too)
      const copyText = validResults
        .map(result => `${result.wallet_address},${result.prize_amount}`)
        .join('\n')

      await navigator.clipboard.writeText(copyText)
      setCopied(true)
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
      
    } catch (error) {
      console.error("❌ Error copying to clipboard:", error)
      alert("Failed to copy to clipboard")
    }
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
          <div className="flex items-center space-x-2">
            <button
              onClick={copyWalletAddressesAndAmounts}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              title="Copy wallet addresses and prize amounts"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Wallet & Amounts</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
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
                      </tr>
                    </thead>
                    <tbody>
                      {teamResults.map((result) => (
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Copy Instructions */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📋 Copy Instructions</h4>
                <p className="text-sm text-blue-800">
                  Click the "Copy Wallet & Amounts" button to copy all wallet addresses and prize amounts 
                  for this pool in the format: <code className="bg-blue-100 px-1 rounded">wallet_address,prize_amount</code>
                  <br />
                  <span className="text-blue-600">Note: Will copy all participants with valid wallet addresses, including those with $0 prize amounts.</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 