"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface PrizePoolTimerProps {
  prizePool: any
  onTimeUp?: () => void
}

export default function PrizePoolTimer({ prizePool, onTimeUp }: PrizePoolTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!prizePool.started_at) {
      console.log("⚠️ No start time found for pool:", prizePool.id)
      return
    }

    console.log("⏰ Setting up timer for pool:", prizePool.id)
    console.log("📅 Started at:", prizePool.started_at)
    console.log("⏱️ Duration:", prizePool.duration_minutes, "minutes")

    const startTime = new Date(prizePool.started_at).getTime()
    const duration = prizePool.duration_minutes * 60 * 1000 // Convert to milliseconds
    const endTime = startTime + duration

    console.log("🎯 End time:", new Date(endTime).toISOString())

    const updateTimer = () => {
      const now = Date.now()
      const remaining = endTime - now

      if (remaining <= 0) {
        setTimeLeft("00:00:00")
        if (!isExpired) {
          setIsExpired(true)
          console.log("⏰ Timer expired for pool:", prizePool.id)
          handleTimeExpired()
        }
        return
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60))
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

      const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      setTimeLeft(timeString)
    }

    const handleTimeExpired = async () => {
      try {
        console.log("🏁 Time expired! Updating pool status to finished:", prizePool.id)

        const { error } = await supabase
          .from("prize_pools")
          .update({
            status: "finished",
            ends_at: new Date().toISOString(),
          })
          .eq("id", prizePool.id)

        if (error) {
          console.error("❌ Error updating pool status to finished:", error)
        } else {
          console.log("✅ Pool status updated to finished successfully")
          if (onTimeUp) {
            onTimeUp()
          }
        }
      } catch (error) {
        console.error("💥 Error handling time expiration:", error)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => {
      console.log("🧹 Cleaning up timer for pool:", prizePool.id)
      clearInterval(interval)
    }
  }, [prizePool.started_at, prizePool.duration_minutes, prizePool.id, onTimeUp, isExpired])

  if (!prizePool.started_at) {
    return (
      <div className="flex items-center space-x-2 bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base">
        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="font-mono font-semibold text-xs sm:text-sm">Starting...</span>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
        isExpired ? "bg-gray-500" : "bg-red-600"
      } text-white`}
    >
      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
      <span className="font-mono font-semibold text-xs sm:text-sm">{timeLeft || "00:00:00"}</span>
      {isExpired && <span className="text-xs ml-2">Finished</span>}
    </div>
  )
}
