import { NextRequest, NextResponse } from 'next/server'
import { intasendService } from '@/services/intasendService'
import { PaymentData, PaymentResponse } from '@/types/student'

export async function POST(request: NextRequest) {
  try {
    const paymentData: PaymentData = await request.json()

    // Validate required fields
    if (!paymentData.examNumber || !paymentData.phoneNumber || !paymentData.amount) {
      return NextResponse.json<PaymentResponse>({
        success: false,
        message: 'Missing required payment information',
      }, { status: 400 })
    }

    // Validate amount (should be 150 KES)
    if (paymentData.amount !== 150) {
      return NextResponse.json<PaymentResponse>({
        success: false,
        message: 'Invalid payment amount',
      }, { status: 400 })
    }

    // Validate phone number format
    const phoneRegex = /^(?:\+254|254|0)?[17]\d{8}$/
    if (!phoneRegex.test(paymentData.phoneNumber)) {
      return NextResponse.json<PaymentResponse>({
        success: false,
        message: 'Invalid phone number format',
      }, { status: 400 })
    }

    // Ensure currency is KES
    paymentData.currency = 'KES'

    // Initiate M-Pesa payment
    const paymentResult = await intasendService.initiateMpesaPayment(paymentData)

    if (!paymentResult.success) {
      return NextResponse.json<PaymentResponse>({
        success: false,
        message: paymentResult.message,
      }, { status: 400 })
    }

    // Return success response
    return NextResponse.json<PaymentResponse>({
      success: true,
      paymentId: paymentResult.paymentId,
      transactionId: paymentResult.transactionId,
      message: 'Payment initiated successfully. Please check your phone for M-Pesa prompt.',
    })

  } catch (error) {
    console.error('Error in process-payment API:', error)
    
    return NextResponse.json<PaymentResponse>({
      success: false,
      message: 'An error occurred while processing payment',
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Payment processing API endpoint',
    method: 'POST',
    body: {
      examNumber: 'string (required)',
      phoneNumber: 'string (required)',
      amount: 'number (required)',
      currency: 'string (optional, defaults to KES)',
      email: 'string (optional)',
    },
  })
} 