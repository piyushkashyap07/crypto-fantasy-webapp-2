"use client"

import { useState, useEffect } from "react"
import { Plus, Users } from "lucide-react"
import Layout from "@/components/layout"
import CreateTeamModal from "@/components/create-team-modal"
import TeamCard from "@/components/team-card"
import { useAuth } from "@/hooks/use-auth"
import { getUserTeams, type Team } from "@/lib/teams"

export default function TeamPage() {
  const { userUID, loading: authLoading } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"create" | "existing">("existing")

  useEffect(() => {
    if (userUID && !authLoading) {
      loadUserTeams()
    }
  }, [userUID, authLoading])

  const loadUserTeams = async () => {
    try {
      setLoading(true)
      const userTeams = await getUserTeams(userUID)
      setTeams(userTeams)
    } catch (error) {
      console.error("Error loading teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTeamCreated = () => {
    loadUserTeams()
  }

  const handleTeamDeleted = () => {
    loadUserTeams()
  }

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-full bg-gradient-to-br from-red-50 to-white px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-full bg-gradient-to-br from-red-50 to-white px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Team Management</h1>
            <p className="text-gray-600">Create and manage your cryptocurrency teams</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8 max-w-md mx-auto">
            <button
              onClick={() => setActiveTab("existing")}
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors flex items-center justify-center space-x-2 ${
                activeTab === "existing" ? "bg-white text-red-600 shadow-sm" : "text-gray-600 hover:text-red-600"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>My Teams</span>
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors flex items-center justify-center space-x-2 ${
                activeTab === "create" ? "bg-white text-red-600 shadow-sm" : "text-gray-600 hover:text-red-600"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          </div>

          {/* Content */}
          {activeTab === "existing" ? (
            <div>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
              ) : teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teams.map((team) => (
                    <TeamCard key={team.id} team={team} onDelete={handleTeamDeleted} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg mb-4">No teams created yet</div>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Your First Team</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">Ready to create a new team?</div>
              <p className="text-gray-400 text-sm mb-6 max-w-2xl mx-auto">
                Build your dream cryptocurrency team by selecting 11 tokens within a 250-point budget. Higher-ranked
                cryptocurrencies cost more points but could yield better results!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-red-600 to-red-500 text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center space-x-2 mx-auto text-lg"
              >
                <Plus className="w-6 h-6" />
                <span>Create New Team</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateTeamModal onClose={() => setShowCreateModal(false)} onSuccess={handleTeamCreated} userUID={userUID} />
      )}
    </Layout>
  )
}
