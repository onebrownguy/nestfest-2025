/**
 * Admin User Invitation API Endpoint
 * Allows admins to invite new users with specific roles
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { rateLimiter } from '@/lib/auth/rate-limiter'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    // Rate limiting for admin actions
    const rateLimitResult = await rateLimiter.checkRateLimit(
      `admin_invite_${session.user.id}`,
      'api',
      { maxAttempts: 10, windowMs: 60 * 60 * 1000 } // 10 invites per hour
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait before sending more invitations.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: rateLimiter.createRateLimitHeaders(rateLimitResult)
        }
      )
    }

    const body = await request.json()
    const { email, role, firstName, lastName, university } = body

    // Validate required fields
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const allowedRoles = ['student', 'judge', 'reviewer', 'admin']
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')

    // Create new user with pending status
    const newUser = await db.insert(users).values({
      email,
      role,
      status: 'pending',
      firstName: firstName || '',
      lastName: lastName || '',
      name: firstName && lastName ? `${firstName} ${lastName}` : email.split('@')[0],
      university: university || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    // Record successful invitation
    await rateLimiter.recordAttempt(
      `admin_invite_${session.user.id}`,
      'api',
      true,
      {
        invitedEmail: email,
        invitedRole: role,
        invitedBy: session.user.email
      }
    )

    // TODO: Send invitation email
    // await sendInvitationEmail(email, invitationToken, role)

    return NextResponse.json({
      success: true,
      message: 'User invitation sent successfully',
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        role: newUser[0].role,
        status: newUser[0].status,
        name: newUser[0].name
      }
    }, {
      status: 201,
      headers: rateLimiter.createRateLimitHeaders(rateLimitResult)
    })

  } catch (error) {
    console.error('User invitation error:', error)
    
    return NextResponse.json(
      { error: 'Failed to send user invitation' },
      { status: 500 }
    )
  }
}

// Get pending invitations
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    // Get all pending users (invitations)
    const pendingUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        university: users.university
      })
      .from(users)
      .where(eq(users.status, 'pending'))
      .orderBy(users.createdAt)

    return NextResponse.json({
      success: true,
      data: pendingUsers
    })

  } catch (error) {
    console.error('Get invitations error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch pending invitations' },
      { status: 500 }
    )
  }
}