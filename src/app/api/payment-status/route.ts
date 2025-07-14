import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsService } from '@/services/googleSheets'
import { intasendService } from '@/services/intasendService'
import { PaymentRecord } from '@/types/student'

export async function POST(request: NextRequest) {
  try {
    const { paymentId, examNumber, forceCheck } = await request.json()

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

    let currentStatus = paymentRecord.status
    let updatedPayment = paymentRecord

    // If payment is still pending or if forceCheck is true, verify with IntaSend
    if ((currentStatus === 'pending' || forceCheck) && paymentRecord.paymentId) {
      console.log(`Checking payment status with IntaSend for: ${paymentRecord.paymentId}`)
      
      try {
        const intasendStatus = await intasendService.checkPaymentStatus(paymentRecord.paymentId)
        
        if (intasendStatus.success && intasendStatus.status !== currentStatus) {
          console.log(`Payment status updated from ${currentStatus} to ${intasendStatus.status}`)
          
          // Update payment status in Google Sheets
          const completedAt = intasendStatus.status === 'completed' ? new Date().toISOString() : undefined
          const failureReason = intasendStatus.status === 'failed' ? intasendStatus.data?.failed_reason : undefined
          
          updatedPayment = await googleSheetsService.updatePaymentStatus(
            paymentRecord.paymentId,
            intasendStatus.status as any,
            completedAt,
            failureReason,
            intasendStatus.data
          ) || paymentRecord

          currentStatus = intasendStatus.status

          // If payment completed, trigger automatic result processing
          if (intasendStatus.status === 'completed') {
            console.log(`Payment completed via direct check: ${paymentRecord.paymentId}`)
            // You could trigger the same logic as in webhook here if needed
          }
        }
      } catch (error) {
        console.error('Error checking payment status with IntaSend:', error)
        // Continue with existing status from database
      }
    }

    // Return detailed payment status
    const response = {
      success: true,
      status: currentStatus,
      paymentRecord: {
        id: updatedPayment.id,
        paymentId: updatedPayment.paymentId,
        examNumber: updatedPayment.examNumber,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        status: currentStatus,
        paymentMethod: updatedPayment.paymentMethod,
        createdAt: updatedPayment.createdAt,
        updatedAt: updatedPayment.updatedAt,
        completedAt: updatedPayment.completedAt,
        failureReason: updatedPayment.failureReason
      },
      verified: currentStatus === 'completed',
      message: getStatusMessage(currentStatus, updatedPayment.failureReason),
      canRetry: currentStatus === 'failed' || currentStatus === 'cancelled',
      checkedWithProvider: (currentStatus === 'pending' || forceCheck) // Indicate if we checked with IntaSend
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
    const forceCheck = searchParams.get('forceCheck') === 'true'

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

    let currentStatus = paymentRecord.status
    let updatedPayment = paymentRecord

    // If payment is still pending or if forceCheck is true, verify with IntaSend
    if ((currentStatus === 'pending' || forceCheck) && paymentRecord.paymentId) {
      console.log(`Checking payment status with IntaSend for: ${paymentRecord.paymentId}`)
      
      try {
        const intasendStatus = await intasendService.checkPaymentStatus(paymentRecord.paymentId)
        
        if (intasendStatus.success && intasendStatus.status !== currentStatus) {
          console.log(`Payment status updated from ${currentStatus} to ${intasendStatus.status}`)
          
          // Update payment status in Google Sheets
          const completedAt = intasendStatus.status === 'completed' ? new Date().toISOString() : undefined
          const failureReason = intasendStatus.status === 'failed' ? intasendStatus.data?.failed_reason : undefined
          
          updatedPayment = await googleSheetsService.updatePaymentStatus(
            paymentRecord.paymentId,
            intasendStatus.status as any,
            completedAt,
            failureReason,
            intasendStatus.data
          ) || paymentRecord

          currentStatus = intasendStatus.status
        }
      } catch (error) {
        console.error('Error checking payment status with IntaSend:', error)
        // Continue with existing status from database
      }
    }

    const response = {
      success: true,
      status: currentStatus,
      paymentRecord: {
        id: updatedPayment.id,
        paymentId: updatedPayment.paymentId,
        examNumber: updatedPayment.examNumber,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        status: currentStatus,
        paymentMethod: updatedPayment.paymentMethod,
        createdAt: updatedPayment.createdAt,
        updatedAt: updatedPayment.updatedAt,
        completedAt: updatedPayment.completedAt,
        failureReason: updatedPayment.failureReason
      },
      verified: currentStatus === 'completed',
      message: getStatusMessage(currentStatus, updatedPayment.failureReason),
      canRetry: currentStatus === 'failed' || currentStatus === 'cancelled',
      checkedWithProvider: (currentStatus === 'pending' || forceCheck)
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