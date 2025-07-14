import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/services/emailService'
import { generatePDFBuffer } from '@/utils/pdfGenerator'
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
    const { userEmail, studentName, examNumber, resultData, paymentId } = body

    // Validate required fields
    if (!userEmail || !studentName || !examNumber || !resultData) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
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

    // Generate PDF buffer
    const pdfBuffer = await generatePDFBuffer(resultData as StudentResult, examNumber)

    // Send email with PDF attachment
    const emailResult = await emailService.sendResultsPDF(
      userEmail,
      studentName,
      examNumber,
      pdfBuffer
    )

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, message: emailResult.message || 'Failed to send email' },
        { status: 500 }
      )
    }

    // Optionally send payment receipt email if paymentId is provided
    if (paymentId) {
      try {
        await emailService.sendPaymentReceiptEmail(
          userEmail,
          studentName,
          examNumber,
          150, // Payment amount
          paymentId
        )
      } catch (error) {
        console.error('Error sending payment receipt email:', error)
        // Don't fail the whole request if receipt email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Results email sent successfully',
    })

  } catch (error: any) {
    console.error('Error sending results email:', error)

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to send results email' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Send results email API endpoint',
    method: 'POST',
    body: {
      userEmail: 'string (required)',
      studentName: 'string (required)',
      examNumber: 'string (required)',
      resultData: 'StudentResult object (required)',
      paymentId: 'string (optional)',
    },
  })
} 