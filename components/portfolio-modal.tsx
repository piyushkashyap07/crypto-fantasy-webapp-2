"use client"

import { X, TrendingUp, TrendingDown } from "lucide-react"
import type { TeamScore } from "@/lib/leaderboard"

interface PortfolioModalProps {
  onClose: () => void
  team: TeamScore
  prizePool: any
}

export default function PortfolioModal({ onClose, team, prizePool }: PortfolioModalProps) {
  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return "fail"
    if (price === 0) return "$0.00"
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toFixed(2)}`
  }

  const formatPercentage = (percentage: number) => {
    if (isNaN(percentage)) return "0.00%"
    return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`
  }

  const formatScore = (score: number) => {
    if (isNaN(score)) return "0.00"
    return score.toFixed(2)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Portfolio Performance</h2>
            <p className="text-sm sm:text-base text-gray-600">
              {team.team_name} - Rank #{team.rank} - Score: {formatScore(team.total_score)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {team.tokens.map((token) => (
              <div key={token.coin_id} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800">{token.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{token.symbol}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-base sm:text-lg font-bold text-red-600">
                      {formatScore(token.individual_score)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Individual Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <div className="text-xs text-gray-600">Locked Price</div>
                    <div className="text-sm font-semibold text-gray-800">
                      {token.locked_price > 0 ? formatPrice(token.locked_price) : "Not locked"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">
                      {prizePool.status === "finished" ? "Final Price" : "Current Price"}
                    </div>
                    <div className="text-sm font-semibold text-gray-800">
                      {prizePool.status === "finished"
                        ? formatPrice(token.final_price || null)
                        : formatPrice(token.current_price)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">% Change</div>
                    <div
                      className={`text-sm font-semibold flex items-center space-x-1 ${
                        token.percentage_change >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {token.percentage_change >= 0 ? (
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                      <span>{formatPercentage(token.percentage_change)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Score Calc</div>
                    <div className="text-xs text-gray-500">{formatPercentage(token.percentage_change)} × 100</div>
                  </div>
                </div>

                {/* Debug info for locked price issues */}
                {token.locked_price === 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    ⚠️ Locked price not available - prices may not have been captured when pool started
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
