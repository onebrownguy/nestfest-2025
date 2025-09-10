/**
 * Review Management API Endpoints - Individual Review
 * 
 * GET /api/reviews/[id] - Get review details
 * PUT /api/reviews/[id] - Update review
 * DELETE /api/reviews/[id] - Delete review (admin only)
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ApiResponseBuilder, getClientIP, logAuditEvent, isValidUUID } from '@/lib/api/utils'
import { authenticate, authorize, rateLimit, cors, errorHandler, securityHeaders, validateInput } from '@/lib/api/middleware'
import { ReviewSchemas } from '@/lib/api/validation'
import type { AuthenticatedRequest } from '@/lib/api/middleware'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/reviews/[id]
 * Get review details with role-based access control
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            try {
              const user = authReq.user!
              const reviewId = params.id

              if (!isValidUUID(reviewId)) {
                return ApiResponseBuilder.error('Invalid review ID', 400, 'INVALID_ID')
              }

              // Get review details
              const { data: review, error } = await supabaseAdmin
                .from('reviews')
                .select(`
                  *,
                  submissions!inner(
                    id,
                    title,
                    description,
                    status,
                    user_id,
                    competition_id,
                    competitions!inner(
                      id,
                      name,
                      status
                    ),
                    users!inner(
                      id,
                      name,
                      email
                    )
                  ),
                  users!reviewer_user_id(
                    id,
                    name,
                    email
                  )
                `)
                .eq('id', reviewId)
                .single()

              if (error || !review) {
                return ApiResponseBuilder.notFound('Review')
              }

              // Check access permissions
              const canAccess = checkReviewAccess(user, review)
              if (!canAccess.allowed) {
                return ApiResponseBuilder.forbidden(canAccess.reason || 'Access denied')
              }

              // Filter sensitive data based on user role
              const filteredReview = { ...review }

              if (user.role === 'student') {
                // Students only see feedback, not internal notes, scores details, or reviewer info
                delete filteredReview.internal_notes
                delete filteredReview.scores
                delete filteredReview.time_spent_seconds
                delete filteredReview.conflict_of_interest
                delete filteredReview.users // Hide reviewer identity
                
                // Only show completed reviews to students
                if (filteredReview.status !== 'completed') {
                  return ApiResponseBuilder.notFound('Review')
                }
              }

              return ApiResponseBuilder.success(filteredReview)

            } catch (error: any) {
              console.error('Get review error:', error)
              return ApiResponseBuilder.serverError('Failed to fetch review')
            }
          })
        })
      })
    })
  })
}

/**
 * PUT /api/reviews/[id]
 * Update review details
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            return validateInput(ReviewSchemas.update)(authReq, async (authReq, validatedData) => {
              try {
                const user = authReq.user!
                const reviewId = params.id

                if (!isValidUUID(reviewId)) {
                  return ApiResponseBuilder.error('Invalid review ID', 400, 'INVALID_ID')
                }

                // Get existing review
                const { data: existingReview, error: fetchError } = await supabaseAdmin
                  .from('reviews')
                  .select(`
                    *,
                    submissions!inner(
                      competition_id,
                      competitions!inner(
                        judging_end_date,
                        status
                      )
                    )
                  `)
                  .eq('id', reviewId)
                  .single()

                if (fetchError || !existingReview) {
                  return ApiResponseBuilder.notFound('Review')
                }

                // Check permissions - only the reviewer or admin can update
                if (existingReview.reviewer_user_id !== user.id && 
                    user.role !== 'admin' && 
                    user.role !== 'super_admin') {
                  return ApiResponseBuilder.forbidden('You can only update your own reviews')
                }

                // Check if review period is still active
                const now = new Date()
                const judgingEnd = new Date(existingReview.submissions.competitions.judging_end_date)
                
                if (now > judgingEnd && user.role !== 'admin' && user.role !== 'super_admin') {
                  return ApiResponseBuilder.error(
                    'Review period has ended',
                    400,
                    'REVIEW_PERIOD_ENDED'
                  )
                }

                // Calculate overall score if scores are being updated
                let overall_score = existingReview.overall_score
                if (validatedData.scores) {
                  const scoreValues = Object.values(validatedData.scores) as number[]
                  overall_score = scoreValues.length > 0 
                    ? scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length 
                    : 0
                }

                // Update review
                const updateData = {
                  ...validatedData,
                  overall_score,
                  completed_at: validatedData.status === 'completed' 
                    ? new Date().toISOString() 
                    : existingReview.completed_at
                }

                const { data: updatedReview, error: updateError } = await supabaseAdmin
                  .from('reviews')
                  .update(updateData)
                  .eq('id', reviewId)
                  .select(`
                    *,
                    submissions!inner(
                      title,
                      competitions!inner(name)
                    ),
                    users!reviewer_user_id(
                      name,
                      email
                    )
                  `)
                  .single()

                if (updateError) {
                  console.error('Review update error:', updateError)
                  return ApiResponseBuilder.serverError('Failed to update review')
                }

                // Log audit event
                logAuditEvent({
                  userId: user.id,
                  action: 'review_updated',
                  resource: 'reviews',
                  resourceId: reviewId,
                  metadata: {
                    changes: validatedData,
                    overall_score,
                    previous_status: existingReview.status,
                    new_status: validatedData.status || existingReview.status
                  },
                  ipAddress: getClientIP(authReq),
                  userAgent: authReq.headers.get('user-agent') || 'unknown'
                })

                return ApiResponseBuilder.success(updatedReview, 'Review updated successfully')

              } catch (error: any) {
                console.error('Update review error:', error)
                return ApiResponseBuilder.serverError('Failed to update review')
              }
            })
          })
        })
      })
    })
  })
}

/**
 * DELETE /api/reviews/[id]
 * Delete review (admin only, or reviewer for incomplete reviews)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            try {
              const user = authReq.user!
              const reviewId = params.id

              if (!isValidUUID(reviewId)) {
                return ApiResponseBuilder.error('Invalid review ID', 400, 'INVALID_ID')
              }

              // Get review details
              const { data: review, error: fetchError } = await supabaseAdmin
                .from('reviews')
                .select(`
                  *,
                  submissions!inner(
                    id,
                    title,
                    competition_id
                  )
                `)
                .eq('id', reviewId)
                .single()

              if (fetchError || !review) {
                return ApiResponseBuilder.notFound('Review')
              }

              // Check permissions
              const isReviewer = review.reviewer_user_id === user.id
              const isAdmin = user.role === 'admin' || user.role === 'super_admin'

              if (!isAdmin && !isReviewer) {
                return ApiResponseBuilder.forbidden('You cannot delete this review')
              }

              // Non-admins can only delete incomplete reviews
              if (!isAdmin && review.status === 'completed') {
                return ApiResponseBuilder.error(
                  'Cannot delete completed reviews',
                  400,
                  'CANNOT_DELETE_COMPLETED'
                )
              }

              // Delete the review
              const { error: deleteError } = await supabaseAdmin
                .from('reviews')
                .delete()
                .eq('id', reviewId)

              if (deleteError) {
                console.error('Review deletion error:', deleteError)
                return ApiResponseBuilder.serverError('Failed to delete review')
              }

              // Log audit event
              logAuditEvent({
                userId: user.id,
                action: 'review_deleted',
                resource: 'reviews',
                resourceId: reviewId,
                metadata: {
                  submission_id: review.submission_id,
                  submission_title: review.submissions.title,
                  reviewer_user_id: review.reviewer_user_id,
                  status: review.status
                },
                ipAddress: getClientIP(authReq),
                userAgent: authReq.headers.get('user-agent') || 'unknown'
              })

              return ApiResponseBuilder.success(
                { deleted_id: reviewId },
                'Review deleted successfully'
              )

            } catch (error: any) {
              console.error('Delete review error:', error)
              return ApiResponseBuilder.serverError('Failed to delete review')
            }
          })
        })
      })
    })
  })
}

// Helper function to check review access
function checkReviewAccess(user: any, review: any): { allowed: boolean; reason?: string } {
  // Admin and super_admin can access all reviews
  if (user.role === 'admin' || user.role === 'super_admin') {
    return { allowed: true }
  }

  // Reviewer can access their own reviews
  if (user.role === 'reviewer' && review.reviewer_user_id === user.id) {
    return { allowed: true }
  }

  // Student can access reviews of their own submissions (completed only)
  if (user.role === 'student' && 
      review.submissions.user_id === user.id && 
      review.status === 'completed') {
    return { allowed: true }
  }

  // Judges can access reviews for submissions they're judging
  if (user.role === 'judge') {
    // TODO: Check judge assignments
    // For now, allow access
    return { allowed: true }
  }

  return { allowed: false, reason: 'You do not have access to this review' }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return cors(request, async () => {
    return new Response(null, { status: 200 })
  })
}