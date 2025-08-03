"use client"

import { useState, useEffect } from "react"
import { X, Trophy, Info, Users, Clock, DollarSign, TrendingUp, Award } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { debugFinalRankings } from "@/lib/debug-final-rankings"
import { cleanupDuplicateRankings } from "@/lib/cleanup-duplicate-rankings"

interface PrizeDistributionModalProps {
  onClose: () => void
  prizePool: any
}

interface PoolStats {
  totalParticipants: number
  totalTeams: number
  averageScore: number
  bestScore: number
  worstScore: number
  contestDuration: string
  fillRate: number
  totalPrizeDistributed: number
  winnersCount: number
}

export default function PrizeDistributionModal({ onClose, prizePool }: PrizeDistributionModalProps) {
  const [showMore, setShowMore] = useState(false)
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null)
  const [loading, setLoading] = useState(true)

  const generatePrizeBreakdown = () => {
    const { distribution_type, distribution_config, prize_pool_size, max_participants } = prizePool
    const { distributions = [], admin_cut = 0 } = distribution_config || {}

    const breakdown: Array<{ rank: number; reward: string; position: string }> = []

    if (distribution_type === "fixed") {
      distributions.forEach((dist: any) => {
        for (let rank = dist.rankFrom; rank <= Math.min(dist.rankTo, max_participants); rank++) {
          breakdown.push({
            rank,
            reward: `$${dist.amount?.toFixed(2) || "0.00"}`,
            position: getRankSuffix(rank),
          })
        }
      })
    } else {
      // Percentage distribution
      distributions.forEach((dist: any) => {
        for (let rank = dist.rankFrom; rank <= Math.min(dist.rankTo, max_participants); rank++) {
          const amount = (prize_pool_size * (dist.percentage || 0)) / 100
          breakdown.push({
            rank,
            reward: `$${amount.toFixed(2)}`,
            position: getRankSuffix(rank),
          })
        }
      })
    }

    // Fill remaining positions with $0.00
    for (let rank = breakdown.length + 1; rank <= max_participants; rank++) {
      breakdown.push({
        rank,
        reward: "$0.00",
        position: getRankSuffix(rank),
      })
    }

    return breakdown.sort((a, b) => a.rank - b.rank)
  }

  const getRankSuffix = (rank: number): string => {
    if (rank % 100 >= 11 && rank % 100 <= 13) {
      return `${rank}th`
    }
    switch (rank % 10) {
      case 1:
        return `${rank}st`
      case 2:
        return `${rank}nd`
      case 3:
        return `${rank}rd`
      default:
        return `${rank}th`
    }
  }

  const breakdown = generatePrizeBreakdown()
  const displayedBreakdown = showMore ? breakdown : breakdown.slice(0, 50)

  // Load pool statistics
  useEffect(() => {
    loadPoolStats()
  }, [prizePool.id])

  const loadPoolStats = async () => {
    try {
      setLoading(true)
      
      // Get participants with their final scores
      const { data: participants, error } = await supabase
        .from("prize_pool_participants")
        .select(`
          *,
          team:teams(team_name, user_uid),
          final_ranking:final_rankings(rank, score)
        `)
        .eq("prize_pool_id", prizePool.id)
        .order("joined_at", { ascending: true })

      if (error) {
        console.error("Error loading pool stats:", error)
        return
      }

      // Calculate statistics
      const scores = participants
        .map(p => p.final_ranking?.score || 0)
        .filter(score => score !== null)

      const totalPrizeDistributed = breakdown
        .slice(0, participants.length)
        .reduce((sum, item) => sum + parseFloat(item.reward.replace('$', '')), 0)

      const stats: PoolStats = {
        totalParticipants: participants.length,
        totalTeams: new Set(participants.map(p => p.team?.user_uid)).size,
        averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
        bestScore: scores.length > 0 ? Math.max(...scores) : 0,
        worstScore: scores.length > 0 ? Math.min(...scores) : 0,
        contestDuration: calculateContestDuration(),
        fillRate: (participants.length / prizePool.max_participants) * 100,
        totalPrizeDistributed,
        winnersCount: breakdown.filter(item => parseFloat(item.reward.replace('$', '')) > 0).length
      }

      setPoolStats(stats)
    } catch (error) {
      console.error("Error calculating pool stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateContestDuration = () => {
    if (!prizePool.started_at || !prizePool.finished_at) return "N/A"
    
    const start = new Date(prizePool.started_at)
    const end = new Date(prizePool.finished_at)
    const duration = end.getTime() - start.getTime()
    
    const minutes = Math.floor(duration / (1000 * 60))
    const seconds = Math.floor((duration % (1000 * 60)) / 1000)
    
    return `${minutes}m ${seconds}s`
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Prize Distribution</h2>
              <p className="text-gray-600">{prizePool.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => debugFinalRankings(prizePool.id)}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
            >
              Debug Rankings
            </button>
            <button
              onClick={() => cleanupDuplicateRankings(prizePool.id)}
              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
            >
              Clean Duplicates
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Contest Statistics */}
          {loading ? (
            <div className="mb-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <span className="ml-3 text-gray-600">Loading contest statistics...</span>
              </div>
            </div>
          ) : poolStats ? (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Contest Statistics
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Participants</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{poolStats.totalParticipants}</div>
                  <div className="text-xs text-blue-600">{poolStats.fillRate.toFixed(1)}% fill rate</div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Winners</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{poolStats.winnersCount}</div>
                  <div className="text-xs text-green-600">Prize winners</div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Duration</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{poolStats.contestDuration}</div>
                  <div className="text-xs text-purple-600">Contest time</div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Distributed</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">${poolStats.totalPrizeDistributed.toFixed(2)}</div>
                  <div className="text-xs text-yellow-600">Total prizes</div>
                </div>
              </div>

              {/* Score Statistics */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Score Analysis</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600">Best Score</div>
                    <div className="text-lg font-bold text-green-600">{poolStats.bestScore.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Average Score</div>
                    <div className="text-lg font-bold text-blue-600">{poolStats.averageScore.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Worst Score</div>
                    <div className="text-lg font-bold text-red-600">{poolStats.worstScore.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-yellow-800 text-center">
                  <Info className="w-5 h-5 mx-auto mb-2" />
                  <p className="font-semibold">Statistics Unavailable</p>
                  <p className="text-sm">Contest data is still being processed</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Total Prize Pool</h3>
                  <p className="text-red-600">
                    Distribution Method: {prizePool.distribution_type === "fixed" ? "Fixed Dollar" : "Percentage"}
                  </p>
                </div>
                <div className="text-3xl font-bold text-red-600">${prizePool.prize_pool_size}</div>
              </div>
            </div>
          </div>

          {/* Prize Breakdown Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-3 gap-4 font-semibold text-gray-800">
                <div>Rank</div>
                <div>Position</div>
                <div>Reward</div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {displayedBreakdown.map((item, index) => (
                <div
                  key={item.rank}
                  className={`px-6 py-3 border-b border-gray-100 ${
                    index < 3 ? "bg-yellow-50" : index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">#{item.rank}</span>
                      {index < 3 && <Trophy className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <div className="text-gray-700">{item.position}</div>
                    <div className="font-semibold text-green-600">{item.reward}</div>
                  </div>
                </div>
              ))}
            </div>

            {!showMore && breakdown.length > 50 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
                <button
                  onClick={() => setShowMore(true)}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  See More ({breakdown.length - 50} more positions)
                </button>
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-blue-800 text-sm">
                <p className="font-semibold mb-1">Prize Distribution Information:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Prizes are distributed based on final team rankings</li>
                  <li>Teams with identical scores are randomly ordered</li>
                  <li>Prize amounts are calculated automatically when the contest ends</li>
                  <li>Winners will be announced immediately after the contest finishes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
