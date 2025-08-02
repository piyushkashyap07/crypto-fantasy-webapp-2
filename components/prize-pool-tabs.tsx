"use client"

import { useState } from "react"
import PrizePoolCard from "./prize-pool-card"
import PrizePoolTimer from "./prize-pool-timer"
import LeaderboardModal from "./leaderboard-modal"

interface PrizePool {
  id: string
  serial_number: string
  name: string
  entry_fee: number
  max_participants: number
  current_participants: number
  duration_minutes: number
  prize_pool_size: number
  status: string
  started_at?: string
}

interface PrizePoolTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  prizePools: PrizePool[]
  loading: boolean
  onUpdate?: () => void
}

export default function PrizePoolTabs({ activeTab, setActiveTab, prizePools, loading, onUpdate }: PrizePoolTabsProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [selectedPool, setSelectedPool] = useState<PrizePool | null>(null)

  const upcomingPools = prizePools.filter((pool) => pool.status === "upcoming")
  const ongoingPools = prizePools.filter((pool) => pool.status === "ongoing")
  const finishedPools = prizePools.filter((pool) => pool.status === "finished")

  const tabs = [
    { id: "upcoming", label: "Upcoming", count: upcomingPools.length },
    { id: "ongoing", label: "Ongoing", count: ongoingPools.length },
    { id: "finished", label: "Finished", count: finishedPools.length },
  ]

  const getCurrentPools = () => {
    switch (activeTab) {
      case "upcoming":
        return upcomingPools
      case "ongoing":
        return ongoingPools
      case "finished":
        return finishedPools
      default:
        return []
    }
  }

  const currentPools = getCurrentPools()

  const handleLeaderboardClick = (pool: PrizePool) => {
    setSelectedPool(pool)
    setShowLeaderboard(true)
  }

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

  const renderOngoingPool = (pool: PrizePool) => (
    <div key={pool.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm text-gray-500 mb-1">#{pool.serial_number}</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{pool.name}</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-red-600">${pool.prize_pool_size}</div>
          <div className="text-sm text-gray-600">Prize Pool</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-600">Entry Fee</div>
          <div className="font-semibold text-gray-800">${pool.entry_fee}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Participants</div>
          <div className="font-semibold text-gray-800">
            {pool.current_participants}/{pool.max_participants}
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <PrizePoolTimer prizePool={pool} onTimeUp={() => onUpdate && onUpdate()} />
        <button
          onClick={() => handleLeaderboardClick(pool)}
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Leaderboard
        </button>
      </div>
    </div>
  )

  const renderFinishedPool = (pool: PrizePool) => (
    <div key={pool.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm text-gray-500 mb-1">#{pool.serial_number}</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{pool.name}</h3>
          <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
            🏆 Contest Finished
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-red-600">${pool.prize_pool_size}</div>
          <div className="text-sm text-gray-600">Total Distributed</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-600">Entry Fee</div>
          <div className="font-semibold text-gray-800">${pool.entry_fee}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Total Participants</div>
          <div className="font-semibold text-gray-800">{pool.current_participants}</div>
        </div>
      </div>

      <button
        onClick={() => handleLeaderboardClick(pool)}
        className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
      >
        <span>🏆 Winners Announced</span>
      </button>
    </div>
  )

  return (
    <>
      <div>
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                activeTab === tab.id ? "bg-white text-red-600 shadow-sm" : "text-gray-600 hover:text-red-600"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : currentPools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTab === "upcoming" &&
                currentPools.map((pool) => <PrizePoolCard key={pool.id} pool={pool} onUpdate={onUpdate} />)}
              {activeTab === "ongoing" && currentPools.map(renderOngoingPool)}
              {activeTab === "finished" && currentPools.map(renderFinishedPool)}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No {activeTab} prize pools</div>
              <div className="text-gray-400 text-sm mt-2">
                {activeTab === "upcoming" && "New prize pools will appear here"}
                {activeTab === "ongoing" && "Active contests will be shown here"}
                {activeTab === "finished" && "Completed contests will be listed here"}
              </div>
            </div>
          )}
        </div>
      </div>

      {showLeaderboard && selectedPool && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} prizePool={selectedPool} />
      )}
    </>
  )
}
