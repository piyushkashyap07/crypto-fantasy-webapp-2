const { createClient } = require('@supabase/supabase-js')

// Quick test configuration (replace with your actual values)
const supabaseUrl = 'https://your-project.supabase.co'  // Replace with your Supabase URL
const supabaseKey = 'your-anon-key'  // Replace with your Supabase anon key

// Initialize client
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('📊 Listing All Pools (Quick Test)...')
console.log('=' .repeat(50))
console.log('⚠️  This script uses hardcoded credentials for testing')
console.log('💡  Replace the supabaseUrl and supabaseKey variables with your actual values')
console.log('')

async function listPoolsQuick() {
  try {
    console.log('\n📋 Fetching pools from database...')
    console.log('-' .repeat(30))
    
    const { data: pools, error } = await supabase
      .from('prize_pools')
      .select('id, name, status, started_at, duration_minutes, created_at, prize_pool_size')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.log('❌ Error fetching pools:', error.message)
      console.log('💡 Make sure to update the supabaseUrl and supabaseKey variables in this script')
      return
    }
    
    if (!pools || pools.length === 0) {
      console.log('❌ No pools found in database')
      return
    }
    
    console.log(`✅ Found ${pools.length} pools:`)
    console.log('')
    
    pools.forEach((pool, index) => {
      const startTime = pool.started_at ? new Date(pool.started_at) : null
      const endTime = startTime && pool.duration_minutes 
        ? new Date(startTime.getTime() + (pool.duration_minutes * 60 * 1000))
        : null
      const now = new Date()
      const isExpired = endTime && now > endTime
      
      console.log(`🏆 Pool ${index + 1}:`)
      console.log(`   Name: ${pool.name}`)
      console.log(`   ID: ${pool.id}`)
      console.log(`   Status: ${pool.status}`)
      console.log(`   Prize Pool: $${pool.prize_pool_size || 0}`)
      console.log(`   Started: ${startTime?.toISOString() || 'Not started'}`)
      console.log(`   Duration: ${pool.duration_minutes || 0} minutes`)
      console.log(`   Should end: ${endTime?.toISOString() || 'Unknown'}`)
      console.log(`   Is expired: ${isExpired ? '✅ Yes' : '❌ No'}`)
      console.log(`   Created: ${new Date(pool.created_at).toISOString()}`)
      console.log('')
    })
    
    // Show recommended pools for testing
    console.log('\n📋 Recommended Pools for Testing:')
    console.log('-' .repeat(30))
    
    const finishedPools = pools.filter(p => p.status === 'finished')
    const ongoingPools = pools.filter(p => p.status === 'ongoing')
    const upcomingPools = pools.filter(p => p.status === 'upcoming')
    
    if (finishedPools.length > 0) {
      console.log('✅ Finished pools (best for testing):')
      finishedPools.forEach((pool, index) => {
        console.log(`   ${index + 1}. ${pool.name} - ID: ${pool.id}`)
      })
      console.log('')
    }
    
    if (ongoingPools.length > 0) {
      console.log('🔄 Ongoing pools (can test status change):')
      ongoingPools.forEach((pool, index) => {
        console.log(`   ${index + 1}. ${pool.name} - ID: ${pool.id}`)
      })
      console.log('')
    }
    
    if (upcomingPools.length > 0) {
      console.log('⏰ Upcoming pools:')
      upcomingPools.forEach((pool, index) => {
        console.log(`   ${index + 1}. ${pool.name} - ID: ${pool.id}`)
      })
      console.log('')
    }
    
    // Show copy-paste commands
    console.log('\n📋 Copy-Paste Commands:')
    console.log('-' .repeat(30))
    
    if (finishedPools.length > 0) {
      const testPool = finishedPools[0]
      console.log(`# Copy this command to test with finished pool:`)
      console.log(`node scripts/test-api-direct.js ${testPool.id}`)
      console.log('')
    }
    
    if (ongoingPools.length > 0) {
      const testPool = ongoingPools[0]
      console.log(`# Copy this command to test with ongoing pool:`)
      console.log(`node scripts/test-api-direct.js ${testPool.id}`)
      console.log('')
    }
    
  } catch (error) {
    console.error('💥 Error listing pools:', error)
    console.log('💡 Make sure to update the supabaseUrl and supabaseKey variables in this script')
  }
}

// Run the script
listPoolsQuick().then(() => {
  console.log('\n🏁 Pool listing completed!')
  console.log('=' .repeat(50))
  console.log('💡 Next steps:')
  console.log('   1. Copy one of the pool IDs above')
  console.log('   2. Run: node scripts/test-api-direct.js [pool-id]')
  console.log('   3. Check the test results')
  process.exit(0)
}).catch((error) => {
  console.error('💥 Pool listing crashed:', error)
  process.exit(1)
}) 