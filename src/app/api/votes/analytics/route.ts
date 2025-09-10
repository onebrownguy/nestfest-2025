/**
 * Voting Analytics API Endpoint
 * 
 * GET /api/votes/analytics - Get voting analytics and insights
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ApiResponseBuilder, extractFilterParams } from '@/lib/api/utils'
import { authenticate, authorize, rateLimit, cors, errorHandler, securityHeaders } from '@/lib/api/middleware'
import { QuadraticVotingEngine } from '@/lib/voting/quadratic'
import type { AuthenticatedRequest } from '@/lib/api/middleware'

/**
 * GET /api/votes/analytics
 * Get comprehensive voting analytics (admin/judge only)
 */
export async function GET(request: NextRequest) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            return authorize('votes', 'read')(authReq, async (authReq: AuthenticatedRequest) => {
              try {
                const user = authReq.user!
                
                const filters = extractFilterParams(authReq.url, [
                  'competition_id', 'round_id', 'start_date', 'end_date', 'include_invalid'
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

                // Build votes query with filters
                let votesQuery = supabaseAdmin
                  .from('votes')
                  .select(`
                    id,
                    submission_id,
                    voter_user_id,
                    voter_session_id,
                    vote_type,
                    vote_data,
                    weight,
                    ip_address,
                    user_agent,
                    voted_at,
                    is_valid,
                    submissions(
                      id,
                      title,
                      user_id,
                      users(name, university)
                    )
                  `)
                  .eq('competition_id', filters.competition_id)

                if (!filters.include_invalid) {
                  votesQuery = votesQuery.eq('is_valid', true)
                }

                if (filters.start_date) {
                  votesQuery = votesQuery.gte('voted_at', filters.start_date)
                }

                if (filters.end_date) {
                  votesQuery = votesQuery.lte('voted_at', filters.end_date)
                }

                const { data: votes, error: votesError } = await votesQuery

                if (votesError) {
                  console.error('Votes analytics query error:', votesError)
                  return ApiResponseBuilder.serverError('Failed to fetch voting data')
                }

                // Calculate comprehensive analytics
                const analytics = await calculateVotingAnalytics(votes || [], competition)

                // Add anomaly detection for admin users
                if (user.role === 'admin' || user.role === 'super_admin') {
                  const quadraticEngine = new QuadraticVotingEngine()
                  const anomalies = quadraticEngine.detectAnomalies(
                    votes?.map(v => ({
                      voter_id: v.voter_user_id || v.voter_session_id || 'anonymous',
                      submission_id: v.submission_id || '',
                      vote_count: v.vote_data?.vote_count || v.vote_data?.value || 1,
                      credits_spent: v.vote_data?.credits_spent || 1,
                      timestamp: v.voted_at,
                      ip_address: v.ip_address
                    })) || []
                  )

                  analytics.anomaly_detection = anomalies
                }

                const responseData = {
                  competition_id: filters.competition_id,
                  competition_name: competition.name,
                  voting_type: competition.config?.voting_rules?.type || 'simple',
                  analytics_period: {
                    start_date: filters.start_date || votes?.[0]?.voted_at,
                    end_date: filters.end_date || votes?.[votes.length - 1]?.voted_at,
                    generated_at: new Date().toISOString()
                  },
                  ...analytics
                }

                return ApiResponseBuilder.success(responseData)

              } catch (error: any) {
                console.error('Get voting analytics error:', error)
                return ApiResponseBuilder.serverError('Failed to generate voting analytics')
              }
            })
          })
        })
      })
    })
  })
}

/**
 * Calculate comprehensive voting analytics
 */
async function calculateVotingAnalytics(votes: any[], competition: any) {
  const analytics: any = {
    overview: calculateOverviewStats(votes),
    participation: calculateParticipationStats(votes),
    temporal: calculateTemporalStats(votes),
    demographic: calculateDemographicStats(votes),
    voting_patterns: calculateVotingPatterns(votes, competition.config?.voting_rules?.type || 'simple'),
    engagement: calculateEngagementMetrics(votes),
    quality: calculateQualityMetrics(votes)
  }

  return analytics
}

/**
 * Calculate overview statistics
 */
function calculateOverviewStats(votes: any[]) {
  const uniqueVoters = new Set(votes.map(v => v.voter_user_id || v.voter_session_id)).size
  const uniqueSubmissions = new Set(votes.filter(v => v.submission_id).map(v => v.submission_id)).size
  const totalVotes = votes.length
  const validVotes = votes.filter(v => v.is_valid).length
  const invalidVotes = totalVotes - validVotes

  return {
    total_votes: totalVotes,
    valid_votes: validVotes,
    invalid_votes: invalidVotes,
    validity_rate: totalVotes > 0 ? (validVotes / totalVotes) * 100 : 0,
    unique_voters: uniqueVoters,
    unique_submissions_voted: uniqueSubmissions,
    average_votes_per_voter: uniqueVoters > 0 ? totalVotes / uniqueVoters : 0
  }
}

/**
 * Calculate participation statistics
 */
function calculateParticipationStats(votes: any[]) {
  const voterParticipation: Record<string, number> = {}
  const submissionVotes: Record<string, number> = {}

  votes.forEach(vote => {
    const voterId = vote.voter_user_id || vote.voter_session_id || 'anonymous'
    voterParticipation[voterId] = (voterParticipation[voterId] || 0) + 1

    if (vote.submission_id) {
      submissionVotes[vote.submission_id] = (submissionVotes[vote.submission_id] || 0) + 1
    }
  })

  const participationLevels = Object.values(voterParticipation)
  const submissionVoteCounts = Object.values(submissionVotes)

  return {
    voter_participation_distribution: {
      min_votes_per_voter: Math.min(...participationLevels),
      max_votes_per_voter: Math.max(...participationLevels),
      median_votes_per_voter: calculateMedian(participationLevels),
      std_deviation: calculateStandardDeviation(participationLevels)
    },
    submission_vote_distribution: {
      min_votes_per_submission: submissionVoteCounts.length > 0 ? Math.min(...submissionVoteCounts) : 0,
      max_votes_per_submission: submissionVoteCounts.length > 0 ? Math.max(...submissionVoteCounts) : 0,
      median_votes_per_submission: calculateMedian(submissionVoteCounts),
      submissions_with_no_votes: 0 // Would need total submissions count
    }
  }
}

/**
 * Calculate temporal statistics
 */
function calculateTemporalStats(votes: any[]) {
  if (votes.length === 0) {
    return {
      voting_timeline: {},
      peak_periods: [],
      voting_velocity: 0
    }
  }

  const sortedVotes = votes.sort((a, b) => new Date(a.voted_at).getTime() - new Date(b.voted_at).getTime())
  
  // Group votes by hour
  const hourlyVotes: Record<string, number> = {}
  const dailyVotes: Record<string, number> = {}

  votes.forEach(vote => {
    const date = new Date(vote.voted_at)
    const hour = date.getHours().toString().padStart(2, '0')
    const day = date.toISOString().split('T')[0]

    hourlyVotes[hour] = (hourlyVotes[hour] || 0) + 1
    dailyVotes[day] = (dailyVotes[day] || 0) + 1
  })

  // Calculate peak periods
  const peakHours = Object.entries(hourlyVotes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: `${hour}:00`, vote_count: count }))

  // Calculate voting velocity (votes per minute)
  const firstVote = new Date(sortedVotes[0].voted_at)
  const lastVote = new Date(sortedVotes[sortedVotes.length - 1].voted_at)
  const durationMinutes = (lastVote.getTime() - firstVote.getTime()) / (1000 * 60)
  const velocity = durationMinutes > 0 ? votes.length / durationMinutes : 0

  return {
    voting_timeline: {
      first_vote: firstVote.toISOString(),
      last_vote: lastVote.toISOString(),
      duration_minutes: Math.round(durationMinutes),
      votes_by_hour: hourlyVotes,
      votes_by_day: dailyVotes
    },
    peak_periods: peakHours,
    voting_velocity: Math.round(velocity * 100) / 100
  }
}

/**
 * Calculate demographic statistics
 */
function calculateDemographicStats(votes: any[]) {
  const universityDistribution: Record<string, number> = {}
  const ipDistribution: Record<string, number> = {}
  const userAgentTypes: Record<string, number> = {}

  votes.forEach(vote => {
    // University distribution
    const university = vote.submissions?.users?.university || 'Unknown'
    universityDistribution[university] = (universityDistribution[university] || 0) + 1

    // IP distribution for geographic insights
    if (vote.ip_address && vote.ip_address !== 'unknown') {
      const ipPrefix = vote.ip_address.split('.').slice(0, 2).join('.')
      ipDistribution[ipPrefix] = (ipDistribution[ipPrefix] || 0) + 1
    }

    // User agent analysis for device types
    const userAgent = vote.user_agent || 'unknown'
    let deviceType = 'Unknown'
    if (userAgent.includes('Mobile')) deviceType = 'Mobile'
    else if (userAgent.includes('Chrome')) deviceType = 'Desktop-Chrome'
    else if (userAgent.includes('Firefox')) deviceType = 'Desktop-Firefox'
    else if (userAgent.includes('Safari')) deviceType = 'Desktop-Safari'

    userAgentTypes[deviceType] = (userAgentTypes[deviceType] || 0) + 1
  })

  return {
    university_distribution: universityDistribution,
    geographic_distribution: ipDistribution,
    device_distribution: userAgentTypes
  }
}

/**
 * Calculate voting pattern analysis
 */
function calculateVotingPatterns(votes: any[], votingType: string) {
  const patterns: any = {
    voting_type: votingType
  }

  switch (votingType) {
    case 'simple':
      patterns.score_distribution = calculateScoreDistribution(votes)
      break
    case 'quadratic':
      patterns.credit_usage = calculateCreditUsagePatterns(votes)
      break
    case 'ranked':
      patterns.ranking_consistency = calculateRankingConsistency(votes)
      break
    case 'approval':
      patterns.approval_patterns = calculateApprovalPatterns(votes)
      break
  }

  return patterns
}

/**
 * Calculate engagement metrics
 */
function calculateEngagementMetrics(votes: any[]) {
  const voterEngagement: Record<string, { votes: number; timeSpent: number }> = {}
  
  votes.forEach(vote => {
    const voterId = vote.voter_user_id || vote.voter_session_id || 'anonymous'
    if (!voterEngagement[voterId]) {
      voterEngagement[voterId] = { votes: 0, timeSpent: 0 }
    }
    voterEngagement[voterId].votes += 1
  })

  const engagementLevels = Object.values(voterEngagement).map(e => e.votes)
  const totalEngaged = engagementLevels.filter(level => level > 1).length

  return {
    highly_engaged_voters: engagementLevels.filter(level => level >= 5).length,
    moderately_engaged_voters: engagementLevels.filter(level => level >= 2 && level < 5).length,
    low_engaged_voters: engagementLevels.filter(level => level === 1).length,
    engagement_rate: engagementLevels.length > 0 ? (totalEngaged / engagementLevels.length) * 100 : 0
  }
}

/**
 * Calculate quality metrics
 */
function calculateQualityMetrics(votes: any[]) {
  const validVotes = votes.filter(v => v.is_valid)
  const invalidVotes = votes.filter(v => !v.is_valid)

  // Analyze vote consistency (similar votes for same submission)
  const submissionVotes: Record<string, number[]> = {}
  validVotes.forEach(vote => {
    if (vote.submission_id && vote.vote_data?.value) {
      if (!submissionVotes[vote.submission_id]) {
        submissionVotes[vote.submission_id] = []
      }
      submissionVotes[vote.submission_id].push(vote.vote_data.value)
    }
  })

  const consistencyScores = Object.values(submissionVotes)
    .map(scores => calculateStandardDeviation(scores))
    .filter(score => !isNaN(score))

  const averageConsistency = consistencyScores.length > 0 
    ? consistencyScores.reduce((sum, score) => sum + score, 0) / consistencyScores.length 
    : 0

  return {
    data_quality: {
      valid_vote_percentage: votes.length > 0 ? (validVotes.length / votes.length) * 100 : 0,
      invalid_vote_count: invalidVotes.length,
      average_vote_consistency: Math.round(averageConsistency * 100) / 100
    },
    potential_issues: {
      duplicate_votes: 0, // Would need more complex analysis
      suspicious_patterns: 0, // Would be detected by anomaly detection
      incomplete_votes: votes.filter(v => !v.vote_data || Object.keys(v.vote_data).length === 0).length
    }
  }
}

// Helper functions
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0
  const sorted = numbers.slice().sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function calculateStandardDeviation(numbers: number[]): number {
  if (numbers.length === 0) return 0
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2))
  const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length
  return Math.sqrt(avgSquaredDiff)
}

function calculateScoreDistribution(votes: any[]) {
  const scores: Record<string, number> = {}
  votes.forEach(vote => {
    const score = vote.vote_data?.value || 0
    scores[score.toString()] = (scores[score.toString()] || 0) + 1
  })
  return scores
}

function calculateCreditUsagePatterns(votes: any[]) {
  const creditsUsed = votes
    .filter(vote => vote.vote_data?.credits_spent)
    .map(vote => vote.vote_data.credits_spent)
  
  return {
    average_credits_per_vote: creditsUsed.length > 0 ? creditsUsed.reduce((sum, credits) => sum + credits, 0) / creditsUsed.length : 0,
    min_credits_used: creditsUsed.length > 0 ? Math.min(...creditsUsed) : 0,
    max_credits_used: creditsUsed.length > 0 ? Math.max(...creditsUsed) : 0,
    credit_distribution: creditsUsed.reduce((acc, credits) => {
      acc[credits.toString()] = (acc[credits.toString()] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}

function calculateRankingConsistency(votes: any[]) {
  // This would require more complex analysis of ranking patterns
  return {
    average_rankings_per_vote: 0,
    most_consistently_ranked: null,
    ranking_volatility: 0
  }
}

function calculateApprovalPatterns(votes: any[]) {
  const approvalsPerVote = votes
    .filter(vote => vote.vote_data?.approved_submissions)
    .map(vote => vote.vote_data.approved_submissions.length)
  
  return {
    average_approvals_per_vote: approvalsPerVote.length > 0 ? approvalsPerVote.reduce((sum, count) => sum + count, 0) / approvalsPerVote.length : 0,
    min_approvals: approvalsPerVote.length > 0 ? Math.min(...approvalsPerVote) : 0,
    max_approvals: approvalsPerVote.length > 0 ? Math.max(...approvalsPerVote) : 0
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return cors(request, async () => {
    return new Response(null, { status: 200 })
  })
}