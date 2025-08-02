"use client"

import { useState } from "react"
import Layout from "@/components/layout"
import PrizePoolTabs from "@/components/prize-pool-tabs"
import { usePrizePools } from "@/hooks/use-prize-pools"

export default function ExplorePage() {
  const { prizePools, loading } = usePrizePools()
  const [activeTab, setActiveTab] = useState("upcoming")

  return (
    <Layout>
      <div className="min-h-full bg-gradient-to-br from-red-50 to-white px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <PrizePoolTabs activeTab={activeTab} setActiveTab={setActiveTab} prizePools={prizePools} loading={loading} />
        </div>
      </div>
    </Layout>
  )
}
