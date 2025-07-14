import { NextRequest, NextResponse } from 'next/server'
import { intasendService } from '@/services/intasendService'
import { googleSheetsService } from '@/services/googleSheets'
import { PaymentData, PaymentResponse } from '@/types/student'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const paymentData: PaymentData = await request.json()

    // Get user ID from token if available (for logged-in users)
    let userId: string | undefined
    try {
      const token = request.cookies.get('auth-token')?.value
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
        userId = decoded.userId
        console.log('Payment initiated by authenticated user:', userId)
      }
    } catch (error) {
      // Token is optional - anonymous users can still make payments
      console.log('No valid token provided for payment processing')
    }

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

    // Record the initial payment in Google Sheets with enhanced information
    try {
      const paymentRecord = {
        userId: userId, // Include user ID for automatic result delivery
        examNumber: paymentData.examNumber,
        paymentId: paymentResult.paymentId!,
        transactionId: paymentResult.transactionId,
        apiRef: paymentResult.apiRef,
        amount: paymentData.amount,
        currency: paymentData.currency,
        phoneNumber: paymentData.phoneNumber,
        email: paymentData.email, // Include email for automatic notifications
        status: 'pending' as const,
        paymentMethod: 'M-Pesa'
      }

      const recordedPayment = await googleSheetsService.recordPayment(paymentRecord)
      console.log('Enhanced payment record created in Google Sheets:', paymentResult.paymentId)
      console.log('Payment linked to user:', userId || 'anonymous')
      console.log('Email for notifications:', paymentData.email || 'not provided')
      
    } catch (error) {
      console.error('Error recording payment to Google Sheets:', error)
      // Don't fail the payment initiation if Google Sheets recording fails
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