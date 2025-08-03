import { supabase } from "./supabase"

export async function handleAuthError(error: any): Promise<{
  shouldRedirect: boolean
  message: string
}> {
  console.log("🔐 Handling auth error:", error)

  // Check for specific authentication errors
  if (error.message?.includes("Invalid Refresh Token") || 
      error.message?.includes("Refresh Token Not Found") ||
      error.message?.includes("JWT expired")) {
    
    console.log("🔄 Authentication token expired, clearing session")
    
    try {
      // Clear the invalid session
      await supabase.auth.signOut()
      
      return {
        shouldRedirect: true,
        message: "Session expired. Please log in again."
      }
    } catch (signOutError) {
      console.error("Error signing out:", signOutError)
      return {
        shouldRedirect: true,
        message: "Authentication error. Please refresh the page."
      }
    }
  }

  // Handle other authentication errors
  if (error.message?.includes("Invalid credentials") ||
      error.message?.includes("User not found")) {
    return {
      shouldRedirect: true,
      message: "Invalid credentials. Please log in again."
    }
  }

  // For other errors, don't redirect but show message
  return {
    shouldRedirect: false,
    message: "An error occurred. Please try again."
  }
}

export async function refreshSessionSafely(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.log("No session to refresh")
      return false
    }

    // Check if session is about to expire (within 5 minutes)
    const now = Math.floor(Date.now() / 1000)
    const expiresIn = session.expires_at ? session.expires_at - now : 0
    
    if (expiresIn < 300) { // 5 minutes
      console.log("Session expiring soon, attempting refresh")
      
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.log("Refresh failed:", error)
        return false
      }
      
      if (data.session) {
        console.log("Session refreshed successfully")
        return true
      }
    }
    
    return true
  } catch (error) {
    console.error("Error refreshing session:", error)
    return false
  }
} 