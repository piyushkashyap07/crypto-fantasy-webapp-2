"use client"

import { useState } from "react"
import { Trash2, Eye } from "lucide-react"
import { type Team, deleteTeam } from "@/lib/teams"

interface TeamCardProps {
  team: Team
  onDelete: () => void
}

export default function TeamCard({ team, onDelete }: TeamCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this team?")) return

    try {
      setDeleting(true)
      await deleteTeam(team.id)
      onDelete()
    } catch (error) {
      console.error("Error deleting team:", error)
      alert("Failed to delete team. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toFixed(2)}`
  }

  const formatPercentage = (percentage: number) => {
    const formatted = percentage?.toFixed(2) || "0.00"
    return `${percentage >= 0 ? "+" : ""}${formatted}%`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">{team.team_name}</h3>
          <div className="text-xs sm:text-sm text-gray-600">
            Created: {new Date(team.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-lg sm:text-xl font-bold text-red-600">{team.total_points} pts</div>
          <div className="text-xs sm:text-sm text-gray-600">{team.tokens.length} tokens</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors text-sm"
        >
          <Eye className="w-4 h-4" />
          <span>{showDetails ? "Hide" : "View"} Details</span>
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 text-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>{deleting ? "Deleting..." : "Delete"}</span>
        </button>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Team Tokens:</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {team.tokens.map((token: any, index: number) => (
              <div key={token.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <span className="text-xs font-bold text-gray-600 flex-shrink-0">#{token.market_cap_rank}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-xs sm:text-sm truncate">{token.name}</div>
                    <div className="text-xs text-gray-600">{token.symbol}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-xs sm:text-sm font-semibold">{formatPrice(token.current_price)}</div>
                  <div
                    className={`text-xs ${token.price_change_percentage_1h_in_currency >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatPercentage(token.price_change_percentage_1h_in_currency)}
                  </div>
                </div>
                <div className="text-red-600 font-bold text-xs sm:text-sm ml-2">{token.points} pts</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
