import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsService } from '@/services/googleSheets'
import { intasendService } from '@/services/intasendService'
import { EmailService } from '@/services/emailService'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { paymentId, examNumber } = await request.json()

    if (!paymentId && !examNumber) {
      return NextResponse.json({
        success: false,
        message: 'Either paymentId or examNumber is required'
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
      console.log('No valid token provided for manual verification')
    }

    let paymentRecord = null

    // Get payment record
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
        message: 'Payment record not found'
      }, { status: 404 })
    }

    console.log(`Manual verification requested for payment: ${paymentRecord.paymentId}`)

    // Force check with IntaSend
    try {
      const intasendStatus = await intasendService.checkPaymentStatus(paymentRecord.paymentId)
      
      if (!intasendStatus.success) {
        return NextResponse.json({
          success: false,
          message: 'Unable to verify payment with provider',
          currentStatus: paymentRecord.status
        })
      }

      console.log(`IntaSend verification result: ${intasendStatus.status} (was: ${paymentRecord.status})`)

      // If status changed, update it
      if (intasendStatus.status !== paymentRecord.status) {
        const completedAt = intasendStatus.status === 'completed' ? new Date().toISOString() : undefined
        const failureReason = intasendStatus.status === 'failed' ? intasendStatus.data?.failed_reason : undefined
        
        const updatedPayment = await googleSheetsService.updatePaymentStatus(
          paymentRecord.paymentId,
          intasendStatus.status as any,
          completedAt,
          failureReason,
          intasendStatus.data
        )

        if (updatedPayment) {
          paymentRecord = updatedPayment
        }

        // If payment completed, handle automatic result delivery
        if (intasendStatus.status === 'completed') {
          console.log(`Payment completed via manual verification: ${paymentRecord.paymentId}`)
          await handleCompletedPayment(paymentRecord)
        }
      }

      return NextResponse.json({
        success: true,
        status: intasendStatus.status,
        verified: intasendStatus.status === 'completed',
        message: getVerificationMessage(intasendStatus.status, paymentRecord.failureReason),
        paymentRecord: {
          id: paymentRecord.id,
          paymentId: paymentRecord.paymentId,
          examNumber: paymentRecord.examNumber,
          amount: paymentRecord.amount,
          currency: paymentRecord.currency,
          status: intasendStatus.status,
          paymentMethod: paymentRecord.paymentMethod,
          createdAt: paymentRecord.createdAt,
          updatedAt: paymentRecord.updatedAt,
          completedAt: paymentRecord.completedAt,
          failureReason: paymentRecord.failureReason
        }
      })

    } catch (error) {
      console.error('Error during manual verification:', error)
      return NextResponse.json({
        success: false,
        message: 'Verification failed due to technical error',
        currentStatus: paymentRecord.status
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in manual-verify-payment API:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error during manual verification'
    }, { status: 500 })
  }
}

async function handleCompletedPayment(paymentRecord: any): Promise<void> {
  try {
    const { examNumber, email, userId } = paymentRecord
    
    console.log(`Processing completed payment for exam: ${examNumber}`)
    
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
        
        console.log(`Manual verification emails sent to: ${email}`)
      } catch (error) {
        console.error('Error sending manual verification emails:', error)
      }
    }

  } catch (error) {
    console.error('Error in handleCompletedPayment:', error)
  }
}

function getVerificationMessage(status: string, failureReason?: string): string {
  switch (status) {
    case 'completed':
      return 'Payment successfully verified and completed!'
    case 'pending':
      return 'Payment is still being processed by the provider'
    case 'failed':
      return failureReason || 'Payment verification failed'
    case 'cancelled':
      return 'Payment was cancelled'
    default:
      return `Payment status: ${status}`
  }
} 