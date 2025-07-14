import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsService } from '@/services/googleSheets'
import { ExamLookupResponse } from '@/types/student'

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
  })
} 