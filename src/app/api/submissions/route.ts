/**
 * Submission Management API Endpoints
 * 
 * GET /api/submissions - List submissions with filtering and pagination
 * POST /api/submissions - Create new submission
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ApiResponseBuilder, extractPaginationParams, extractFilterParams, extractSortParams, getClientIP, logAuditEvent, generateSubmissionNumber } from '@/lib/api/utils'
import { authenticate, rateLimit, cors, errorHandler, securityHeaders, validateInput } from '@/lib/api/middleware'
import { SubmissionSchemas } from '@/lib/api/validation'
import { QueryHelpers } from '@/lib/api/utils'
import { permissionManager } from '@/lib/auth/permissions'
import type { AuthenticatedRequest } from '@/lib/api/middleware'

/**
 * GET /api/submissions
 * List submissions with role-based filtering and permissions
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
                'title', 'status', 'submitted_at', 'last_modified_at', 'created_at'
              ])
              
              const filters = extractFilterParams(authReq.url, [
                'competition_id', 'status', 'category_id', 'user_id', 'team_id', 'search'
              ])

              // Build base query with role-based access control
              let query = supabaseAdmin
                .from('submissions')
                .select(`
                  id,
                  competition_id,
                  round_id,
                  user_id,
                  team_id,
                  title,
                  description,
                  category_id,
                  status,
                  submission_number,
                  submitted_at,
                  last_modified_at,
                  metadata,
                  version,
                  created_at,
                  competitions!inner(
                    id,
                    name,
                    status,
                    allow_team_submissions
                  ),
                  users(
                    id,
                    name,
                    email
                  ),
                  teams(
                    id,
                    name
                  )
                `, { count: 'exact' })

              // Apply role-based filtering
              if (user.role === 'student') {
                // Students can only see their own submissions and public submissions in live competitions
                query = query.or(`user_id.eq.${user.id},and(competitions.status.eq.live,status.in.(submitted,accepted,advanced,winner))`)
              } else if (user.role === 'reviewer') {
                // Reviewers see submissions they need to review
                const { data: reviewAssignments } = await supabaseAdmin
                  .from('reviews')
                  .select('submission_id')
                  .eq('reviewer_user_id', user.id)

                const assignedSubmissionIds = reviewAssignments?.map(r => r.submission_id) || []
                
                if (assignedSubmissionIds.length > 0) {
                  query = query.in('id', assignedSubmissionIds)
                } else {
                  // No assignments, return empty result
                  return ApiResponseBuilder.paginated([], 0, page, perPage)
                }
              } else if (user.role === 'judge') {
                // Judges see submissions they need to judge
                const { data: judgeAssignments } = await supabaseAdmin
                  .from('judge_assignments')
                  .select('submission_id')
                  .eq('judge_user_id', user.id)

                const assignedSubmissionIds = judgeAssignments?.map(j => j.submission_id) || []
                
                if (assignedSubmissionIds.length > 0) {
                  query = query.in('id', assignedSubmissionIds)
                } else {
                  // No assignments, return empty result
                  return ApiResponseBuilder.paginated([], 0, page, perPage)
                }
              }
              // Admins and super_admins see all submissions (no additional filtering)

              // Apply filters
              query = QueryHelpers.applyFilters(query, filters)

              // Handle search
              if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
              }

              // Apply sorting and pagination
              query = QueryHelpers.applySorting(query, sortBy, sortOrder)
              query = QueryHelpers.applyPagination(query, offset, perPage)

              const { data: submissions, error, count } = await query

              if (error) {
                console.error('Submissions query error:', error)
                return ApiResponseBuilder.serverError('Failed to fetch submissions')
              }

              return ApiResponseBuilder.paginated(
                submissions || [],
                count || 0,
                page,
                perPage
              )

            } catch (error: any) {
              console.error('Get submissions error:', error)
              return ApiResponseBuilder.serverError('Failed to fetch submissions')
            }
          })
        })
      })
    })
  })
}

/**
 * POST /api/submissions
 * Create new submission
 */
export async function POST(request: NextRequest) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            return validateInput(SubmissionSchemas.create)(authReq, async (authReq, validatedData) => {
              try {
                const user = authReq.user!
                const { competition_id, title, description, category_id, team_id, metadata } = validatedData

                // Check if competition exists and is open for submissions
                const { data: competition, error: competitionError } = await supabaseAdmin
                  .from('competitions')
                  .select('*')
                  .eq('id', competition_id)
                  .single()

                if (competitionError || !competition) {
                  return ApiResponseBuilder.notFound('Competition')
                }

                if (competition.status !== 'open') {
                  return ApiResponseBuilder.error(
                    'Competition is not open for submissions',
                    400,
                    'COMPETITION_NOT_OPEN'
                  )
                }

                // Check submission deadline
                const now = new Date()
                const deadline = new Date(competition.submission_deadline)
                if (now > deadline) {
                  return ApiResponseBuilder.error(
                    'Submission deadline has passed',
                    400,
                    'DEADLINE_PASSED'
                  )
                }

                // Validate team submission logic
                if (team_id) {
                  if (!competition.allow_team_submissions) {
                    return ApiResponseBuilder.error(
                      'Team submissions are not allowed for this competition',
                      400,
                      'TEAM_SUBMISSIONS_NOT_ALLOWED'
                    )
                  }

                  // Check if user is a member of the team
                  const { data: teamMember, error: teamError } = await supabaseAdmin
                    .from('team_members')
                    .select('role')
                    .eq('team_id', team_id)
                    .eq('user_id', user.id)
                    .is('removed_at', null)
                    .single()

                  if (teamError || !teamMember) {
                    return ApiResponseBuilder.error(
                      'You are not a member of this team',
                      403,
                      'NOT_TEAM_MEMBER'
                    )
                  }
                }

                // Check submission limits
                const { data: existingSubmissions } = await supabaseAdmin
                  .from('submissions')
                  .select('id')
                  .eq('competition_id', competition_id)
                  .eq('user_id', user.id)

                if (existingSubmissions && existingSubmissions.length >= competition.max_submissions_per_user) {
                  return ApiResponseBuilder.error(
                    `Maximum ${competition.max_submissions_per_user} submissions per user allowed`,
                    400,
                    'SUBMISSION_LIMIT_EXCEEDED'
                  )
                }

                // Generate submission number
                const { count: submissionCount } = await supabaseAdmin
                  .from('submissions')
                  .select('*', { count: 'exact', head: true })
                  .eq('competition_id', competition_id)

                const submissionNumber = generateSubmissionNumber(competition_id, (submissionCount || 0) + 1)

                // Create submission
                const { data: submission, error: createError } = await supabaseAdmin
                  .from('submissions')
                  .insert({
                    competition_id,
                    user_id: user.id,
                    team_id: team_id || null,
                    title,
                    description,
                    category_id,
                    status: 'draft',
                    submission_number: submissionNumber,
                    metadata,
                    version: 1,
                    last_modified_at: new Date().toISOString(),
                    ip_address: getClientIP(authReq),
                    browser_fingerprint: '', // TODO: implement browser fingerprinting
                    created_at: new Date().toISOString()
                  })
                  .select(`
                    *,
                    competitions!inner(name, status),
                    users(name, email)
                  `)
                  .single()

                if (createError) {
                  console.error('Submission creation error:', createError)
                  return ApiResponseBuilder.serverError('Failed to create submission')
                }

                // Log audit event
                logAuditEvent({
                  userId: user.id,
                  action: 'submission_created',
                  resource: 'submissions',
                  resourceId: submission.id,
                  metadata: {
                    competition_id,
                    title,
                    submission_number: submissionNumber,
                    is_team_submission: !!team_id
                  },
                  ipAddress: getClientIP(authReq),
                  userAgent: authReq.headers.get('user-agent') || 'unknown'
                })

                return ApiResponseBuilder.success(submission, 'Submission created successfully')

              } catch (error: any) {
                console.error('Create submission error:', error)
                return ApiResponseBuilder.serverError('Failed to create submission')
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