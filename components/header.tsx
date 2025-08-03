"use client"

import { User } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function Header() {
  const { userUID, loading } = useAuth()

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg">
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
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-mono">@{userUID}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>


    </>
  )
}
