import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsService } from '@/services/googleSheets'
import jwt from 'jsonwebtoken'
import { UserRegistration } from '@/types/auth'

export async function PUT(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any

    // Get request body
    const body = await request.json()
    const {
      firstName,
      lastName,
      examNumber,
      title,
      gender,
      country,
      phoneNumber,
      seniorDeputyArchBishop,
      region,
      alter,
      department,
    } = body

    // Validate required fields
    if (!firstName || !lastName || !examNumber || !title || !gender || !country || !phoneNumber || !department) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be filled' },
        { status: 400 }
      )
    }

    // Validate email format is not being changed (email should remain same)
    if (body.email && body.email !== decoded.email) {
      return NextResponse.json(
        { success: false, message: 'Email cannot be changed' },
        { status: 400 }
      )
    }

    // Validate phone number format
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid phone number' },
        { status: 400 }
      )
    }

    // Validate title
    const validTitles = ['Mr', 'Mrs', 'Miss', 'Dr', 'Prof', 'Rev', 'Pastor', 'Bishop', 'Archbishop']
    if (!validTitles.includes(title)) {
      return NextResponse.json(
        { success: false, message: 'Please select a valid title' },
        { status: 400 }
      )
    }

    // Validate gender
    if (!['Male', 'Female'].includes(gender)) {
      return NextResponse.json(
        { success: false, message: 'Please select a valid gender' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData = {
      firstName,
      lastName,
      examNumber,
      title,
      gender,
      country,
      phoneNumber,
      seniorDeputyArchBishop: seniorDeputyArchBishop || '',
      region: region || '',
      alter: alter || '',
      department,
    }

    // Update user in Google Sheets
    const updatedUser = await googleSheetsService.updateUser(decoded.userId, updateData)

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found or update failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    })
  } catch (error: any) {
    console.error('Update user error:', error)

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update profile' },
      { status: 500 }
    )
  }
} 