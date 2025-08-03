import { supabase } from "./supabase"

export async function cleanupDuplicateRankings(poolId: string) {
  try {
    console.log("🧹 Cleaning up duplicate rankings for pool:", poolId)
    
    // Get all rankings for this pool
    const { data: rankings, error } = await supabase
      .from("final_rankings")
      .select("*")
      .eq("prize_pool_id", poolId)
      .order("created_at", { ascending: true })
    
    if (error) {
      console.error("❌ Error fetching rankings:", error)
      return
    }
    
    console.log("📊 Total rankings found:", rankings.length)
    
    // Group by team_id to find duplicates
    const groupedByTeam = new Map<string, any[]>()
    rankings.forEach(ranking => {
      if (!groupedByTeam.has(ranking.team_id)) {
        groupedByTeam.set(ranking.team_id, [])
      }
      groupedByTeam.get(ranking.team_id)!.push(ranking)
    })
    
    // Find teams with duplicates
    const duplicates = Array.from(groupedByTeam.entries())
      .filter(([teamId, teamRankings]) => teamRankings.length > 1)
    
    if (duplicates.length === 0) {
      console.log("✅ No duplicates found")
      return
    }
    
    console.log("⚠️ Found duplicates for teams:", duplicates.map(([teamId]) => teamId))
    
    // Keep only the first ranking for each team (oldest by created_at)
    const rankingsToDelete: string[] = []
    
    duplicates.forEach(([teamId, teamRankings]) => {
      // Sort by created_at and keep the first one
      const sortedRankings = teamRankings.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      
      // Mark all but the first for deletion
      sortedRankings.slice(1).forEach(ranking => {
        rankingsToDelete.push(ranking.id)
      })
      
      console.log(`Team ${teamId}: Keeping rank ${sortedRankings[0].final_rank}, deleting ${sortedRankings.length - 1} duplicates`)
    })
    
    if (rankingsToDelete.length > 0) {
      console.log(`🗑️ Deleting ${rankingsToDelete.length} duplicate rankings...`)
      
      const { error: deleteError } = await supabase
        .from("final_rankings")
        .delete()
        .in("id", rankingsToDelete)
      
      if (deleteError) {
        console.error("❌ Error deleting duplicates:", deleteError)
      } else {
        console.log("✅ Successfully cleaned up duplicate rankings")
      }
    }
    
  } catch (error) {
    console.error("💥 Cleanup error:", error)
  }
} 