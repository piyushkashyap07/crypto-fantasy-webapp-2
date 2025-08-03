"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Plus, Users, Trophy, DollarSign, BarChart3, RefreshCw } from "lucide-react"
import { getCurrentAdmin, adminSignOut, getAdminStats } from "@/lib/admin-auth"
import AdminPrizePoolTabs from "@/components/admin-prize-pool-tabs"
import AddPrizePoolModal from "@/components/add-prize-pool-modal"
import { usePrizePools } from "@/hooks/use-prize-pools"

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("upcoming")
  const { prizePools, loading: poolsLoading, refetch } = usePrizePools()
  const router = useRouter()

  useEffect(() => {
    checkAdminAuth()
    
    // Set up session refresh interval
    const sessionInterval = setInterval(() => {
      checkAdminAuth()
    }, 30000) // Check every 30 seconds

    return () => clearInterval(sessionInterval)
  }, [])

  const checkAdminAuth = async () => {
    try {
      const adminUser = await getCurrentAdmin()
      if (!adminUser) {
        console.log("No admin user found, redirecting to login")
        router.push("/admin")
        return
      }
      console.log("Admin user authenticated:", adminUser.email)
      setAdmin(adminUser)
      loadStats()
    } catch (error) {
      console.error("Auth check error:", error)
      router.push("/admin")
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const adminStats = await getAdminStats()
      setStats(adminStats)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const handleSignOut = async () => {
    await adminSignOut()
    router.push("/admin")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {admin?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Prize Pools</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPools || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Teams</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTeams || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPayments || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prize Pool Management */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Prize Pool Management</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => refetch()}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Prize Pool</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            <AdminPrizePoolTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              prizePools={prizePools}
              loading={poolsLoading}
            />
          </div>
        </div>
      </div>

      {showAddModal && <AddPrizePoolModal onClose={() => setShowAddModal(false)} />}
    </div>
  )
} 