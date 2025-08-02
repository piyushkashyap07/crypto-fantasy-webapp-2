"use client"

import { useState, useEffect } from "react"
import { getOrCreateUserUID, isAdminLoggedIn } from "@/lib/supabase"

export function useAuth() {
  const [userUID, setUserUID] = useState<string>("")
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeUser()
  }, [])

  const initializeUser = async () => {
    try {
      // Get or create anonymous user UID
      const uid = await getOrCreateUserUID()
      setUserUID(uid)

      // Check admin status
      setIsAdminUser(isAdminLoggedIn())
    } catch (error) {
      console.error("Error initializing user:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshAdminStatus = () => {
    setIsAdminUser(isAdminLoggedIn())
  }

  return { userUID, isAdminUser, loading, refreshAdminStatus }
}
