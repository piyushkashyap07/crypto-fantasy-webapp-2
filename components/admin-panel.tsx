"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"
import AdminPrizePoolTabs from "./admin-prize-pool-tabs"
import AddPrizePoolModal from "./add-prize-pool-modal"
import { usePrizePools } from "@/hooks/use-prize-pools"
import { useAuth } from "@/hooks/use-auth"

interface AdminPanelProps {
  onClose: () => void
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState("upcoming")
  const [showAddModal, setShowAddModal] = useState(false)
  const { prizePools, loading } = usePrizePools()
  const { isAdminUser } = useAuth()

  if (!isAdminUser) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">You need admin privileges to access this panel.</p>
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
              Admin Panel
            </h2>
            <div className="flex items-center space-x-4">
              {activeTab === "upcoming" && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Prize Pool</span>
                </button>
              )}
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <AdminPrizePoolTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              prizePools={prizePools}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {showAddModal && <AddPrizePoolModal onClose={() => setShowAddModal(false)} />}
    </>
  )
}
