import { NextRequest, NextResponse } from 'next/server'
import { googleSheetsService } from '@/services/googleSheets'
import { UserRegistration } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
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
    }: UserRegistration = await request.json()

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !examNumber || !title || 
        !gender || !country || !phoneNumber || !seniorDeputyArchBishop || 
        !region || !alter || !department) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
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

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Validate title selection
    const validTitles = ['Mr', 'Mrs', 'Ms', 'Dr', 'Rev', 'Pastor', 'Bishop', 'Archbishop']
    if (!validTitles.includes(title)) {
      return NextResponse.json(
        { success: false, message: 'Invalid title selection' },
        { status: 400 }
      )
    }

    // Validate gender selection
    const validGenders = ['Male', 'Female']
    if (!validGenders.includes(gender)) {
      return NextResponse.json(
        { success: false, message: 'Invalid gender selection' },
        { status: 400 }
      )
    }

    // Create user with all fields
    const user = await googleSheetsService.createUser(
      email,
      password,
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
      department
    )

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user,
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    
    if (error.message === 'User already exists') {
      return NextResponse.json(
        { success: false, message: 'User already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Registration failed' },
      { status: 500 }
    )
  }
} 