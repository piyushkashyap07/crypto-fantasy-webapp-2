import { supabase } from "./supabase"

export interface AdminUser {
  id: string
  email: string
  role: "admin" | "super_admin"
  created_at: string
}

// Admin authentication with Supabase
export async function adminSignIn(email: string, password: string): Promise<{
  success: boolean
  user?: AdminUser
  error?: string
}> {
  try {
    // Use Supabase Auth for admin login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: "Invalid credentials" }
    }

    // Check if user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", data.user.id)
      .single()

    if (adminError || !adminUser) {
      // Sign out the user if they're not an admin
      await supabase.auth.signOut()
      return { success: false, error: "Access denied. Admin privileges required." }
    }

    return { success: true, user: adminUser }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function adminSignOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log("No authenticated user found")
      return null
    }

    console.log("Checking admin status for user:", user.id)

    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (adminError) {
      console.log("Admin check error:", adminError)
      return null
    }

    if (!adminUser) {
      console.log("User is not an admin")
      return null
    }

    console.log("Admin user found:", adminUser.email)
    return adminUser
  } catch (error) {
    console.error("Error in getCurrentAdmin:", error)
    return null
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const admin = await getCurrentAdmin()
  return admin !== null
}

// Admin-only API functions
export async function createPrizePool(data: any): Promise<any> {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) {
    throw new Error("Admin authentication required")
  }

  const { data: result, error } = await supabase
    .from("prize_pools")
    .insert(data)
    .select()
    .single()

  if (error) {
    throw error
  }

  return result
}

export async function updatePrizePool(id: string, data: any): Promise<any> {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) {
    throw new Error("Admin authentication required")
  }

  const { data: result, error } = await supabase
    .from("prize_pools")
    .update(data)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return result
}

export async function deletePrizePool(id: string): Promise<void> {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) {
    throw new Error("Admin authentication required")
  }

  const { error } = await supabase
    .from("prize_pools")
    .delete()
    .eq("id", id)

  if (error) {
    throw error
  }
}

export async function getAdminStats(): Promise<any> {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) {
    throw new Error("Admin authentication required")
  }

  try {
    // Get various admin statistics
    const [
      { count: totalPools },
      { count: totalUsers },
      { count: totalTeams },
      { count: totalPayments },
      { data: recentPools },
      { data: recentParticipants }
    ] = await Promise.all([
      supabase.from("prize_pools").select("*", { count: "exact", head: true }),
      supabase.from("anonymous_users").select("*", { count: "exact", head: true }),
      supabase.from("teams").select("*", { count: "exact", head: true }),
      supabase.from("prize_pool_participants").select("*", { count: "exact", head: true }),
      supabase.from("prize_pools").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("prize_pool_participants").select("*").order("created_at", { ascending: false }).limit(10)
    ])

    // Calculate additional stats
    const totalRevenue = recentParticipants?.reduce((sum: number, p: any) => sum + (p.payment_amount || 0), 0) || 0
    const activePools = recentPools?.filter((p: any) => p.status === "ongoing").length || 0
    const upcomingPools = recentPools?.filter((p: any) => p.status === "upcoming").length || 0

    return {
      totalPools,
      totalUsers,
      totalTeams,
      totalPayments,
      totalRevenue,
      activePools,
      upcomingPools,
      recentPools: recentPools || [],
      recentParticipants: recentParticipants || []
    }
  } catch (error) {
    console.error("Error getting admin stats:", error)
    throw error
  }
} 