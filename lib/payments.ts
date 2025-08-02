import { supabase } from "./supabase"
import { verifyUSDTPayment } from "./blockchain-verification"

export interface PaymentRecord {
  prizePoolId: string
  userUID: string
  teamId: string
  walletAddress: string
  transactionHash: string
  amountUSDT: number
  recipientWallet: string
}

export interface PaymentDetails {
  id: string
  user_uid: string
  prize_pool_id: string
  wallet_address: string
  transaction_hash: string
  amount_usdt: number
  status: "pending" | "confirmed" | "failed"
  created_at: string
  confirmed_at?: string
}

export interface ParticipantWithPayment {
  id: string
  user_uid: string
  prize_pool_id: string
  team_id: string
  transaction_hash: string
  joined_at: string
  wallet_address?: string
  teams: {
    id: string
    team_name: string
    tokens: any[]
  }
  payment_details?: {
    wallet_address: string
    transaction_hash: string
    amount_usdt: number
    status: string
    confirmed_at?: string
  }
}

export async function recordPayment(payment: PaymentRecord) {
  try {
    console.log("💾 Recording payment:", payment)

    const { data, error } = await supabase
      .from("payments")
      .insert({
        prize_pool_id: payment.prizePoolId,
        user_uid: payment.userUID,
        team_id: payment.teamId,
        wallet_address: payment.walletAddress,
        transaction_hash: payment.transactionHash,
        amount_usdt: payment.amountUSDT,
        recipient_wallet: payment.recipientWallet,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Error recording payment:", error)
      throw error
    }

    console.log("✅ Payment recorded successfully:", data)
    return data
  } catch (error) {
    console.error("💥 Error in recordPayment:", error)
    throw error
  }
}

export async function confirmPayment(transactionHash: string): Promise<{
  isConfirmed: boolean
  error?: string
  details?: any
}> {
  try {
    console.log("🔍 Confirming payment for TX:", transactionHash)

    // Get payment record from database
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select("*")
      .eq("transaction_hash", transactionHash)
      .single()

    if (fetchError) {
      console.error("❌ Error fetching payment:", fetchError)
      return {
        isConfirmed: false,
        error: "Payment record not found in database",
      }
    }

    if (payment.status === "confirmed") {
      console.log("✅ Payment already confirmed")
      return {
        isConfirmed: true,
        details: payment,
      }
    }

    // ENHANCED: Check if team has already joined this prize pool
    const { data: existingParticipation } = await supabase
      .from("prize_pool_participants")
      .select("*")
      .eq("prize_pool_id", payment.prize_pool_id)
      .eq("team_id", payment.team_id)
      .single()

    if (existingParticipation) {
      console.log("❌ Team has already joined this prize pool")

      // Update payment status to failed
      await supabase
        .from("payments")
        .update({
          status: "failed",
          confirmed_at: new Date().toISOString(),
        })
        .eq("transaction_hash", transactionHash)

      return {
        isConfirmed: false,
        error: "This team has already joined this prize pool. Each team can only participate once.",
      }
    }

    // Verify payment on blockchain
    console.log("🔗 Verifying payment on BSC blockchain...")
    const verification = await verifyUSDTPayment(
      transactionHash,
      payment.wallet_address,
      payment.recipient_wallet,
      payment.amount_usdt,
      2, // 2% tolerance for amount differences
    )

    if (!verification.isValid) {
      console.error("❌ Blockchain verification failed:", verification.error)

      // Update payment status to failed
      await supabase
        .from("payments")
        .update({
          status: "failed",
          confirmed_at: new Date().toISOString(),
        })
        .eq("transaction_hash", transactionHash)

      return {
        isConfirmed: false,
        error: verification.error || "Blockchain verification failed",
      }
    }

    console.log("✅ Blockchain verification successful!")

    // Update payment status to confirmed
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("transaction_hash", transactionHash)

    if (updateError) {
      console.error("❌ Error updating payment status:", updateError)
      return {
        isConfirmed: false,
        error: "Failed to update payment status",
      }
    }

    // Add participant to prize pool
    const { error: participantError } = await supabase.from("prize_pool_participants").insert({
      prize_pool_id: payment.prize_pool_id,
      user_uid: payment.user_uid,
      team_id: payment.team_id,
      wallet_address: payment.wallet_address,
      transaction_hash: transactionHash,
      payment_confirmed: true,
    })

    if (participantError) {
      console.error("❌ Error adding participant:", participantError)
      return {
        isConfirmed: false,
        error: "Payment confirmed but failed to join prize pool",
      }
    }

    // Update prize pool participant count using the RPC function
    const { error: countError } = await supabase.rpc("increment_prize_pool_participants", {
      pool_id: payment.prize_pool_id,
    })

    if (countError) {
      console.error("❌ Error updating participant count:", countError)
    }

    console.log("✅ Payment confirmed and participant added successfully!")
    return {
      isConfirmed: true,
      details: {
        ...payment,
        actualAmount: verification.actualAmount,
        confirmations: verification.confirmations,
      },
    }
  } catch (error) {
    console.error("💥 Error confirming payment:", error)
    return {
      isConfirmed: false,
      error: `Confirmation failed: ${error.message}`,
    }
  }
}

export async function getPrizePoolPayments(prizePoolId: string) {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        teams!inner(team_name)
      `)
      .eq("prize_pool_id", prizePoolId)
      .eq("status", "confirmed")
      .order("confirmed_at", { ascending: false })

    if (error) {
      console.error("Error fetching payments:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in getPrizePoolPayments:", error)
    throw error
  }
}

// Check if a specific wallet has made valid payment for a prize pool
export async function checkWalletPaymentStatus(
  walletAddress: string,
  prizePoolId: string,
): Promise<{
  hasPaid: boolean
  paymentDetails?: any
  transactionHash?: string
}> {
  try {
    const { data: payment, error } = await supabase
      .from("payments")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .eq("prize_pool_id", prizePoolId)
      .eq("status", "confirmed")
      .single()

    if (error || !payment) {
      return { hasPaid: false }
    }

    return {
      hasPaid: true,
      paymentDetails: payment,
      transactionHash: payment.transaction_hash,
    }
  } catch (error) {
    console.error("Error checking wallet payment status:", error)
    return { hasPaid: false }
  }
}

// Get teams that have already joined a prize pool
export async function getJoinedTeams(prizePoolId: string, userUID: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("prize_pool_participants")
      .select("team_id")
      .eq("prize_pool_id", prizePoolId)
      .eq("user_uid", userUID)

    if (error) {
      console.error("Error fetching joined teams:", error)
      return []
    }

    return data.map((participant) => participant.team_id)
  } catch (error) {
    console.error("Error in getJoinedTeams:", error)
    return []
  }
}

// Get all participants for a prize pool (for admin view)
export async function getPrizePoolParticipants(prizePoolId: string): Promise<ParticipantWithPayment[]> {
  try {
    console.log("🔍 Fetching participants for prize pool:", prizePoolId)

    // First get all participants
    const { data: participants, error: participantsError } = await supabase
      .from("prize_pool_participants")
      .select(`
        *,
        teams!inner(team_name, tokens)
      `)
      .eq("prize_pool_id", prizePoolId)
      .order("joined_at", { ascending: false })

    if (participantsError) {
      console.error("❌ Error fetching participants:", participantsError)
      throw participantsError
    }

    if (!participants || participants.length === 0) {
      console.log("⚠️ No participants found")
      return []
    }

    console.log("👥 Found participants:", participants.length)

    // Get payment details for each participant using their transaction hash
    const participantsWithPayments = await Promise.all(
      participants.map(async (participant) => {
        if (participant.transaction_hash) {
          const { data: payment, error: paymentError } = await supabase
            .from("payments")
            .select("wallet_address, transaction_hash, amount_usdt, confirmed_at, status")
            .eq("transaction_hash", participant.transaction_hash)
            .single()

          if (paymentError) {
            console.error("❌ Error fetching payment for participant:", participant.id, paymentError)
            // Return participant without payment details if payment not found
            return {
              ...participant,
              payment_details: {
                wallet_address: participant.wallet_address || "Unknown",
                transaction_hash: participant.transaction_hash,
                amount_usdt: 0,
                confirmed_at: participant.joined_at,
                status: "unknown",
              },
            }
          }

          return {
            ...participant,
            payment_details: payment,
          }
        } else {
          // Fallback for participants without transaction hash
          return {
            ...participant,
            payment_details: {
              wallet_address: participant.wallet_address || "Unknown",
              transaction_hash: "N/A",
              amount_usdt: 0,
              confirmed_at: participant.joined_at,
              status: "unknown",
            },
          }
        }
      }),
    )

    console.log("✅ Successfully fetched participants with payment details")
    return participantsWithPayments
  } catch (error) {
    console.error("💥 Error in getPrizePoolParticipants:", error)
    throw error
  }
}

// Check if user has already joined a prize pool
export async function hasUserJoinedPrizePool(userId: string, prizePoolId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("prize_pool_participants")
      .select("id")
      .eq("user_uid", userId)
      .eq("prize_pool_id", prizePoolId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking user participation:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error checking user participation:", error)
    return false
  }
}

// Create a new payment record
export async function createPayment(paymentData: {
  user_uid: string
  prize_pool_id: string
  wallet_address: string
  transaction_hash: string
  amount_usdt: number
}): Promise<PaymentDetails | null> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .insert([
        {
          ...paymentData,
          status: "pending",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating payment:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error creating payment:", error)
    return null
  }
}

// Get payment by transaction hash
export async function getPaymentByTransaction(transactionHash: string): Promise<PaymentDetails | null> {
  try {
    const { data, error } = await supabase.from("payments").select("*").eq("transaction_hash", transactionHash).single()

    if (error) {
      console.error("Error fetching payment:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching payment:", error)
    return null
  }
}

// Add participant to prize pool
export async function addParticipant(participantData: {
  user_uid: string
  prize_pool_id: string
  team_id: string
  transaction_hash: string
}): Promise<boolean> {
  try {
    // Check if user already joined this prize pool
    const { data: existing, error: checkError } = await supabase
      .from("prize_pool_participants")
      .select("id")
      .eq("user_uid", participantData.user_uid)
      .eq("prize_pool_id", participantData.prize_pool_id)
      .single()

    if (existing) {
      console.error("User already joined this prize pool")
      return false
    }

    const { error } = await supabase.from("prize_pool_participants").insert([participantData])

    if (error) {
      console.error("Error adding participant:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error adding participant:", error)
    return false
  }
}
