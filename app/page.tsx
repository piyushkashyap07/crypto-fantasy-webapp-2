"use client"

import { useState } from "react"
import Layout from "@/components/layout"
import PrizePoolCard from "@/components/prize-pool-card"
import PrizePoolSkeleton from "@/components/prize-pool-skeleton"
import TeamSelectionDropdown from "@/components/team-selection-dropdown"
import { usePrizePools } from "@/hooks/use-prize-pools"
import { useAuth } from "@/hooks/use-auth"
import { Link } from "lucide-react"
import type { Team } from "@/lib/teams"

export default function HomePage() {
  const { prizePools, loading, refetch } = usePrizePools()
  const { userUID } = useAuth()
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  // Only show first 2 upcoming prize pools on homepage
  const upcomingPools = prizePools.filter((pool) => pool.status === "upcoming").slice(0, 2)

  return (
    <Layout>
      <div className="min-h-full bg-gradient-to-br from-red-50 to-white px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Contest Platform</h1>
            <p className="text-gray-600">Join exciting contests and compete for prizes</p>
          </div>

          <TeamSelectionDropdown selectedTeam={selectedTeam} onTeamSelect={setSelectedTeam} />

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Featured Contests</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PrizePoolSkeleton />
              <PrizePoolSkeleton />
            </div>
          ) : upcomingPools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingPools.map((pool) => (
                <PrizePoolCard key={pool.id} pool={pool} onUpdate={refetch} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No featured contests available</div>
              <div className="text-gray-400 text-sm mt-2">Check the Explore page for all available contests</div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
