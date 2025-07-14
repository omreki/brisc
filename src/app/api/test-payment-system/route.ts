import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsService } from '@/services/googleSheets'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, examNumber, paymentId } = body

    switch (action) {
      case 'test-record-payment':
        // Test recording a new payment
        const testPayment = {
          examNumber: examNumber || 'TEST123',
          paymentId: paymentId || `test_payment_${Date.now()}`,
          transactionId: `test_txn_${Date.now()}`,
          apiRef: `exam_${examNumber || 'TEST123'}_${Date.now()}`,
          amount: 15,
          currency: 'KES',
          phoneNumber: '254712345678',
          email: 'test@example.com',
          status: 'pending' as const,
          paymentMethod: 'M-Pesa'
        }

        const recordedPayment = await googleSheetsService.recordPayment(testPayment)
        
        return NextResponse.json({
          success: true,
          message: 'Test payment recorded successfully',
          data: recordedPayment
        })

      case 'test-update-payment':
        // Test updating payment status
        const updatedPayment = await googleSheetsService.updatePaymentStatus(
          paymentId || 'test_payment_123',
          'completed',
          new Date().toISOString(),
          undefined,
          { test: true }
        )
        
        return NextResponse.json({
          success: !!updatedPayment,
          message: updatedPayment ? 'Payment status updated successfully' : 'Payment not found',
          data: updatedPayment
        })

      case 'test-verify-payment':
        // Test payment verification
        const verification = await googleSheetsService.verifyPaymentForExamAccess(
          examNumber || 'TEST123'
        )
        
        return NextResponse.json({
          success: true,
          message: 'Payment verification completed',
          data: verification
        })

      case 'test-get-payments':
        // Test getting payments by exam number
        const payments = await googleSheetsService.getPaymentsByExamNumber(
          examNumber || 'TEST123'
        )
        
        return NextResponse.json({
          success: true,
          message: `Found ${payments.length} payments`,
          data: payments
        })

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action. Use: test-record-payment, test-update-payment, test-verify-payment, or test-get-payments'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in payment system test:', error)
    return NextResponse.json({
      success: false,
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Test Google Sheets connection and basic functionality
    const testResult = await googleSheetsService.validateConnection()
    
    return NextResponse.json({
      success: testResult,
      message: testResult ? 'Google Sheets connection successful' : 'Google Sheets connection failed',
      timestamp: new Date().toISOString(),
      availableTests: [
        'POST with action: test-record-payment',
        'POST with action: test-update-payment',
        'POST with action: test-verify-payment', 
        'POST with action: test-get-payments'
      ]
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 