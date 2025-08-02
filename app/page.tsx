"use client"

import { useState } from "react"
import Layout from "@/components/layout"
import PrizePoolCard from "@/components/prize-pool-card"
import TeamSelectionDropdown from "@/components/team-selection-dropdown"
import { usePrizePools } from "@/hooks/use-prize-pools"
import type { Team } from "@/lib/teams"

export default function HomePage() {
  const { prizePools, loading, refetch } = usePrizePools()
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  // Only show first 2 upcoming prize pools on homepage
  const upcomingPools = prizePools.filter((pool) => pool.status === "upcoming").slice(0, 2)

  return (
    <Layout>
      <div className="min-h-full bg-gradient-to-br from-red-50 to-white px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <TeamSelectionDropdown selectedTeam={selectedTeam} onTeamSelect={setSelectedTeam} />

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : upcomingPools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingPools.map((pool) => (
                <PrizePoolCard key={pool.id} pool={pool} onUpdate={refetch} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No prize pools available</div>
              <div className="text-gray-400 text-sm mt-2">New contests will appear here when admins create them</div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
