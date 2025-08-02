"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, Calendar } from "lucide-react"
import { getUserTeams, type Team } from "@/lib/teams"
import { useAuth } from "@/hooks/use-auth"

interface TeamSelectionDropdownProps {
  selectedTeam: Team | null
  onTeamSelect: (team: Team | null) => void
}

export default function TeamSelectionDropdown({ selectedTeam, onTeamSelect }: TeamSelectionDropdownProps) {
  const { userUID } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (userUID) {
      loadUserTeams()
    }
  }, [userUID])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const loadUserTeams = async () => {
    try {
      setLoading(true)
      const userTeams = await getUserTeams(userUID)
      setTeams(userTeams)
    } catch (error) {
      console.error("Error loading teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTeamSelect = (team: Team) => {
    onTeamSelect(team)
    setIsOpen(false)
  }

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2 mb-3">
        <Calendar className="w-5 h-5 text-red-600" />
        <h2 className="text-xl font-semibold text-gray-800">Upcoming Prize Pool</h2>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full max-w-md bg-white border border-gray-300 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
          <span className="text-gray-700">
            Team Selected: <span className="font-semibold">{selectedTeam ? selectedTeam.team_name : "None"}</span>
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-w-md">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <button
                  onClick={() => handleTeamSelect(null)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    !selectedTeam ? "bg-red-50 text-red-600" : "text-gray-700"
                  }`}
                >
                  None
                </button>
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleTeamSelect(team)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-t border-gray-100 ${
                      selectedTeam?.id === team.id ? "bg-red-50 text-red-600" : "text-gray-700"
                    }`}
                  >
                    <div className="font-medium">{team.team_name}</div>
                    <div className="text-sm text-gray-500">
                      {team.total_points} points • {team.tokens.length} tokens
                    </div>
                  </button>
                ))}
                {teams.length === 0 && (
                  <div className="px-4 py-3 text-gray-500 text-sm">No teams available. Create a team first.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
