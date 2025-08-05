"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, DollarSign, Trophy, CheckCircle, RefreshCw, Settings } from "lucide-react"

export default function AdminPanel() {
  const [stats, setStats] = useState({
    totalPools: 0,
    ongoingPools: 0,
    finishedPools: 0,
    totalParticipants: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Get total pools
      const { count: totalPools } = await supabase
        .from("prize_pools")
        .select("*", { count: "exact", head: true })

      // Get ongoing pools
      const { count: ongoingPools } = await supabase
        .from("prize_pools")
        .select("*", { count: "exact", head: true })
        .eq("status", "ongoing")

      // Get finished pools
      const { count: finishedPools } = await supabase
        .from("prize_pools")
        .select("*", { count: "exact", head: true })
        .eq("status", "finished")

      // Get total participants
      const { count: totalParticipants } = await supabase
        .from("prize_pool_participants")
        .select("*", { count: "exact", head: true })

      setStats({
        totalPools: totalPools || 0,
        ongoingPools: ongoingPools || 0,
        finishedPools: finishedPools || 0,
        totalParticipants: totalParticipants || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor your platform's performance</p>
            </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pools</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPools}</div>
            <p className="text-xs text-muted-foreground">
              All time pools created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ongoing Pools</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ongoingPools}</div>
            <p className="text-xs text-muted-foreground">
              Currently active pools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finished Pools</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.finishedPools}</div>
            <p className="text-xs text-muted-foreground">
              Completed pools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalParticipants}</div>
            <p className="text-xs text-muted-foreground">
              All time participants
            </p>
          </CardContent>
        </Card>
          </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={fetchStats} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Stats
            </Button>
            <Button variant="outline" className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              System Settings
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
  )
}

