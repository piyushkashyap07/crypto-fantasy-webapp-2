"use client"

import type React from "react"
import { useState } from "react"
import Header from "./header"
import BottomNavigation from "./bottom-navigation"
import { useAuth } from "@/hooks/use-auth"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { userUID } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* Add proper spacing for fixed header and bottom navigation */}
      <main className="pt-20 pb-24 min-h-screen">{children}</main>
      <BottomNavigation />
    </div>
  )
}
