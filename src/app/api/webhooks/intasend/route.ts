import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { googleSheetsService } from '@/services/googleSheets'
import { EmailService } from '@/services/emailService'

interface IntaSendWebhookPayload {
  invoice_id: string
  state: string
  api_ref: string
  value: number
  currency: string
  account: string
  created_at: string
  updated_at: string
  charges: number
  net_amount: number
  failed_reason?: string
  failed_code?: string
}

// In-memory storage for payment statuses (in production, use a database)
const paymentStatuses = new Map<string, {
  status: string
  timestamp: Date
  data: any
}>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const payload: IntaSendWebhookPayload = JSON.parse(body)
    
    console.log('Webhook received:', payload)
    
    // Verify webhook authenticity (optional but recommended)
    const signature = request.headers.get('x-intasend-signature')
    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    // Process the webhook payload
    const status = mapIntaSendStatus(payload.state)
    
    // Store payment status for polling endpoints to access
    paymentStatuses.set(payload.invoice_id, {
      status,
      timestamp: new Date(),
      data: payload
    })
    
    // Log the payment status update
    console.log(`Payment ${payload.invoice_id} status updated to: ${status}`)
    
    // Record/Update payment in Google Sheets
    try {
      const paymentRecord = await recordPaymentToSheets(payload, status)
      
      // If payment is completed, trigger automatic result delivery
      if (status === 'completed' && paymentRecord) {
        console.log(`Payment completed for ${payload.invoice_id}, triggering automatic result delivery`)
        await handleCompletedPayment(paymentRecord, payload)
      }
    } catch (error) {
      console.error('Error recording payment to Google Sheets:', error)
      // Don't fail the webhook response, just log the error
    }
    
    if (status === 'completed') {
      console.log(`Payment completed for api_ref: ${payload.api_ref}`)
    } else if (status === 'failed') {
      console.log(`Payment failed for api_ref: ${payload.api_ref}, reason: ${payload.failed_reason}`)
    }
    
    // Respond with 200 to acknowledge receipt
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCompletedPayment(paymentRecord: any, payload: IntaSendWebhookPayload) {
  try {
    const { examNumber, email, userId } = paymentRecord
    
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
          payload.value,
          payload.invoice_id
        )

        // Send results email
        await emailService.sendResultsEmail(
          email,
          studentResult.name,
          examNumber,
          studentResult
        )
        
        console.log(`Automatic emails sent to: ${email}`)
      } catch (error) {
        console.error('Error sending automatic emails:', error)
      }
    }

  } catch (error) {
    console.error('Error in handleCompletedPayment:', error)
  }
}

async function recordPaymentToSheets(payload: IntaSendWebhookPayload, status: string) {
  try {
    // Extract exam number from api_ref (format: exam_{examNumber}_{timestamp})
    const examNumber = payload.api_ref?.match(/exam_(.+?)_\d+/)?.[1] || ''
    
    if (!examNumber) {
      console.warn('Could not extract exam number from api_ref:', payload.api_ref)
      return null
    }

    // Check if payment already exists in sheets
    const existingPayment = await googleSheetsService.getPaymentByPaymentId(payload.invoice_id)
    
    if (existingPayment) {
      // Update existing payment status
      const completedAt = status === 'completed' ? new Date().toISOString() : undefined
      const failureReason = status === 'failed' ? payload.failed_reason : undefined
      
      const updatedPayment = await googleSheetsService.updatePaymentStatus(
        payload.invoice_id,
        status as any,
        completedAt,
        failureReason,
        payload
      )
      
      console.log('Updated existing payment record in Google Sheets')
      return updatedPayment
    } else {
      // Create new payment record
      const paymentRecord = {
        examNumber,
        paymentId: payload.invoice_id,
        transactionId: '', // IntaSend doesn't provide transaction ID in webhook
        apiRef: payload.api_ref,
        amount: payload.value,
        currency: payload.currency,
        phoneNumber: payload.account || '', // IntaSend puts phone number in account field for M-Pesa
        email: '', // Email not available in webhook payload
        status: status as any,
        paymentMethod: 'M-Pesa',
        completedAt: status === 'completed' ? new Date().toISOString() : undefined,
        failureReason: status === 'failed' ? payload.failed_reason : undefined,
        webhookData: payload
      }
      
      const newPayment = await googleSheetsService.recordPayment(paymentRecord)
      console.log('Created new payment record in Google Sheets')
      return newPayment
    }
    
  } catch (error) {
    console.error('Error in recordPaymentToSheets:', error)
    throw error
  }
}

function verifyWebhookSignature(body: string, signature: string): boolean {
  try {
    // IntaSend webhook signature verification
    // You would need to get the webhook secret from IntaSend dashboard
    const webhookSecret = process.env.INTASEND_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      console.warn('INTASEND_WEBHOOK_SECRET not configured, skipping verification')
      return true
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

function mapIntaSendStatus(state: string): string {
  const statusMap: { [key: string]: string } = {
    'PENDING': 'pending',
    'PROCESSING': 'pending', // Map PROCESSING to pending since our type doesn't have processing
    'COMPLETE': 'completed',
    'COMPLETED': 'completed',
    'FAILED': 'failed',
    'CANCELLED': 'cancelled',
    'TIMEOUT': 'failed',
  }
  
  return statusMap[state?.toUpperCase()] || 'pending'
} 