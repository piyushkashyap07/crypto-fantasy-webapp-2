"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase, getPrizePools } from "@/lib/supabase"
import { lockPricesForPool, finalizePricesAndRankings } from "@/lib/leaderboard"

export function usePrizePools() {
  const [prizePools, setPrizePools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPrizePools = useCallback(async () => {
    try {
      const data = await getPrizePools()
      setPrizePools(data)
    } catch (error) {
      console.error("Error fetching prize pools:", error)
      setPrizePools([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleStatusChange = useCallback(async (payload: any) => {
    console.log("🔄 Prize pool change detected:", payload)

    if (payload.eventType === "UPDATE") {
      const updatedPool = payload.new
      const oldPool = payload.old

      // Check if status changed to ongoing
      if (updatedPool.status === "ongoing" && oldPool.status === "upcoming") {
        console.log("🚀 Pool became ongoing, locking prices immediately:", updatedPool.id)

        try {
          // Lock prices immediately when pool becomes ongoing
          const result = await lockPricesForPool(updatedPool.id)
          console.log("✅ Price locking result:", result)
        } catch (error) {
          console.error("❌ Failed to lock prices for pool:", updatedPool.id, error)
        }
      }

      // Check if status changed to finished
      if (updatedPool.status === "finished" && oldPool.status === "ongoing") {
        console.log("🏁 Pool finished, finalizing prices and rankings:", updatedPool.id)
        try {
          await finalizePricesAndRankings(updatedPool.id)
          console.log("✅ Prices and rankings finalized for pool:", updatedPool.id)
        } catch (error) {
          console.error("❌ Failed to finalize prices and rankings for pool:", updatedPool.id, error)
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
                    return newPools
                  })
                  showNotification(payload.new)
                } else if (payload.eventType === "UPDATE") {
                  console.log("🔄 Updating prize pool:", payload.new)
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
