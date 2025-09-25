import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const result = await AuthService.authenticate(email, password)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    if (!result.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Create session token
    const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const sessionData = {
      token: sessionToken,
      userId: result.user.id,
      createdAt: Date.now()
    }

    const cookieValue = btoa(JSON.stringify(sessionData))

    // Set httpOnly cookie for security
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        university: result.user.university,
        verified: result.user.verified
      }
    })

    const cookieStore = await cookies()

    response.cookies.set({
      name: 'nest-fest-session',
      value: cookieValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}