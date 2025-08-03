"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/layout"
import PrizePoolCard from "@/components/prize-pool-card"
import PrizePoolSkeleton from "@/components/prize-pool-skeleton"
import { usePrizePools } from "@/hooks/use-prize-pools"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"

export default function MyContestPage() {
  const { prizePools, loading, refetch } = usePrizePools()
  const { userUID } = useAuth()
  const [userParticipatedPools, setUserParticipatedPools] = useState<any[]>([])
  const [loadingUserPools, setLoadingUserPools] = useState(true)

  // Fetch contests where user has participated
  useEffect(() => {
    const fetchUserParticipatedPools = async () => {
      if (!userUID) {
        setUserParticipatedPools([])
        setLoadingUserPools(false)
        return
      }

      try {
        // Get all teams created by this user
        const { data: userTeams, error: teamsError } = await supabase
          .from("teams")
          .select("id")
          .eq("user_uid", userUID)

        if (teamsError) {
          console.error("Error fetching user teams:", teamsError)
          setUserParticipatedPools([])
          setLoadingUserPools(false)
          return
        }

        if (!userTeams || userTeams.length === 0) {
          setUserParticipatedPools([])
          setLoadingUserPools(false)
          return
        }

        const teamIds = userTeams.map(team => team.id)

        // Get all prize pools where user has participated
        const { data: participatedPools, error: poolsError } = await supabase
          .from("prize_pool_participants")
          .select(`
            prize_pool_id,
            prize_pools!inner(*)
          `)
          .in("team_id", teamIds)

        if (poolsError) {
          console.error("Error fetching participated pools:", poolsError)
          setUserParticipatedPools([])
          setLoadingUserPools(false)
          return
        }

        // Extract unique prize pools
        const uniquePools = participatedPools?.reduce((acc: any[], current: any) => {
          const exists = acc.find(pool => pool.prize_pools.id === current.prize_pools.id)
          if (!exists) {
            acc.push(current.prize_pools)
          }
          return acc
        }, []) || []

        setUserParticipatedPools(uniquePools)
      } catch (error) {
        console.error("Error fetching user participated pools:", error)
        setUserParticipatedPools([])
      } finally {
        setLoadingUserPools(false)
      }
    }

    fetchUserParticipatedPools()
  }, [userUID])

  const isLoading = loading || loadingUserPools

  return (
    <Layout>
      <div className="min-h-full bg-gradient-to-br from-red-50 to-white px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Contests</h1>
            <p className="text-gray-600">Contests you've participated in</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PrizePoolSkeleton />
              <PrizePoolSkeleton />
            </div>
          ) : userParticipatedPools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userParticipatedPools.map((pool) => (
                <PrizePoolCard key={pool.id} pool={pool} onUpdate={refetch} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No contests participated yet</div>
              <div className="text-gray-400 text-sm mt-2">
                {userUID ? 
                  "Join contests from the Explore page to see them here" : 
                  "Sign in to see your participated contests"
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
