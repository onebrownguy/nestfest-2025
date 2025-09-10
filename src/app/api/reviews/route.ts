/**
 * Review System API Endpoints
 * 
 * GET /api/reviews - List reviews with filtering and pagination
 * POST /api/reviews - Create new review
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ApiResponseBuilder, extractPaginationParams, extractFilterParams, extractSortParams, getClientIP, logAuditEvent } from '@/lib/api/utils'
import { authenticate, authorize, rateLimit, cors, errorHandler, securityHeaders, validateInput } from '@/lib/api/middleware'
import { ReviewSchemas } from '@/lib/api/validation'
import { QueryHelpers } from '@/lib/api/utils'
import type { AuthenticatedRequest } from '@/lib/api/middleware'

/**
 * GET /api/reviews
 * List reviews with role-based filtering
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
              const { sortBy, sortOrder } = extractSortParams(authReq.url, [
                'completed_at', 'started_at', 'overall_score', 'confidence_level'
              ])
              
              const filters = extractFilterParams(authReq.url, [
                'submission_id', 'reviewer_user_id', 'round_id', 'status'
              ])

              // Build base query
              let query = supabaseAdmin
                .from('reviews')
                .select(`
                  id,
                  submission_id,
                  reviewer_user_id,
                  round_id,
                  status,
                  overall_score,
                  scores,
                  feedback_for_participant,
                  internal_notes,
                  time_spent_seconds,
                  started_at,
                  completed_at,
                  conflict_of_interest,
                  confidence_level,
                  submissions!inner(
                    id,
                    title,
                    status,
                    competition_id,
                    competitions!inner(name)
                  ),
                  users!reviewer_user_id(
                    id,
                    name,
                    email
                  )
                `, { count: 'exact' })

              // Apply role-based filtering
              if (user.role === 'reviewer') {
                // Reviewers can only see their own reviews
                query = query.eq('reviewer_user_id', user.id)
              } else if (user.role === 'judge') {
                // Judges can see reviews for submissions they're judging
                const { data: judgeAssignments } = await supabaseAdmin
                  .from('judge_assignments')
                  .select('submission_id')
                  .eq('judge_user_id', user.id)

                const assignedSubmissionIds = judgeAssignments?.map(j => j.submission_id) || []
                
                if (assignedSubmissionIds.length > 0) {
                  query = query.in('submission_id', assignedSubmissionIds)
                } else {
                  return ApiResponseBuilder.paginated([], 0, page, perPage)
                }
              } else if (user.role === 'student') {
                // Students can see reviews for their own submissions (feedback only)
                const { data: userSubmissions } = await supabaseAdmin
                  .from('submissions')
                  .select('id')
                  .eq('user_id', user.id)

                const userSubmissionIds = userSubmissions?.map(s => s.id) || []
                
                if (userSubmissionIds.length > 0) {
                  query = query
                    .in('submission_id', userSubmissionIds)
                    .eq('status', 'completed') // Only completed reviews visible to students
                } else {
                  return ApiResponseBuilder.paginated([], 0, page, perPage)
                }
              }
              // Admins and super_admins see all reviews (no additional filtering)

              // Apply filters
              query = QueryHelpers.applyFilters(query, filters)

              // Apply sorting and pagination
              query = QueryHelpers.applySorting(query, sortBy, sortOrder)
              query = QueryHelpers.applyPagination(query, offset, perPage)

              const { data: reviews, error, count } = await query

              if (error) {
                console.error('Reviews query error:', error)
                return ApiResponseBuilder.serverError('Failed to fetch reviews')
              }

              // Filter sensitive data based on user role
              const filteredReviews = reviews?.map(review => {
                const filteredReview = { ...review }

                if (user.role === 'student') {
                  // Students only see feedback, not internal notes or scores
                  delete filteredReview.internal_notes
                  delete filteredReview.scores
                  delete filteredReview.time_spent_seconds
                  delete filteredReview.conflict_of_interest
                  delete filteredReview.users // Hide reviewer identity
                }

                return filteredReview
              }) || []

              return ApiResponseBuilder.paginated(
                filteredReviews,
                count || 0,
                page,
                perPage
              )

            } catch (error: any) {
              console.error('Get reviews error:', error)
              return ApiResponseBuilder.serverError('Failed to fetch reviews')
            }
          })
        })
      })
    })
  })
}

/**
 * POST /api/reviews
 * Create new review (reviewers only)
 */
export async function POST(request: NextRequest) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            return authorize('reviews', 'write')(authReq, async (authReq: AuthenticatedRequest) => {
              return validateInput(ReviewSchemas.create)(authReq, async (authReq, validatedData) => {
                try {
                  const user = authReq.user!
                  const { submission_id, round_id, scores, feedback_for_participant, internal_notes, confidence_level } = validatedData

                  // Check if submission exists and is in reviewable state
                  const { data: submission, error: submissionError } = await supabaseAdmin
                    .from('submissions')
                    .select(`
                      id,
                      status,
                      competition_id,
                      user_id,
                      competitions!inner(
                        id,
                        status,
                        judging_start_date,
                        judging_end_date
                      )
                    `)
                    .eq('id', submission_id)
                    .single()

                  if (submissionError || !submission) {
                    return ApiResponseBuilder.notFound('Submission')
                  }

                  // Check if submission is in reviewable state
                  if (!['submitted', 'in_review'].includes(submission.status)) {
                    return ApiResponseBuilder.error(
                      'Submission is not in a reviewable state',
                      400,
                      'NOT_REVIEWABLE'
                    )
                  }

                  // Check if competition is in review phase
                  const now = new Date()
                  const judgingStart = new Date(submission.competitions.judging_start_date)
                  const judgingEnd = new Date(submission.competitions.judging_end_date)

                  if (now < judgingStart || now > judgingEnd) {
                    return ApiResponseBuilder.error(
                      'Review period is not active',
                      400,
                      'REVIEW_PERIOD_INACTIVE'
                    )
                  }

                  // For non-admin users, check if they have permission to review this submission
                  if (user.role !== 'admin' && user.role !== 'super_admin') {
                    // Check if reviewer is assigned to this submission
                    const { data: existingAssignment } = await supabaseAdmin
                      .from('reviews')
                      .select('id, status')
                      .eq('submission_id', submission_id)
                      .eq('reviewer_user_id', user.id)
                      .single()

                    if (!existingAssignment) {
                      return ApiResponseBuilder.error(
                        'You are not assigned to review this submission',
                        403,
                        'NOT_ASSIGNED'
                      )
                    }

                    if (existingAssignment.status === 'completed') {
                      return ApiResponseBuilder.error(
                        'You have already completed this review',
                        400,
                        'ALREADY_REVIEWED'
                      )
                    }
                  }

                  // Check for conflict of interest
                  if (submission.user_id === user.id) {
                    return ApiResponseBuilder.error(
                      'Cannot review your own submission',
                      400,
                      'CONFLICT_OF_INTEREST'
                    )
                  }

                  // Calculate overall score from individual scores
                  const scoreValues = Object.values(scores) as number[]
                  const overall_score = scoreValues.length > 0 
                    ? scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length 
                    : 0

                  // Check if review already exists (for updates)
                  const { data: existingReview } = await supabaseAdmin
                    .from('reviews')
                    .select('id')
                    .eq('submission_id', submission_id)
                    .eq('reviewer_user_id', user.id)
                    .single()

                  let reviewData
                  if (existingReview) {
                    // Update existing review
                    const { data: updatedReview, error: updateError } = await supabaseAdmin
                      .from('reviews')
                      .update({
                        scores,
                        overall_score,
                        feedback_for_participant,
                        internal_notes,
                        confidence_level,
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        time_spent_seconds: 0 // TODO: Calculate actual time spent
                      })
                      .eq('id', existingReview.id)
                      .select(`
                        *,
                        submissions!inner(
                          title,
                          competitions!inner(name)
                        )
                      `)
                      .single()

                    if (updateError) {
                      console.error('Review update error:', updateError)
                      return ApiResponseBuilder.serverError('Failed to update review')
                    }

                    reviewData = updatedReview
                  } else {
                    // Create new review
                    const { data: newReview, error: createError } = await supabaseAdmin
                      .from('reviews')
                      .insert({
                        submission_id,
                        reviewer_user_id: user.id,
                        round_id,
                        status: 'completed',
                        overall_score,
                        scores,
                        feedback_for_participant,
                        internal_notes,
                        confidence_level,
                        started_at: new Date().toISOString(),
                        completed_at: new Date().toISOString(),
                        conflict_of_interest: false,
                        time_spent_seconds: 0 // TODO: Calculate actual time spent
                      })
                      .select(`
                        *,
                        submissions!inner(
                          title,
                          competitions!inner(name)
                        )
                      `)
                      .single()

                    if (createError) {
                      console.error('Review creation error:', createError)
                      return ApiResponseBuilder.serverError('Failed to create review')
                    }

                    reviewData = newReview
                  }

                  // Update submission status to in_review if it wasn't already
                  if (submission.status === 'submitted') {
                    await supabaseAdmin
                      .from('submissions')
                      .update({ status: 'in_review' })
                      .eq('id', submission_id)
                  }

                  // Log audit event
                  logAuditEvent({
                    userId: user.id,
                    action: existingReview ? 'review_updated' : 'review_created',
                    resource: 'reviews',
                    resourceId: reviewData.id,
                    metadata: {
                      submission_id,
                      overall_score,
                      confidence_level,
                      competition_id: submission.competition_id
                    },
                    ipAddress: getClientIP(authReq),
                    userAgent: authReq.headers.get('user-agent') || 'unknown'
                  })

                  return ApiResponseBuilder.success(
                    reviewData, 
                    existingReview ? 'Review updated successfully' : 'Review created successfully'
                  )

                } catch (error: any) {
                  console.error('Create/update review error:', error)
                  return ApiResponseBuilder.serverError('Failed to process review')
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