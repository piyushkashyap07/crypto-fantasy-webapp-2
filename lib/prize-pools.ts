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

    // Update participant count
    const newParticipantCount = prizePool.current_participants + 1
    const shouldStartPool = newParticipantCount >= prizePool.max_participants

    console.log("📊 New participant count:", newParticipantCount, "/", prizePool.max_participants)
    console.log("🚀 Should start pool?", shouldStartPool)

    const updateData: any = {
      current_participants: newParticipantCount,
    }

    // If pool is now full, start it immediately
    if (shouldStartPool && prizePool.status === "upcoming") {
      updateData.status = "ongoing"
      updateData.started_at = new Date().toISOString()
      console.log("🎉 Pool is now full! Starting immediately...")
    }

    const { error: updateError } = await supabase.from("prize_pools").update(updateData).eq("id", prizePoolId)

    if (updateError) throw updateError

    // Invalidate cache when pool data changes
    cache.delete(CACHE_KEYS.PRIZE_POOLS)

    // If we just started the pool, lock prices immediately
    if (shouldStartPool && prizePool.status === "upcoming") {
      console.log("🔒 Pool just started, locking prices now...")
      try {
        const result = await lockPricesForPool(prizePoolId)
        console.log("✅ Price locking result:", result)
      } catch (lockError) {
        console.error("❌ Failed to lock prices:", lockError)
        // Don't throw here - the join was successful, price locking is secondary
      }
    }

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
