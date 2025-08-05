import { supabase } from "./supabase"

export interface ExcelRow {
  address: string
  memo: string
  amount: number
  remark: string
}

export async function generatePrizeDistributionExcel(prizePoolId: string): Promise<{
  success: boolean
  data?: ExcelRow[]
  error?: string
}> {
  try {
    console.log("📊 Generating Excel for prize pool:", prizePoolId)

    // Check if user is authenticated (optional check for admin functions)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log("⚠️ No active session, but continuing with Excel generation")
    }

    // Get the prize pool details
    const { data: prizePool, error: poolError } = await supabase
      .from("prize_pools")
      .select("*")
      .eq("id", prizePoolId)
      .single()

    if (poolError || !prizePool) {
      throw new Error("Prize pool not found")
    }

    if (prizePool.status !== "finished") {
      throw new Error("Prize pool must be finished to generate Excel")
    }

    // Get final rankings with prize amounts
    const { data: finalRankings, error: rankingsError } = await supabase
      .from("final_rankings")
      .select(`
        *,
        teams!inner(team_name, user_uid)
      `)
      .eq("prize_pool_id", prizePoolId)
      .gt("prize_amount", 0) // Only include winners with prize amounts
      .order("final_rank", { ascending: true })

    if (rankingsError) {
      console.error("❌ Error fetching final rankings:", rankingsError)
      throw rankingsError
    }

    if (!finalRankings || finalRankings.length === 0) {
      console.log("⚠️ No winners found for prize pool")
      return {
        success: true,
        data: []
      }
    }

    console.log("🏆 Found winners:", finalRankings.length)

    // Get payment details for wallet addresses
    const excelRows: ExcelRow[] = []

    for (const ranking of finalRankings) {
      try {
        // Get payment details for this participant
        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .select("wallet_address")
          .eq("prize_pool_id", prizePoolId)
          .eq("user_uid", ranking.user_uid)
          .single()

        let walletAddress = "Unknown"
        if (!paymentError && payment) {
          walletAddress = payment.wallet_address || "Unknown"
        }

        // If no payment found, try to get from participant record
        if (walletAddress === "Unknown") {
          const { data: participant } = await supabase
            .from("prize_pool_participants")
            .select("wallet_address")
            .eq("prize_pool_id", prizePoolId)
            .eq("user_uid", ranking.user_uid)
            .single()
          
          if (participant && participant.wallet_address) {
            walletAddress = participant.wallet_address
          }
        }

        // Create Excel row
        const row: ExcelRow = {
          address: walletAddress,
          memo: "", // Always empty as per requirements
          amount: parseFloat(ranking.prize_amount.toString()),
          remark: `User ${ranking.user_uid} - Rank ${ranking.final_rank}`
        }

        excelRows.push(row)
      } catch (error) {
        console.error("❌ Error processing ranking:", ranking.id, error)
        // Continue with other rankings even if one fails
      }
    }

    console.log("✅ Generated Excel rows:", excelRows.length)
    
    return {
      success: true,
      data: excelRows
    }

  } catch (error) {
    console.error("💥 Error generating Excel:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

export function downloadExcelFile(data: ExcelRow[], prizePoolName: string): void {
  try {
    // Import xlsx dynamically to avoid SSR issues
    import('xlsx').then((XLSX) => {
      // Create worksheet data
      const worksheetData = [
        ["Address/ENS/Cwallet_ID", "Memo(optional)", "Amount", "Remark"],
        ...data.map(row => [
          row.address,
          row.memo,
          row.amount,
          row.remark
        ])
      ]

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Prize Distribution")

      // Generate Excel file and download
      XLSX.writeFile(workbook, `${prizePoolName}_prize_distribution.xlsx`)
    }).catch((error) => {
      console.error("❌ Error loading xlsx library:", error)
      // Fallback to CSV if xlsx fails
      const headers = ["Address/ENS/Cwallet_ID", "Memo(optional)", "Amount", "Remark"]
      const csvContent = [
        headers.join(","),
        ...data.map(row => [
          `"${row.address}"`,
          `"${row.memo}"`,
          row.amount.toString(),
          `"${row.remark}"`
        ].join(","))
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `${prizePoolName}_prize_distribution.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    })
  } catch (error) {
    console.error("❌ Error downloading Excel file:", error)
    throw error
  }
} 