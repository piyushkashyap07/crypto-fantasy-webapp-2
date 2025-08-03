import { supabase } from "./supabase"

export async function debugFinalRankings(poolId: string) {
  try {
    console.log("🔍 Debugging final rankings for pool:", poolId)
    
    // Get all participants
    const { data: participants, error: participantsError } = await supabase
      .from("prize_pool_participants")
      .select(`
        *,
        team:teams(team_name, user_uid)
      `)
      .eq("prize_pool_id", poolId)
    
    if (participantsError) {
      console.error("❌ Error fetching participants:", participantsError)
      return
    }
    
    console.log("👥 Participants:", participants.length)
    participants.forEach((p, i) => {
      console.log(`${i + 1}. Team: ${p.team?.team_name} | User: ${p.team?.user_uid} | Joined: ${p.joined_at}`)
    })
    
    // Get all final rankings
    const { data: rankings, error: rankingsError } = await supabase
      .from("final_rankings")
      .select("*")
      .eq("prize_pool_id", poolId)
      .order("rank", { ascending: true })
    
    if (rankingsError) {
      console.error("❌ Error fetching rankings:", rankingsError)
      return
    }
    
    console.log("🏆 Final Rankings:", rankings.length)
    rankings.forEach((r, i) => {
      console.log(`${i + 1}. Rank: ${r.rank} | Team: ${r.team_id} | Score: ${r.score} | User: ${r.user_uid}`)
    })
    
    // Check for duplicates
    const teamIds = rankings.map(r => r.team_id)
    const uniqueTeamIds = [...new Set(teamIds)]
    
    console.log("🎯 Analysis:", {
      totalParticipants: participants.length,
      totalRankings: rankings.length,
      uniqueTeamsInRankings: uniqueTeamIds.length,
      hasDuplicates: rankings.length !== uniqueTeamIds.length
    })
    
    // Find duplicates
    const duplicates = teamIds.filter((teamId, index) => teamIds.indexOf(teamId) !== index)
    if (duplicates.length > 0) {
      console.log("⚠️  Duplicate team IDs found:", duplicates)
      
      // Show which rankings are duplicates
      duplicates.forEach(teamId => {
        const duplicateRankings = rankings.filter(r => r.team_id === teamId)
        console.log(`Team ${teamId} has ${duplicateRankings.length} rankings:`, duplicateRankings)
      })
    }
    
    // Check if rankings match participants
    const participantTeamIds = participants.map(p => p.team_id)
    const rankingTeamIds = rankings.map(r => r.team_id)
    
    const missingInRankings = participantTeamIds.filter(id => !rankingTeamIds.includes(id))
    const extraInRankings = rankingTeamIds.filter(id => !participantTeamIds.includes(id))
    
    console.log("📊 Data Consistency:", {
      missingInRankings,
      extraInRankings,
      isConsistent: missingInRankings.length === 0 && extraInRankings.length === 0
    })
    
  } catch (error) {
    console.error("💥 Debug error:", error)
  }
} 