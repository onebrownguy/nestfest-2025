/**
 * Voting System API Endpoints
 * 
 * POST /api/votes - Cast vote (including quadratic voting)
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ApiResponseBuilder, getClientIP, logAuditEvent, generateBrowserFingerprint } from '@/lib/api/utils'
import { authenticate, rateLimit, cors, errorHandler, securityHeaders, validateInput } from '@/lib/api/middleware'
import { VotingSchemas } from '@/lib/api/validation'
import { QuadraticVotingEngine } from '@/lib/voting/quadratic'
import type { AuthenticatedRequest } from '@/lib/api/middleware'

/**
 * POST /api/votes
 * Cast vote with support for different voting types
 */
export async function POST(request: NextRequest) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            try {
              const user = authReq.user!
              const requestData = await authReq.json()
              const voteType = requestData.vote_type

              // Validate based on vote type
              let validatedData
              let validationError

              switch (voteType) {
                case 'simple':
                  try {
                    validatedData = VotingSchemas.simple.parse(requestData)
                  } catch (error: any) {
                    validationError = error
                  }
                  break
                case 'quadratic':
                  try {
                    validatedData = VotingSchemas.quadratic.parse(requestData)
                  } catch (error: any) {
                    validationError = error
                  }
                  break
                case 'ranked':
                  try {
                    validatedData = VotingSchemas.ranked.parse(requestData)
                  } catch (error: any) {
                    validationError = error
                  }
                  break
                case 'approval':
                  try {
                    validatedData = VotingSchemas.approval.parse(requestData)
                  } catch (error: any) {
                    validationError = error
                  }
                  break
                default:
                  return ApiResponseBuilder.error('Invalid vote type', 400, 'INVALID_VOTE_TYPE')
              }

              if (validationError) {
                return ApiResponseBuilder.validation(validationError)
              }

              const { competition_id } = validatedData

              // Get competition details
              const { data: competition, error: competitionError } = await supabaseAdmin
                .from('competitions')
                .select(`
                  *,
                  rounds:competition_rounds(*)
                `)
                .eq('id', competition_id)
                .single()

              if (competitionError || !competition) {
                return ApiResponseBuilder.notFound('Competition')
              }

              // Check if voting is enabled and competition is in voting state
              if (!competition.voting_enabled) {
                return ApiResponseBuilder.error('Voting is not enabled for this competition', 400, 'VOTING_DISABLED')
              }

              const allowedStatuses = ['live', 'judging']
              if (!allowedStatuses.includes(competition.status)) {
                return ApiResponseBuilder.error('Competition is not in a voting state', 400, 'VOTING_NOT_ACTIVE')
              }

              // Check public voting permissions
              if (user.role === 'student' && !competition.public_voting_enabled) {
                return ApiResponseBuilder.error('Public voting is not enabled for this competition', 403, 'PUBLIC_VOTING_DISABLED')
              }

              // Process vote based on type
              switch (voteType) {
                case 'simple':
                  return await processSimpleVote(authReq, user, validatedData, competition)
                case 'quadratic':
                  return await processQuadraticVote(authReq, user, validatedData, competition)
                case 'ranked':
                  return await processRankedVote(authReq, user, validatedData, competition)
                case 'approval':
                  return await processApprovalVote(authReq, user, validatedData, competition)
                default:
                  return ApiResponseBuilder.serverError('Unsupported vote type')
              }

            } catch (error: any) {
              console.error('Voting error:', error)
              return ApiResponseBuilder.serverError('Failed to process vote')
            }
          })
        })
      })
    }, { points: 20, duration: 60 }) // More restrictive rate limit for voting
  })
}

/**
 * Process simple vote
 */
async function processSimpleVote(
  request: AuthenticatedRequest,
  user: any,
  validatedData: any,
  competition: any
): Promise<Response> {
  const { competition_id, submission_id, vote_data } = validatedData

  // Verify submission exists and is voteable
  const { data: submission, error: submissionError } = await supabaseAdmin
    .from('submissions')
    .select('id, status, user_id')
    .eq('id', submission_id)
    .eq('competition_id', competition_id)
    .single()

  if (submissionError || !submission) {
    return ApiResponseBuilder.notFound('Submission')
  }

  if (!['submitted', 'accepted', 'advanced'].includes(submission.status)) {
    return ApiResponseBuilder.error('Submission is not available for voting', 400, 'SUBMISSION_NOT_VOTEABLE')
  }

  // Check if user is trying to vote for their own submission
  if (submission.user_id === user.id) {
    return ApiResponseBuilder.error('Cannot vote for your own submission', 400, 'SELF_VOTING_NOT_ALLOWED')
  }

  // Check for existing vote
  const { data: existingVote } = await supabaseAdmin
    .from('votes')
    .select('id')
    .eq('competition_id', competition_id)
    .eq('submission_id', submission_id)
    .eq('voter_user_id', user.id)
    .single()

  // Create or update vote
  const voteRecord = {
    competition_id,
    submission_id,
    voter_user_id: user.id,
    vote_type: 'simple',
    vote_data,
    weight: 1, // Simple vote weight
    ip_address: getClientIP(request),
    user_agent: request.headers.get('user-agent') || 'unknown',
    voted_at: new Date().toISOString(),
    is_valid: true
  }

  if (existingVote) {
    // Update existing vote
    const { data: updatedVote, error: updateError } = await supabaseAdmin
      .from('votes')
      .update(voteRecord)
      .eq('id', existingVote.id)
      .select()
      .single()

    if (updateError) {
      console.error('Vote update error:', updateError)
      return ApiResponseBuilder.serverError('Failed to update vote')
    }

    logAuditEvent({
      userId: user.id,
      action: 'vote_updated',
      resource: 'votes',
      resourceId: updatedVote.id,
      metadata: { competition_id, submission_id, vote_type: 'simple', value: vote_data.value },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return ApiResponseBuilder.success(updatedVote, 'Vote updated successfully')
  } else {
    // Create new vote
    const { data: newVote, error: createError } = await supabaseAdmin
      .from('votes')
      .insert(voteRecord)
      .select()
      .single()

    if (createError) {
      console.error('Vote creation error:', createError)
      return ApiResponseBuilder.serverError('Failed to create vote')
    }

    logAuditEvent({
      userId: user.id,
      action: 'vote_created',
      resource: 'votes',
      resourceId: newVote.id,
      metadata: { competition_id, submission_id, vote_type: 'simple', value: vote_data.value },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return ApiResponseBuilder.success(newVote, 'Vote cast successfully')
  }
}

/**
 * Process quadratic vote
 */
async function processQuadraticVote(
  request: AuthenticatedRequest,
  user: any,
  validatedData: any,
  competition: any
): Promise<Response> {
  const { competition_id, submission_id, vote_data } = validatedData
  const quadraticEngine = new QuadraticVotingEngine()

  // Get user's voting budget
  const { data: budget, error: budgetError } = await supabaseAdmin
    .from('quadratic_voting_budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('competition_id', competition_id)
    .single()

  if (budgetError || !budget) {
    return ApiResponseBuilder.error('Voting budget not found', 404, 'BUDGET_NOT_FOUND')
  }

  // Verify submission
  const { data: submission, error: submissionError } = await supabaseAdmin
    .from('submissions')
    .select('id, status, user_id')
    .eq('id', submission_id)
    .eq('competition_id', competition_id)
    .single()

  if (submissionError || !submission) {
    return ApiResponseBuilder.notFound('Submission')
  }

  if (!['submitted', 'accepted', 'advanced'].includes(submission.status)) {
    return ApiResponseBuilder.error('Submission is not available for voting', 400, 'SUBMISSION_NOT_VOTEABLE')
  }

  if (submission.user_id === user.id) {
    return ApiResponseBuilder.error('Cannot vote for your own submission', 400, 'SELF_VOTING_NOT_ALLOWED')
  }

  // Get current votes for budget calculation
  const { data: currentVotes } = await supabaseAdmin
    .from('votes')
    .select('submission_id, vote_data')
    .eq('competition_id', competition_id)
    .eq('voter_user_id', user.id)
    .eq('vote_type', 'quadratic')

  // Calculate current allocation excluding this submission
  const currentAllocation: Record<string, number> = {}
  currentVotes?.forEach(vote => {
    if (vote.submission_id !== submission_id) {
      currentAllocation[vote.submission_id] = vote.vote_data.vote_count || 0
    }
  })

  // Add new vote to allocation
  currentAllocation[submission_id] = vote_data.vote_count

  // Validate budget
  const budgetValidation = quadraticEngine.validateBudget(
    currentAllocation,
    budget.total_credits - budget.spent_credits + (vote_data.credits_spent || 0) // Add back existing spend
  )

  if (!budgetValidation.isValid) {
    return ApiResponseBuilder.error(
      `Insufficient voting credits. Required: ${budgetValidation.totalCost}, Available: ${budget.total_credits - budget.spent_credits}`,
      400,
      'INSUFFICIENT_CREDITS'
    )
  }

  // Process the vote
  const voteResult = await quadraticEngine.processQuadraticVote(
    user.id,
    submission_id,
    vote_data.vote_count,
    budget
  )

  if (!voteResult.success) {
    return ApiResponseBuilder.error(voteResult.error || 'Vote processing failed', 400, 'VOTE_PROCESSING_FAILED')
  }

  // Check for existing vote
  const { data: existingVote } = await supabaseAdmin
    .from('votes')
    .select('id, vote_data')
    .eq('competition_id', competition_id)
    .eq('submission_id', submission_id)
    .eq('voter_user_id', user.id)
    .single()

  const voteRecord = {
    competition_id,
    submission_id,
    voter_user_id: user.id,
    vote_type: 'quadratic',
    vote_data: voteResult.voteData,
    weight: vote_data.vote_count,
    ip_address: getClientIP(request),
    user_agent: request.headers.get('user-agent') || 'unknown',
    voted_at: new Date().toISOString(),
    is_valid: true
  }

  // Update budget
  const newSpentCredits = budget.spent_credits - (existingVote?.vote_data?.credits_spent || 0) + vote_data.credits_spent

  await supabaseAdmin
    .from('quadratic_voting_budgets')
    .update({ spent_credits: newSpentCredits })
    .eq('user_id', user.id)
    .eq('competition_id', competition_id)

  if (existingVote) {
    // Update existing vote
    const { data: updatedVote, error: updateError } = await supabaseAdmin
      .from('votes')
      .update(voteRecord)
      .eq('id', existingVote.id)
      .select()
      .single()

    if (updateError) {
      console.error('Quadratic vote update error:', updateError)
      return ApiResponseBuilder.serverError('Failed to update vote')
    }

    return ApiResponseBuilder.success(updatedVote, 'Quadratic vote updated successfully')
  } else {
    // Create new vote
    const { data: newVote, error: createError } = await supabaseAdmin
      .from('votes')
      .insert(voteRecord)
      .select()
      .single()

    if (createError) {
      console.error('Quadratic vote creation error:', createError)
      return ApiResponseBuilder.serverError('Failed to create vote')
    }

    return ApiResponseBuilder.success(newVote, 'Quadratic vote cast successfully')
  }
}

/**
 * Process ranked vote
 */
async function processRankedVote(
  request: AuthenticatedRequest,
  user: any,
  validatedData: any,
  competition: any
): Promise<Response> {
  const { competition_id, vote_data } = validatedData

  // Verify all submissions exist and are voteable
  const submissionIds = vote_data.rankings.map((r: any) => r.submission_id)
  const { data: submissions, error: submissionsError } = await supabaseAdmin
    .from('submissions')
    .select('id, status, user_id')
    .eq('competition_id', competition_id)
    .in('id', submissionIds)

  if (submissionsError || !submissions || submissions.length !== submissionIds.length) {
    return ApiResponseBuilder.error('One or more submissions not found', 404, 'SUBMISSIONS_NOT_FOUND')
  }

  // Check submissions are voteable and not user's own
  const invalidsSubmissions = submissions.filter(s => 
    !['submitted', 'accepted', 'advanced'].includes(s.status) || s.user_id === user.id
  )

  if (invalidsSubmissions.length > 0) {
    return ApiResponseBuilder.error('Some submissions are not available for voting', 400, 'INVALID_SUBMISSIONS')
  }

  // Validate rankings (no duplicates, sequential ranks)
  const ranks = vote_data.rankings.map((r: any) => r.rank).sort((a: number, b: number) => a - b)
  const expectedRanks = Array.from({ length: ranks.length }, (_, i) => i + 1)
  
  if (JSON.stringify(ranks) !== JSON.stringify(expectedRanks)) {
    return ApiResponseBuilder.error('Invalid ranking sequence', 400, 'INVALID_RANKINGS')
  }

  // Delete existing ranked votes for this competition
  await supabaseAdmin
    .from('votes')
    .delete()
    .eq('competition_id', competition_id)
    .eq('voter_user_id', user.id)
    .eq('vote_type', 'ranked')

  // Create new ranked vote
  const voteRecord = {
    competition_id,
    submission_id: null, // Ranked votes don't have a single submission
    voter_user_id: user.id,
    vote_type: 'ranked',
    vote_data,
    weight: 1,
    ip_address: getClientIP(request),
    user_agent: request.headers.get('user-agent') || 'unknown',
    voted_at: new Date().toISOString(),
    is_valid: true
  }

  const { data: newVote, error: createError } = await supabaseAdmin
    .from('votes')
    .insert(voteRecord)
    .select()
    .single()

  if (createError) {
    console.error('Ranked vote creation error:', createError)
    return ApiResponseBuilder.serverError('Failed to create ranked vote')
  }

  logAuditEvent({
    userId: user.id,
    action: 'ranked_vote_created',
    resource: 'votes',
    resourceId: newVote.id,
    metadata: { 
      competition_id, 
      vote_type: 'ranked', 
      ranked_submissions: vote_data.rankings.length 
    },
    ipAddress: getClientIP(request),
    userAgent: request.headers.get('user-agent') || 'unknown'
  })

  return ApiResponseBuilder.success(newVote, 'Ranked vote cast successfully')
}

/**
 * Process approval vote
 */
async function processApprovalVote(
  request: AuthenticatedRequest,
  user: any,
  validatedData: any,
  competition: any
): Promise<Response> {
  const { competition_id, vote_data } = validatedData

  // Verify all submissions exist and are voteable
  const { data: submissions, error: submissionsError } = await supabaseAdmin
    .from('submissions')
    .select('id, status, user_id')
    .eq('competition_id', competition_id)
    .in('id', vote_data.approved_submissions)

  if (submissionsError || !submissions || submissions.length !== vote_data.approved_submissions.length) {
    return ApiResponseBuilder.error('One or more submissions not found', 404, 'SUBMISSIONS_NOT_FOUND')
  }

  // Check submissions are voteable and not user's own
  const invalidSubmissions = submissions.filter(s => 
    !['submitted', 'accepted', 'advanced'].includes(s.status) || s.user_id === user.id
  )

  if (invalidSubmissions.length > 0) {
    return ApiResponseBuilder.error('Some submissions are not available for voting', 400, 'INVALID_SUBMISSIONS')
  }

  // Check voting rules for max selections
  const votingRules = competition.config?.voting_rules
  if (votingRules?.max_selections && vote_data.approved_submissions.length > votingRules.max_selections) {
    return ApiResponseBuilder.error(
      `Maximum ${votingRules.max_selections} selections allowed`,
      400,
      'TOO_MANY_SELECTIONS'
    )
  }

  // Delete existing approval votes for this competition
  await supabaseAdmin
    .from('votes')
    .delete()
    .eq('competition_id', competition_id)
    .eq('voter_user_id', user.id)
    .eq('vote_type', 'approval')

  // Create new approval vote
  const voteRecord = {
    competition_id,
    submission_id: null, // Approval votes don't have a single submission
    voter_user_id: user.id,
    vote_type: 'approval',
    vote_data,
    weight: 1,
    ip_address: getClientIP(request),
    user_agent: request.headers.get('user-agent') || 'unknown',
    voted_at: new Date().toISOString(),
    is_valid: true
  }

  const { data: newVote, error: createError } = await supabaseAdmin
    .from('votes')
    .insert(voteRecord)
    .select()
    .single()

  if (createError) {
    console.error('Approval vote creation error:', createError)
    return ApiResponseBuilder.serverError('Failed to create approval vote')
  }

  logAuditEvent({
    userId: user.id,
    action: 'approval_vote_created',
    resource: 'votes',
    resourceId: newVote.id,
    metadata: { 
      competition_id, 
      vote_type: 'approval', 
      approved_submissions: vote_data.approved_submissions.length 
    },
    ipAddress: getClientIP(request),
    userAgent: request.headers.get('user-agent') || 'unknown'
  })

  return ApiResponseBuilder.success(newVote, 'Approval vote cast successfully')
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return cors(request, async () => {
    return new Response(null, { status: 200 })
  })
}