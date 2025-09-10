/**
 * Submission Management API Endpoints - Individual Submission
 * 
 * GET /api/submissions/[id] - Get submission details
 * PUT /api/submissions/[id] - Update submission
 * DELETE /api/submissions/[id] - Delete submission
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ApiResponseBuilder, getClientIP, logAuditEvent, isValidUUID } from '@/lib/api/utils'
import { authenticate, rateLimit, cors, errorHandler, securityHeaders, validateInput } from '@/lib/api/middleware'
import { SubmissionSchemas } from '@/lib/api/validation'
import { permissionManager } from '@/lib/auth/permissions'
import type { AuthenticatedRequest } from '@/lib/api/middleware'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/submissions/[id]
 * Get submission details with role-based access control
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            try {
              const user = authReq.user!
              const submissionId = params.id

              if (!isValidUUID(submissionId)) {
                return ApiResponseBuilder.error('Invalid submission ID', 400, 'INVALID_ID')
              }

              // Get submission details
              const { data: submission, error } = await supabaseAdmin
                .from('submissions')
                .select(`
                  *,
                  competitions!inner(
                    id,
                    name,
                    status,
                    allow_team_submissions,
                    submission_deadline,
                    event_date
                  ),
                  users(
                    id,
                    name,
                    email
                  ),
                  teams(
                    id,
                    name,
                    members:team_members(
                      user_id,
                      role,
                      users!inner(name)
                    )
                  ),
                  files:submission_files(
                    id,
                    file_type,
                    original_filename,
                    file_size,
                    upload_status,
                    thumbnail_url,
                    uploaded_at
                  )
                `)
                .eq('id', submissionId)
                .single()

              if (error || !submission) {
                return ApiResponseBuilder.notFound('Submission')
              }

              // Check access permissions
              const canAccess = await checkSubmissionAccess(user, submission)
              if (!canAccess.allowed) {
                return ApiResponseBuilder.forbidden(canAccess.reason || 'Access denied')
              }

              // Get additional data based on user role and access level
              let additionalData: any = {}

              // For reviewers and judges, include review data
              if (user.role === 'reviewer' || user.role === 'judge') {
                const { data: reviews } = await supabaseAdmin
                  .from('reviews')
                  .select(`
                    id,
                    reviewer_user_id,
                    status,
                    overall_score,
                    scores,
                    feedback_for_participant,
                    confidence_level,
                    completed_at,
                    users!inner(name)
                  `)
                  .eq('submission_id', submissionId)

                additionalData.reviews = reviews || []

                // Include own review if it exists
                if (user.role === 'reviewer') {
                  const myReview = reviews?.find(r => r.reviewer_user_id === user.id)
                  additionalData.my_review = myReview || null
                }
              }

              // For admins, include comprehensive data
              if (user.role === 'admin' || user.role === 'super_admin') {
                // Get all votes for this submission
                const { data: votes } = await supabaseAdmin
                  .from('votes')
                  .select('*')
                  .eq('submission_id', submissionId)

                additionalData.votes = votes || []
                additionalData.vote_summary = {
                  total_votes: votes?.length || 0,
                  average_score: votes?.length ? 
                    votes.reduce((sum, vote) => sum + (vote.vote_data?.value || 0), 0) / votes.length : 0
                }
              }

              // For the submission owner, include edit capabilities and history
              if (submission.user_id === user.id || 
                  (submission.team_id && await isTeamMember(user.id, submission.team_id))) {
                additionalData.can_edit = canEditSubmission(submission, user)
                additionalData.can_submit = canSubmitSubmission(submission)
                additionalData.can_withdraw = canWithdrawSubmission(submission)
              }

              const responseData = {
                ...submission,
                ...additionalData
              }

              return ApiResponseBuilder.success(responseData)

            } catch (error: any) {
              console.error('Get submission error:', error)
              return ApiResponseBuilder.serverError('Failed to fetch submission')
            }
          })
        })
      })
    })
  })
}

/**
 * PUT /api/submissions/[id]
 * Update submission details
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            return validateInput(SubmissionSchemas.update)(authReq, async (authReq, validatedData) => {
              try {
                const user = authReq.user!
                const submissionId = params.id

                if (!isValidUUID(submissionId)) {
                  return ApiResponseBuilder.error('Invalid submission ID', 400, 'INVALID_ID')
                }

                // Get existing submission
                const { data: existingSubmission, error: fetchError } = await supabaseAdmin
                  .from('submissions')
                  .select(`
                    *,
                    competitions!inner(status, submission_deadline),
                    teams(id)
                  `)
                  .eq('id', submissionId)
                  .single()

                if (fetchError || !existingSubmission) {
                  return ApiResponseBuilder.notFound('Submission')
                }

                // Check if user can modify this submission
                const canModify = permissionManager.canModifySubmission(
                  user.role,
                  user.id,
                  {
                    user_id: existingSubmission.user_id,
                    team_id: existingSubmission.team_id,
                    status: existingSubmission.status,
                    competition_status: existingSubmission.competitions.status
                  }
                )

                if (!canModify && user.role !== 'admin' && user.role !== 'super_admin') {
                  return ApiResponseBuilder.forbidden('You cannot modify this submission')
                }

                // Validate status transitions
                if (validatedData.status && validatedData.status !== existingSubmission.status) {
                  const validTransitions = getValidStatusTransitions(existingSubmission.status, user.role)
                  if (!validTransitions.includes(validatedData.status)) {
                    return ApiResponseBuilder.error(
                      `Invalid status transition from ${existingSubmission.status} to ${validatedData.status}`,
                      400,
                      'INVALID_STATUS_TRANSITION'
                    )
                  }

                  // Special validation for submission
                  if (validatedData.status === 'submitted') {
                    const now = new Date()
                    const deadline = new Date(existingSubmission.competitions.submission_deadline)
                    
                    if (now > deadline) {
                      return ApiResponseBuilder.error(
                        'Submission deadline has passed',
                        400,
                        'DEADLINE_PASSED'
                      )
                    }

                    // Check if submission has files (if required)
                    const { data: files } = await supabaseAdmin
                      .from('submission_files')
                      .select('id')
                      .eq('submission_id', submissionId)
                      .eq('upload_status', 'ready')

                    if (!files || files.length === 0) {
                      return ApiResponseBuilder.error(
                        'Cannot submit without any files',
                        400,
                        'NO_FILES_UPLOADED'
                      )
                    }
                  }
                }

                // Update submission
                const updateData = {
                  ...validatedData,
                  last_modified_at: new Date().toISOString(),
                  version: existingSubmission.version + 1
                }

                // Set submitted_at if status is being changed to submitted
                if (validatedData.status === 'submitted' && existingSubmission.status !== 'submitted') {
                  updateData.submitted_at = new Date().toISOString()
                }

                // Set withdrawn_at if status is being changed to withdrawn
                if (validatedData.status === 'withdrawn') {
                  updateData.withdrawn_at = new Date().toISOString()
                }

                const { data: updatedSubmission, error: updateError } = await supabaseAdmin
                  .from('submissions')
                  .update(updateData)
                  .eq('id', submissionId)
                  .select(`
                    *,
                    competitions!inner(name, status),
                    users(name, email)
                  `)
                  .single()

                if (updateError) {
                  console.error('Submission update error:', updateError)
                  return ApiResponseBuilder.serverError('Failed to update submission')
                }

                // Log audit event
                logAuditEvent({
                  userId: user.id,
                  action: 'submission_updated',
                  resource: 'submissions',
                  resourceId: submissionId,
                  metadata: {
                    changes: validatedData,
                    previous_status: existingSubmission.status,
                    new_status: validatedData.status || existingSubmission.status,
                    version: updateData.version
                  },
                  ipAddress: getClientIP(authReq),
                  userAgent: authReq.headers.get('user-agent') || 'unknown'
                })

                return ApiResponseBuilder.success(updatedSubmission, 'Submission updated successfully')

              } catch (error: any) {
                console.error('Update submission error:', error)
                return ApiResponseBuilder.serverError('Failed to update submission')
              }
            })
          })
        })
      })
    })
  })
}

/**
 * DELETE /api/submissions/[id]
 * Delete submission (only draft submissions by owner or admin)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            try {
              const user = authReq.user!
              const submissionId = params.id

              if (!isValidUUID(submissionId)) {
                return ApiResponseBuilder.error('Invalid submission ID', 400, 'INVALID_ID')
              }

              // Get submission details
              const { data: submission, error: fetchError } = await supabaseAdmin
                .from('submissions')
                .select('*')
                .eq('id', submissionId)
                .single()

              if (fetchError || !submission) {
                return ApiResponseBuilder.notFound('Submission')
              }

              // Check permissions
              const isOwner = submission.user_id === user.id || 
                             (submission.team_id && await isTeamMember(user.id, submission.team_id))
              const isAdmin = user.role === 'admin' || user.role === 'super_admin'

              if (!isOwner && !isAdmin) {
                return ApiResponseBuilder.forbidden('You cannot delete this submission')
              }

              // Only allow deletion of draft submissions
              if (submission.status !== 'draft') {
                return ApiResponseBuilder.error(
                  'Only draft submissions can be deleted',
                  400,
                  'CANNOT_DELETE_SUBMITTED'
                )
              }

              // Delete related files first
              const { data: files } = await supabaseAdmin
                .from('submission_files')
                .select('storage_key')
                .eq('submission_id', submissionId)

              // TODO: Delete files from storage
              // for (const file of files || []) {
              //   await deleteFromStorage(file.storage_key)
              // }

              // Delete submission files records
              await supabaseAdmin
                .from('submission_files')
                .delete()
                .eq('submission_id', submissionId)

              // Delete the submission
              const { error: deleteError } = await supabaseAdmin
                .from('submissions')
                .delete()
                .eq('id', submissionId)

              if (deleteError) {
                console.error('Submission deletion error:', deleteError)
                return ApiResponseBuilder.serverError('Failed to delete submission')
              }

              // Log audit event
              logAuditEvent({
                userId: user.id,
                action: 'submission_deleted',
                resource: 'submissions',
                resourceId: submissionId,
                metadata: {
                  title: submission.title,
                  status: submission.status,
                  competition_id: submission.competition_id
                },
                ipAddress: getClientIP(authReq),
                userAgent: authReq.headers.get('user-agent') || 'unknown'
              })

              return ApiResponseBuilder.success(
                { deleted_id: submissionId },
                'Submission deleted successfully'
              )

            } catch (error: any) {
              console.error('Delete submission error:', error)
              return ApiResponseBuilder.serverError('Failed to delete submission')
            }
          })
        })
      })
    })
  })
}

// Helper functions

async function checkSubmissionAccess(user: any, submission: any): Promise<{ allowed: boolean; reason?: string }> {
  // Admin and super_admin can access all submissions
  if (user.role === 'admin' || user.role === 'super_admin') {
    return { allowed: true }
  }

  // Owner can always access their submission
  if (submission.user_id === user.id) {
    return { allowed: true }
  }

  // Team members can access team submissions
  if (submission.team_id && await isTeamMember(user.id, submission.team_id)) {
    return { allowed: true }
  }

  // Reviewers can access submissions they're assigned to review
  if (user.role === 'reviewer') {
    const { data: review } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('submission_id', submission.id)
      .eq('reviewer_user_id', user.id)
      .single()

    if (review) {
      return { allowed: true }
    }
  }

  // Judges can access submissions they're assigned to judge
  if (user.role === 'judge') {
    const { data: assignment } = await supabaseAdmin
      .from('judge_assignments')
      .select('id')
      .eq('submission_id', submission.id)
      .eq('judge_user_id', user.id)
      .single()

    if (assignment) {
      return { allowed: true }
    }
  }

  // Public access for live competitions
  if (submission.competitions.status === 'live' && 
      ['submitted', 'accepted', 'advanced', 'winner'].includes(submission.status)) {
    return { allowed: true }
  }

  return { allowed: false, reason: 'You do not have access to this submission' }
}

async function isTeamMember(userId: string, teamId: string): Promise<boolean> {
  const { data: member } = await supabaseAdmin
    .from('team_members')
    .select('id')
    .eq('user_id', userId)
    .eq('team_id', teamId)
    .is('removed_at', null)
    .single()

  return !!member
}

function canEditSubmission(submission: any, user: any): boolean {
  // Admin can always edit
  if (user.role === 'admin' || user.role === 'super_admin') {
    return true
  }

  // Can only edit draft submissions
  return submission.status === 'draft' && submission.competitions.status === 'open'
}

function canSubmitSubmission(submission: any): boolean {
  return submission.status === 'draft' && submission.competitions.status === 'open'
}

function canWithdrawSubmission(submission: any): boolean {
  return ['submitted', 'in_review'].includes(submission.status)
}

function getValidStatusTransitions(currentStatus: string, userRole: string): string[] {
  const transitions: Record<string, Record<string, string[]>> = {
    'draft': {
      'student': ['submitted'],
      'admin': ['submitted', 'accepted', 'rejected'],
      'super_admin': ['submitted', 'accepted', 'rejected']
    },
    'submitted': {
      'student': ['withdrawn'],
      'reviewer': ['in_review'],
      'admin': ['draft', 'in_review', 'accepted', 'rejected'],
      'super_admin': ['draft', 'in_review', 'accepted', 'rejected']
    },
    'in_review': {
      'reviewer': ['accepted', 'rejected'],
      'admin': ['submitted', 'accepted', 'rejected', 'advanced'],
      'super_admin': ['submitted', 'accepted', 'rejected', 'advanced']
    },
    'accepted': {
      'admin': ['advanced', 'eliminated'],
      'super_admin': ['advanced', 'eliminated']
    },
    'rejected': {
      'admin': ['in_review', 'accepted'],
      'super_admin': ['in_review', 'accepted']
    },
    'advanced': {
      'admin': ['winner', 'eliminated'],
      'super_admin': ['winner', 'eliminated']
    },
    'eliminated': {
      'admin': ['advanced'],
      'super_admin': ['advanced']
    },
    'winner': {
      'admin': ['advanced'],
      'super_admin': ['advanced']
    }
  }

  return transitions[currentStatus]?.[userRole] || []
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return cors(request, async () => {
    return new Response(null, { status: 200 })
  })
}