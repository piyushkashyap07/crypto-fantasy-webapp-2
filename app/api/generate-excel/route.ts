import { NextRequest, NextResponse } from 'next/server'
import { generatePrizeDistributionExcel } from '@/lib/excel-generator'

export async function POST(request: NextRequest) {
  try {
    const { prizePoolId } = await request.json()
    
    if (!prizePoolId) {
      return NextResponse.json(
        { error: 'Prize pool ID is required' },
        { status: 400 }
      )
    }

    console.log('📊 API: Generating Excel for prize pool:', prizePoolId)
    
    const result = await generatePrizeDistributionExcel(prizePoolId)
    
    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Excel data generated successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to generate Excel data'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ API Error in generate-excel:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 