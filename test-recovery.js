// Test script for account recovery
// Run this in browser console to test the recovery system

async function testRecovery() {
  console.log("🧪 Testing Account Recovery System...")
  
  // Test wallet address
  const walletAddress = "0x1f5f9909053518a8249f9c8001fAb728507223e6"
  
  try {
    // Import the recovery function (you'll need to adjust this based on your setup)
    const response = await fetch('/api/test-recovery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: walletAddress
      })
    })
    
    const result = await response.json()
    console.log("✅ Recovery test result:", result)
    
    if (result.success) {
      console.log("🎉 Account found!")
      console.log("User ID:", result.data.user_uid)
      console.log("Teams:", result.data.teams.length)
      console.log("Payments:", result.data.payments.length)
      console.log("Participants:", result.data.participants.length)
    } else {
      console.log("❌ No account found")
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Run the test
testRecovery() 