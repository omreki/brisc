import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/services/emailService'

export async function POST(request: NextRequest) {
  try {
    const { email, type = 'test' } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Test email connection first
    const connectionTest = await emailService.testConnection()
    if (!connectionTest.success) {
      return NextResponse.json(
        { 
          error: 'Email service connection failed', 
          details: connectionTest.message 
        },
        { status: 500 }
      )
    }

    let result
    
    if (type === 'test') {
      // Send test email
      result = await emailService.sendTestEmail(email)
    } else if (type === 'password-reset') {
      // Send a test password reset email
      result = await emailService.sendPasswordResetEmail(
        email,
        'Test User',
        'test-token-123456'
      )
    } else {
      return NextResponse.json(
        { error: 'Invalid email type. Use "test" or "password-reset"' },
        { status: 400 }
      )
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        fromEmail: 'topnotchlimted21@gmail.com',
        toEmail: email,
        type: type
      })
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to send email', 
          details: result.message 
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Test email connection
    const connectionTest = await emailService.testConnection()
    
    return NextResponse.json({
      emailService: connectionTest.success ? 'Connected' : 'Failed',
      details: connectionTest.message,
      fromEmail: 'topnotchlimted21@gmail.com',
      smtpUser: process.env.SMTP_USER || 'topnotchlimted21@gmail.com'
    })
  } catch (error: any) {
    console.error('Email service test error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    )
  }
} 