import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsService } from '@/services/googleSheets'
import { emailService } from '@/services/emailService'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Always return success for security reasons (don't reveal if email exists)
    // But only send email if user actually exists
    let emailSent = false

    try {
      // Check if user exists
      const user = await googleSheetsService.getUserByEmail(email)
      
      if (user) {
        // Generate password reset token
        const resetToken = await googleSheetsService.generatePasswordResetToken(user.id)
        
        if (resetToken) {
          // Send password reset email
          const emailResult = await emailService.sendPasswordResetEmail(
            email,
            `${user.firstName} ${user.lastName}`,
            resetToken
          )
          
          if (emailResult.success) {
            emailSent = true
            console.log(`Password reset email sent to ${email}`)
          } else {
            console.error(`Failed to send password reset email to ${email}:`, emailResult.message)
          }
        } else {
          console.error(`Failed to generate reset token for user ${user.id}`)
        }
      } else {
        console.log(`Password reset requested for non-existent email: ${email}`)
      }
    } catch (error) {
      console.error('Error in forgot password process:', error)
      // Don't return error to user for security reasons
    }

    // Always return success response for security
    return NextResponse.json({
      success: true,
      message: 'If your email is registered with us, you will receive a password reset link shortly.',
    })

  } catch (error: any) {
    console.error('Error in forgot password API:', error)
    
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Forgot password API endpoint',
    method: 'POST',
    body: {
      email: 'string (required)',
    },
  })
} 