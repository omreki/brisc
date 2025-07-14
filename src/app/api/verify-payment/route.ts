import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsService } from '@/services/googleSheets'
import { intasendService } from '@/services/intasendService'
import { PaymentVerificationResult } from '@/types/student'
import { EmailService } from '@/services/emailService'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { examNumber, paymentId, forceRefresh, checkPaymentsSheetOnly } = body

    if (!examNumber && !paymentId) {
      return NextResponse.json({
        success: false,
        isValid: false,
        hasValidPayment: false,
        message: 'Either exam number or payment ID is required',
        verificationSource: 'input_validation'
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

    // Handle payments sheet only verification (simple check with no fallbacks)
    if (checkPaymentsSheetOnly) {
      console.log('Checking payments sheet only for exam:', examNumber)
      
      const verificationResult = await googleSheetsService.verifyPaymentForExamAccess(examNumber!, userId)
      
      if (verificationResult.isValid) {
        // Get student result to include in response
        const studentResult = await googleSheetsService.getStudentResult(examNumber!)
        
        return NextResponse.json({
          success: true,
          isValid: true,
          hasValidPayment: true,
          message: 'Valid payment found in records',
          paymentRecord: verificationResult.paymentRecord,
          studentResult: studentResult || undefined,
          verificationSource: 'payments_sheet',
          timestamp: new Date().toISOString()
        })
      } else {
        // No valid payment found - return clear error without fallback options
        return NextResponse.json({
          success: false,
          isValid: false,
          hasValidPayment: verificationResult.hasValidPayment,
          message: verificationResult.message || 'No completed payment found for this exam number',
          paymentRecord: verificationResult.paymentRecord,
          verificationSource: 'payments_sheet',
          timestamp: new Date().toISOString()
        })
      }
    }

    let verificationResult: PaymentVerificationResult & { 
      verificationSource?: string
      providerStatus?: string
      providerVerified?: boolean 
    }

    // Always force provider verification when forceRefresh is true
    if (forceRefresh) {
      console.log('Force refresh requested - verifying directly with provider')
      
      if (paymentId) {
        verificationResult = await verifyWithProviderByPaymentId(paymentId, userId)
      } else {
        verificationResult = await verifyWithProviderByExamNumber(examNumber, userId)
      }
    } else {
      // Standard verification (database first, then provider if needed)
      if (paymentId) {
        verificationResult = await verifySpecificPayment(paymentId, userId)
      } else {
        verificationResult = await googleSheetsService.verifyPaymentForExamAccess(examNumber!, userId)
      }

      // If verification failed, attempt reconciliation with provider
      if (!verificationResult.isValid) {
        console.log('Database verification failed, checking with provider...')
        
        if (paymentId) {
          await reconcilePaymentById(paymentId)
          verificationResult = await verifySpecificPayment(paymentId, userId)
        } else if (examNumber) {
          await reconcilePaymentsByExamNumber(examNumber)
          verificationResult = await googleSheetsService.verifyPaymentForExamAccess(examNumber, userId)
        }
      }
    }

    // Enhanced response with clear verification details
    return NextResponse.json({
      success: verificationResult.isValid,
      isValid: verificationResult.isValid,
      hasValidPayment: verificationResult.hasValidPayment,
      message: verificationResult.message || (verificationResult.isValid 
        ? 'Payment verified successfully with provider' 
        : 'No valid payment found with provider'),
      paymentRecord: verificationResult.paymentRecord,
      studentResult: verificationResult.studentResult,
      verificationSource: verificationResult.verificationSource || 'database',
      providerStatus: verificationResult.providerStatus,
      providerVerified: verificationResult.providerVerified,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in verify-payment API:', error)
    return NextResponse.json({
      success: false,
      isValid: false,
      hasValidPayment: false,
      message: 'Internal server error during payment verification',
      verificationSource: 'error',
      timestamp: new Date().toISOString()
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

// New function to verify directly with provider by payment ID
async function verifyWithProviderByPaymentId(paymentId: string, userId?: string): Promise<PaymentVerificationResult & { 
  verificationSource?: string
  providerStatus?: string
  providerVerified?: boolean 
}> {
  try {
    console.log(`Verifying payment ${paymentId} directly with IntaSend provider`)
    
    // Check with IntaSend API directly
    const providerResult = await intasendService.checkPaymentStatus(paymentId)
    
    if (!providerResult.success) {
      return {
        isValid: false,
        hasValidPayment: false,
        message: `Provider verification failed: ${providerResult.message}`,
        verificationSource: 'provider_error',
        providerStatus: 'unknown',
        providerVerified: false
      }
    }

    const isCompleted = providerResult.status === 'completed'
    
    // Update our database with the latest status from provider
    if (providerResult.data) {
      const paymentRecord = await googleSheetsService.getPaymentByPaymentId(paymentId)
      if (paymentRecord && paymentRecord.status !== providerResult.status) {
        await googleSheetsService.updatePaymentStatus(
          paymentId,
          providerResult.status as any,
          isCompleted ? new Date().toISOString() : undefined,
          providerResult.status === 'failed' ? providerResult.data?.failed_reason : undefined,
          providerResult.data
        )
      }
    }

    if (isCompleted) {
      // Get payment record and exam info
      const paymentRecord = await googleSheetsService.getPaymentByPaymentId(paymentId)
      if (!paymentRecord) {
        return {
          isValid: false,
          hasValidPayment: false,
          message: 'Payment completed with provider but not found in database',
          verificationSource: 'provider_success_db_missing',
          providerStatus: providerResult.status,
          providerVerified: true
        }
      }

              // Get student result
        const studentResult = await googleSheetsService.getStudentResult(paymentRecord.examNumber)
        
        return {
          isValid: true,
          hasValidPayment: true,
          message: 'Payment verified successfully with IntaSend provider',
          paymentRecord,
          studentResult: studentResult || undefined,
          verificationSource: 'provider_direct',
          providerStatus: providerResult.status,
          providerVerified: true
        }
    } else {
      return {
        isValid: false,
        hasValidPayment: false,
        message: `Payment status with provider: ${providerResult.status}`,
        verificationSource: 'provider_direct',
        providerStatus: providerResult.status,
        providerVerified: true
      }
    }

  } catch (error) {
    console.error(`Error verifying payment ${paymentId} with provider:`, error)
    return {
      isValid: false,
      hasValidPayment: false,
      message: 'Error communicating with payment provider',
      verificationSource: 'provider_error',
      providerStatus: 'error',
      providerVerified: false
    }
  }
}

// New function to verify directly with provider by exam number
async function verifyWithProviderByExamNumber(examNumber: string, userId?: string): Promise<PaymentVerificationResult & { 
  verificationSource?: string
  providerStatus?: string
  providerVerified?: boolean 
}> {
  try {
    console.log(`Verifying payments for exam ${examNumber} directly with IntaSend provider`)
    
    // Get all payments for this exam number
    const payments = await googleSheetsService.getPaymentsByExamNumber(examNumber)
    
    if (payments.length === 0) {
      return {
        isValid: false,
        hasValidPayment: false,
        message: 'No payment records found for this exam number',
        verificationSource: 'no_payments',
        providerStatus: 'no_records',
        providerVerified: true
      }
    }

    // Check each payment with provider
    for (const payment of payments) {
      const providerResult = await intasendService.checkPaymentStatus(payment.paymentId)
      
      if (providerResult.success && providerResult.status === 'completed') {
        // Update status in database if different
        if (payment.status !== 'completed') {
          await googleSheetsService.updatePaymentStatus(
            payment.paymentId,
            'completed',
            new Date().toISOString(),
            undefined,
            providerResult.data
          )
        }

        // Get student result
        const studentResult = await googleSheetsService.getStudentResult(examNumber)
        
        return {
          isValid: true,
          hasValidPayment: true,
          message: 'Payment verified successfully with IntaSend provider',
          paymentRecord: { ...payment, status: 'completed' },
          studentResult: studentResult || undefined,
          verificationSource: 'provider_direct',
          providerStatus: providerResult.status,
          providerVerified: true
        }
      } else if (providerResult.success) {
        // Update status if different
        if (payment.status !== providerResult.status) {
          await googleSheetsService.updatePaymentStatus(
            payment.paymentId,
            providerResult.status as any,
            undefined,
            providerResult.status === 'failed' ? providerResult.data?.failed_reason : undefined,
            providerResult.data
          )
        }
      }
    }

    return {
      isValid: false,
      hasValidPayment: false,
      message: 'No completed payments found with provider for this exam number',
      verificationSource: 'provider_direct',
      providerStatus: 'none_completed',
      providerVerified: true
    }

  } catch (error) {
    console.error(`Error verifying payments for exam ${examNumber} with provider:`, error)
    return {
      isValid: false,
      hasValidPayment: false,
      message: 'Error communicating with payment provider',
      verificationSource: 'provider_error',
      providerStatus: 'error',
      providerVerified: false
    }
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
        message: getPaymentStatusMessage(paymentRecord.status, paymentRecord.failureReason),
        paymentRecord
      }
    }

    // Get the student result
    const studentResult = await googleSheetsService.getStudentResult(paymentRecord.examNumber)
    
    if (!studentResult) {
      return {
        isValid: false,
        hasValidPayment: true,
        message: 'Payment completed but exam results not found',
        paymentRecord
      }
    }

    return {
      isValid: true,
      hasValidPayment: true,
      message: 'Payment verified successfully',
      paymentRecord,
      studentResult
    }

  } catch (error) {
    console.error(`Error verifying specific payment ${paymentId}:`, error)
    return {
      isValid: false,
      hasValidPayment: false,
      message: 'Error during payment verification'
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