import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsService } from '@/services/googleSheets'
import { StudentResult } from '@/types/student'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any

    // Get request body
    const body = await request.json()
    const { examNumber, studentName, paymentId, resultData } = body

    // Validate required fields
    if (!examNumber || !studentName || !paymentId || !resultData) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate that resultData is a valid StudentResult
    const requiredFields = [
      'name', 'examNumber', 'oldTestamentSurvey', 'newTestamentSurvey',
      'prophets', 'paulsMissionaryJourney', 'hebrewLanguage', 'bookOfHebrew',
      'greekLanguage', 'bibleStudyMethod', 'bookOfRomans', 'theBookOfJudges',
      'abrahamsJourney', 'kingsOfIsrael', 'kingsOfJudah', 'epistles',
      'churchHistory', 'theology', 'tabernacle', 'theBookOfEzekiel',
      'theJourneyOfIsraelites', 'churchAdministration', 'practicum', 'ref'
    ]

    const missingFields = requiredFields.filter(field => !resultData[field])
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing result data fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if user already has results for this exam number
    const existingResult = await googleSheetsService.getUserResultByExamNumber(decoded.userId, examNumber)
    
    if (existingResult) {
      return NextResponse.json(
        { success: false, message: 'Results already exist for this exam number' },
        { status: 409 }
      )
    }

    // Save the result to user's account
    const savedResult = await googleSheetsService.saveUserResult(
      decoded.userId,
      examNumber,
      studentName,
      paymentId,
      resultData as StudentResult
    )

    if (!savedResult) {
      return NextResponse.json(
        { success: false, message: 'Failed to save result to user account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Result saved to user account successfully',
      resultId: savedResult.id,
    })

  } catch (error: any) {
    console.error('Error saving user result:', error)

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to save result to user account' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any

    // Get user's results
    const userResults = await googleSheetsService.getUserResults(decoded.userId)

    return NextResponse.json({
      success: true,
      results: userResults,
    })

  } catch (error: any) {
    console.error('Error fetching user results:', error)

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch user results' },
      { status: 500 }
    )
  }
} 