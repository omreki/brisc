import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsService } from '@/services/googleSheets'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    // Validate required fields
    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Validate token
    const tokenValidation = await googleSheetsService.validatePasswordResetToken(token)
    
    if (!tokenValidation.isValid || !tokenValidation.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Update user password
    const passwordUpdated = await googleSheetsService.updateUserPassword(
      tokenValidation.userId,
      password
    )

    if (!passwordUpdated) {
      return NextResponse.json(
        { success: false, message: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Mark token as used
    await googleSheetsService.markTokenAsUsed(token)

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    })

  } catch (error: any) {
    console.error('Error in reset password API:', error)
    
    return NextResponse.json(
      { success: false, message: 'An error occurred while resetting your password' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Extract token from URL parameters for validation
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      )
    }

    // Validate token
    const tokenValidation = await googleSheetsService.validatePasswordResetToken(token)
    
    return NextResponse.json({
      success: true,
      isValid: tokenValidation.isValid,
      message: tokenValidation.isValid 
        ? 'Token is valid' 
        : 'Invalid or expired token',
    })

  } catch (error: any) {
    console.error('Error validating reset token:', error)
    
    return NextResponse.json(
      { success: false, message: 'An error occurred while validating the token' },
      { status: 500 }
    )
  }
} 