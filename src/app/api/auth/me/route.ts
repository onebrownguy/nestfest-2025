/**
 * Authentication Current User API Endpoint
 * 
 * GET /api/auth/me
 * Returns current user information and session status
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ApiResponseBuilder, getClientIP } from '@/lib/api/utils'
import { authenticate, rateLimit, cors, errorHandler, securityHeaders } from '@/lib/api/middleware'
import { permissionManager } from '@/lib/auth/permissions'
import type { AuthenticatedRequest } from '@/lib/api/middleware'

export async function GET(request: NextRequest) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            try {
              const user = authReq.user!
              
              // Get fresh user data from database
              const { data: userData, error: userError } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()

              if (userError || !userData) {
                return ApiResponseBuilder.error('User not found', 404, 'USER_NOT_FOUND')
              }

              // Check if account is still active
              if (userData.status !== 'active') {
                return ApiResponseBuilder.error(
                  `Account is ${userData.status}`,
                  403,
                  'ACCOUNT_INACTIVE'
                )
              }

              // Get user's contextual permissions
              const permissions = permissionManager.getContextualPermissions(
                userData.role,
                userData.id,
                {
                  currentRoute: req.headers.get('referer') || undefined
                }
              )

              // Get user's team memberships if they're a student
              let teamMemberships: any[] = []
              if (userData.role === 'student') {
                const { data: teams, error: teamsError } = await supabaseAdmin
                  .from('team_members')
                  .select(`
                    id,
                    team_id,
                    role,
                    joined_at,
                    teams!inner (
                      id,
                      name,
                      code,
                      is_locked,
                      max_members
                    )
                  `)
                  .eq('user_id', userData.id)
                  .is('removed_at', null)

                if (!teamsError && teams) {
                  teamMemberships = teams
                }
              }

              // Get judge/reviewer assignments if applicable
              let assignments = {}
              if (userData.role === 'judge') {
                const { data: judgeAssignments } = await supabaseAdmin
                  .from('judge_assignments')
                  .select('competition_id, round_id, due_date')
                  .eq('judge_user_id', userData.id)
                  .is('completed_at', null)

                assignments = { 
                  judge_assignments: judgeAssignments || [] 
                }
              } else if (userData.role === 'reviewer') {
                const { data: reviewAssignments } = await supabaseAdmin
                  .from('reviews')
                  .select('submission_id, round_id, status')
                  .eq('reviewer_user_id', userData.id)
                  .in('status', ['assigned', 'in_progress'])

                assignments = { 
                  review_assignments: reviewAssignments || [] 
                }
              }

              // Prepare comprehensive user data
              const responseData = {
                user: {
                  id: userData.id,
                  email: userData.email,
                  name: userData.name,
                  role: userData.role,
                  status: userData.status,
                  university: userData.university,
                  graduation_year: userData.graduation_year,
                  program: userData.program,
                  phone_number: userData.phone_number,
                  timezone: userData.timezone,
                  avatar_url: userData.avatar_url,
                  email_verified_at: userData.email_verified_at,
                  last_login_at: userData.last_login_at,
                  created_at: userData.created_at,
                  updated_at: userData.updated_at
                },
                permissions,
                teams: teamMemberships,
                assignments,
                session_info: {
                  ip_address: getClientIP(authReq),
                  user_agent: authReq.headers.get('user-agent') || 'unknown',
                  last_activity: new Date().toISOString()
                }
              }

              return ApiResponseBuilder.success(responseData)

            } catch (error: any) {
              console.error('Get current user error:', error)
              return ApiResponseBuilder.serverError('Failed to retrieve user information')
            }
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