import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Mock users for development
const mockUsers = [
  {
    id: '1',
    email: 'admin@nestfest.com',
    name: 'NEST FEST Admin',
    role: 'admin',
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'judge@nestfest.com',
    name: 'Sample Judge',
    role: 'judge',
    university: 'Stanford University',
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    email: 'student@university.edu',
    name: 'Sample Student',
    role: 'student',
    university: 'MIT',
    verified: true,
    createdAt: new Date().toISOString()
  }
]

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('nest-fest-session')

    if (!sessionCookie) {
      return NextResponse.json({ user: null })
    }

    // Parse session token
    let sessionData
    try {
      sessionData = JSON.parse(atob(sessionCookie.value))
    } catch {
      // Invalid session cookie
      return NextResponse.json({ user: null })
    }

    // Check if session is expired (24 hours)
    const sessionAge = Date.now() - sessionData.createdAt
    if (sessionAge > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ user: null })
    }

    // Find user
    const user = mockUsers.find(u => u.id === sessionData.userId)

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        university: user.university,
        verified: user.verified
      }
    })
  } catch (error) {
    console.error('Error getting current user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}