"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { downloadExcelFile } from "@/lib/excel-generator"

interface DownloadExcelButtonProps {
  prizePoolId: string
  prizePoolName: string
  isFinished: boolean
}

export default function DownloadExcelButton({ 
  prizePoolId, 
  prizePoolName, 
  isFinished 
}: DownloadExcelButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    if (!isFinished) {
      setError("Prize pool must be finished to download Excel")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log("📥 Starting Excel download for pool:", prizePoolId)
      
      const response = await fetch('/api/generate-excel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prizePoolId })
    })
    
    const result = await response.json()
      
      if (!result.success) {
        setError(result.error || "Failed to generate Excel file")
        return
      }

      if (!result.data || result.data.length === 0) {
        setError("No winners found for this prize pool")
        return
      }

      // Download the file
      downloadExcelFile(result.data, prizePoolName)
      
      console.log("✅ Excel file downloaded successfully")
    } catch (error: any) {
      console.error("❌ Error downloading Excel:", error)
      
      // Handle specific authentication errors
      if (error.message?.includes("Invalid Refresh Token") || 
          error.message?.includes("Refresh Token Not Found")) {
        setError("Authentication expired. Please refresh the page and try again.")
      } else {
        setError("Failed to download Excel file. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isFinished) {
    return null // Don't show button for unfinished pools
  }

  return (
    <div className="flex flex-col space-y-2">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{loading ? "Generating..." : "Download Excel"}</span>
      </button>
      
      {error && (
        <div className="text-red-600 text-xs bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  )
} 