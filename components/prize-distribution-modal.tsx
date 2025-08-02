"use client"

import { useState } from "react"
import { X, Trophy, Info } from "lucide-react"

interface PrizeDistributionModalProps {
  onClose: () => void
  prizePool: any
}

export default function PrizeDistributionModal({ onClose, prizePool }: PrizeDistributionModalProps) {
  const [showMore, setShowMore] = useState(false)

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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
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
