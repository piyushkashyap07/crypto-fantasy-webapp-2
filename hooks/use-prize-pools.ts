"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase, getPrizePools } from "@/lib/supabase"
import { lockPricesForPool, finalizePricesAndRankings } from "@/lib/leaderboard"
import { cache, CACHE_KEYS } from "@/lib/cache"

export function usePrizePools() {
  const [prizePools, setPrizePools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPrizePools = useCallback(async () => {
    try {
      // Check cache first
      const cachedData = cache.get(CACHE_KEYS.PRIZE_POOLS)
      if (cachedData) {
        console.log("📦 Using cached prize pools data")
        setPrizePools(cachedData)
        setLoading(false)
        return
      }

      console.log("🌐 Fetching fresh prize pools data")
      const data = await getPrizePools()
      setPrizePools(data)
      
      // Cache the data for 30 seconds
      cache.set(CACHE_KEYS.PRIZE_POOLS, data, 30000)
    } catch (error) {
      console.error("Error fetching prize pools:", error)
      setPrizePools([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleStatusChange = useCallback(async (payload: any) => {
    console.log("🔄 Real-time: Prize pool change detected")
    console.log("   Event type:", payload.eventType)
    console.log("   Pool ID:", payload.new?.id)
    console.log("   Old status:", payload.old?.status)
    console.log("   New status:", payload.new?.status)
    console.log("   Timestamp:", new Date().toISOString())

    if (payload.eventType === "UPDATE") {
      const updatedPool = payload.new
      const oldPool = payload.old

      // Invalidate cache when pool data changes
      cache.delete(CACHE_KEYS.PRIZE_POOLS)
      console.log("🗑️ Cache invalidated for prize pools")

      // Check if status changed to ongoing
      if (updatedPool.status === "ongoing" && oldPool.status === "upcoming") {
        console.log("🚀 Real-time: Pool became ongoing, locking prices immediately")
        console.log("   Pool ID:", updatedPool.id)
        console.log("   Pool name:", updatedPool.name)

        try {
          // Lock prices immediately when pool becomes ongoing
          const result = await lockPricesForPool(updatedPool.id)
          console.log("✅ Real-time: Price locking result:", result)
        } catch (error) {
          console.error("❌ Real-time: Failed to lock prices for pool:", updatedPool.id, error)
        }
      }

      // Check if status changed to finished
      if (updatedPool.status === "finished" && oldPool.status === "ongoing") {
        console.log("🏁 Real-time: Pool finished, starting completion process")
        console.log("   Pool ID:", updatedPool.id)
        console.log("   Pool name:", updatedPool.name)
        console.log("   Started at:", updatedPool.started_at)
        console.log("   Duration:", updatedPool.duration_minutes, "minutes")
        
        try {
          // Step 1: Finalize prices and rankings
          console.log("📊 Real-time: Step 1 - Finalizing prices and rankings...")
          try {
            await finalizePricesAndRankings(updatedPool.id)
            console.log("✅ Real-time: Step 1 completed - Prices and rankings finalized")
          } catch (finalizeError) {
            console.error("❌ Real-time: Step 1 failed - Error finalizing prices and rankings")
            console.error("   Pool ID:", updatedPool.id)
            console.error("   Error:", finalizeError)
            // Continue with the process even if finalization fails
          }
          
          console.log("🏁 Real-time: Pool completion process finished")
        } catch (error) {
          console.error("❌ Real-time: Failed to finalize prices and rankings for pool")
          console.error("   Pool ID:", updatedPool.id)
          console.error("   Error:", error)
        }
      }
    }
  }, [])

  useEffect(() => {
    fetchPrizePools()

    // Set up real-time subscription with better error handling
    console.log("🔗 Setting up real-time subscription...")

    let retryCount = 0
    const maxRetries = 3
    let channel: any = null

    const setupSubscription = () => {
      try {
        channel = supabase
          .channel(`prize_pools_realtime_${Date.now()}`) // Unique channel name
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "prize_pools",
            },
            (payload) => {
              console.log("📡 Real-time change received:", payload)
              console.log("   Event type:", payload.eventType)
              console.log("   Pool ID:", (payload.new as any)?.id || 'unknown')
              console.log("   Old status:", (payload.old as any)?.status || 'unknown')
              console.log("   New status:", (payload.new as any)?.status || 'unknown')
              console.log("   Timestamp:", new Date().toISOString())

              try {
                // Handle status changes first
                handleStatusChange(payload)

                if (payload.eventType === "INSERT") {
                  console.log("➕ Adding new prize pool:", payload.new)
                  setPrizePools((prev) => {
                    const exists = prev.some((pool) => pool.id === payload.new.id)
                    if (exists) {
                      return prev
                    }
                    const newPools = [payload.new, ...prev]
                    console.log("Updated prize pools list:", newPools.length, "pools")
                    return newPools
                  })
                  showNotification(payload.new)
                } else if (payload.eventType === "UPDATE") {
                  console.log("🔄 Updating prize pool:", payload.new)
                  console.log("   Status changed from:", (payload.old as any)?.status || 'unknown', "to:", (payload.new as any)?.status || 'unknown')
                  setPrizePools((prev) => prev.map((pool) => (pool.id === payload.new.id ? payload.new : pool)))
                } else if (payload.eventType === "DELETE") {
                  console.log("🗑️ Deleting prize pool:", payload.old)
                  setPrizePools((prev) => prev.filter((pool) => pool.id !== payload.old.id))
                }
              } catch (error) {
                console.error("❌ Error handling real-time change:", error)
              }
            },
          )
          .subscribe((status, err) => {
            console.log("📡 Subscription status:", status)

            if (status === "SUBSCRIBED") {
              console.log("✅ Successfully subscribed to real-time updates")
              retryCount = 0 // Reset retry count on successful connection
            } else if (status === "CHANNEL_ERROR") {
              console.error("❌ Channel subscription error:", err)

              // Retry connection with exponential backoff
              if (retryCount < maxRetries) {
                retryCount++
                const retryDelay = Math.pow(2, retryCount) * 1000 // 2s, 4s, 8s
                console.log(`🔄 Retrying subscription in ${retryDelay}ms (attempt ${retryCount}/${maxRetries})`)

                setTimeout(() => {
                  if (channel) {
                    supabase.removeChannel(channel)
                  }
                  setupSubscription()
                }, retryDelay)
              } else {
                console.error("💥 Max retries reached, giving up on real-time subscription")
              }
            } else if (status === "TIMED_OUT") {
              console.error("⏰ Channel subscription timed out")

              // Retry on timeout
              if (retryCount < maxRetries) {
                retryCount++
                console.log(`🔄 Retrying after timeout (attempt ${retryCount}/${maxRetries})`)
                setTimeout(() => {
                  if (channel) {
                    supabase.removeChannel(channel)
                  }
                  setupSubscription()
                }, 2000)
              }
            } else if (status === "CLOSED") {
              console.log("🔒 Channel subscription closed")
            }
          })
      } catch (error) {
        console.error("💥 Error setting up subscription:", error)

        // Fallback: poll for updates every 30 seconds if real-time fails
        const pollInterval = setInterval(() => {
          console.log("🔄 Polling for updates (real-time failed)")
          fetchPrizePools()
        }, 30000)

        return () => clearInterval(pollInterval)
      }
    }

    // Initial setup
    setupSubscription()

    return () => {
      console.log("🧹 Cleaning up subscription...")
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch (error) {
          console.error("Error removing channel:", error)
        }
      }
    }
  }, [fetchPrizePools, handleStatusChange])

  const showNotification = (pool: any) => {
    const notification = document.createElement("div")
    notification.className =
      "fixed top-24 right-4 z-[70] bg-gradient-to-r from-red-600 to-red-500 text-white p-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300"
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>
        <div>
          <div class="font-semibold">New Prize Pool Available!</div>
          <div class="text-sm opacity-90">${pool.name} - $${pool.prize_pool_size}</div>
        </div>
      </div>
    `

    document.body.appendChild(notification)

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)"
    }, 100)

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.transform = "translateX(100%)"
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 5000)
  }

  return { prizePools, loading, refetch: fetchPrizePools }
}
