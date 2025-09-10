/**
 * User Management API Endpoints - Individual User
 * 
 * GET /api/users/[id] - Get user details
 * PUT /api/users/[id] - Update user
 * DELETE /api/users/[id] - Delete user (admin only)
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ApiResponseBuilder, getClientIP, logAuditEvent, isValidUUID } from '@/lib/api/utils'
import { authenticate, authorize, rateLimit, cors, errorHandler, securityHeaders, validateInput } from '@/lib/api/middleware'
import { UserSchemas } from '@/lib/api/validation'
import type { AuthenticatedRequest } from '@/lib/api/middleware'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/users/[id]
 * Get user details with role-based access control
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            try {
              const user = authReq.user!
              const targetUserId = params.id

              if (!isValidUUID(targetUserId)) {
                return ApiResponseBuilder.error('Invalid user ID', 400, 'INVALID_ID')
              }

              // Check if user can access this profile
              const canAccess = user.id === targetUserId || 
                              user.role === 'admin' || 
                              user.role === 'super_admin'

              if (!canAccess) {
                return ApiResponseBuilder.forbidden('You can only access your own profile')
              }

              // Get user details
              const { data: targetUser, error } = await supabaseAdmin
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
                `)
                .eq('id', targetUserId)
                .single()

              if (error || !targetUser) {
                return ApiResponseBuilder.notFound('User')
              }

              // Get additional data based on role and access level
              let additionalData: any = {}

              // For students, include team memberships and submissions
              if (targetUser.role === 'student') {
                const { data: teamMemberships } = await supabaseAdmin
                  .from('team_members')
                  .select(`
                    id,
                    team_id,
                    role,
                    joined_at,
                    teams!inner(
                      id,
                      name,
                      code,
                      is_locked,
                      max_members
                    )
                  `)
                  .eq('user_id', targetUserId)
                  .is('removed_at', null)

                additionalData.team_memberships = teamMemberships || []

                // If accessing own profile or admin, include submission statistics
                if (user.id === targetUserId || user.role === 'admin' || user.role === 'super_admin') {
                  const { data: submissionStats } = await supabaseAdmin
                    .from('submissions')
                    .select('status')
                    .eq('user_id', targetUserId)

                  const stats = submissionStats?.reduce((acc, submission) => {
                    acc[submission.status] = (acc[submission.status] || 0) + 1
                    return acc
                  }, {} as Record<string, number>) || {}

                  additionalData.submission_statistics = {
                    total_submissions: submissionStats?.length || 0,
                    submissions_by_status: stats
                  }
                }
              }

              // For reviewers and judges, include assignment statistics
              if (['reviewer', 'judge'].includes(targetUser.role)) {
                if (targetUser.role === 'reviewer') {
                  const { data: reviewStats } = await supabaseAdmin
                    .from('reviews')
                    .select('status')
                    .eq('reviewer_user_id', targetUserId)

                  const reviewCounts = reviewStats?.reduce((acc, review) => {
                    acc[review.status] = (acc[review.status] || 0) + 1
                    return acc
                  }, {} as Record<string, number>) || {}

                  additionalData.review_statistics = {
                    total_reviews: reviewStats?.length || 0,
                    reviews_by_status: reviewCounts
                  }
                }

                if (targetUser.role === 'judge') {
                  const { data: assignmentStats } = await supabaseAdmin
                    .from('judge_assignments')
                    .select('completed_at')
                    .eq('judge_user_id', targetUserId)

                  const completedCount = assignmentStats?.filter(a => a.completed_at).length || 0

                  additionalData.judge_statistics = {
                    total_assignments: assignmentStats?.length || 0,
                    completed_assignments: completedCount,
                    pending_assignments: (assignmentStats?.length || 0) - completedCount
                  }
                }
              }

              // Filter sensitive data based on access level
              const responseData = { ...targetUser, ...additionalData }

              // Non-admin users accessing others' profiles get limited data
              if (user.id !== targetUserId && user.role !== 'admin' && user.role !== 'super_admin') {
                delete responseData.email
                delete responseData.phone_number
                delete responseData.last_login_at
                delete responseData.email_verified_at
              }

              return ApiResponseBuilder.success(responseData)

            } catch (error: any) {
              console.error('Get user error:', error)
              return ApiResponseBuilder.serverError('Failed to fetch user')
            }
          })
        })
      })
    })
  })
}

/**
 * PUT /api/users/[id]
 * Update user details
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            return validateInput(UserSchemas.update)(authReq, async (authReq, validatedData) => {
              try {
                const user = authReq.user!
                const targetUserId = params.id

                if (!isValidUUID(targetUserId)) {
                  return ApiResponseBuilder.error('Invalid user ID', 400, 'INVALID_ID')
                }

                // Check if user can modify this profile
                const canModify = user.id === targetUserId || 
                                user.role === 'admin' || 
                                user.role === 'super_admin'

                if (!canModify) {
                  return ApiResponseBuilder.forbidden('You can only modify your own profile')
                }

                // Get existing user data
                const { data: existingUser, error: fetchError } = await supabaseAdmin
                  .from('users')
                  .select('*')
                  .eq('id', targetUserId)
                  .single()

                if (fetchError || !existingUser) {
                  return ApiResponseBuilder.notFound('User')
                }

                // Validate role change permissions
                if (validatedData.role && validatedData.role !== existingUser.role) {
                  // Only admins can change roles
                  if (user.role !== 'admin' && user.role !== 'super_admin') {
                    return ApiResponseBuilder.forbidden('Insufficient permissions to change user role')
                  }

                  // Only super_admin can create/modify admin users
                  if (['admin', 'super_admin'].includes(validatedData.role) && user.role !== 'super_admin') {
                    return ApiResponseBuilder.forbidden('Insufficient permissions to assign admin role')
                  }

                  // Super admin role can only be assigned by another super admin
                  if (validatedData.role === 'super_admin' && user.role !== 'super_admin') {
                    return ApiResponseBuilder.forbidden('Only super admins can assign super admin role')
                  }

                  // Cannot demote the last super admin
                  if (existingUser.role === 'super_admin' && validatedData.role !== 'super_admin') {
                    const { count: superAdminCount } = await supabaseAdmin
                      .from('users')
                      .select('*', { count: 'exact', head: true })
                      .eq('role', 'super_admin')
                      .eq('status', 'active')

                    if ((superAdminCount || 0) <= 1) {
                      return ApiResponseBuilder.error(
                        'Cannot demote the last active super admin',
                        400,
                        'LAST_SUPER_ADMIN'
                      )
                    }
                  }
                }

                // Validate status change permissions
                if (validatedData.status && validatedData.status !== existingUser.status) {
                  // Users can't change their own status
                  if (user.id === targetUserId) {
                    return ApiResponseBuilder.forbidden('You cannot change your own account status')
                  }

                  // Only admins can change status
                  if (user.role !== 'admin' && user.role !== 'super_admin') {
                    return ApiResponseBuilder.forbidden('Insufficient permissions to change user status')
                  }
                }

                // Update user
                const { data: updatedUser, error: updateError } = await supabaseAdmin
                  .from('users')
                  .update({
                    ...validatedData,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', targetUserId)
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
                  `)
                  .single()

                if (updateError) {
                  console.error('User update error:', updateError)
                  return ApiResponseBuilder.serverError('Failed to update user')
                }

                // Log audit event
                logAuditEvent({
                  userId: user.id,
                  action: 'user_updated',
                  resource: 'users',
                  resourceId: targetUserId,
                  metadata: {
                    changes: validatedData,
                    target_user_email: existingUser.email,
                    previous_role: existingUser.role,
                    new_role: validatedData.role || existingUser.role,
                    previous_status: existingUser.status,
                    new_status: validatedData.status || existingUser.status
                  },
                  ipAddress: getClientIP(authReq),
                  userAgent: authReq.headers.get('user-agent') || 'unknown'
                })

                return ApiResponseBuilder.success(updatedUser, 'User updated successfully')

              } catch (error: any) {
                console.error('Update user error:', error)
                return ApiResponseBuilder.serverError('Failed to update user')
              }
            })
          })
        })
      })
    })
  })
}

/**
 * DELETE /api/users/[id]
 * Delete user (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            return authorize('users', 'admin')(authReq, async (authReq: AuthenticatedRequest) => {
              try {
                const user = authReq.user!
                const targetUserId = params.id

                if (!isValidUUID(targetUserId)) {
                  return ApiResponseBuilder.error('Invalid user ID', 400, 'INVALID_ID')
                }

                // Prevent self-deletion
                if (user.id === targetUserId) {
                  return ApiResponseBuilder.error(
                    'You cannot delete your own account',
                    400,
                    'SELF_DELETION_NOT_ALLOWED'
                  )
                }

                // Get user details
                const { data: targetUser, error: fetchError } = await supabaseAdmin
                  .from('users')
                  .select('*')
                  .eq('id', targetUserId)
                  .single()

                if (fetchError || !targetUser) {
                  return ApiResponseBuilder.notFound('User')
                }

                // Prevent deletion of the last super admin
                if (targetUser.role === 'super_admin') {
                  const { count: superAdminCount } = await supabaseAdmin
                    .from('users')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'super_admin')
                    .eq('status', 'active')

                  if ((superAdminCount || 0) <= 1) {
                    return ApiResponseBuilder.error(
                      'Cannot delete the last active super admin',
                      400,
                      'LAST_SUPER_ADMIN'
                    )
                  }
                }

                // Check for active submissions or reviews
                const { data: activeSubmissions } = await supabaseAdmin
                  .from('submissions')
                  .select('id')
                  .eq('user_id', targetUserId)
                  .in('status', ['draft', 'submitted', 'in_review'])
                  .limit(1)

                const { data: activeReviews } = await supabaseAdmin
                  .from('reviews')
                  .select('id')
                  .eq('reviewer_user_id', targetUserId)
                  .in('status', ['assigned', 'in_progress'])
                  .limit(1)

                if ((activeSubmissions && activeSubmissions.length > 0) || 
                    (activeReviews && activeReviews.length > 0)) {
                  return ApiResponseBuilder.error(
                    'Cannot delete user with active submissions or reviews',
                    400,
                    'HAS_ACTIVE_DATA'
                  )
                }

                // Soft delete approach - set status to 'suspended' and anonymize data
                const anonymizedEmail = `deleted_${Date.now()}@deleted.local`
                const { data: deletedUser, error: deleteError } = await supabaseAdmin
                  .from('users')
                  .update({
                    email: anonymizedEmail,
                    name: 'Deleted User',
                    status: 'suspended',
                    phone_number: null,
                    avatar_url: null,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', targetUserId)
                  .select('id')
                  .single()

                if (deleteError) {
                  console.error('User deletion error:', deleteError)
                  return ApiResponseBuilder.serverError('Failed to delete user')
                }

                // Delete from Supabase Auth
                const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
                if (authDeleteError) {
                  console.warn('Failed to delete from Supabase Auth:', authDeleteError)
                  // Continue with deletion even if auth deletion fails
                }

                // Log audit event
                logAuditEvent({
                  userId: user.id,
                  action: 'user_deleted',
                  resource: 'users',
                  resourceId: targetUserId,
                  metadata: {
                    deleted_user_email: targetUser.email,
                    deleted_user_name: targetUser.name,
                    deleted_user_role: targetUser.role,
                    deletion_method: 'soft_delete'
                  },
                  ipAddress: getClientIP(authReq),
                  userAgent: authReq.headers.get('user-agent') || 'unknown'
                })

                return ApiResponseBuilder.success(
                  { deleted_id: targetUserId },
                  'User deleted successfully'
                )

              } catch (error: any) {
                console.error('Delete user error:', error)
                return ApiResponseBuilder.serverError('Failed to delete user')
              }
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