/**
 * Voting Results API Endpoint
 * 
 * GET /api/votes/results - Get voting results for a competition
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ApiResponseBuilder, extractFilterParams } from '@/lib/api/utils'
import { authenticate, rateLimit, cors, errorHandler, securityHeaders } from '@/lib/api/middleware'
import { QuadraticVotingEngine } from '@/lib/voting/quadratic'
import type { AuthenticatedRequest } from '@/lib/api/middleware'

/**
 * GET /api/votes/results
 * Get voting results with role-based access control
 */
export async function GET(request: NextRequest) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            try {
              const user = authReq.user!
              
              const filters = extractFilterParams(authReq.url, [
                'competition_id', 'round_id', 'include_breakdown'
              ])

              if (!filters.competition_id) {
                return ApiResponseBuilder.error('Competition ID is required', 400, 'MISSING_COMPETITION_ID')
              }

              // Get competition details
              const { data: competition, error: competitionError } = await supabaseAdmin
                .from('competitions')
                .select(`
                  id,
                  name,
                  status,
                  voting_enabled,
                  public_voting_enabled,
                  config
                `)
                .eq('id', filters.competition_id)
                .single()

              if (competitionError || !competition) {
                return ApiResponseBuilder.notFound('Competition')
              }

              // Check access permissions
              const canViewResults = checkResultsAccess(user, competition)
              if (!canViewResults.allowed) {
                return ApiResponseBuilder.forbidden(canViewResults.reason || 'Access denied')
              }

              // Get all valid votes for the competition
              let votesQuery = supabaseAdmin
                .from('votes')
                .select(`
                  id,
                  submission_id,
                  voter_user_id,
                  vote_type,
                  vote_data,
                  weight,
                  voted_at,
                  is_valid,
                  submissions!inner(
                    id,
                    title,
                    status,
                    user_id,
                    users!inner(name)
                  )
                `)
                .eq('competition_id', filters.competition_id)
                .eq('is_valid', true)

              if (filters.round_id) {
                // TODO: Filter by round when round_id is available in votes table
              }

              const { data: votes, error: votesError } = await votesQuery

              if (votesError) {
                console.error('Votes query error:', votesError)
                return ApiResponseBuilder.serverError('Failed to fetch votes')
              }

              // Calculate results based on voting type
              const votingType = competition.config?.voting_rules?.type || 'simple'
              const results = await calculateResults(votes || [], votingType, competition.config)

              // Prepare response data
              const responseData: any = {
                competition_id: filters.competition_id,
                competition_name: competition.name,
                voting_type: votingType,
                results,
                metadata: {
                  total_votes: votes?.length || 0,
                  total_voters: new Set(votes?.map(v => v.voter_user_id)).size || 0,
                  last_updated: new Date().toISOString()
                }
              }

              // Add breakdown if requested and user has permission
              if (filters.include_breakdown === 'true' && 
                  (user.role === 'admin' || user.role === 'super_admin')) {
                responseData.breakdown = await getDetailedBreakdown(votes || [], votingType)
              }

              return ApiResponseBuilder.success(responseData)

            } catch (error: any) {
              console.error('Get voting results error:', error)
              return ApiResponseBuilder.serverError('Failed to fetch voting results')
            }
          })
        })
      })
    })
  })
}

/**
 * Check if user can view results
 */
function checkResultsAccess(user: any, competition: any): { allowed: boolean; reason?: string } {
  // Admin and super_admin can always view results
  if (user.role === 'admin' || user.role === 'super_admin') {
    return { allowed: true }
  }

  // Judges can view results during judging and after
  if (user.role === 'judge' && ['judging', 'live', 'completed'].includes(competition.status)) {
    return { allowed: true }
  }

  // Students and reviewers can view results after competition is live
  if (['student', 'reviewer'].includes(user.role) && 
      ['live', 'completed'].includes(competition.status) &&
      competition.public_voting_enabled) {
    return { allowed: true }
  }

  // Results are private during review phase
  if (competition.status === 'reviewing') {
    return { allowed: false, reason: 'Results are not available during review phase' }
  }

  return { allowed: false, reason: 'You do not have permission to view results for this competition' }
}

/**
 * Calculate results based on voting type
 */
async function calculateResults(votes: any[], votingType: string, config: any) {
  switch (votingType) {
    case 'simple':
      return calculateSimpleResults(votes)
    case 'quadratic':
      return calculateQuadraticResults(votes)
    case 'ranked':
      return calculateRankedResults(votes, config)
    case 'approval':
      return calculateApprovalResults(votes)
    default:
      return calculateSimpleResults(votes)
  }
}

/**
 * Calculate simple voting results
 */
function calculateSimpleResults(votes: any[]) {
  const submissionScores: Record<string, {
    submission_id: string
    title: string
    author: string
    total_score: number
    vote_count: number
    average_score: number
  }> = {}

  // Group votes by submission
  for (const vote of votes) {
    if (!vote.submission_id) continue

    const submissionId = vote.submission_id
    const score = vote.vote_data?.value || 0

    if (!submissionScores[submissionId]) {
      submissionScores[submissionId] = {
        submission_id: submissionId,
        title: vote.submissions.title,
        author: vote.submissions.users.name,
        total_score: 0,
        vote_count: 0,
        average_score: 0
      }
    }

    submissionScores[submissionId].total_score += score
    submissionScores[submissionId].vote_count += 1
  }

  // Calculate averages and sort by score
  const results = Object.values(submissionScores)
    .map(submission => ({
      ...submission,
      average_score: submission.vote_count > 0 ? submission.total_score / submission.vote_count : 0
    }))
    .sort((a, b) => b.average_score - a.average_score)

  return results.map((result, index) => ({
    ...result,
    rank: index + 1
  }))
}

/**
 * Calculate quadratic voting results
 */
function calculateQuadraticResults(votes: any[]) {
  const quadraticEngine = new QuadraticVotingEngine()
  
  const voteData = votes
    .filter(vote => vote.submission_id)
    .map(vote => ({
      submission_id: vote.submission_id,
      vote_count: vote.vote_data?.vote_count || 0,
      weight: vote.weight || 1
    }))

  const scores = quadraticEngine.calculateQuadraticScores(voteData)
  
  // Group by submission for display
  const submissionScores: Record<string, {
    submission_id: string
    title: string
    author: string
    quadratic_score: number
    total_votes: number
    total_credits: number
  }> = {}

  for (const vote of votes) {
    if (!vote.submission_id) continue

    const submissionId = vote.submission_id
    if (!submissionScores[submissionId]) {
      submissionScores[submissionId] = {
        submission_id: submissionId,
        title: vote.submissions.title,
        author: vote.submissions.users.name,
        quadratic_score: scores[submissionId] || 0,
        total_votes: 0,
        total_credits: 0
      }
    }

    submissionScores[submissionId].total_votes += vote.vote_data?.vote_count || 0
    submissionScores[submissionId].total_credits += vote.vote_data?.credits_spent || 0
  }

  return Object.values(submissionScores)
    .sort((a, b) => b.quadratic_score - a.quadratic_score)
    .map((result, index) => ({
      ...result,
      rank: index + 1
    }))
}

/**
 * Calculate ranked voting results using Borda count
 */
function calculateRankedResults(votes: any[], config: any) {
  const submissionPoints: Record<string, number> = {}
  const submissionInfo: Record<string, { title: string; author: string }> = {}
  
  // Collect all submissions from votes
  const allSubmissions = new Set<string>()
  votes.forEach(vote => {
    vote.vote_data?.rankings?.forEach((ranking: any) => {
      allSubmissions.add(ranking.submission_id)
    })
  })

  const totalSubmissions = allSubmissions.size

  for (const vote of votes) {
    const rankings = vote.vote_data?.rankings || []
    
    for (const ranking of rankings) {
      const submissionId = ranking.submission_id
      
      // Borda count: higher rank = more points
      // If there are N submissions, rank 1 gets N points, rank 2 gets N-1 points, etc.
      const points = totalSubmissions - ranking.rank + 1
      
      submissionPoints[submissionId] = (submissionPoints[submissionId] || 0) + points
      
      // Store submission info (assuming it's available in the vote data structure)
      if (!submissionInfo[submissionId]) {
        submissionInfo[submissionId] = {
          title: 'Unknown', // This would need to be fetched separately
          author: 'Unknown'
        }
      }
    }
  }

  return Object.entries(submissionPoints)
    .map(([submission_id, points]) => ({
      submission_id,
      title: submissionInfo[submission_id]?.title || 'Unknown',
      author: submissionInfo[submission_id]?.author || 'Unknown',
      borda_points: points,
      total_rankings: votes.filter(v => 
        v.vote_data?.rankings?.some((r: any) => r.submission_id === submission_id)
      ).length
    }))
    .sort((a, b) => b.borda_points - a.borda_points)
    .map((result, index) => ({
      ...result,
      rank: index + 1
    }))
}

/**
 * Calculate approval voting results
 */
function calculateApprovalResults(votes: any[]) {
  const submissionApprovals: Record<string, number> = {}
  const submissionInfo: Record<string, { title: string; author: string }> = {}

  for (const vote of votes) {
    const approvedSubmissions = vote.vote_data?.approved_submissions || []
    
    for (const submissionId of approvedSubmissions) {
      submissionApprovals[submissionId] = (submissionApprovals[submissionId] || 0) + 1
      
      if (!submissionInfo[submissionId]) {
        submissionInfo[submissionId] = {
          title: 'Unknown', // This would need to be fetched separately
          author: 'Unknown'
        }
      }
    }
  }

  const totalVoters = new Set(votes.map(v => v.voter_user_id)).size

  return Object.entries(submissionApprovals)
    .map(([submission_id, approvals]) => ({
      submission_id,
      title: submissionInfo[submission_id]?.title || 'Unknown',
      author: submissionInfo[submission_id]?.author || 'Unknown',
      approval_count: approvals,
      approval_percentage: totalVoters > 0 ? (approvals / totalVoters) * 100 : 0
    }))
    .sort((a, b) => b.approval_count - a.approval_count)
    .map((result, index) => ({
      ...result,
      rank: index + 1
    }))
}

/**
 * Get detailed breakdown for admin view
 */
async function getDetailedBreakdown(votes: any[], votingType: string) {
  const breakdown: any = {
    vote_distribution: {},
    voter_demographics: {},
    temporal_analysis: {}
  }

  // Vote distribution by submission
  const submissionVotes: Record<string, number> = {}
  votes.forEach(vote => {
    if (vote.submission_id) {
      submissionVotes[vote.submission_id] = (submissionVotes[vote.submission_id] || 0) + 1
    }
  })
  breakdown.vote_distribution = submissionVotes

  // Temporal analysis - votes over time
  const hourlyVotes: Record<string, number> = {}
  votes.forEach(vote => {
    const hour = new Date(vote.voted_at).getHours().toString()
    hourlyVotes[hour] = (hourlyVotes[hour] || 0) + 1
  })
  breakdown.temporal_analysis = {
    votes_by_hour: hourlyVotes,
    peak_hour: Object.entries(hourlyVotes).sort(([,a], [,b]) => b - a)[0]?.[0] || '0'
  }

  return breakdown
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return cors(request, async () => {
    return new Response(null, { status: 200 })
  })
}