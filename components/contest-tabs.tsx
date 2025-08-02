"use client"

interface Contest {
  id: number
  title: string
  prize: string
  participants: number
  category: string
  startTime?: string
  timeLeft?: string
  winner?: string
  status?: string
}

interface ContestTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  contests: {
    upcoming?: Contest[]
    ongoing?: Contest[]
    finished?: Contest[]
  } | null
  isAdmin?: boolean
}

export default function ContestTabs({ activeTab, setActiveTab, contests, isAdmin = false }: ContestTabsProps) {
  const tabs = [
    { id: "upcoming", label: "Upcoming", count: contests?.upcoming?.length || 0 },
    { id: "ongoing", label: "Ongoing", count: contests?.ongoing?.length || 0 },
    { id: "finished", label: "Finished", count: contests?.finished?.length || 0 },
  ]

  const renderContest = (contest: Contest) => (
    <div key={contest.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{contest.title}</h3>
          <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
            {contest.category}
          </span>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-red-600">{contest.prize}</div>
          <div className="text-sm text-gray-600">Prize Pool</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-gray-800">{contest.participants.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Participants</div>
        </div>

        {contest.startTime && (
          <div>
            <div className="text-lg font-semibold text-gray-800">{contest.startTime}</div>
            <div className="text-sm text-gray-600">Start Time</div>
          </div>
        )}

        {contest.timeLeft && (
          <div>
            <div className="text-lg font-semibold text-green-600">{contest.timeLeft}</div>
            <div className="text-sm text-gray-600">Time Left</div>
          </div>
        )}

        {contest.winner && (
          <div>
            <div className="text-lg font-semibold text-yellow-600">{contest.winner}</div>
            <div className="text-sm text-gray-600">Winner</div>
          </div>
        )}

        {isAdmin && contest.status && (
          <div>
            <div
              className={`text-lg font-semibold ${
                contest.status === "active"
                  ? "text-green-600"
                  : contest.status === "scheduled"
                    ? "text-blue-600"
                    : "text-gray-600"
              }`}
            >
              {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
            </div>
            <div className="text-sm text-gray-600">Status</div>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="mt-4 pt-4 border-t">
          <button className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity">
            {activeTab === "upcoming" ? "Register Now" : activeTab === "ongoing" ? "Join Contest" : "View Results"}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
              activeTab === tab.id ? "bg-white text-red-600 shadow-sm" : "text-gray-600 hover:text-red-600"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "upcoming" && (
          <div className="grid gap-6">
            {contests?.upcoming?.map(renderContest) || (
              <div className="text-center text-gray-500 py-12">No upcoming contests</div>
            )}
          </div>
        )}

        {activeTab === "ongoing" && (
          <div className="grid gap-6">
            {contests?.ongoing?.map(renderContest) || (
              <div className="text-center text-gray-500 py-12">No ongoing contests</div>
            )}
          </div>
        )}

        {activeTab === "finished" && (
          <div className="grid gap-6">
            {contests?.finished?.map(renderContest) || (
              <div className="text-center text-gray-500 py-12">No finished contests</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
