/**
 * Custom Login API Route
 * Works alongside NextAuth.js for credential authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { signIn, getServerSession } from 'next-auth/react'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { rateLimiter, checkLoginRateLimit } from '@/lib/auth/rate-limiter'

export async function POST(request: NextRequest) {
  let rateLimitResult
  let headers = {}
  
  try {
    const { email, password, remember } = await request.json()

    // Check rate limiting with email/IP combination
    rateLimitResult = await checkLoginRateLimit(request, email)
    
    // Create response headers with rate limiting info
    headers = rateLimiter.createRateLimitHeaders(rateLimitResult)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    if (!email || !password) {
      // Record failed attempt for invalid input
      await rateLimiter.recordAttempt(
        rateLimiter.getIdentifierFromRequest(request, 'combined', email), 
        'login', 
        false
      )
      
      return NextResponse.json(
        { error: 'Email and password are required' },
        { 
          status: 400,
          headers
        }
      )
    }

    // Check if user exists and is active
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user.length) {
      // Record failed attempt for non-existent user
      await rateLimiter.recordAttempt(
        rateLimiter.getIdentifierFromRequest(request, 'combined', email), 
        'login', 
        false
      )
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { 
          status: 401,
          headers
        }
      )
    }

    const dbUser = user[0]
    
    if (dbUser.status !== 'active') {
      // Record failed attempt for inactive account
      await rateLimiter.recordAttempt(
        rateLimiter.getIdentifierFromRequest(request, 'combined', email), 
        'login', 
        false
      )
      
      return NextResponse.json(
        { error: 'Account is not active' },
        { 
          status: 401,
          headers
        }
      )
    }

    // For demo purposes, accept common passwords
    const demoPasswords = ['password', 'demo', '123456']
    const isValidDemo = demoPasswords.includes(password.toLowerCase())
    
    if (!isValidDemo) {
      // Record failed attempt for wrong password
      await rateLimiter.recordAttempt(
        rateLimiter.getIdentifierFromRequest(request, 'combined', email), 
        'login', 
        false
      )
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { 
          status: 401,
          headers
        }
      )
    }

    // Record successful attempt
    await rateLimiter.recordAttempt(
      rateLimiter.getIdentifierFromRequest(request, 'combined', email), 
      'login', 
      true
    )

    // Update last login time
    await db
      .update(users)
      .set({ 
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, dbUser.id))

    // Return user data for client-side session management
    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
      },
      message: 'Login successful'
    }, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Login API error:', error)
    
    // Record failed attempt for system errors
    if (rateLimitResult) {
      try {
        await rateLimiter.recordAttempt(
          rateLimiter.getIdentifierFromRequest(request, 'ip'), 
          'login', 
          false
        )
      } catch (recordError) {
        console.error('Failed to record rate limit attempt:', recordError)
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers
      }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting to GET requests too
    const rateLimitResult = await rateLimiter.checkRateLimit(
      rateLimiter.getIdentifierFromRequest(request, 'ip'),
      'api'
    )
    
    const headers = rateLimiter.createRateLimitHeaders(rateLimitResult)
    
    return NextResponse.json(
      { error: 'Method not allowed' },
      { 
        status: 405,
        headers
      }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  }
}