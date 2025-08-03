import { supabase } from "./supabase"

export async function debugPoolStatus(poolId: string) {
  try {
    console.log("🔍 Debugging pool status for:", poolId)
    
    // Get pool data
    const { data: pool, error: poolError } = await supabase
      .from("prize_pools")
      .select("*")
      .eq("id", poolId)
      .single()
    
    if (poolError) {
      console.error("❌ Error fetching pool:", poolError)
      return
    }
    
    console.log("📊 Pool Data:", {
      id: pool.id,
      name: pool.name,
      status: pool.status,
      current_participants: pool.current_participants,
      max_participants: pool.max_participants,
      started_at: pool.started_at
    })
    
    // Get actual participant count
    const { data: participants, error: participantsError } = await supabase
      .from("prize_pool_participants")
      .select("id, user_uid, team_id, joined_at")
      .eq("prize_pool_id", poolId)
    
    if (participantsError) {
      console.error("❌ Error fetching participants:", participantsError)
      return
    }
    
    console.log("👥 Actual Participants:", participants.length)
    console.log("📋 Participant Details:", participants)
    
    // Check if pool should be ongoing
    const isFull = participants.length >= pool.max_participants
    const shouldBeOngoing = isFull && pool.status === "upcoming"
    
    console.log("🎯 Analysis:", {
      isFull,
      shouldBeOngoing,
      participantCount: participants.length,
      maxParticipants: pool.max_participants
    })
    
    if (shouldBeOngoing) {
      console.log("⚠️  Pool should be ongoing but isn't! Fixing...")
      
      // Update pool to ongoing
      const { error: updateError } = await supabase
        .from("prize_pools")
        .update({
          status: "ongoing",
          started_at: new Date().toISOString(),
          current_participants: participants.length
        })
        .eq("id", poolId)
      
      if (updateError) {
        console.error("❌ Error updating pool:", updateError)
      } else {
        console.log("✅ Pool status fixed!")
      }
    }
    
  } catch (error) {
    console.error("💥 Debug error:", error)
  }
} 