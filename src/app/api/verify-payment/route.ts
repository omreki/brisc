import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsService } from '@/services/googleSheets'
import { intasendService } from '@/services/intasendService'
import { PaymentVerificationResult } from '@/types/student'
import { EmailService } from '@/services/emailService'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { examNumber, paymentId, forceRefresh } = body

    if (!examNumber && !paymentId) {
      return NextResponse.json({
        success: false,
        message: 'Either exam number or payment ID is required'
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
      // Token is optional for this endpoint, so we don't fail if it's invalid
      console.log('No valid token provided for payment verification')
    }

    let verificationResult: PaymentVerificationResult

    if (paymentId) {
      // Verify specific payment by ID
      verificationResult = await verifySpecificPayment(paymentId, userId)
    } else {
      // Verify payment for exam access
      verificationResult = await googleSheetsService.verifyPaymentForExamAccess(examNumber, userId)
    }

    // If verification failed and forceRefresh is requested, attempt reconciliation
    if (!verificationResult.isValid && forceRefresh) {
      console.log('Verification failed, attempting payment reconciliation...')
      
      if (paymentId) {
        // Try to reconcile specific payment
        await reconcilePaymentById(paymentId)
        verificationResult = await verifySpecificPayment(paymentId, userId)
      } else if (examNumber) {
        // Try to reconcile all payments for this exam number
        await reconcilePaymentsByExamNumber(examNumber)
        verificationResult = await googleSheetsService.verifyPaymentForExamAccess(examNumber, userId)
      }
    }
    
    return NextResponse.json({
      success: verificationResult.isValid,
      ...verificationResult
    })

  } catch (error) {
    console.error('Error in verify-payment API:', error)
    return NextResponse.json({
      success: false,
      isValid: false,
      hasValidPayment: false,
      message: 'Internal server error during payment verification'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const examNumber = searchParams.get('examNumber')
    const paymentId = searchParams.get('paymentId')
    const forceRefresh = searchParams.get('forceRefresh') === 'true'

    if (!examNumber && !paymentId) {
      return NextResponse.json({
        success: false,
        message: 'Either exam number or payment ID is required'
      }, { status: 400 })
    }

    // Get user ID from token if available
    let userId: string | undefined
    try {
      const token = request.cookies.get('auth-token')?.value
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
        userId = decoded.userId
      }
    } catch (error) {
      // Token is optional for this endpoint
      console.log('No valid token provided for payment verification')
    }

    let verificationResult: PaymentVerificationResult

    if (paymentId) {
      verificationResult = await verifySpecificPayment(paymentId, userId)
    } else {
      verificationResult = await googleSheetsService.verifyPaymentForExamAccess(examNumber!, userId)
    }

    // If verification failed and forceRefresh is requested, attempt reconciliation
    if (!verificationResult.isValid && forceRefresh) {
      console.log('Verification failed, attempting payment reconciliation...')
      
      if (paymentId) {
        await reconcilePaymentById(paymentId)
        verificationResult = await verifySpecificPayment(paymentId, userId)
      } else if (examNumber) {
        await reconcilePaymentsByExamNumber(examNumber)
        verificationResult = await googleSheetsService.verifyPaymentForExamAccess(examNumber, userId)
      }
    }
    
    return NextResponse.json({
      success: verificationResult.isValid,
      ...verificationResult
    })

  } catch (error) {
    console.error('Error in verify-payment API (GET):', error)
    return NextResponse.json({
      success: false,
      isValid: false,
      hasValidPayment: false,
      message: 'Internal server error during payment verification'
    }, { status: 500 })
  }
}

async function verifySpecificPayment(paymentId: string, userId?: string): Promise<PaymentVerificationResult> {
  try {
    const paymentRecord = await googleSheetsService.getPaymentByPaymentId(paymentId)
    
    if (!paymentRecord) {
      return {
        isValid: false,
        hasValidPayment: false,
        message: 'Payment record not found'
      }
    }

    if (paymentRecord.status !== 'completed') {
      return {
        isValid: false,
        hasValidPayment: false,
        paymentRecord,
        message: getPaymentStatusMessage(paymentRecord.status, paymentRecord.failureReason)
      }
    }

    // If userId is provided, verify it matches the payment
    if (userId && paymentRecord.userId && paymentRecord.userId !== userId) {
      return {
        isValid: false,
        hasValidPayment: true,
        paymentRecord,
        message: 'Payment found but belongs to a different user account'
      }
    }

    return {
      isValid: true,
      hasValidPayment: true,
      paymentRecord,
      message: 'Payment verified successfully'
    }

  } catch (error) {
    console.error('Error verifying specific payment:', error)
    return {
      isValid: false,
      hasValidPayment: false,
      message: 'Error verifying payment. Please try again.'
    }
  }
}

async function reconcilePaymentById(paymentId: string): Promise<void> {
  try {
    console.log(`Attempting to reconcile payment: ${paymentId}`)
    
    // Get current payment record
    const paymentRecord = await googleSheetsService.getPaymentByPaymentId(paymentId)
    
    if (!paymentRecord) {
      console.log(`Payment record not found for reconciliation: ${paymentId}`)
      return
    }

    // If payment is already completed, no reconciliation needed
    if (paymentRecord.status === 'completed') {
      console.log(`Payment ${paymentId} is already completed`)
      return
    }

    // Check with IntaSend API for current status
    try {
      const intasendStatus = await intasendService.checkPaymentStatus(paymentId)
      
      if (intasendStatus.success && intasendStatus.status !== paymentRecord.status) {
        console.log(`Reconciliation: Payment status updated from ${paymentRecord.status} to ${intasendStatus.status}`)
        
        // Update payment status in Google Sheets
        const completedAt = intasendStatus.status === 'completed' ? new Date().toISOString() : undefined
        const failureReason = intasendStatus.status === 'failed' ? intasendStatus.data?.failed_reason : undefined
        
        await googleSheetsService.updatePaymentStatus(
          paymentId,
          intasendStatus.status as any,
          completedAt,
          failureReason,
          intasendStatus.data
        )

        // If payment completed, trigger automatic result processing
        if (intasendStatus.status === 'completed') {
          await handleCompletedPaymentVerification(paymentRecord, intasendStatus.data)
        }
      }
    } catch (error) {
      console.error(`Error checking IntaSend status during reconciliation for ${paymentId}:`, error)
    }
    
  } catch (error) {
    console.error(`Error reconciling payment ${paymentId}:`, error)
  }
}

async function handleCompletedPaymentVerification(paymentRecord: any, intasendData: any): Promise<void> {
  try {
    const { examNumber, email, userId } = paymentRecord
    
    console.log(`Processing completed payment verification for exam: ${examNumber}`)
    
    // Get the student result
    const studentResult = await googleSheetsService.getStudentResult(examNumber)
    
    if (!studentResult) {
      console.warn(`No student result found for exam number: ${examNumber}`)
      return
    }

    // If user is logged in (has userId), save the result to their account
    if (userId) {
      try {
        await googleSheetsService.saveUserResult(
          userId,
          examNumber,
          studentResult.name,
          paymentRecord.paymentId,
          studentResult
        )
        console.log(`Result saved to user account for userId: ${userId}`)
      } catch (error) {
        console.error('Error saving result to user account:', error)
      }
    }

    // Send email notification if email is available
    if (email) {
      try {
        const emailService = new EmailService()
        
        // Send payment receipt
        await emailService.sendPaymentReceiptEmail(
          email,
          studentResult.name,
          examNumber,
          paymentRecord.amount,
          paymentRecord.paymentId
        )

        // Send results email
        await emailService.sendResultsEmail(
          email,
          studentResult.name,
          examNumber,
          studentResult
        )
        
        console.log(`Verification emails sent to: ${email}`)
      } catch (error) {
        console.error('Error sending verification emails:', error)
      }
    }

  } catch (error) {
    console.error('Error in handleCompletedPaymentVerification:', error)
  }
}

async function reconcilePaymentsByExamNumber(examNumber: string): Promise<void> {
  try {
    console.log(`Attempting to reconcile payments for exam: ${examNumber}`)
    
    // Get all payments for this exam number
    const payments = await googleSheetsService.getPaymentsByExamNumber(examNumber)
    
    if (payments.length === 0) {
      console.log(`No payment records found for exam: ${examNumber}`)
      return
    }

    // Reconcile each pending payment
    for (const payment of payments) {
      if (payment.status === 'pending') {
        await reconcilePaymentById(payment.paymentId)
      }
    }
    
    console.log(`Payment reconciliation completed for exam: ${examNumber}`)
    
  } catch (error) {
    console.error(`Error reconciling payments for exam ${examNumber}:`, error)
  }
}

function getPaymentStatusMessage(status: string, failureReason?: string): string {
  switch (status) {
    case 'pending':
      return 'Payment is still being processed. Please wait a few minutes and try again.'
    case 'failed':
      return failureReason || 'Payment was not successful. Please make a new payment to access results.'
    case 'cancelled':
      return 'Payment was cancelled. Please make a new payment to access results.'
    default:
      return 'Payment status unknown. Please contact support.'
  }
} 