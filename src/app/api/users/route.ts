/**
 * User Management API Endpoints
 * 
 * GET /api/users - List users with filtering and pagination (admin only)
 * POST /api/users - Create new user (admin only)
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ApiResponseBuilder, extractPaginationParams, extractFilterParams, extractSortParams, getClientIP, logAuditEvent, generateRandomPassword } from '@/lib/api/utils'
import { authenticate, authorize, rateLimit, cors, errorHandler, securityHeaders, validateInput } from '@/lib/api/middleware'
import { UserSchemas } from '@/lib/api/validation'
import { QueryHelpers } from '@/lib/api/utils'
import type { AuthenticatedRequest } from '@/lib/api/middleware'

/**
 * GET /api/users
 * List users with filtering and pagination (admin only)
 */
export async function GET(request: NextRequest) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            return authorize('users', 'read')(authReq, async (authReq: AuthenticatedRequest) => {
              try {
                const user = authReq.user!
                const { page, perPage, offset } = extractPaginationParams(authReq.url)
                const { sortBy, sortOrder } = extractSortParams(authReq.url, [
                  'name', 'email', 'role', 'status', 'university', 'created_at', 'last_login_at'
                ])
                
                const filters = extractFilterParams(authReq.url, [
                  'role', 'status', 'university', 'graduation_year', 'search'
                ])

                // Build base query
                let query = supabaseAdmin
                  .from('users')
                  .select(`
                    id,
                    email,
                    name,
                    role,
                    status,
                    university,
                    graduation_year,
                    program,
                    phone_number,
                    timezone,
                    avatar_url,
                    email_verified_at,
                    last_login_at,
                    created_at,
                    updated_at
                  `, { count: 'exact' })

                // Apply filters
                query = QueryHelpers.applyFilters(query, filters)

                // Handle search across multiple fields
                if (filters.search) {
                  query = query.or(
                    `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,university.ilike.%${filters.search}%`
                  )
                }

                // Apply sorting and pagination
                query = QueryHelpers.applySorting(query, sortBy, sortOrder)
                query = QueryHelpers.applyPagination(query, offset, perPage)

                const { data: users, error, count } = await query

                if (error) {
                  console.error('Users query error:', error)
                  return ApiResponseBuilder.serverError('Failed to fetch users')
                }

                // For security, filter sensitive information based on requesting user's role
                const filteredUsers = users?.map(userRecord => {
                  const filteredUser = { ...userRecord }

                  // Non-super admins can't see other admin users' full details
                  if (user.role !== 'super_admin' && 
                      ['admin', 'super_admin'].includes(userRecord.role)) {
                    delete filteredUser.phone_number
                    delete filteredUser.last_login_at
                  }

                  return filteredUser
                }) || []

                return ApiResponseBuilder.paginated(
                  filteredUsers,
                  count || 0,
                  page,
                  perPage
                )

              } catch (error: any) {
                console.error('Get users error:', error)
                return ApiResponseBuilder.serverError('Failed to fetch users')
              }
            })
          })
        })
      })
    })
  })
}

/**
 * POST /api/users
 * Create new user (admin only)
 */
export async function POST(request: NextRequest) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            return authorize('users', 'admin')(authReq, async (authReq: AuthenticatedRequest) => {
              return validateInput(UserSchemas.create)(authReq, async (authReq, validatedData) => {
                try {
                  const user = authReq.user!
                  const { 
                    email, 
                    name, 
                    role, 
                    university, 
                    graduation_year, 
                    program, 
                    phone_number, 
                    timezone 
                  } = validatedData

                  // Check if user already exists
                  const { data: existingUser } = await supabaseAdmin
                    .from('users')
                    .select('id, email')
                    .eq('email', email.toLowerCase())
                    .single()

                  if (existingUser) {
                    return ApiResponseBuilder.error(
                      'A user with this email already exists',
                      409,
                      'EMAIL_EXISTS'
                    )
                  }

                  // Only super_admin can create admin users
                  if (['admin', 'super_admin'].includes(role) && user.role !== 'super_admin') {
                    return ApiResponseBuilder.forbidden('Insufficient permissions to create admin users')
                  }

                  // Generate temporary password
                  const tempPassword = generateRandomPassword(12)

                  // Create user with Supabase Auth
                  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email: email.toLowerCase(),
                    password: tempPassword,
                    email_confirm: false, // Require email confirmation
                    user_metadata: {
                      name,
                      university,
                      graduation_year,
                      program,
                      timezone,
                      created_by: user.id
                    }
                  })

                  if (authError || !authData.user) {
                    console.error('Supabase auth error:', authError)
                    return ApiResponseBuilder.error(
                      authError?.message || 'Failed to create auth user',
                      400,
                      'AUTH_CREATION_FAILED'
                    )
                  }

                  // Create user record in our users table
                  const { data: newUser, error: userError } = await supabaseAdmin
                    .from('users')
                    .insert({
                      id: authData.user.id,
                      email: email.toLowerCase(),
                      name,
                      role,
                      status: 'active',
                      university,
                      graduation_year,
                      program,
                      phone_number,
                      timezone,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    })
                    .select(`
                      id,
                      email,
                      name,
                      role,
                      status,
                      university,
                      graduation_year,
                      program,
                      phone_number,
                      timezone,
                      created_at,
                      updated_at
                    `)
                    .single()

                  if (userError) {
                    console.error('User creation error:', userError)
                    
                    // Clean up the auth user if user creation fails
                    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
                    
                    return ApiResponseBuilder.error(
                      'Failed to create user record',
                      500,
                      'USER_CREATION_FAILED'
                    )
                  }

                  // TODO: Send welcome email with temporary password
                  // await sendWelcomeEmail(email, name, tempPassword)

                  // Log audit event
                  logAuditEvent({
                    userId: user.id,
                    action: 'user_created',
                    resource: 'users',
                    resourceId: newUser.id,
                    metadata: {
                      created_user_email: newUser.email,
                      created_user_name: newUser.name,
                      created_user_role: newUser.role,
                      university: newUser.university
                    },
                    ipAddress: getClientIP(authReq),
                    userAgent: authReq.headers.get('user-agent') || 'unknown'
                  })

                  // Return user data without sensitive information
                  const responseData = {
                    ...newUser,
                    temporary_password: tempPassword, // Include in response for admin
                    email_confirmation_required: true
                  }

                  return ApiResponseBuilder.success(
                    responseData, 
                    'User created successfully. A welcome email has been sent.'
                  )

                } catch (error: any) {
                  console.error('Create user error:', error)
                  return ApiResponseBuilder.serverError('Failed to create user')
                }
              })
            })
          })
        })
      })
    })
  })
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return cors(request, async () => {
    return new Response(null, { status: 200 })
  })
}