import { supabase } from "./supabase"

export interface Team {
  id: string
  user_uid: string
  team_name: string
  tokens: any[]
  total_points: number
  created_at: string
  updated_at: string
}

export async function createTeam(userUID: string, teamName: string, selectedTokens: any[]): Promise<Team> {
  try {
    console.log("🔍 Checking if team name exists:", teamName)

    // Check if team name already exists globally (across all users)
    const { data: existingTeam, error: checkError } = await supabase
      .from("teams")
      .select("team_name, user_uid")
      .eq("team_name", teamName)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking team name:", checkError)
      throw new Error("Failed to validate team name. Please try again.")
    }

    if (existingTeam) {
      console.log("❌ Team name already exists:", existingTeam)
      throw new Error(`Team name "${teamName}" is already taken by another user. Please choose a different name.`)
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
    return data
  } catch (error) {
    console.error("Error creating team:", error)
    throw error
  }
}

export async function getUserTeams(userUID: string): Promise<Team[]> {
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("user_uid", userUID)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching teams:", error)
      throw error
    }

    return data || []
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
  } catch (error) {
    console.error("Error in deleteTeam:", error)
    throw error
  }
}
