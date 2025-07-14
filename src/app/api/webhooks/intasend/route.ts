import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

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
    
    // Here you could also:
    // 1. Update database with payment status
    // 2. Send notifications to users
    // 3. Trigger business logic based on payment status
    
    if (status === 'completed') {
      console.log(`Payment completed for api_ref: ${payload.api_ref}`)
      // Additional success handling could go here
    } else if (status === 'failed') {
      console.log(`Payment failed for api_ref: ${payload.api_ref}, reason: ${payload.failed_reason}`)
      // Additional failure handling could go here
    }
    
    // Respond with 200 to acknowledge receipt
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
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
    'PROCESSING': 'processing',
    'COMPLETE': 'completed',
    'COMPLETED': 'completed',
    'FAILED': 'failed',
    'CANCELLED': 'failed',
    'TIMEOUT': 'failed',
  }
  
  return statusMap[state?.toUpperCase()] || 'unknown'
}

// Export function to get payment status from webhook data
export function getWebhookPaymentStatus(invoiceId: string) {
  return paymentStatuses.get(invoiceId)
}

// Clean up old payment statuses (optional, for memory management)
export function cleanupOldStatuses() {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  
  Array.from(paymentStatuses.entries()).forEach(([invoiceId, statusData]) => {
    if (statusData.timestamp < oneHourAgo) {
      paymentStatuses.delete(invoiceId)
    }
  })
} 