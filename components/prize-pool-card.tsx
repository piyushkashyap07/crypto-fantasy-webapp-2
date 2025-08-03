"use client"

import { useState } from "react"
import JoinPoolModal from "./join-pool-modal"
import CreateTeamModal from "./create-team-modal"
import PrizeDistributionModal from "./prize-distribution-modal"
import PrizePoolTimer from "./prize-pool-timer"
import { useAuth } from "@/hooks/use-auth"
import { debugPoolStatus } from "@/lib/debug-pool-status"

interface PrizePoolCardProps {
  pool: any
  onUpdate?: () => void
}

export default function PrizePoolCard({ pool, onUpdate }: PrizePoolCardProps) {
  const { userUID } = useAuth()
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
  const [showPrizeDistribution, setShowPrizeDistribution] = useState(false)

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hours`
    } else {
      const days = Math.floor(minutes / 1440)
      const remainingHours = Math.floor((minutes % 1440) / 60)
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`
    }
  }

  const handleJoinSuccess = () => {
    if (onUpdate) {
      onUpdate()
    }
  }

  const handleTeamCreated = () => {
    if (onUpdate) {
      onUpdate()
    }
  }

  const handleTimeUp = () => {
    if (onUpdate) {
      onUpdate()
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
          <div>
            <div className="text-xs sm:text-sm text-gray-500 mb-1">#{pool.serial_number}</div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">{pool.name}</h3>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xl sm:text-2xl font-bold text-red-600">${pool.prize_pool_size}</div>
            <div className="text-xs sm:text-sm text-gray-600">Prize Pool</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <div className="text-xs sm:text-sm text-gray-600">Entry Fee</div>
            <div className="text-sm sm:text-base font-semibold text-gray-800">${pool.entry_fee}</div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-gray-600">Duration</div>
            <div className="text-sm sm:text-base font-semibold text-gray-800">
              {formatDuration(pool.duration_minutes)}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-xs sm:text-sm text-gray-600">Participants</div>
            <div className="text-sm sm:text-base font-semibold text-gray-800">
              {pool.current_participants}/{pool.max_participants}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-1">
              <div
                className="bg-red-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                style={{ width: `${(pool.current_participants / pool.max_participants) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Show timer if pool is ongoing */}
        {pool.status === "ongoing" && pool.started_at && (
          <div className="mb-4">
            <PrizePoolTimer prizePool={pool} onTimeUp={handleTimeUp} />
          </div>
        )}

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {pool.status === "upcoming" && pool.current_participants < pool.max_participants ? (
            <>
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-opacity"
              >
                Join Pool
              </button>
              <button
                onClick={() => setShowPrizeDistribution(true)}
                className="flex-1 bg-white border border-red-600 text-red-600 py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-red-50 transition-colors"
              >
                Cash Rewards
              </button>
            </>
          ) : pool.status === "upcoming" && pool.current_participants >= pool.max_participants ? (
            <div className="w-full text-center space-y-2">
              <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg">
                <div className="font-semibold">Pool Full!</div>
                <div className="text-sm">Waiting for contest to start...</div>
              </div>
              <button
                onClick={() => debugPoolStatus(pool.id)}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
              >
                Debug Status
              </button>
            </div>
          ) : pool.status === "ongoing" ? (
            <button
              onClick={() => setShowPrizeDistribution(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-opacity"
            >
              Leaderboard
            </button>
          ) : (
            <button
              onClick={() => setShowPrizeDistribution(true)}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-opacity"
            >
              Winners Announced
            </button>
          )}
        </div>
      </div>

      {showJoinModal && (
        <JoinPoolModal
          onClose={() => setShowJoinModal(false)}
          onSuccess={handleJoinSuccess}
          prizePool={pool}
          onCreateTeam={() => setShowCreateTeamModal(true)}
        />
      )}

        {showCreateTeamModal && (
          <CreateTeamModal
            onClose={() => setShowCreateTeamModal(false)}
            onSuccess={handleTeamCreated}
            userUID={userUID}
            poolId={pool.id}
          />
        )}

      {showPrizeDistribution && (
        <PrizeDistributionModal onClose={() => setShowPrizeDistribution(false)} prizePool={pool} />
      )}
    </>
  )
}
