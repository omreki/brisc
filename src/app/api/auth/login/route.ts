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
      process.env.JWT_SECRET || 'your-secret-key',
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

    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    )
  }
} 