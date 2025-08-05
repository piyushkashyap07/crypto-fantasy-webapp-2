import { supabase } from "./supabase"
import { lockPricesForPool } from "./leaderboard"
import { cache, CACHE_KEYS } from "./cache"

export async function joinPrizePool(prizePoolId: string, userUID: string, teamId: string) {
  try {
    console.log("🎯 Joining prize pool:", prizePoolId, "with team:", teamId)

    // Check if user already joined with this team
    const { data: existingParticipation } = await supabase
      .from("prize_pool_participants")
      .select("*")
      .eq("prize_pool_id", prizePoolId)
      .eq("user_uid", userUID)
      .eq("team_id", teamId)
      .single()

    if (existingParticipation) {
      throw new Error("You have already joined this prize pool with this team.")
    }

    // Check if user has reached maximum team limit (5 teams per pool)
    const { data: userParticipations } = await supabase
      .from("prize_pool_participants")
      .select("*")
      .eq("prize_pool_id", prizePoolId)
      .eq("user_uid", userUID)

    if (userParticipations && userParticipations.length >= 5) {
      throw new Error("You can join a prize pool with maximum 5 teams.")
    }

    // Get current prize pool data
    const { data: prizePool, error: poolError } = await supabase
      .from("prize_pools")
      .select("*")
      .eq("id", prizePoolId)
      .single()

    if (poolError) throw poolError

    if (prizePool.current_participants >= prizePool.max_participants) {
      throw new Error("This prize pool is already full.")
    }

    // Add participant
    const { error: participantError } = await supabase.from("prize_pool_participants").insert({
      prize_pool_id: prizePoolId,
      user_uid: userUID,
      team_id: teamId,
    })

    if (participantError) throw participantError

    // Use the RPC function to increment participant count and auto-start pool
    const { error: countError } = await supabase.rpc("increment_prize_pool_participants", {
      pool_id: prizePoolId,
    })

    if (countError) {
      console.error("❌ Error updating participant count:", countError)
      throw countError
    }

    console.log("✅ Participant added and count updated using RPC function")

    // Invalidate cache when pool data changes
    cache.delete(CACHE_KEYS.PRIZE_POOLS)

    // Price locking will be handled by the real-time subscription when pool status changes
    console.log("🔄 Pool status change will trigger price locking via real-time subscription")

    return { success: true }
  } catch (error) {
    console.error("💥 Error joining prize pool:", error)
    throw error
  }
}

export async function deletePrizePool(prizePoolId: string) {
  try {
    // Delete all participants first
    await supabase.from("prize_pool_participants").delete().eq("prize_pool_id", prizePoolId)

    // Delete locked prices
    await supabase.from("locked_prices").delete().eq("prize_pool_id", prizePoolId)

    // Delete final prices
    await supabase.from("final_prices").delete().eq("prize_pool_id", prizePoolId)

    // Delete final rankings
    await supabase.from("final_rankings").delete().eq("prize_pool_id", prizePoolId)

    // Delete the prize pool
    const { error } = await supabase.from("prize_pools").delete().eq("id", prizePoolId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error deleting prize pool:", error)
    throw error
  }
}
