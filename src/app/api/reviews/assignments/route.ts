/**
 * Review Assignment API Endpoints
 * 
 * GET /api/reviews/assignments - Get judge assignments
 * POST /api/reviews/assignments - Create judge assignments (admin only)
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ApiResponseBuilder, extractPaginationParams, extractFilterParams, getClientIP, logAuditEvent } from '@/lib/api/utils'
import { authenticate, authorize, rateLimit, cors, errorHandler, securityHeaders, validateInput } from '@/lib/api/middleware'
import { ReviewSchemas } from '@/lib/api/validation'
import { QueryHelpers } from '@/lib/api/utils'
import type { AuthenticatedRequest } from '@/lib/api/middleware'

/**
 * GET /api/reviews/assignments
 * Get judge assignments with role-based filtering
 */
export async function GET(request: NextRequest) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            try {
              const user = authReq.user!
              const { page, perPage, offset } = extractPaginationParams(authReq.url)
              
              const filters = extractFilterParams(authReq.url, [
                'competition_id', 'round_id', 'judge_user_id', 'due_date'
              ])

              // Build base query
              let query = supabaseAdmin
                .from('judge_assignments')
                .select(`
                  id,
                  judge_user_id,
                  submission_id,
                  round_id,
                  assigned_by_user_id,
                  assignment_method,
                  priority,
                  due_date,
                  assigned_at,
                  viewed_at,
                  completed_at,
                  users!judge_user_id(
                    id,
                    name,
                    email
                  ),
                  submissions!inner(
                    id,
                    title,
                    status,
                    competition_id,
                    user_id,
                    competitions!inner(
                      id,
                      name,
                      status
                    ),
                    users!user_id(
                      name,
                      email
                    )
                  ),
                  assigned_by:users!assigned_by_user_id(
                    name,
                    email
                  )
                `, { count: 'exact' })

              // Apply role-based filtering
              if (user.role === 'judge') {
                // Judges can only see their own assignments
                query = query.eq('judge_user_id', user.id)
              } else if (user.role === 'reviewer') {
                // Reviewers cannot see judge assignments
                return ApiResponseBuilder.forbidden('Reviewers cannot access judge assignments')
              } else if (user.role === 'student') {
                // Students cannot see judge assignments
                return ApiResponseBuilder.forbidden('Students cannot access judge assignments')
              }
              // Admins and super_admins see all assignments

              // Apply filters
              query = QueryHelpers.applyFilters(query, filters)

              // Apply pagination
              query = QueryHelpers.applyPagination(query, offset, perPage)

              const { data: assignments, error, count } = await query

              if (error) {
                console.error('Judge assignments query error:', error)
                return ApiResponseBuilder.serverError('Failed to fetch judge assignments')
              }

              return ApiResponseBuilder.paginated(
                assignments || [],
                count || 0,
                page,
                perPage
              )

            } catch (error: any) {
              console.error('Get judge assignments error:', error)
              return ApiResponseBuilder.serverError('Failed to fetch judge assignments')
            }
          })
        })
      })
    })
  })
}

/**
 * POST /api/reviews/assignments
 * Create judge assignments (admin only)
 */
export async function POST(request: NextRequest) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            return authorize('judge_assignments', 'admin')(authReq, async (authReq: AuthenticatedRequest) => {
              return validateInput(ReviewSchemas.assignment)(authReq, async (authReq, validatedData) => {
                try {
                  const user = authReq.user!
                  const { judge_user_id, submission_ids, round_id, due_date, priority } = validatedData

                  // Verify judge user exists and has judge role
                  const { data: judge, error: judgeError } = await supabaseAdmin
                    .from('users')
                    .select('id, role, status')
                    .eq('id', judge_user_id)
                    .single()

                  if (judgeError || !judge) {
                    return ApiResponseBuilder.notFound('Judge user')
                  }

                  if (judge.role !== 'judge') {
                    return ApiResponseBuilder.error(
                      'User is not a judge',
                      400,
                      'NOT_A_JUDGE'
                    )
                  }

                  if (judge.status !== 'active') {
                    return ApiResponseBuilder.error(
                      'Judge is not active',
                      400,
                      'JUDGE_NOT_ACTIVE'
                    )
                  }

                  // Verify submissions exist and are in appropriate state
                  const { data: submissions, error: submissionsError } = await supabaseAdmin
                    .from('submissions')
                    .select(`
                      id,
                      title,
                      status,
                      user_id,
                      competition_id,
                      competitions!inner(
                        status,
                        judging_start_date,
                        judging_end_date
                      )
                    `)
                    .in('id', submission_ids)

                  if (submissionsError || !submissions || submissions.length !== submission_ids.length) {
                    return ApiResponseBuilder.error(
                      'One or more submissions not found',
                      404,
                      'SUBMISSIONS_NOT_FOUND'
                    )
                  }

                  // Validate submissions are in judgeable state
                  const invalidSubmissions = submissions.filter(s => 
                    !['submitted', 'in_review', 'accepted'].includes(s.status)
                  )

                  if (invalidSubmissions.length > 0) {
                    return ApiResponseBuilder.error(
                      'Some submissions are not in a judgeable state',
                      400,
                      'INVALID_SUBMISSION_STATE'
                    )
                  }

                  // Check for conflicts of interest
                  const conflictSubmissions = submissions.filter(s => s.user_id === judge_user_id)
                  if (conflictSubmissions.length > 0) {
                    return ApiResponseBuilder.error(
                      'Judge cannot be assigned to their own submissions',
                      400,
                      'CONFLICT_OF_INTEREST'
                    )
                  }

                  // Check for existing assignments
                  const { data: existingAssignments } = await supabaseAdmin
                    .from('judge_assignments')
                    .select('submission_id')
                    .eq('judge_user_id', judge_user_id)
                    .in('submission_id', submission_ids)

                  const alreadyAssignedIds = existingAssignments?.map(a => a.submission_id) || []
                  const newAssignmentIds = submission_ids.filter(id => !alreadyAssignedIds.includes(id))

                  if (newAssignmentIds.length === 0) {
                    return ApiResponseBuilder.error(
                      'All submissions are already assigned to this judge',
                      400,
                      'ALREADY_ASSIGNED'
                    )
                  }

                  // Create assignments
                  const assignmentData = newAssignmentIds.map(submission_id => ({
                    judge_user_id,
                    submission_id,
                    round_id,
                    assigned_by_user_id: user.id,
                    assignment_method: 'manual' as const,
                    priority: priority || 3,
                    due_date,
                    assigned_at: new Date().toISOString()
                  }))

                  const { data: createdAssignments, error: createError } = await supabaseAdmin
                    .from('judge_assignments')
                    .insert(assignmentData)
                    .select(`
                      *,
                      submissions!inner(
                        title,
                        competitions!inner(name)
                      ),
                      users!judge_user_id(
                        name,
                        email
                      )
                    `)

                  if (createError) {
                    console.error('Judge assignment creation error:', createError)
                    return ApiResponseBuilder.serverError('Failed to create judge assignments')
                  }

                  // Log audit event
                  logAuditEvent({
                    userId: user.id,
                    action: 'judge_assignments_created',
                    resource: 'judge_assignments',
                    metadata: {
                      judge_user_id,
                      submission_ids: newAssignmentIds,
                      round_id,
                      due_date,
                      assignments_created: createdAssignments?.length || 0,
                      already_assigned: alreadyAssignedIds.length
                    },
                    ipAddress: getClientIP(authReq),
                    userAgent: authReq.headers.get('user-agent') || 'unknown'
                  })

                  // TODO: Send notification to judge about new assignments
                  
                  const responseData = {
                    created_assignments: createdAssignments || [],
                    already_assigned_submissions: alreadyAssignedIds,
                    summary: {
                      total_requested: submission_ids.length,
                      newly_created: newAssignmentIds.length,
                      already_assigned: alreadyAssignedIds.length
                    }
                  }

                  return ApiResponseBuilder.success(
                    responseData,
                    `${newAssignmentIds.length} judge assignments created successfully`
                  )

                } catch (error: any) {
                  console.error('Create judge assignments error:', error)
                  return ApiResponseBuilder.serverError('Failed to create judge assignments')
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