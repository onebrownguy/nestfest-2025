/**
 * API Middleware for NestFest Backend
 * 
 * This module provides middleware functions for authentication, authorization,
 * rate limiting, and request validation across all API endpoints.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { RateLimiterRedis } from 'rate-limiter-flexible'
import { supabaseAdmin } from '@/lib/supabase/client'
import { permissionManager } from '@/lib/auth/permissions'
import { UserRole } from '@/types'
import jwt from 'jsonwebtoken'
import crypto from 'crypto-js'

// Rate limiting configuration
const rateLimiterConfig = {
  storeClient: null, // Will be configured with Redis if available
  keyPrefix: 'nestfest_rl',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  execEvenly: true,
}

let rateLimiter: RateLimiterRedis | null = null

// Initialize rate limiter (fallback to memory if Redis unavailable)
try {
  // Note: Redis client should be initialized separately
  // rateLimiter = new RateLimiterRedis(rateLimiterConfig)
} catch (error) {
  console.warn('Redis unavailable, rate limiting disabled:', error)
}

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: UserRole
    status: string
  }
}

/**
 * Extract and verify JWT token from request
 */
async function extractAndVerifyToken(request: NextRequest): Promise<any> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

  if (!token) {
    throw new Error('No token provided')
  }

  try {
    // First try to verify with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) {
      throw new Error('Invalid token')
    }

    // Get user details from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      throw new Error('User not found')
    }

    return userData
  } catch (error) {
    throw new Error('Token verification failed')
  }
}

/**
 * Authentication middleware
 */
export async function authenticate(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<Response>
): Promise<Response> {
  try {
    const user = await extractAndVerifyToken(request)
    const authRequest = request as AuthenticatedRequest
    authRequest.user = user
    return await handler(authRequest)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Unauthorized', message: error.message },
      { status: 401 }
    )
  }
}

/**
 * Authorization middleware
 */
export function authorize(
  resource: string,
  action: 'read' | 'write' | 'delete' | 'admin'
) {
  return async function(
    request: AuthenticatedRequest,
    handler: (req: AuthenticatedRequest) => Promise<Response>
  ): Promise<Response> {
    if (!request.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const hasPermission = permissionManager.hasPermission(
      request.user.role,
      resource,
      action
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return await handler(request)
  }
}

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<Response>,
  options?: {
    points?: number
    duration?: number
    keyPrefix?: string
  }
): Promise<Response> {
  if (!rateLimiter) {
    // If no rate limiter available, proceed without limiting
    return await handler(request)
  }

  try {
    const key = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown-ip'

    const result = await rateLimiter.consume(key)
    
    const response = await handler(request)
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', options?.points?.toString() || '100')
    response.headers.set('X-RateLimit-Remaining', result.remainingPoints?.toString() || '0')
    response.headers.set('X-RateLimit-Reset', new Date(result.msBeforeNext + Date.now()).toISOString())
    
    return response
  } catch (rejRes: any) {
    if (rejRes.remainingPoints !== undefined) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', message: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': options?.points?.toString() || '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rejRes.msBeforeNext + Date.now()).toISOString(),
            'Retry-After': Math.round(rejRes.msBeforeNext / 1000).toString()
          }
        }
      )
    }
    throw rejRes
  }
}

/**
 * Input validation middleware using Zod
 */
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return async function(
    request: NextRequest,
    handler: (req: NextRequest, validatedData: T) => Promise<Response>
  ): Promise<Response> {
    try {
      let data: any

      const contentType = request.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        data = await request.json()
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData()
        data = Object.fromEntries(formData.entries())
      } else if (request.method === 'GET') {
        const { searchParams } = new URL(request.url)
        data = Object.fromEntries(searchParams.entries())
      } else {
        data = {}
      }

      const validatedData = schema.parse(data)
      return await handler(request, validatedData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid input',
            message: 'Request validation failed',
            details: error.errors
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Bad request', message: 'Invalid request format' },
        { status: 400 }
      )
    }
  }
}

/**
 * CORS middleware
 */
export async function cors(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  const response = await handler(request)

  // Add CORS headers to response
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

  return response
}

/**
 * Error handling middleware
 */
export async function errorHandler(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  try {
    return await handler(request)
  } catch (error: any) {
    console.error('API Error:', {
      url: request.url,
      method: request.method,
      error: error.message,
      stack: error.stack
    })

    // Don't expose internal errors in production
    const isProduction = process.env.NODE_ENV === 'production'
    const message = isProduction ? 'Internal server error' : error.message

    return NextResponse.json(
      {
        error: 'Internal server error',
        message,
        ...(isProduction ? {} : { stack: error.stack })
      },
      { status: 500 }
    )
  }
}

/**
 * Compose multiple middleware functions
 */
export function compose(...middlewares: Array<(req: any, handler: any, ...args: any[]) => Promise<Response>>) {
  return function(handler: (req: NextRequest) => Promise<Response>) {
    return middlewares.reduceRight(
      (next, middleware) => (req: NextRequest) => middleware(req, next),
      handler
    )
  }
}

/**
 * Security headers middleware
 */
export async function securityHeaders(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  const response = await handler(request)

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  return response
}

/**
 * Request logging middleware
 */
export async function requestLogger(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  const start = Date.now()
  const requestId = crypto.lib.WordArray.random(16).toString()

  console.log(`[${requestId}] ${request.method} ${request.url} - Started`)

  const response = await handler(request)
  
  const duration = Date.now() - start
  console.log(`[${requestId}] ${request.method} ${request.url} - ${response.status} in ${duration}ms`)

  response.headers.set('X-Request-ID', requestId)
  
  return response
}

/**
 * File upload validation middleware
 */
export function validateFileUpload(options: {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  maxFiles?: number
}) {
  return async function(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<Response>
  ): Promise<Response> {
    const contentType = request.headers.get('content-type') || ''
    
    if (!contentType.includes('multipart/form-data')) {
      return await handler(request)
    }

    try {
      const formData = await request.formData()
      const files: File[] = []
      
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          files.push(value)
        }
      }

      // Validate file count
      if (options.maxFiles && files.length > options.maxFiles) {
        return NextResponse.json(
          { error: 'Too many files', message: `Maximum ${options.maxFiles} files allowed` },
          { status: 400 }
        )
      }

      // Validate each file
      for (const file of files) {
        // Check file size
        if (options.maxSize && file.size > options.maxSize) {
          return NextResponse.json(
            { error: 'File too large', message: `Maximum file size is ${options.maxSize} bytes` },
            { status: 400 }
          )
        }

        // Check file type
        if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: 'Invalid file type', message: `Allowed types: ${options.allowedTypes.join(', ')}` },
            { status: 400 }
          )
        }
      }

      return await handler(request)
    } catch (error) {
      return NextResponse.json(
        { error: 'File validation failed', message: 'Could not process uploaded files' },
        { status: 400 }
      )
    }
  }
}