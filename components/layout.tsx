"use client"

import type React from "react"
import { useState } from "react"
import Header from "./header"
import BottomNavigation from "./bottom-navigation"
import AdminPanel from "./admin-panel"
import AdminPasswordModal from "./admin-password-modal"
import { useAuth } from "@/hooks/use-auth"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false)
  const [headerTapCount, setHeaderTapCount] = useState(0)
  const { isAdminUser, refreshAdminStatus } = useAuth()

  const handleHeaderTap = () => {
    setHeaderTapCount((prev) => {
      const newCount = prev + 1
      if (newCount === 5) {
        if (isAdminUser) {
          setShowAdminPanel(true)
        } else {
          setShowAdminPasswordModal(true)
        }
        return 0
      }
      return newCount
    })

    // Reset tap count after 2 seconds of inactivity
    setTimeout(() => {
      setHeaderTapCount(0)
    }, 2000)
  }

  const handleAdminPasswordSuccess = () => {
    refreshAdminStatus()
    setShowAdminPasswordModal(false)
    setShowAdminPanel(true)
  }

  return (
    <div className="min-h-screen bg-white">
      <Header onTap={handleHeaderTap} />
      {/* Add proper spacing for fixed header and bottom navigation */}
      <main className="pt-20 pb-24 min-h-screen">{children}</main>
      <BottomNavigation />

      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      {showAdminPasswordModal && (
        <AdminPasswordModal onClose={() => setShowAdminPasswordModal(false)} onSuccess={handleAdminPasswordSuccess} />
      )}
    </div>
  )
}
