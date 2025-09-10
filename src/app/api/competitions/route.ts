/**
 * Competition Management API Endpoints
 * 
 * GET /api/competitions - List competitions with filtering and pagination
 * POST /api/competitions - Create new competition (admin only)
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ApiResponseBuilder, extractPaginationParams, extractFilterParams, extractSortParams, getClientIP, logAuditEvent, generateSlug } from '@/lib/api/utils'
import { authenticate, authorize, rateLimit, cors, errorHandler, securityHeaders, validateInput } from '@/lib/api/middleware'
import { CompetitionSchemas } from '@/lib/api/validation'
import { QueryHelpers } from '@/lib/api/utils'
import type { AuthenticatedRequest } from '@/lib/api/middleware'

/**
 * GET /api/competitions
 * List competitions with filtering, pagination, and role-based access
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
                'name', 'start_date', 'submission_deadline', 'event_date', 'created_at'
              ])
              
              const filters = extractFilterParams(authReq.url, [
                'status', 'voting_enabled', 'public_voting_enabled', 'search'
              ])

              // Build base query
              let query = supabaseAdmin
                .from('competitions')
                .select(`
                  id,
                  name,
                  slug,
                  description,
                  rules_document_url,
                  start_date,
                  submission_deadline,
                  judging_start_date,
                  judging_end_date,
                  event_date,
                  status,
                  max_submissions_per_user,
                  allow_team_submissions,
                  team_size_min,
                  team_size_max,
                  voting_enabled,
                  public_voting_enabled,
                  config,
                  created_at
                `, { count: 'exact' })

              // Apply role-based filtering
              if (user.role === 'student') {
                // Students can only see public competitions
                query = query.in('status', ['open', 'live', 'completed'])
              } else if (user.role === 'judge') {
                // Judges see competitions they're assigned to + public ones
                // TODO: Add join with judge_assignments
                query = query.in('status', ['open', 'reviewing', 'judging', 'live', 'completed'])
              } else if (user.role === 'reviewer') {
                // Reviewers see competitions they're assigned to + public ones
                query = query.in('status', ['open', 'reviewing', 'judging', 'live', 'completed'])
              }
              // Admins and super_admins see all competitions (no additional filtering)

              // Apply filters
              query = QueryHelpers.applyFilters(query, filters)

              // Handle search
              if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
              }

              // Apply sorting and pagination
              query = QueryHelpers.applySorting(query, sortBy, sortOrder)
              query = QueryHelpers.applyPagination(query, offset, perPage)

              const { data: competitions, error, count } = await query

              if (error) {
                console.error('Competition query error:', error)
                return ApiResponseBuilder.serverError('Failed to fetch competitions')
              }

              return ApiResponseBuilder.paginated(
                competitions || [],
                count || 0,
                page,
                perPage
              )

            } catch (error: any) {
              console.error('Get competitions error:', error)
              return ApiResponseBuilder.serverError('Failed to fetch competitions')
            }
          })
        })
      })
    })
  })
}

/**
 * POST /api/competitions
 * Create new competition (admin only)
 */
export async function POST(request: NextRequest) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            return authorize('competitions', 'admin')(authReq, async (authReq: AuthenticatedRequest) => {
              return validateInput(CompetitionSchemas.create)(authReq, async (authReq, validatedData) => {
                try {
                  const user = authReq.user!
                  
                  // Check if slug is unique
                  const { data: existingCompetition } = await supabaseAdmin
                    .from('competitions')
                    .select('id')
                    .eq('slug', validatedData.slug)
                    .single()

                  if (existingCompetition) {
                    return ApiResponseBuilder.error(
                      'A competition with this slug already exists',
                      409,
                      'SLUG_EXISTS'
                    )
                  }

                  // Validate date logic
                  const now = new Date()
                  const startDate = new Date(validatedData.start_date)
                  
                  if (startDate < now) {
                    return ApiResponseBuilder.error(
                      'Competition start date must be in the future',
                      400,
                      'INVALID_START_DATE'
                    )
                  }

                  // Create competition
                  const { data: competition, error: createError } = await supabaseAdmin
                    .from('competitions')
                    .insert({
                      ...validatedData,
                      status: 'draft', // Always start as draft
                      created_at: new Date().toISOString()
                    })
                    .select()
                    .single()

                  if (createError) {
                    console.error('Competition creation error:', createError)
                    return ApiResponseBuilder.serverError('Failed to create competition')
                  }

                  // Create default competition round
                  const { error: roundError } = await supabaseAdmin
                    .from('competition_rounds')
                    .insert({
                      competition_id: competition.id,
                      round_number: 1,
                      name: 'Main Round',
                      start_date: validatedData.start_date,
                      end_date: validatedData.event_date,
                      advancement_type: 'automatic',
                      scoring_criteria: [],
                      is_public_voting_round: validatedData.public_voting_enabled
                    })

                  if (roundError) {
                    console.warn('Failed to create default round:', roundError)
                  }

                  // Log audit event
                  logAuditEvent({
                    userId: user.id,
                    action: 'competition_created',
                    resource: 'competitions',
                    resourceId: competition.id,
                    metadata: {
                      name: competition.name,
                      slug: competition.slug,
                      start_date: competition.start_date
                    },
                    ipAddress: getClientIP(authReq),
                    userAgent: authReq.headers.get('user-agent') || 'unknown'
                  })

                  return ApiResponseBuilder.success(competition, 'Competition created successfully')

                } catch (error: any) {
                  console.error('Create competition error:', error)
                  return ApiResponseBuilder.serverError('Failed to create competition')
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