"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ConnectionStatus() {
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("prize_pools").select("count", { count: "exact", head: true })

      if (error) {
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          setStatus({ success: false, message: "Table does not exist" })
        } else {
          setStatus({ success: false, message: error.message })
        }
      } else {
        setStatus({ success: true, message: "Connection successful" })
      }
    } catch (error: any) {
      setStatus({ success: false, message: error.message })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed bottom-24 right-4 bg-gray-100 text-gray-600 px-3 py-2 rounded-lg shadow-sm flex items-center space-x-2 text-sm">
        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600"></div>
        <span>Checking connection...</span>
      </div>
    )
  }

  if (!status) return null

  return (
    <div
      className={`fixed bottom-24 right-4 px-3 py-2 rounded-lg shadow-sm flex items-center space-x-2 text-sm ${
        status.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700 cursor-pointer hover:bg-red-200"
      }`}
      onClick={!status.success ? checkConnection : undefined}
    >
      {status.success ? (
        <>
          <Wifi className="w-3 h-3" />
          <span>Database connected</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Database setup needed</span>
        </>
      )}
    </div>
  )
}
