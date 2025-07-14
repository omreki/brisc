import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsService } from '@/services/googleSheets'
import { PaymentRecord } from '@/types/student'

export async function POST(request: NextRequest) {
  try {
    const { paymentId, examNumber } = await request.json()

    if (!paymentId && !examNumber) {
      return NextResponse.json({
        success: false,
        message: 'Either paymentId or examNumber is required'
      }, { status: 400 })
    }

    let paymentRecord: PaymentRecord | null = null

    // Get payment record by payment ID or exam number
    if (paymentId) {
      paymentRecord = await googleSheetsService.getPaymentByPaymentId(paymentId)
    } else if (examNumber) {
      // Get the most recent payment for this exam number
      const payments = await googleSheetsService.getPaymentsByExamNumber(examNumber)
      if (payments.length > 0) {
        // Sort by creation date and get the most recent
        paymentRecord = payments.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
      }
    }

    if (!paymentRecord) {
      return NextResponse.json({
        success: false,
        status: 'not_found',
        message: 'Payment record not found'
      })
    }

    // Return detailed payment status
    const response = {
      success: true,
      status: paymentRecord.status,
      paymentRecord: {
        id: paymentRecord.id,
        paymentId: paymentRecord.paymentId,
        examNumber: paymentRecord.examNumber,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
        status: paymentRecord.status,
        paymentMethod: paymentRecord.paymentMethod,
        createdAt: paymentRecord.createdAt,
        updatedAt: paymentRecord.updatedAt,
        completedAt: paymentRecord.completedAt,
        failureReason: paymentRecord.failureReason
      },
      verified: paymentRecord.status === 'completed',
      message: getStatusMessage(paymentRecord.status, paymentRecord.failureReason),
      canRetry: paymentRecord.status === 'failed' || paymentRecord.status === 'cancelled'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in payment-status API:', error)
    return NextResponse.json({
      success: false,
      status: 'error',
      message: 'Internal server error while checking payment status'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')
    const examNumber = searchParams.get('examNumber')

    if (!paymentId && !examNumber) {
      return NextResponse.json({
        success: false,
        message: 'Either paymentId or examNumber is required'
      }, { status: 400 })
    }

    let paymentRecord: PaymentRecord | null = null

    if (paymentId) {
      paymentRecord = await googleSheetsService.getPaymentByPaymentId(paymentId)
    } else if (examNumber) {
      const payments = await googleSheetsService.getPaymentsByExamNumber(examNumber)
      if (payments.length > 0) {
        paymentRecord = payments.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
      }
    }

    if (!paymentRecord) {
      return NextResponse.json({
        success: false,
        status: 'not_found',
        message: 'Payment record not found'
      })
    }

    const response = {
      success: true,
      status: paymentRecord.status,
      paymentRecord: {
        id: paymentRecord.id,
        paymentId: paymentRecord.paymentId,
        examNumber: paymentRecord.examNumber,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
        status: paymentRecord.status,
        paymentMethod: paymentRecord.paymentMethod,
        createdAt: paymentRecord.createdAt,
        updatedAt: paymentRecord.updatedAt,
        completedAt: paymentRecord.completedAt,
        failureReason: paymentRecord.failureReason
      },
      verified: paymentRecord.status === 'completed',
      message: getStatusMessage(paymentRecord.status, paymentRecord.failureReason),
      canRetry: paymentRecord.status === 'failed' || paymentRecord.status === 'cancelled'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in payment-status API (GET):', error)
    return NextResponse.json({
      success: false,
      status: 'error',
      message: 'Internal server error while checking payment status'
    }, { status: 500 })
  }
}

function getStatusMessage(status: string, failureReason?: string): string {
  switch (status) {
    case 'completed':
      return 'Payment completed successfully'
    case 'pending':
      return 'Payment is being processed. Please wait...'
    case 'failed':
      return failureReason || 'Payment failed. Please try again.'
    case 'cancelled':
      return 'Payment was cancelled. Please try again if you wish to proceed.'
    default:
      return 'Payment status unknown. Please contact support.'
  }
} 