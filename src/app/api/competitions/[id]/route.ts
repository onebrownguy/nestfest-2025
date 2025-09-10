/**
 * Competition Management API Endpoints - Individual Competition
 * 
 * GET /api/competitions/[id] - Get competition details
 * PUT /api/competitions/[id] - Update competition
 * DELETE /api/competitions/[id] - Delete competition (admin only)
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ApiResponseBuilder, getClientIP, logAuditEvent, isValidUUID } from '@/lib/api/utils'
import { authenticate, authorize, rateLimit, cors, errorHandler, securityHeaders, validateInput } from '@/lib/api/middleware'
import { CompetitionSchemas } from '@/lib/api/validation'
import { permissionManager } from '@/lib/auth/permissions'
import type { AuthenticatedRequest } from '@/lib/api/middleware'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/competitions/[id]
 * Get competition details with role-based access control
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            try {
              const user = (authReq as AuthenticatedRequest).user!
              const competitionId = params.id

              if (!isValidUUID(competitionId)) {
                return ApiResponseBuilder.error('Invalid competition ID', 400, 'INVALID_ID')
              }

              // Get competition details
              const { data: competition, error } = await supabaseAdmin
                .from('competitions')
                .select(`
                  *,
                  rounds:competition_rounds(
                    id,
                    round_number,
                    name,
                    start_date,
                    end_date,
                    advancement_quota,
                    advancement_type,
                    scoring_criteria,
                    is_public_voting_round
                  )
                `)
                .eq('id', competitionId)
                .single()

              if (error || !competition) {
                return ApiResponseBuilder.notFound('Competition')
              }

              // Check if user can access this competition
              const canAccess = permissionManager.canAccessCompetition(
                user.role,
                user.id,
                competitionId,
                competition.status
              )

              if (!canAccess) {
                return ApiResponseBuilder.forbidden('You do not have access to this competition')
              }

              // Get additional data based on user role
              let additionalData: any = {}

              // For admins, include management data
              if (user.role === 'admin' || user.role === 'super_admin') {
                // Get submission statistics
                const { data: submissionStats } = await supabaseAdmin
                  .from('submissions')
                  .select('status')
                  .eq('competition_id', competitionId)

                const stats = submissionStats?.reduce((acc, submission) => {
                  acc[submission.status] = (acc[submission.status] || 0) + 1
                  return acc
                }, {} as Record<string, number>) || {}

                additionalData.statistics = {
                  total_submissions: submissionStats?.length || 0,
                  submissions_by_status: stats
                }

                // Get judge assignments
                const { data: judgeAssignments } = await supabaseAdmin
                  .from('judge_assignments')
                  .select(`
                    id,
                    judge_user_id,
                    submission_id,
                    round_id,
                    assigned_at,
                    completed_at,
                    users!inner(name, email)
                  `)
                  .eq('competition_id', competitionId)

                additionalData.judge_assignments = judgeAssignments || []
              }

              // For judges, include their assignments
              if (user.role === 'judge') {
                const { data: myAssignments } = await supabaseAdmin
                  .from('judge_assignments')
                  .select(`
                    id,
                    submission_id,
                    round_id,
                    due_date,
                    assigned_at,
                    completed_at,
                    submissions!inner(
                      id,
                      title,
                      status,
                      submitted_at
                    )
                  `)
                  .eq('competition_id', competitionId)
                  .eq('judge_user_id', user.id)

                additionalData.my_assignments = myAssignments || []
              }

              // For students, include their submissions
              if (user.role === 'student') {
                const { data: mySubmissions } = await supabaseAdmin
                  .from('submissions')
                  .select(`
                    id,
                    title,
                    description,
                    status,
                    submission_number,
                    submitted_at,
                    last_modified_at
                  `)
                  .eq('competition_id', competitionId)
                  .eq('user_id', user.id)

                additionalData.my_submissions = mySubmissions || []

                // Check if public voting is enabled and get voting status
                if (competition.public_voting_enabled && competition.status === 'live') {
                  const { data: myVotes } = await supabaseAdmin
                    .from('votes')
                    .select('submission_id, vote_data')
                    .eq('competition_id', competitionId)
                    .eq('voter_user_id', user.id)

                  additionalData.my_votes = myVotes || []
                  additionalData.can_vote = true
                }
              }

              const responseData = {
                ...competition,
                ...additionalData
              }

              return ApiResponseBuilder.success(responseData)

            } catch (error: any) {
              console.error('Get competition error:', error)
              return ApiResponseBuilder.serverError('Failed to fetch competition')
            }
          })
        })
      })
    })
  })
}

/**
 * PUT /api/competitions/[id]
 * Update competition details
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            return authorize('competitions', 'admin')(authReq, async (authReq: AuthenticatedRequest) => {
              return validateInput(CompetitionSchemas.update)(authReq, async (authReq, validatedData) => {
                try {
                  const user = (authReq as AuthenticatedRequest).user!
                  const competitionId = params.id

                  if (!isValidUUID(competitionId)) {
                    return ApiResponseBuilder.error('Invalid competition ID', 400, 'INVALID_ID')
                  }

                  // Check if competition exists
                  const { data: existingCompetition, error: fetchError } = await supabaseAdmin
                    .from('competitions')
                    .select('*')
                    .eq('id', competitionId)
                    .single()

                  if (fetchError || !existingCompetition) {
                    return ApiResponseBuilder.notFound('Competition')
                  }

                  // Validate status transitions
                  if (validatedData.status && validatedData.status !== existingCompetition.status) {
                    const validTransitions: Record<string, string[]> = {
                      'draft': ['open'],
                      'open': ['reviewing', 'archived'],
                      'reviewing': ['judging', 'open'],
                      'judging': ['live', 'reviewing'],
                      'live': ['completed'],
                      'completed': ['archived'],
                      'archived': [] // No transitions from archived
                    }

                    const allowedTransitions = validTransitions[existingCompetition.status] || []
                    if (!allowedTransitions.includes(validatedData.status)) {
                      return ApiResponseBuilder.error(
                        `Invalid status transition from ${existingCompetition.status} to ${validatedData.status}`,
                        400,
                        'INVALID_STATUS_TRANSITION'
                      )
                    }
                  }

                  // Update competition
                  const { data: updatedCompetition, error: updateError } = await supabaseAdmin
                    .from('competitions')
                    .update({
                      ...validatedData,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', competitionId)
                    .select()
                    .single()

                  if (updateError) {
                    console.error('Competition update error:', updateError)
                    return ApiResponseBuilder.serverError('Failed to update competition')
                  }

                  // Log audit event
                  logAuditEvent({
                    userId: user.id,
                    action: 'competition_updated',
                    resource: 'competitions',
                    resourceId: competitionId,
                    metadata: {
                      changes: validatedData,
                      previous_status: existingCompetition.status,
                      new_status: validatedData.status || existingCompetition.status
                    },
                    ipAddress: getClientIP(authReq),
                    userAgent: authReq.headers.get('user-agent') || 'unknown'
                  })

                  return ApiResponseBuilder.success(updatedCompetition, 'Competition updated successfully')

                } catch (error: any) {
                  console.error('Update competition error:', error)
                  return ApiResponseBuilder.serverError('Failed to update competition')
                }
              })
            })
          })
        })
      })
    })
  })
}

/**
 * DELETE /api/competitions/[id]
 * Delete competition (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            return authorize('competitions', 'admin')(authReq, async (authReq: AuthenticatedRequest) => {
              try {
                const user = (authReq as AuthenticatedRequest).user!
                const competitionId = params.id

                if (!isValidUUID(competitionId)) {
                  return ApiResponseBuilder.error('Invalid competition ID', 400, 'INVALID_ID')
                }

                // Check if competition exists and get details
                const { data: competition, error: fetchError } = await supabaseAdmin
                  .from('competitions')
                  .select('*')
                  .eq('id', competitionId)
                  .single()

                if (fetchError || !competition) {
                  return ApiResponseBuilder.notFound('Competition')
                }

                // Check if competition can be deleted (only draft competitions)
                if (competition.status !== 'draft') {
                  return ApiResponseBuilder.error(
                    'Only draft competitions can be deleted',
                    400,
                    'CANNOT_DELETE_ACTIVE_COMPETITION'
                  )
                }

                // Check if there are any submissions
                const { data: submissions } = await supabaseAdmin
                  .from('submissions')
                  .select('id')
                  .eq('competition_id', competitionId)
                  .limit(1)

                if (submissions && submissions.length > 0) {
                  return ApiResponseBuilder.error(
                    'Cannot delete competition with existing submissions',
                    400,
                    'HAS_SUBMISSIONS'
                  )
                }

                // Delete related data first (cascade delete)
                await supabaseAdmin
                  .from('competition_rounds')
                  .delete()
                  .eq('competition_id', competitionId)

                // Delete the competition
                const { error: deleteError } = await supabaseAdmin
                  .from('competitions')
                  .delete()
                  .eq('id', competitionId)

                if (deleteError) {
                  console.error('Competition deletion error:', deleteError)
                  return ApiResponseBuilder.serverError('Failed to delete competition')
                }

                // Log audit event
                logAuditEvent({
                  userId: user.id,
                  action: 'competition_deleted',
                  resource: 'competitions',
                  resourceId: competitionId,
                  metadata: {
                    name: competition.name,
                    slug: competition.slug,
                    status: competition.status
                  },
                  ipAddress: getClientIP(authReq),
                  userAgent: authReq.headers.get('user-agent') || 'unknown'
                })

                return ApiResponseBuilder.success(
                  { deleted_id: competitionId },
                  'Competition deleted successfully'
                )

              } catch (error: any) {
                console.error('Delete competition error:', error)
                return ApiResponseBuilder.serverError('Failed to delete competition')
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