import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 5, // Reduced from 10 to be more conservative
    },
    heartbeatIntervalMs: 30000, // 30 seconds
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10000), // Exponential backoff up to 10s
  },
  auth: {
    persistSession: false, // Since we're using anonymous users
  },
})

// Generate random alphanumeric UID
function generateUID(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const length = Math.floor(Math.random() * 5) + 6 // 6-10 characters
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Get or create anonymous user UID
export async function getOrCreateUserUID(): Promise<string> {
  // Check if UID exists in localStorage
  let uid = localStorage.getItem("user_uid")

  if (!uid) {
    // Generate new UID
    uid = generateUID()

    // Check if UID already exists in database
    const { data: existingUser } = await supabase.from("anonymous_users").select("uid").eq("uid", uid).single()

    // If UID exists, generate a new one
    if (existingUser) {
      uid = generateUID()
    }

    // Store in database
    await supabase.from("anonymous_users").insert({ uid })

    // Store in localStorage
    localStorage.setItem("user_uid", uid)
  } else {
    // Update last_seen for existing user
    await supabase.from("anonymous_users").update({ last_seen: new Date().toISOString() }).eq("uid", uid)
  }

  return uid
}

// Admin authentication (simple email/password check)
export async function adminSignIn(email: string, password: string): Promise<boolean> {
  // In a real app, you'd hash the password and compare
  // For demo purposes, using simple comparison
  if (email === "devashish@contest.com" && password === "Devashish123@") {
    localStorage.setItem("admin_session", "true")
    return true
  }
  return false
}

export function isAdminLoggedIn(): boolean {
  return localStorage.getItem("admin_session") === "true"
}

export function adminSignOut(): void {
  localStorage.removeItem("admin_session")
}

// Authentication functions for regular users (kept for compatibility)
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

// Prize pool functions with better error handling
export async function createPrizePool(data: any) {
  if (!isAdminLoggedIn()) {
    throw new Error("Admin authentication required")
  }

  try {
    const { data: result, error } = await supabase.from("prize_pools").insert(data).select().single()

    if (error) {
      console.error("Supabase error:", error)
      throw error
    }

    console.log("Prize pool created successfully:", result)
    return result
  } catch (error) {
    console.error("Error in createPrizePool:", error)
    throw error
  }
}

export async function getPrizePools() {
  try {
    const { data, error } = await supabase.from("prize_pools").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching prize pools:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in getPrizePools:", error)
    throw error
  }
}
