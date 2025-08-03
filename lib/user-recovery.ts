import { supabase } from "./supabase"

export interface UserRecoveryData {
  user_uid: string
  teams: any[]
  payments: any[]
  participants: any[]
}

export async function findUserByWalletAddress(walletAddress: string): Promise<UserRecoveryData | null> {
  try {
    console.log("🔍 Searching for user with wallet:", walletAddress)

    // Find payments by wallet address (try both exact and case-insensitive)
    let { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .eq("wallet_address", walletAddress)

    // If not found, try case-insensitive search
    if (!payments || payments.length === 0) {
      console.log("Trying case-insensitive search...")
      const { data: paymentsCI, error: paymentsCIError } = await supabase
        .from("payments")
        .select("*")
        .ilike("wallet_address", walletAddress)
      
      if (!paymentsCIError && paymentsCI && paymentsCI.length > 0) {
        payments = paymentsCI
        paymentsError = null
      }
    }

    if (paymentsError) {
      console.error("Error finding payments:", paymentsError)
      return null
    }

    if (!payments || payments.length === 0) {
      console.log("No payments found for wallet:", walletAddress)
      
      // Debug: Let's see what wallet addresses are actually in the database
      const { data: allPayments, error: debugError } = await supabase
        .from("payments")
        .select("wallet_address")
        .limit(5)
      
      if (!debugError && allPayments) {
        console.log("Sample wallet addresses in database:", allPayments.map(p => p.wallet_address))
      }
      
      return null
    }

    // Get unique user UIDs from payments
    const userUIDs = [...new Set(payments.map(p => p.user_uid))]
    console.log("Found user UIDs:", userUIDs)

    // Get teams for these users
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .in("user_uid", userUIDs)

    if (teamsError) {
      console.error("Error finding teams:", teamsError)
    }

    // Get participants for these users
    const { data: participants, error: participantsError } = await supabase
      .from("prize_pool_participants")
      .select("*")
      .in("user_uid", userUIDs)

    if (participantsError) {
      console.error("Error finding participants:", participantsError)
    }

    // Return the most recent user UID (assuming it's the current one)
    const mostRecentUserUID = userUIDs[0]

    return {
      user_uid: mostRecentUserUID,
      teams: teams || [],
      payments: payments || [],
      participants: participants || []
    }
  } catch (error) {
    console.error("Error in findUserByWalletAddress:", error)
    return null
  }
}

export async function findUserByTransactionHash(transactionHash: string): Promise<UserRecoveryData | null> {
  try {
    console.log("🔍 Searching for user with transaction:", transactionHash)

    // Find payment by transaction hash
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("transaction_hash", transactionHash)
      .single()

    if (paymentError || !payment) {
      console.log("No payment found for transaction:", transactionHash)
      return null
    }

    // Get teams for this user
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .eq("user_uid", payment.user_uid)

    if (teamsError) {
      console.error("Error finding teams:", teamsError)
    }

    // Get participants for this user
    const { data: participants, error: participantsError } = await supabase
      .from("prize_pool_participants")
      .select("*")
      .eq("user_uid", payment.user_uid)

    if (participantsError) {
      console.error("Error finding participants:", participantsError)
    }

    return {
      user_uid: payment.user_uid,
      teams: teams || [],
      payments: [payment],
      participants: participants || []
    }
  } catch (error) {
    console.error("Error in findUserByTransactionHash:", error)
    return null
  }
}

export async function recoverUserSession(recoveryData: UserRecoveryData): Promise<boolean> {
  try {
    // Store the recovered user UID in localStorage
    localStorage.setItem("user_uid", recoveryData.user_uid)
    
    // Update last_seen in database
    await supabase
      .from("anonymous_users")
      .update({ last_seen: new Date().toISOString() })
      .eq("uid", recoveryData.user_uid)

    console.log("✅ User session recovered:", recoveryData.user_uid)
    return true
  } catch (error) {
    console.error("Error recovering user session:", error)
    return false
  }
}

 