import { supabase } from "./supabase"
import { getCurrentPrices } from "./coingecko"

export interface TeamScore {
  team_id: string
  team_name: string
  user_uid: string
  total_score: number
  rank: number
  prize_amount?: number
  is_tie?: boolean
  tokens: TokenScore[]
}

export interface TokenScore {
  coin_id: string
  name: string
  symbol: string
  locked_price: number
  current_price: number | null
  final_price?: number
  percentage_change: number
  individual_score: number
}

export async function lockPricesForPool(prizePoolId: string) {
  try {
    console.log("🔒 Starting price lock for pool:", prizePoolId)

    // First check if prices are already locked
    const { data: existingLocks, error: checkError } = await supabase
      .from("locked_prices")
      .select("coin_id")
      .eq("prize_pool_id", prizePoolId)

    if (checkError) {
      console.error("❌ Error checking existing locked prices:", checkError)
      throw checkError
    }

    if (existingLocks && existingLocks.length > 0) {
      console.log("✅ Prices already locked for pool:", prizePoolId)
      console.log("   Found", existingLocks.length, "locked prices")
      return { success: true, message: "Prices already locked" }
    }

    // Get all unique tokens from participating teams
    const { data: participants, error: participantsError } = await supabase
      .from("prize_pool_participants")
      .select(`
        team_id,
        teams!inner(tokens)
      `)
      .eq("prize_pool_id", prizePoolId)

    if (participantsError) {
      console.error("❌ Error fetching participants:", participantsError)
      throw participantsError
    }

    if (!participants || participants.length === 0) {
      console.log("⚠️ No participants found for pool:", prizePoolId)
      return { success: false, message: "No participants found" }
    }

    console.log("👥 Found participants:", participants.length)

    // Extract all unique token IDs
    const allTokens = new Set<string>()
    participants.forEach((participant: any) => {
      if (participant.teams && participant.teams.tokens && Array.isArray(participant.teams.tokens)) {
        participant.teams.tokens.forEach((token: any) => {
          if (token && token.id) {
            allTokens.add(token.id)
          }
        })
      }
    })

    const coinIds = Array.from(allTokens)
    console.log("🪙 Unique tokens to lock:", coinIds.length, coinIds.slice(0, 5), "...")

    if (coinIds.length === 0) {
      console.log("⚠️ No valid tokens found to lock prices for")
      return { success: false, message: "No valid tokens found" }
    }

    // Get current prices for all tokens with retry mechanism
    console.log("📊 Fetching current prices from CoinGecko...")
    let currentPrices: Record<string, number> = {}
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        currentPrices = await getCurrentPrices(coinIds)
        console.log("💰 Current prices fetched:", Object.keys(currentPrices).length, "prices")
        break
      } catch (error) {
        retryCount++
        console.error(`❌ Error fetching prices (attempt ${retryCount}/${maxRetries}):`, error)
        if (retryCount < maxRetries) {
          console.log("⏳ Retrying in 2 seconds...")
          await new Promise((resolve) => setTimeout(resolve, 2000))
        } else {
          throw new Error("Failed to fetch prices after multiple attempts")
        }
      }
    }

    if (Object.keys(currentPrices).length === 0) {
      throw new Error("No prices were fetched from CoinGecko")
    }

    // Store locked prices with fallback for missing prices
    const lockedPricesData = coinIds.map((coinId) => ({
      prize_pool_id: prizePoolId,
      coin_id: coinId,
      locked_price: currentPrices[coinId] || 0, // Use 0 as fallback
    }))

    console.log("💾 Inserting locked prices:", lockedPricesData.length, "records")
    console.log("📊 Sample locked prices:", lockedPricesData.slice(0, 3))

    // Use upsert to handle race conditions - if prices already exist, they won't be inserted
    const { error: insertError } = await supabase
      .from("locked_prices")
      .upsert(lockedPricesData, { 
        onConflict: 'prize_pool_id,coin_id',
        ignoreDuplicates: true 
      })

    if (insertError) {
      console.error("❌ Error inserting locked prices:", insertError)
      throw insertError
    }

    // Verify the insertion worked
    const { data: verifiedPrices, error: verifyError } = await supabase
      .from("locked_prices")
      .select("*")
      .eq("prize_pool_id", prizePoolId)

    if (verifyError) {
      console.error("❌ Error verifying locked prices:", verifyError)
    } else {
      console.log("✅ Verified locked prices:", verifiedPrices?.length || 0, "records stored")
      if (verifiedPrices && verifiedPrices.length > 0) {
        console.log("📊 Sample verified prices:", verifiedPrices.slice(0, 3))
      }
    }

    console.log("✅ Successfully locked", lockedPricesData.length, "prices for pool:", prizePoolId)
    return { success: true, message: "Prices locked successfully" }
  } catch (error) {
    console.error("❌ Failed to lock prices:", error)
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function finalizePricesAndRankings(prizePoolId: string) {
  try {
    console.log("🏁 Finalizing prices and rankings for pool:", prizePoolId)

    // Check if final rankings already exist
    const { data: existingRankings } = await supabase
      .from("final_rankings")
      .select("id")
      .eq("prize_pool_id", prizePoolId)
      .limit(1)

    if (existingRankings && existingRankings.length > 0) {
      console.log("⚠️ Final rankings already exist for pool:", prizePoolId)
      return { success: true, message: "Final rankings already exist" }
    }

    // Get leaderboard data
    const leaderboard = await getLeaderboard(prizePoolId, false)

    // Get all unique tokens
    const allTokens = new Set<string>()
    leaderboard.forEach((team) => {
      team.tokens.forEach((token) => {
        allTokens.add(token.coin_id)
      })
    })

    // Get final prices
    const coinIds = Array.from(allTokens)
    const finalPrices = await getCurrentPrices(coinIds)

    // Store final prices
    const finalPricesData = coinIds.map((coinId) => ({
      prize_pool_id: prizePoolId,
      coin_id: coinId,
      final_price: finalPrices[coinId] || 0,
    }))

    await supabase.from("final_prices").insert(finalPricesData)

    // Calculate final rankings with prize distribution
    const { data: prizePool } = await supabase
      .from("prize_pools")
      .select("distribution_type, distribution_config, prize_pool_size")
      .eq("id", prizePoolId)
      .single()

    if (prizePool) {
      const finalRankings = calculatePrizeDistribution(leaderboard, prizePool)

      // Store final rankings
      const rankingsData = finalRankings.map((team) => ({
        prize_pool_id: prizePoolId,
        team_id: team.team_id,
        user_uid: team.user_uid,
        final_rank: team.rank,
        final_score: team.total_score,
        prize_amount: team.prize_amount || 0,
        is_tie: team.is_tie || false,
      }))

      await supabase.from("final_rankings").insert(rankingsData)
    }

    console.log("✅ Successfully finalized prices and rankings for pool:", prizePoolId)
  } catch (error) {
    console.error("💥 Error finalizing prices and rankings:", error)
    throw error
  }
}

function calculatePrizeDistribution(leaderboard: TeamScore[], prizePool: any): TeamScore[] {
  const { distribution_type, distribution_config, prize_pool_size } = prizePool
  const { distributions, admin_cut } = distribution_config

  // Handle ties by randomizing teams with same scores
  const groupedByScore = new Map<number, TeamScore[]>()
  leaderboard.forEach((team) => {
    const score = Math.round(team.total_score * 100) / 100 // Round to avoid floating point issues
    if (!groupedByScore.has(score)) {
      groupedByScore.set(score, [])
    }
    groupedByScore.get(score)!.push(team)
  })

  // Randomize tied teams and assign ranks
  let currentRank = 1
  const finalRankings: TeamScore[] = []

  Array.from(groupedByScore.entries())
    .sort(([a], [b]) => b - a) // Sort by score descending
    .forEach(([score, teams]) => {
      if (teams.length > 1) {
        // Shuffle tied teams randomly
        for (let i = teams.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[teams[i], teams[j]] = [teams[j], teams[i]]
        }
        teams.forEach((team) => {
          team.is_tie = true
        })
      }

      teams.forEach((team) => {
        team.rank = currentRank
        finalRankings.push(team)
        currentRank++
      })
    })

  // Calculate prize amounts
  finalRankings.forEach((team) => {
    team.prize_amount = calculateTeamPrize(team.rank, distribution_type, distributions, prize_pool_size, admin_cut)
  })

  return finalRankings
}

function calculateTeamPrize(
  rank: number,
  distributionType: string,
  distributions: any[],
  prizePoolSize: number,
  adminCut: number,
): number {
  if (distributionType === "fixed") {
    const dist = distributions.find((d) => rank >= d.rankFrom && rank <= d.rankTo)
    return dist?.amount || 0
  } else {
    const dist = distributions.find((d) => rank >= d.rankFrom && rank <= d.rankTo)
    const percentage = dist?.percentage || 0
    return (prizePoolSize * percentage) / 100
  }
}

export async function getLeaderboard(prizePoolId: string, isFinished = false): Promise<TeamScore[]> {
  try {
    console.log("📊 Getting leaderboard for pool:", prizePoolId, "finished:", isFinished)

    if (isFinished) {
      // First get actual participants for this pool
      const { data: participants } = await supabase
        .from("prize_pool_participants")
        .select("team_id")
        .eq("prize_pool_id", prizePoolId)

      if (!participants || participants.length === 0) {
        console.log("⚠️ No participants found for finished pool")
        return []
      }

      const participantTeamIds = participants.map(p => p.team_id)
      console.log("👥 Actual participants:", participantTeamIds)

      // Get final rankings only for actual participants
      const { data: finalRankings } = await supabase
        .from("final_rankings")
        .select(`
          *,
          teams!inner(team_name, tokens)
        `)
        .eq("prize_pool_id", prizePoolId)
        .in("team_id", participantTeamIds)
        .order("final_rank")

      if (finalRankings && finalRankings.length > 0) {
        console.log("🏆 Found final rankings:", finalRankings.length, "for participants:", participantTeamIds.length)
        
        const { data: finalPrices } = await supabase.from("final_prices").select("*").eq("prize_pool_id", prizePoolId)
        const finalPriceMap = new Map(finalPrices?.map((fp) => [fp.coin_id, fp.final_price]) || [])

        const { data: lockedPrices } = await supabase.from("locked_prices").select("*").eq("prize_pool_id", prizePoolId)
        const lockedPriceMap = new Map(lockedPrices?.map((lp) => [lp.coin_id, lp.locked_price]) || [])

                // Remove duplicates by team_id (keep first occurrence)
        const uniqueRankings = finalRankings.filter((ranking, index, self) => 
          index === self.findIndex(r => r.team_id === ranking.team_id)
        )
        
        console.log("🔍 Original rankings:", finalRankings.length, "Unique rankings:", uniqueRankings.length)
        
        const leaderboard = uniqueRankings.map((ranking: any) => ({
          team_id: ranking.team_id,
          team_name: ranking.teams.team_name,
          user_uid: ranking.user_uid,
          total_score: ranking.final_score,
          rank: ranking.final_rank,
          prize_amount: ranking.prize_amount,
          is_tie: ranking.is_tie,
          tokens: ranking.teams.tokens.map((token: any) => {
            const lockedPrice = lockedPriceMap.get(token.id) || 0
            const finalPrice = finalPriceMap.get(token.id) || 0
            const percentageChange = lockedPrice > 0 ? ((finalPrice - lockedPrice) / lockedPrice) * 100 : 0

            return {
              coin_id: token.id,
              name: token.name,
              symbol: token.symbol,
              locked_price: lockedPrice,
              current_price: finalPrice,
              final_price: finalPrice,
              percentage_change: percentageChange,
              individual_score: percentageChange * 100,
            }
          }),
        }))
        
        console.log("✅ Returning leaderboard with", leaderboard.length, "teams")
        return leaderboard
        } else {
          // If no final rankings exist yet, calculate them now
          console.log("⚠️ No final rankings found, calculating now...")
          await finalizePricesAndRankings(prizePoolId)
          // Recursively call to get the newly created rankings
          return getLeaderboard(prizePoolId, true)
        }
    }

    // Get live leaderboard for ongoing pools
    const { data: participants } = await supabase
      .from("prize_pool_participants")
      .select(`
        team_id,
        user_uid,
        teams!inner(team_name, tokens)
      `)
      .eq("prize_pool_id", prizePoolId)

    if (!participants) {
      console.log("⚠️ No participants found")
      return []
    }

    console.log("👥 Found", participants.length, "participating teams")

    // Get locked prices
    const { data: lockedPrices } = await supabase.from("locked_prices").select("*").eq("prize_pool_id", prizePoolId)
    const lockedPriceMap = new Map(lockedPrices?.map((lp) => [lp.coin_id, lp.locked_price]) || [])

    console.log("🔒 Found", lockedPrices?.length || 0, "locked prices")

    // If no locked prices exist, try to lock them now
    if (!lockedPrices || lockedPrices.length === 0) {
      console.log("⚠️ No locked prices found, attempting to lock prices now...")
      try {
        await lockPricesForPool(prizePoolId)
        // Retry getting locked prices
        const { data: newLockedPrices } = await supabase
          .from("locked_prices")
          .select("*")
          .eq("prize_pool_id", prizePoolId)
        if (newLockedPrices) {
          newLockedPrices.forEach((lp) => lockedPriceMap.set(lp.coin_id, lp.locked_price))
          console.log("✅ Successfully locked prices, found", newLockedPrices.length, "prices")
        }
      } catch (error) {
        console.error("❌ Failed to lock prices:", error)
      }
    }

    // Get current prices - optimized for faster refresh
    const allTokens = new Set<string>()
    participants.forEach((participant: any) => {
      if (participant.teams && participant.teams.tokens && Array.isArray(participant.teams.tokens)) {
        participant.teams.tokens.forEach((token: any) => {
          if (token && token.id) {
            allTokens.add(token.id)
          }
        })
      }
    })

    let currentPrices: Record<string, number> = {}
    try {
      console.log("📊 Fetching current prices for", allTokens.size, "tokens")
      const priceStartTime = Date.now()
      currentPrices = await getCurrentPrices(Array.from(allTokens))
      const priceEndTime = Date.now()
      console.log(
        `💰 Got current prices for ${Object.keys(currentPrices).length} tokens in ${priceEndTime - priceStartTime}ms`,
      )
    } catch (error) {
      console.error("❌ Failed to fetch current prices:", error)
      // Continue with empty prices - will show "fail" in UI
    }

    // Calculate scores for each team
    const teamScores: TeamScore[] = participants.map((participant: any) => {
      const tokens: TokenScore[] = participant.teams.tokens.map((token: any) => {
        const lockedPrice = lockedPriceMap.get(token.id) || 0
        const currentPrice = currentPrices[token.id] || null

        let percentageChange = 0
        if (lockedPrice > 0 && currentPrice !== null && currentPrice !== undefined) {
          percentageChange = ((currentPrice - lockedPrice) / lockedPrice) * 100
        }

        const individualScore = percentageChange * 100 // Multiply by 100 for scoring

        return {
          coin_id: token.id,
          name: token.name,
          symbol: token.symbol,
          locked_price: lockedPrice,
          current_price: currentPrice,
          percentage_change: percentageChange,
          individual_score: individualScore,
        }
      })

      const totalScore = tokens.reduce((sum, token) => sum + token.individual_score, 0)

      return {
        team_id: participant.team_id,
        team_name: participant.teams.team_name,
        user_uid: participant.user_uid,
        total_score: totalScore,
        rank: 0, // Will be set after sorting
        tokens,
      }
    })

    // Sort by total score and assign ranks
    teamScores.sort((a, b) => b.total_score - a.total_score)
    teamScores.forEach((team, index) => {
      team.rank = index + 1
    })

    console.log("🏆 Calculated scores for", teamScores.length, "teams")
    return teamScores
  } catch (error) {
    console.error("💥 Error getting leaderboard:", error)
    return []
  }
}
