import { NextRequest, NextResponse } from 'next/server'
import { intasendService } from '@/services/intasendService'
import { getWebhookPaymentStatus } from '../webhooks/intasend/route'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, transactionId } = body

    if (!paymentId && !transactionId) {
      return NextResponse.json({
        success: false,
        message: 'Payment ID or Transaction ID is required'
      }, { status: 400 })
    }

    // First, check if we have webhook data for this payment
    const webhookStatus = getWebhookPaymentStatus(paymentId)
    
    if (webhookStatus) {
      console.log(`Using webhook data for payment ${paymentId}:`, webhookStatus.status)
      
      return NextResponse.json({
        success: true,
        status: webhookStatus.status,
        data: webhookStatus.data,
        source: 'webhook',
        timestamp: webhookStatus.timestamp
      })
    }

    // If no webhook data, fall back to API call
    console.log(`No webhook data found for payment ${paymentId}, checking via API`)
    
    const statusResult = await intasendService.checkPaymentStatus(paymentId)
    
    if (statusResult.success) {
      return NextResponse.json({
        success: true,
        status: statusResult.status,
        data: statusResult.data,
        source: 'api'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: statusResult.message || 'Failed to check payment status',
        status: statusResult.status || 'unknown'
      })
    }
    
  } catch (error) {
    console.error('Error in payment status check:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      status: 'error'
    }, { status: 500 })
  }
}

function mapIntasendStatus(intasendStatus: string): string {
  switch (intasendStatus?.toLowerCase()) {
    case 'complete':
    case 'completed':
    case 'success':
    case 'successful':
      return 'completed'
    case 'failed':
    case 'cancelled':
    case 'error':
      return 'failed'
    case 'pending':
    case 'processing':
    case 'initiated':
      return 'pending'
    default:
      return 'unknown'
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Payment status checking API endpoint',
    method: 'POST',
    body: {
      paymentId: 'string (required if transactionId not provided)',
      transactionId: 'string (required if paymentId not provided)',
    },
  })
} 