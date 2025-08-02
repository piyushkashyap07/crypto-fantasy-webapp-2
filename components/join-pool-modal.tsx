"use client"

import { useState, useEffect } from "react"
import { X, Plus, Ban } from "lucide-react"
import { getUserTeams, type Team } from "@/lib/teams"
import { getJoinedTeams } from "@/lib/payments"
import PaymentModal from "./payment-modal"
import { useAuth } from "@/hooks/use-auth"

interface JoinPoolModalProps {
  onClose: () => void
  onSuccess: () => void
  prizePool: any
  onCreateTeam: () => void
}

export default function JoinPoolModal({ onClose, onSuccess, prizePool, onCreateTeam }: JoinPoolModalProps) {
  const { userUID } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [joinedTeamIds, setJoinedTeamIds] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (userUID) {
      loadUserTeamsAndJoinedTeams()
    }
  }, [userUID])

  const loadUserTeamsAndJoinedTeams = async () => {
    try {
      setLoading(true)

      // Load user teams and joined teams in parallel
      const [userTeams, joinedTeams] = await Promise.all([getUserTeams(userUID), getJoinedTeams(prizePool.id, userUID)])

      setTeams(userTeams)
      setJoinedTeamIds(joinedTeams)

      console.log("👥 User teams:", userTeams.length)
      console.log("✅ Already joined teams:", joinedTeams.length)
    } catch (error) {
      console.error("Error loading teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProceedToPayment = () => {
    if (!selectedTeam) {
      setError("Please select a team to join the pool.")
      return
    }

    if (joinedTeamIds.includes(selectedTeam.id)) {
      setError("This team has already joined this prize pool.")
      return
    }

    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false)
    onSuccess()
    onClose()
  }

  const handleCreateTeamClick = () => {
    onClose()
    onCreateTeam()
  }

  const isTeamJoined = (teamId: string) => joinedTeamIds.includes(teamId)
  const availableTeams = teams.filter((team) => !isTeamJoined(team.id))

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Join Prize Pool</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">{prizePool.name}</h3>
              <div className="text-sm text-gray-600">
                Prize Pool: <span className="font-semibold text-red-600">${prizePool.prize_pool_size}</span>
              </div>
              <div className="text-sm text-gray-600">
                Entry Fee: <span className="font-semibold">{prizePool.entry_fee} USDT</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : teams.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select a team to join:
                  {joinedTeamIds.length > 0 && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({joinedTeamIds.length} team{joinedTeamIds.length > 1 ? "s" : ""} already joined)
                    </span>
                  )}
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {teams.map((team) => {
                    const isJoined = isTeamJoined(team.id)
                    return (
                      <button
                        key={team.id}
                        onClick={() => !isJoined && setSelectedTeam(team)}
                        disabled={isJoined}
                        className={`w-full p-3 text-left border rounded-lg transition-colors ${
                          isJoined
                            ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                            : selectedTeam?.id === team.id
                              ? "border-red-500 bg-red-50 ring-2 ring-red-500"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800 flex items-center space-x-2">
                              <span>{team.team_name}</span>
                              {isJoined && <Ban className="w-4 h-4 text-red-500" />}
                            </div>
                            <div className="text-sm text-gray-600">
                              {team.total_points} points • {team.tokens.length} tokens
                            </div>
                          </div>
                          {isJoined && (
                            <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Already Joined</div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {availableTeams.length === 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm text-yellow-800">
                      All your teams have already joined this prize pool. Create a new team to participate again.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">You don't have any teams yet.</div>
                <button
                  onClick={handleCreateTeamClick}
                  className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Team</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {availableTeams.length > 0 && (
            <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProceedToPayment}
                disabled={!selectedTeam || isTeamJoined(selectedTeam?.id || "")}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pay {prizePool.entry_fee} USDT To Join
              </button>
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && selectedTeam && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          prizePool={prizePool}
          team={selectedTeam}
          userUID={userUID}
        />
      )}
    </>
  )
}
