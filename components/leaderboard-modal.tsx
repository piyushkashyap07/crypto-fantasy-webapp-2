"use client"

import { useState, useEffect, useMemo } from "react"
import { X, Trophy, TrendingUp, Info, Search } from "lucide-react"
import { getLeaderboard, type TeamScore } from "@/lib/leaderboard"
import PrizePoolTimer from "./prize-pool-timer"
import PortfolioModal from "./portfolio-modal"
import { cleanupDuplicateRankings } from "@/lib/cleanup-duplicate-rankings"

interface LeaderboardModalProps {
  onClose: () => void
  prizePool: any
}

export default function LeaderboardModal({ onClose, prizePool }: LeaderboardModalProps) {
  const [leaderboard, setLeaderboard] = useState<TeamScore[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<TeamScore | null>(null)
  const [showPortfolio, setShowPortfolio] = useState(false)
  const [refreshCountdown, setRefreshCountdown] = useState(20)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const isFinished = prizePool.status === "finished"

  // Filter leaderboard based on search query
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard

    const query = searchQuery.toLowerCase()
    return leaderboard.filter(
      (team) => team.team_name.toLowerCase().includes(query) || team.user_uid.toLowerCase().includes(query),
    )
  }, [leaderboard, searchQuery])

  useEffect(() => {
    loadLeaderboard()
    if (!isFinished) {
      console.log("🔄 Setting up 20-second refresh timer for ongoing pool")

      // Set up refresh timer for ongoing pools - exactly 20 seconds
      const refreshInterval = setInterval(() => {
        console.log("⏰ 20 seconds elapsed - refreshing leaderboard data...")
        loadLeaderboard()
        setRefreshCountdown(20) // Reset countdown
      }, 20000) // Exactly 20 seconds

      // Countdown timer - updates every second
      const countdownInterval = setInterval(() => {
        setRefreshCountdown((prev) => {
          const newCount = prev > 1 ? prev - 1 : 20
          if (newCount === 20) {
            console.log("🔄 Countdown reset to 20 seconds")
          }
          return newCount
        })
      }, 1000)

      return () => {
        console.log("🧹 Cleaning up refresh timers")
        clearInterval(refreshInterval)
        clearInterval(countdownInterval)
      }
    }
  }, [prizePool.id, isFinished])

  const loadLeaderboard = async () => {
    try {
      if (leaderboard.length > 0) {
        setRefreshing(true) // Show refreshing indicator only if we already have data
      }
      console.log("📊 Loading leaderboard data for pool:", prizePool.id)
      const startTime = Date.now()

      const data = await getLeaderboard(prizePool.id, isFinished)

      const endTime = Date.now()
      console.log(`✅ Leaderboard data loaded in ${endTime - startTime}ms:`, data.length, "teams")

      setLeaderboard(data)
    } catch (error) {
      console.error("❌ Error loading leaderboard:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleTeamClick = (team: TeamScore) => {
    setSelectedTeam(team)
    setShowPortfolio(true)
  }

  const formatScore = (score: number) => {
    return score.toFixed(2)
  }

  const formatPrize = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-6 border-b space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
                  {isFinished ? "Winners Announced" : "Leaderboard"}
                </h2>
                <p className="text-sm sm:text-base text-gray-600">{prizePool.name}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {!isFinished && prizePool.status === "ongoing" && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <PrizePoolTimer prizePool={prizePool} />
                  <div
                    className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg ${
                      refreshing ? "bg-green-50 text-green-700" : "bg-blue-50 text-gray-600"
                    }`}
                  >
                    {refreshing ? "Refreshing scores..." : `Refreshing in ${refreshCountdown}s`}
                  </div>
                </div>
              )}
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 self-end sm:self-auto">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 sm:p-6 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                placeholder="Search team name or user ID..."
              />
            </div>
            {searchQuery && (
              <div className="mt-2 text-xs text-gray-600">
                Showing {filteredLeaderboard.length} of {leaderboard.length} teams
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-3 sm:p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-red-600"></div>
              </div>
            ) : filteredLeaderboard.length > 0 ? (
              <div className="h-full overflow-y-auto">
                <div className="space-y-2 sm:space-y-3">
                  {filteredLeaderboard.map((team) => (
                    <div
                      key={team.team_id}
                      onClick={() => handleTeamClick(team)}
                      className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                          <div
                            className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-white text-xs sm:text-sm ${
                              team.rank === 1
                                ? "bg-yellow-500"
                                : team.rank === 2
                                  ? "bg-gray-400"
                                  : team.rank === 3
                                    ? "bg-amber-600"
                                    : "bg-gray-600"
                            }`}
                          >
                            #{team.rank}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                {team.team_name}
                              </h3>
                              {team.is_tie && (
                                <div className="relative group">
                                  <Info className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 cursor-help flex-shrink-0" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 sm:px-3 py-1 sm:py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    Teams with same score - random order applied
                                  </div>
                                </div>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">@{team.user_uid}</p>
                            <p className="text-xs text-blue-600 cursor-pointer hover:underline">Tap for details</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg sm:text-2xl font-bold text-red-600">
                            {formatScore(team.total_score)}
                          </div>
                          {isFinished && team.prize_amount !== undefined && team.prize_amount > 0 && (
                            <div className="text-sm sm:text-lg font-semibold text-green-600 mt-1">
                              🏆 {formatPrize(team.prize_amount)}
                            </div>
                          )}
                          {isFinished && team.prize_amount === 0 && (
                            <div className="text-xs sm:text-sm text-gray-500 mt-1">No prize</div>
                          )}
                          <div className="flex items-center justify-end space-x-1 text-xs sm:text-sm text-gray-600">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">{isFinished ? "Final" : "Live"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : searchQuery ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-base sm:text-lg">No teams found matching "{searchQuery}"</div>
                <button onClick={() => setSearchQuery("")} className="mt-2 text-red-600 hover:text-red-700 text-sm">
                  Clear search
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 text-base sm:text-lg">No teams participating yet</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPortfolio && selectedTeam && (
        <PortfolioModal onClose={() => setShowPortfolio(false)} team={selectedTeam} prizePool={prizePool} />
      )}
    </>
  )
}
