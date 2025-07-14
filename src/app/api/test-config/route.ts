import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const config = {
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasGoogleSheetsId: !!process.env.GOOGLE_SHEETS_SHEET_ID,
      hasGoogleSheetsClientEmail: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      hasGoogleSheetsPrivateKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      hasIntasendApiKey: !!process.env.INTASEND_API_KEY,
      hasIntasendPublishableKey: !!process.env.INTASEND_PUBLISHABLE_KEY,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
    }

    return NextResponse.json({
      success: true,
      message: 'Environment configuration check',
      config,
    })
  } catch (error: any) {
    console.error('Config check error:', error)
    return NextResponse.json(
      { success: false, message: 'Config check failed', error: error.message },
      { status: 500 }
    )
  }
} 