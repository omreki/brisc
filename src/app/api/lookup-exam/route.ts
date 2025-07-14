import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsService } from '@/services/googleSheets'
import { ExamLookupResponse } from '@/types/student'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { examNumber } = await request.json()

    if (!examNumber) {
      return NextResponse.json<ExamLookupResponse>({
        success: false,
        message: 'Exam number is required',
      }, { status: 400 })
    }

    // Validate exam number format (basic validation)
    const examNumberStr = examNumber.toString().trim()
    if (examNumberStr.length < 3) {
      return NextResponse.json<ExamLookupResponse>({
        success: false,
        message: 'Invalid exam number format',
      }, { status: 400 })
    }

    // Get user ID from token if available (for user-specific verification)
    let userId: string | undefined
    try {
      const token = request.cookies.get('auth-token')?.value
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
        userId = decoded.userId
      }
    } catch (error) {
      // Token is optional - anonymous users can still access results if they've paid
      console.log('No valid token provided for exam lookup')
    }

    // Verify payment before looking up results
    const paymentVerification = await googleSheetsService.verifyPaymentForExamAccess(examNumberStr, userId)
    
    if (!paymentVerification.isValid) {
      return NextResponse.json<ExamLookupResponse>({
        success: false,
        message: paymentVerification.message,
        paymentRequired: true,
        paymentRecord: paymentVerification.paymentRecord,
      }, { status: 402 }) // 402 Payment Required
    }

    // Look up the student result
    const studentResult = await googleSheetsService.getStudentResult(examNumberStr)

    if (!studentResult) {
      return NextResponse.json<ExamLookupResponse>({
        success: false,
        message: 'Exam number not found. Please check and try again.',
      }, { status: 404 })
    }

    return NextResponse.json<ExamLookupResponse>({
      success: true,
      data: studentResult,
      message: 'Exam results found successfully',
      paymentRecord: paymentVerification.paymentRecord,
    })

  } catch (error) {
    console.error('Error in lookup-exam API:', error)
    
    return NextResponse.json<ExamLookupResponse>({
      success: false,
      message: 'An error occurred while looking up exam results',
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Exam lookup API endpoint',
    method: 'POST',
    body: {
      examNumber: 'string (required)',
    },
    note: 'Payment verification is required to access exam results'
  })
} 