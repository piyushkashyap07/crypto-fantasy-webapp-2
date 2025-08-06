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
    console.log("🗑️ Starting deletion of prize pool:", prizePoolId)

    // First, update teams to remove the pool reference (set created_for_pool_id to null)
    const { error: teamsUpdateError } = await supabase
      .from("teams")
      .update({ created_for_pool_id: null })
      .eq("created_for_pool_id", prizePoolId)

    if (teamsUpdateError) {
      console.error("❌ Error updating teams:", teamsUpdateError)
      throw teamsUpdateError
    }

    console.log("✅ Updated teams to remove pool reference")

    // Delete all participants first
    const { error: participantsError } = await supabase
      .from("prize_pool_participants")
      .delete()
      .eq("prize_pool_id", prizePoolId)

    if (participantsError) {
      console.error("❌ Error deleting participants:", participantsError)
      throw participantsError
    }

    console.log("✅ Deleted participants")

    // Delete locked prices
    const { error: lockedPricesError } = await supabase
      .from("locked_prices")
      .delete()
      .eq("prize_pool_id", prizePoolId)

    if (lockedPricesError) {
      console.error("❌ Error deleting locked prices:", lockedPricesError)
      throw lockedPricesError
    }

    console.log("✅ Deleted locked prices")

    // Delete final prices
    const { error: finalPricesError } = await supabase
      .from("final_prices")
      .delete()
      .eq("prize_pool_id", prizePoolId)

    if (finalPricesError) {
      console.error("❌ Error deleting final prices:", finalPricesError)
      throw finalPricesError
    }

    console.log("✅ Deleted final prices")

    // Delete final rankings
    const { error: rankingsError } = await supabase
      .from("final_rankings")
      .delete()
      .eq("prize_pool_id", prizePoolId)

    if (rankingsError) {
      console.error("❌ Error deleting final rankings:", rankingsError)
      throw rankingsError
    }

    console.log("✅ Deleted final rankings")

    // Delete payments associated with this pool
    const { error: paymentsError } = await supabase
      .from("payments")
      .delete()
      .eq("prize_pool_id", prizePoolId)

    if (paymentsError) {
      console.error("❌ Error deleting payments:", paymentsError)
      throw paymentsError
    }

    console.log("✅ Deleted payments")

    // Finally, delete the prize pool
    const { error: poolError } = await supabase
      .from("prize_pools")
      .delete()
      .eq("id", prizePoolId)

    if (poolError) {
      console.error("❌ Error deleting prize pool:", poolError)
      throw poolError
    }

    console.log("✅ Successfully deleted prize pool:", prizePoolId)

    // Invalidate cache
    cache.delete(CACHE_KEYS.PRIZE_POOLS)

    return { success: true }
  } catch (error) {
    console.error("💥 Error deleting prize pool:", error)
    throw error
  }
}
