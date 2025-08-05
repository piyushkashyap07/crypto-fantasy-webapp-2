require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testTeamResults() {
  try {
    console.log('🔍 Testing Team Results functionality...')

    // Get a finished prize pool
    const { data: finishedPools, error: poolsError } = await supabase
      .from("prize_pools")
      .select("id, name, status")
      .eq("status", "finished")
      .limit(1)

    if (poolsError) {
      console.error('❌ Error fetching finished pools:', poolsError)
      return
    }

    if (!finishedPools || finishedPools.length === 0) {
      console.log('⚠️ No finished pools found for testing')
      return
    }

    const testPool = finishedPools[0]
    console.log(`\n📊 Testing with pool: ${testPool.name} (${testPool.id})`)

    // Get final rankings with team details
    const { data: rankings, error: rankingsError } = await supabase
      .from("final_rankings")
      .select(`
        id,
        user_uid,
        team_id,
        final_rank,
        prize_amount,
        teams!inner(
          team_name,
          tokens
        )
      `)
      .eq("prize_pool_id", testPool.id)
      .order("final_rank", { ascending: true })

    if (rankingsError) {
      console.error('❌ Error fetching rankings:', rankingsError)
      return
    }

    console.log(`\n🏆 Found ${rankings?.length || 0} team rankings:`)

    if (rankings && rankings.length > 0) {
      for (const ranking of rankings) {
        console.log(`\n--- Rank ${ranking.final_rank} ---`)
        console.log(`Team: ${ranking.teams.team_name}`)
        console.log(`User: ${ranking.user_uid}`)
        console.log(`Prize: $${ranking.prize_amount}`)
        
        // Get wallet address
        const { data: payments } = await supabase
          .from("payments")
          .select("wallet_address")
          .eq("prize_pool_id", testPool.id)
          .eq("user_uid", ranking.user_uid)
          .eq("status", "confirmed")
          .limit(1)

        let walletAddress = "Unknown"
        if (payments && payments.length > 0) {
          walletAddress = payments[0].wallet_address
        } else {
          const { data: participants } = await supabase
            .from("prize_pool_participants")
            .select("wallet_address")
            .eq("prize_pool_id", testPool.id)
            .eq("user_uid", ranking.user_uid)
            .limit(1)

          if (participants && participants.length > 0 && participants[0].wallet_address) {
            walletAddress = participants[0].wallet_address
          }
        }

        console.log(`Wallet: ${walletAddress}`)
      }
    } else {
      console.log('⚠️ No rankings found for this pool')
    }

  } catch (error) {
    console.error('💥 Error in test:', error)
  }
}

testTeamResults() 