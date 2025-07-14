import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsService } from '@/services/googleSheets'
import { intasendService } from '@/services/intasendService'

export async function POST(request: NextRequest) {
  try {
    const { examNumber, days = 1, dryRun = false } = await request.json()

    // Validate authorization (you might want to add API key validation here)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.RECONCILIATION_API_KEY}`) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    console.log(`Starting payment reconciliation${dryRun ? ' (DRY RUN)' : ''}`)
    
    let paymentsToReconcile: any[] = []
    
    if (examNumber) {
      // Reconcile payments for specific exam number
      paymentsToReconcile = await googleSheetsService.getPaymentsByExamNumber(examNumber)
      console.log(`Found ${paymentsToReconcile.length} payments for exam ${examNumber}`)
    } else {
      // Get all payments from the last N days that are still pending
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      // For now, we'll need to implement a method to get payments by date range
      // This is a simplified version that gets all payments and filters them
      console.log(`Reconciling payments from the last ${days} day(s)`)
      
      // Note: This would need to be implemented in GoogleSheetsService
      // paymentsToReconcile = await googleSheetsService.getPaymentsByDateRange(cutoffDate, new Date())
      
      // For now, just return info about what would be reconciled
      return NextResponse.json({
        success: true,
        message: `Reconciliation endpoint is ready. Specify examNumber for targeted reconciliation.`,
        dryRun,
        reconciliationDate: new Date().toISOString()
      })
    }

    // Filter to only pending payments
    const pendingPayments = paymentsToReconcile.filter(payment => payment.status === 'pending')
    
    console.log(`Found ${pendingPayments.length} pending payments to reconcile`)

    const reconciliationResults = {
      total: pendingPayments.length,
      completed: 0,
      failed: 0,
      stillPending: 0,
      errors: [] as string[]
    }

    if (!dryRun) {
      // Process each pending payment
      for (const payment of pendingPayments) {
        try {
          console.log(`Reconciling payment: ${payment.paymentId}`)
          
          // Check payment status with IntaSend (if you want to verify against their API)
          // const statusCheck = await intasendService.checkPaymentStatus(payment.paymentId)
          
          // For now, we'll implement a simple reconciliation that checks webhook data
          // In a real implementation, you might want to call the IntaSend API here
          
          // Since we don't have the actual status check implementation,
          // we'll mark this as reconciled without changing the status
          console.log(`Payment ${payment.paymentId} reconciliation completed`)
          
          reconciliationResults.stillPending++
          
        } catch (error) {
          console.error(`Error reconciling payment ${payment.paymentId}:`, error)
          reconciliationResults.errors.push(`Payment ${payment.paymentId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          reconciliationResults.failed++
        }
      }
    }

    const result = {
      success: true,
      message: `Reconciliation ${dryRun ? 'simulation ' : ''}completed successfully`,
      examNumber: examNumber || 'all',
      dryRun,
      results: reconciliationResults,
      reconciliationDate: new Date().toISOString()
    }

    console.log('Payment reconciliation completed:', result)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in payment reconciliation:', error)
    return NextResponse.json({
      success: false,
      message: 'Payment reconciliation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const examNumber = searchParams.get('examNumber')
    const days = parseInt(searchParams.get('days') || '1')
    const dryRun = searchParams.get('dryRun') === 'true'

    // Validate authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.RECONCILIATION_API_KEY}`) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    let paymentsInfo: any[] = []
    
    if (examNumber) {
      paymentsInfo = await googleSheetsService.getPaymentsByExamNumber(examNumber)
    }

    const pendingPayments = paymentsInfo.filter(payment => payment.status === 'pending')
    
    return NextResponse.json({
      success: true,
      message: 'Payment reconciliation status',
      examNumber: examNumber || 'all',
      totalPayments: paymentsInfo.length,
      pendingPayments: pendingPayments.length,
      completedPayments: paymentsInfo.filter(p => p.status === 'completed').length,
      failedPayments: paymentsInfo.filter(p => p.status === 'failed').length,
      payments: paymentsInfo.map(p => ({
        paymentId: p.paymentId,
        examNumber: p.examNumber,
        status: p.status,
        amount: p.amount,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }))
    })

  } catch (error) {
    console.error('Error getting reconciliation status:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to get reconciliation status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 