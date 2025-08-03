"use client"

import { useState, useEffect } from "react"
import { X, Users, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Participant {
  id: string
  user_uid: string
  prize_pool_id: string
  team_id: string
  wallet_address?: string
  transaction_hash?: string
  payment_confirmed?: boolean
  joined_at: string
  team?: {
    team_name: string
    tokens: Array<string | {
      id: string
      name: string
      symbol: string
      current_price: number
      market_cap_rank: number
      price_change_percentage_1h_in_currency: number
    }>
  }
}

interface AdminParticipantsModalProps {
  prizePoolId: string
  prizePoolName: string
  onClose: () => void
}

export default function AdminParticipantsModal({ 
  prizePoolId, 
  prizePoolName, 
  onClose 
}: AdminParticipantsModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadParticipants()
  }, [prizePoolId])

  const loadParticipants = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from("prize_pool_participants")
        .select(`
          *,
          team:teams(team_name, tokens)
        `)
        .eq("prize_pool_id", prizePoolId)
        .order("joined_at", { ascending: false })

      if (error) {
        throw error
      }

      setParticipants(data || [])
    } catch (error: any) {
      console.error("Error loading participants:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatusIcon = (confirmed: boolean) => {
    if (confirmed) {
      return <CheckCircle className="w-4 h-4 text-green-600" />
    } else {
      return <Clock className="w-4 h-4 text-yellow-600" />
    }
  }

  const getPaymentStatusColor = (confirmed: boolean) => {
    if (confirmed) {
      return "bg-green-100 text-green-800"
    } else {
      return "bg-yellow-100 text-yellow-800"
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Pool Participants</h2>
              <p className="text-sm text-gray-600">{prizePoolName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No participants yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800">
                  {participants.length} Participant{participants.length !== 1 ? 's' : ''}
                </h3>
                <button
                  onClick={loadParticipants}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Refresh
                </button>
              </div>

              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-gray-800">
                        User: @{participant.user_uid}
                      </p>
                                             <p className="text-sm text-gray-600">
                         Team: {participant.team?.team_name || "Unknown"}
                       </p>
                    </div>
                                         <div className="flex items-center space-x-2">
                       {getPaymentStatusIcon(participant.payment_confirmed || false)}
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(participant.payment_confirmed || false)}`}>
                         {participant.payment_confirmed ? "Confirmed" : "Pending"}
                       </span>
                     </div>
                  </div>

                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                     <div>
                       <p className="text-gray-600">Wallet Address:</p>
                       <p className="font-medium font-mono text-xs">
                         {participant.wallet_address || "Not provided"}
                       </p>
                     </div>
                     <div>
                       <p className="text-gray-600">Joined:</p>
                       <p className="font-medium">
                         {new Date(participant.joined_at).toLocaleString()}
                       </p>
                     </div>
                     {participant.transaction_hash && (
                       <div className="md:col-span-2">
                         <p className="text-gray-600">Transaction Hash:</p>
                         <p className="font-mono text-xs break-all">
                           {participant.transaction_hash}
                         </p>
                       </div>
                     )}
                                         {participant.team?.tokens && participant.team.tokens.length > 0 && (
                       <div className="md:col-span-2">
                         <p className="text-gray-600">Team Tokens ({participant.team.tokens.length}):</p>
                         <div className="flex flex-wrap gap-1 mt-1">
                           {participant.team.tokens.map((token, index) => {
                             const tokenSymbol = typeof token === 'string' ? token : token.symbol || token.name || 'Unknown'
                             const tokenName = typeof token === 'string' ? token : token.name || token.symbol || 'Unknown'
                             return (
                               <span
                                 key={index}
                                 className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                                 title={typeof token === 'string' ? token : `${tokenName} (${tokenSymbol})`}
                               >
                                 {tokenSymbol}
                               </span>
                             )
                           })}
                         </div>
                       </div>
                     )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
