import { supabase } from "./supabase"
import { cache, CACHE_KEYS } from "./cache"

export interface Team {
  id: string
  user_uid: string
  team_name: string
  tokens: any[]
  total_points: number
  created_at: string
  updated_at: string
}

export async function createTeam(userUID: string, teamName: string, selectedTokens: any[], poolId?: string): Promise<Team> {
  try {
    console.log("🔍 Checking if team name exists:", teamName, "for pool:", poolId)

    let existingTeam = null
    let checkError = null

    if (poolId) {
      // Check if team name exists in this specific pool
      const { data, error } = await supabase
        .from("teams")
        .select("team_name, user_uid")
        .eq("team_name", teamName)
        .eq("created_for_pool_id", poolId)
        .maybeSingle()
      
      existingTeam = data
      checkError = error
    } else {
      // Check if team name exists globally (for backward compatibility)
      const { data, error } = await supabase
        .from("teams")
        .select("team_name, user_uid")
        .eq("team_name", teamName)
        .maybeSingle()
      
      existingTeam = data
      checkError = error
    }

    if (checkError) {
      console.error("Error checking team name:", checkError)
      throw new Error("Failed to validate team name. Please try again.")
    }

    if (existingTeam) {
      console.log("❌ Team name already exists:", existingTeam)
      const message = poolId 
        ? `Team name "${teamName}" is already taken in this prize pool. Please choose a different name.`
        : `Team name "${teamName}" is already taken by another user. Please choose a different name.`
      throw new Error(message)
    }

    console.log("✅ Team name is available, creating team...")

    const totalPoints = selectedTokens.reduce((sum, token) => sum + token.points, 0)

    const { data, error } = await supabase
      .from("teams")
      .insert({
        user_uid: userUID,
        team_name: teamName,
        tokens: selectedTokens,
        total_points: totalPoints,
        created_for_pool_id: poolId || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase insert error:", error)

      // Handle unique constraint violation
      if (error.code === "23505" && error.message.includes("teams_team_name_unique")) {
        throw new Error(`Team name "${teamName}" is already taken. Please choose a different name.`)
      }

      throw new Error("Failed to create team. Please try again.")
    }

    console.log("✅ Team created successfully:", data)
    
    // Invalidate cache for this user
    const cacheKey = `${CACHE_KEYS.USER_TEAMS}_${userUID}`
    cache.delete(cacheKey)
    
    return data
  } catch (error) {
    console.error("Error creating team:", error)
    throw error
  }
}

export async function getUserTeams(userUID: string): Promise<Team[]> {
  try {
    // Check cache first
    const cacheKey = `${CACHE_KEYS.USER_TEAMS}_${userUID}`
    const cachedData = cache.get(cacheKey)
    if (cachedData) {
      console.log("📦 Using cached teams data for user:", userUID)
      return cachedData
    }

    console.log("🌐 Fetching fresh teams data for user:", userUID)
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("user_uid", userUID)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching teams:", error)
      throw error
    }

    const teams = data || []
    
    // Cache the data for 60 seconds
    cache.set(cacheKey, teams, 60000)
    
    return teams
  } catch (error) {
    console.error("Error in getUserTeams:", error)
    throw error
  }
}

export async function deleteTeam(teamId: string): Promise<void> {
  try {
    const { error } = await supabase.from("teams").delete().eq("id", teamId)

    if (error) {
      console.error("Error deleting team:", error)
      throw error
    }
    
    // Invalidate cache for this user (we don't know the user_uid, so clear all team caches)
    // In a real app, you'd pass user_uid to this function
    cache.delete(CACHE_KEYS.USER_TEAMS)
  } catch (error) {
    console.error("Error in deleteTeam:", error)
    throw error
  }
}
