"use client"

import { useState } from "react"
import { LogOut, User } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { adminSignOut } from "@/lib/supabase"
import AdminAuthModal from "./admin-auth-modal"

interface HeaderProps {
  onTap: () => void
}

export default function Header({ onTap }: HeaderProps) {
  const { userUID, isAdminUser, loading, refreshAdminStatus } = useAuth()
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false)

  const handleAdminSignOut = () => {
    adminSignOut()
    refreshAdminStatus()
  }

  const handleAdminSignInSuccess = () => {
    refreshAdminStatus()
  }

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg"
        onClick={onTap}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-lg">C</span>
              </div>
              <h1 className="text-xl font-bold">Contest Platform</h1>
            </div>

            <div className="flex items-center space-x-4">
              {!loading && (
                <>
                  <div className="flex items-center space-x-3">
                    {isAdminUser && (
                      <span className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded text-xs font-medium">Admin</span>
                    )}
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span className="text-sm font-mono">@{userUID}</span>
                    </div>
                    {isAdminUser && (
                      <button
                        onClick={handleAdminSignOut}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-sm transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {showAdminAuthModal && (
        <AdminAuthModal onClose={() => setShowAdminAuthModal(false)} onSuccess={handleAdminSignInSuccess} />
      )}
    </>
  )
}
