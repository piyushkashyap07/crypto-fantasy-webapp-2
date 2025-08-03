"use client"

import { useState } from "react"
import { Trash2, Wallet, Users, Edit, Eye, Users as UsersIcon } from "lucide-react"
import { deletePrizePool, updatePrizePool } from "@/lib/admin-auth"
import EditRecipientModal from "./edit-recipient-modal"
import AdminParticipantsModal from "./admin-participants-modal"
import EditPrizePoolModal from "./edit-prize-pool-modal"
import DownloadExcelButton from "./download-excel-button"

interface AdminPrizePoolTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  prizePools: any[]
  loading: boolean
  onUpdate: () => void
}

export default function AdminPrizePoolTabs({
  activeTab,
  setActiveTab,
  prizePools,
  loading,
  onUpdate,
}: AdminPrizePoolTabsProps) {
  const [showEditRecipient, setShowEditRecipient] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showEditPrizePool, setShowEditPrizePool] = useState(false)
  const [selectedPool, setSelectedPool] = useState<any>(null)

  const upcomingPools = prizePools.filter((pool) => pool.status === "upcoming")
  const ongoingPools = prizePools.filter((pool) => pool.status === "ongoing")
  const finishedPools = prizePools.filter((pool) => pool.status === "finished")

  const tabs = [
    { id: "upcoming", label: "Upcoming", count: upcomingPools.length },
    { id: "ongoing", label: "Ongoing", count: ongoingPools.length },
    { id: "finished", label: "Finished", count: finishedPools.length },
  ]

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

  const handleDeletePrizePool = async (poolId: string, poolName: string) => {
    if (!confirm(`Are you sure you want to delete "${poolName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deletePrizePool(poolId)
      alert("Prize pool deleted successfully!")
      onUpdate()
    } catch (error: any) {
      alert(`Error deleting prize pool: ${error.message}`)
    }
  }

  const handleEditRecipient = (pool: any) => {
    setSelectedPool(pool)
    setShowEditRecipient(true)
  }

  const handleViewParticipants = (pool: any) => {
    setSelectedPool(pool)
    setShowParticipants(true)
  }

  const handleEditPrizePool = (pool: any) => {
    setSelectedPool(pool)
    setShowEditPrizePool(true)
  }

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

  const renderPrizePool = (pool: any) => (
    <div key={pool.id} className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm text-gray-500 mb-1">#{pool.serial_number}</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{pool.name}</h3>
          <span
            className={`inline-block px-2 py-1 rounded text-sm font-medium ${
              pool.status === "upcoming"
                ? "bg-blue-100 text-blue-800"
                : pool.status === "ongoing"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {pool.status.charAt(0).toUpperCase() + pool.status.slice(1)}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-xl font-bold text-red-600">${pool.prize_pool_size}</div>
            <div className="text-sm text-gray-600">Prize Pool</div>
          </div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleViewParticipants(pool)}
              className="text-blue-600 hover:text-blue-700 transition-colors p-2 hover:bg-blue-50 rounded"
              title="View Participants"
            >
              <UsersIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleEditPrizePool(pool)}
              className="text-orange-600 hover:text-orange-700 transition-colors p-2 hover:bg-orange-50 rounded"
              title="Edit Prize Pool"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleEditRecipient(pool)}
              className="text-green-600 hover:text-green-700 transition-colors p-2 hover:bg-green-50 rounded"
              title="Edit Recipient Wallet"
            >
              <Wallet className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDeletePrizePool(pool.id, pool.name)}
              className="text-red-600 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded"
              title="Delete Prize Pool"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-600">Entry Fee</div>
          <div className="font-semibold text-gray-800">{pool.entry_fee} USDT</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Duration</div>
          <div className="font-semibold text-gray-800">{formatDuration(pool.duration_minutes)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Participants</div>
          <div className="font-semibold text-gray-800">
            {pool.current_participants}/{pool.max_participants}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Fill Rate</div>
          <div className="font-semibold text-gray-800">
            {((pool.current_participants / pool.max_participants) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Recipient Wallet Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">Recipient Wallet</div>
        <div className="font-mono text-sm text-gray-800 break-all">
          {pool.recipient_wallet || "0xbb5C95B0555b9DE5EEf6DAacEC0fAC734E87e898"}
        </div>
      </div>

      {/* Participants Summary */}
      {pool.current_participants > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800">
              <span className="font-medium">{pool.current_participants} teams</span> have joined this pool
            </div>
            <button
              onClick={() => handleViewParticipants(pool)}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Download Excel Button for Finished Pools */}
      {pool.status === "finished" && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-green-800">
              <span className="font-medium">Prize Distribution</span> - Download Excel file for payments
            </div>
            <DownloadExcelButton 
              prizePoolId={pool.id}
              prizePoolName={pool.name}
              isFinished={pool.status === "finished"}
            />
          </div>
        </div>
      )}
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
            <div className="space-y-4">{currentPools.map(renderPrizePool)}</div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No {activeTab} prize pools</div>
              <div className="text-gray-400 text-sm mt-2">
                {activeTab === "upcoming" && "Click 'Add Prize Pool' to create a new one"}
                {activeTab === "ongoing" && "Active contests will be shown here"}
                {activeTab === "finished" && "Completed contests will be listed here"}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditRecipient && selectedPool && (
        <EditRecipientModal onClose={() => setShowEditRecipient(false)} prizePool={selectedPool} onUpdate={onUpdate} />
      )}

      {showParticipants && selectedPool && (
        <AdminParticipantsModal 
          onClose={() => setShowParticipants(false)} 
          prizePoolId={selectedPool.id}
          prizePoolName={selectedPool.name}
        />
      )}

      {showEditPrizePool && selectedPool && (
        <EditPrizePoolModal
          prizePool={selectedPool}
          onClose={() => setShowEditPrizePool(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  )
}
