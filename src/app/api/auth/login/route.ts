import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsService } from '@/services/googleSheets'
import { UserLogin } from '@/types/auth'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, password }: UserLogin = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if JWT secret is available
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured')
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Validate user credentials
    const user = await googleSheetsService.validateUserPassword(email, password)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user,
      token,
    })

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    console.error('Error stack:', error.stack)

    // Return more specific error messages for debugging
    let errorMessage = 'Login failed'
    if (error.message?.includes('Google Sheets')) {
      errorMessage = 'Database connection error'
    } else if (error.message?.includes('JWT')) {
      errorMessage = 'Authentication service error'
    }

    return NextResponse.json(
      { success: false, message: errorMessage, error: error.message },
      { status: 500 }
    )
  }
} 