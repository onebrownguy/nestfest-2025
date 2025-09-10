/**
 * Quadratic Voting Implementation for NestFest
 * 
 * Quadratic voting allows voters to express the intensity of their preferences
 * by allocating voting credits. Each additional vote on the same submission
 * costs quadratically more credits (1 vote = 1 credit, 2 votes = 4 credits, etc.)
 */

import { VoteData, QuadraticVotingBudget } from '@/types'

export class QuadraticVotingEngine {
  /**
   * Calculate the credit cost for a given number of votes
   */
  calculateCost(votes: number): number {
    return Math.pow(Math.abs(votes), 2)
  }

  /**
   * Calculate the maximum votes possible with given credits
   */
  calculateMaxVotes(availableCredits: number): number {
    return Math.floor(Math.sqrt(availableCredits))
  }

  /**
   * Validate if a voting allocation is within budget
   */
  validateBudget(
    allocation: Record<string, number>, 
    availableCredits: number
  ): { isValid: boolean; totalCost: number; breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {}
    let totalCost = 0

    for (const [submissionId, votes] of Object.entries(allocation)) {
      const cost = this.calculateCost(votes)
      breakdown[submissionId] = cost
      totalCost += cost
    }

    return {
      isValid: totalCost <= availableCredits,
      totalCost,
      breakdown
    }
  }

  /**
   * Optimize vote allocation to maximize impact within budget
   */
  optimizeAllocation(
    preferences: Record<string, number>, // submission_id -> preference_strength (0-10)
    budget: number
  ): Record<string, number> {
    const submissions = Object.keys(preferences).sort(
      (a, b) => preferences[b] - preferences[a]
    )

    const allocation: Record<string, number> = {}
    let remainingBudget = budget

    // Greedy allocation based on preference strength
    for (const submissionId of submissions) {
      const preferenceStrength = preferences[submissionId]
      
      // Skip if no preference
      if (preferenceStrength <= 0) continue

      // Calculate optimal votes based on preference strength and remaining budget
      const maxPossibleVotes = Math.floor(Math.sqrt(remainingBudget))
      const desiredVotes = Math.min(
        maxPossibleVotes,
        Math.ceil(preferenceStrength)
      )

      if (desiredVotes > 0) {
        const cost = this.calculateCost(desiredVotes)
        allocation[submissionId] = desiredVotes
        remainingBudget -= cost
      }
    }

    return allocation
  }

  /**
   * Calculate voting power for a user based on their credits and stakes
   */
  calculateVotingPower(
    baseCredits: number,
    bonusCredits: number = 0,
    multipliers: number[] = []
  ): number {
    const totalCredits = baseCredits + bonusCredits
    const multiplier = multipliers.reduce((acc, mult) => acc * mult, 1)
    return Math.floor(totalCredits * multiplier)
  }

  /**
   * Process a quadratic vote and update the voter's budget
   */
  async processQuadraticVote(
    voterId: string,
    submissionId: string,
    voteCount: number,
    currentBudget: QuadraticVotingBudget
  ): Promise<{
    success: boolean
    updatedBudget?: QuadraticVotingBudget
    voteData?: VoteData
    error?: string
  }> {
    // Validate vote count
    if (voteCount < 0) {
      return { success: false, error: 'Vote count cannot be negative' }
    }

    // Calculate cost
    const cost = this.calculateCost(voteCount)

    // Check if voter has enough credits
    const availableCredits = currentBudget.total_credits - currentBudget.spent_credits
    if (cost > availableCredits) {
      return {
        success: false,
        error: `Insufficient credits. Required: ${cost}, Available: ${availableCredits}`
      }
    }

    // Update budget
    const updatedBudget: QuadraticVotingBudget = {
      ...currentBudget,
      spent_credits: currentBudget.spent_credits + cost
    }

    // Create vote data
    const voteData: VoteData = {
      vote_count: voteCount,
      credits_spent: cost
    }

    return {
      success: true,
      updatedBudget,
      voteData
    }
  }

  /**
   * Calculate aggregated scores using quadratic voting
   */
  calculateQuadraticScores(votes: Array<{
    submission_id: string
    vote_count: number
    weight: number
  }>): Record<string, number> {
    const scores: Record<string, number> = {}

    for (const vote of votes) {
      if (!scores[vote.submission_id]) {
        scores[vote.submission_id] = 0
      }

      // Apply voter weight to the vote count
      const weightedVotes = vote.vote_count * vote.weight
      scores[vote.submission_id] += weightedVotes
    }

    return scores
  }

  /**
   * Detect potential voting anomalies in quadratic voting
   */
  detectAnomalies(votes: Array<{
    voter_id: string
    submission_id: string
    vote_count: number
    credits_spent: number
    timestamp: string
    ip_address: string
  }>): {
    suspicious_patterns: string[]
    flagged_voters: string[]
    confidence_score: number
  } {
    const suspicious_patterns: string[] = []
    const flagged_voters: Set<string> = new Set()

    // Group votes by voter
    const voterGroups = votes.reduce((acc, vote) => {
      if (!acc[vote.voter_id]) acc[vote.voter_id] = []
      acc[vote.voter_id].push(vote)
      return acc
    }, {} as Record<string, typeof votes>)

    // Check for suspicious patterns
    for (const [voterId, voterVotes] of Object.entries(voterGroups)) {
      // Pattern 1: Rapid voting (all votes within very short timeframe)
      const timestamps = voterVotes.map(v => new Date(v.timestamp).getTime())
      const timeDiff = Math.max(...timestamps) - Math.min(...timestamps)
      if (timeDiff < 30000 && voterVotes.length > 3) { // 30 seconds
        suspicious_patterns.push(`Rapid voting pattern detected for voter ${voterId}`)
        flagged_voters.add(voterId)
      }

      // Pattern 2: Inconsistent credit calculation
      for (const vote of voterVotes) {
        const expectedCost = this.calculateCost(vote.vote_count)
        if (Math.abs(vote.credits_spent - expectedCost) > 0.01) {
          suspicious_patterns.push(`Credit calculation mismatch for voter ${voterId}`)
          flagged_voters.add(voterId)
        }
      }

      // Pattern 3: Extreme vote concentration
      const maxVotes = Math.max(...voterVotes.map(v => v.vote_count))
      const totalVotes = voterVotes.reduce((sum, v) => sum + v.vote_count, 0)
      if (maxVotes / totalVotes > 0.8) { // 80% of votes on single submission
        suspicious_patterns.push(`Extreme vote concentration for voter ${voterId}`)
        flagged_voters.add(voterId)
      }
    }

    // Group votes by IP address
    const ipGroups = votes.reduce((acc, vote) => {
      if (!acc[vote.ip_address]) acc[vote.ip_address] = new Set()
      acc[vote.ip_address].add(vote.voter_id)
      return acc
    }, {} as Record<string, Set<string>>)

    // Pattern 4: Too many voters from same IP
    for (const [ip, voterIds] of Object.entries(ipGroups)) {
      if (voterIds.size > 5) { // More than 5 voters from same IP
        suspicious_patterns.push(`Multiple voters from same IP: ${ip}`)
        voterIds.forEach(id => flagged_voters.add(id))
      }
    }

    // Calculate confidence score (0-1)
    const totalVoters = Object.keys(voterGroups).length
    const flaggedRatio = flagged_voters.size / totalVoters
    const confidence_score = Math.min(1, flaggedRatio * suspicious_patterns.length * 0.1)

    return {
      suspicious_patterns,
      flagged_voters: Array.from(flagged_voters),
      confidence_score
    }
  }

  /**
   * Generate voting insights and analytics
   */
  generateInsights(votes: Array<{
    submission_id: string
    vote_count: number
    credits_spent: number
    timestamp: string
  }>): {
    total_votes: number
    total_credits_used: number
    average_intensity: number
    most_passionate_submissions: string[]
    voting_distribution: Record<string, number>
    engagement_metrics: {
      participation_rate: number
      average_votes_per_user: number
      peak_voting_time: string
    }
  } {
    const total_votes = votes.reduce((sum, vote) => sum + vote.vote_count, 0)
    const total_credits_used = votes.reduce((sum, vote) => sum + vote.credits_spent, 0)
    const average_intensity = total_votes > 0 ? total_credits_used / total_votes : 0

    // Calculate voting distribution by submission
    const voting_distribution: Record<string, number> = {}
    for (const vote of votes) {
      if (!voting_distribution[vote.submission_id]) {
        voting_distribution[vote.submission_id] = 0
      }
      voting_distribution[vote.submission_id] += vote.vote_count
    }

    // Find most passionate submissions (highest vote intensity)
    const most_passionate_submissions = Object.entries(voting_distribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id)

    // Calculate peak voting time
    const hourly_votes: Record<string, number> = {}
    votes.forEach(vote => {
      const hour = new Date(vote.timestamp).getHours().toString()
      hourly_votes[hour] = (hourly_votes[hour] || 0) + 1
    })
    
    const peak_voting_time = Object.entries(hourly_votes)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '0'

    // Unique voters count (assuming we have voter data)
    const unique_voters = new Set(votes.map((_, index) => index)).size // Placeholder
    
    return {
      total_votes,
      total_credits_used,
      average_intensity,
      most_passionate_submissions,
      voting_distribution,
      engagement_metrics: {
        participation_rate: 0.85, // Placeholder - would calculate from actual data
        average_votes_per_user: total_votes / unique_voters,
        peak_voting_time: `${peak_voting_time}:00`
      }
    }
  }
}