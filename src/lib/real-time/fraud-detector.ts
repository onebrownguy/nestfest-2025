/**
 * Real-time Fraud Detection and Analytics System
 * 
 * Features:
 * - Suspicious voting pattern detection
 * - Rapid voting anomaly detection
 * - Duplicate vote prevention
 * - Bot activity identification
 * - IP-based analysis
 * - Behavioral pattern analysis
 * - Real-time alert generation
 */

import { createClient } from 'redis'
import type { 
  FraudDetectionAlert, 
  RealtimeVoteData, 
  VotingAnalytics,
  User
} from '@/types'

interface VotingPattern {
  userId?: string
  sessionId?: string
  ipAddress: string
  userAgent: string
  votes: VoteEvent[]
  firstVote: number
  lastVote: number
  velocity: number
  suspicionScore: number
}

interface VoteEvent {
  timestamp: number
  submissionId: string
  voteType: string
  timeBetween: number
}

interface FraudRule {
  id: string
  name: string
  enabled: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  threshold: number
  check: (pattern: VotingPattern) => { triggered: boolean; score: number; details: any }
}

interface AnalyticsData {
  totalVotes: number
  uniqueVoters: number
  averageVelocity: number
  suspiciousVotes: number
  blockedVotes: number
  patterns: Map<string, VotingPattern>
}

export class FraudDetector {
  private redisClient: any
  private patterns = new Map<string, VotingPattern>()
  private rules: FraudRule[] = []
  private analytics: AnalyticsData
  private alertCallbacks: ((alert: FraudDetectionAlert) => void)[] = []
  
  constructor() {
    this.analytics = {
      totalVotes: 0,
      uniqueVoters: 0,
      averageVelocity: 0,
      suspiciousVotes: 0,
      blockedVotes: 0,
      patterns: this.patterns
    }
    
    this.initializeRedis()
    this.setupFraudRules()
  }

  /**
   * Initialize Redis client
   */
  private async initializeRedis() {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      })
      await this.redisClient.connect()
      console.log('Fraud detector Redis client connected')
    } catch (error) {
      console.error('Failed to connect to Redis for fraud detection:', error)
    }
  }

  /**
   * Setup fraud detection rules
   */
  private setupFraudRules() {
    this.rules = [
      {
        id: 'rapid_voting',
        name: 'Rapid Voting Detection',
        enabled: true,
        severity: 'high',
        threshold: 10,
        check: (pattern: VotingPattern) => {
          const avgTimeBetween = pattern.votes.reduce((sum, v) => sum + v.timeBetween, 0) / pattern.votes.length
          const triggered = pattern.votes.length > 5 && avgTimeBetween < 1000 // Less than 1 second between votes
          return {
            triggered,
            score: triggered ? Math.min(100, (1000 / avgTimeBetween) * 10) : 0,
            details: { averageTimeBetween: avgTimeBetween, voteCount: pattern.votes.length }
          }
        }
      },
      {
        id: 'duplicate_votes',
        name: 'Duplicate Vote Prevention',
        enabled: true,
        severity: 'critical',
        threshold: 1,
        check: (pattern: VotingPattern) => {
          const submissionCounts = new Map<string, number>()
          pattern.votes.forEach(vote => {
            submissionCounts.set(vote.submissionId, (submissionCounts.get(vote.submissionId) || 0) + 1)
          })
          
          const duplicates = Array.from(submissionCounts.values()).filter(count => count > 1)
          const triggered = duplicates.length > 0
          
          return {
            triggered,
            score: triggered ? Math.min(100, duplicates.length * 50) : 0,
            details: { duplicateSubmissions: Array.from(submissionCounts.entries()).filter(([_, count]) => count > 1) }
          }
        }
      },
      {
        id: 'bot_activity',
        name: 'Bot Activity Detection',
        enabled: true,
        severity: 'high',
        threshold: 15,
        check: (pattern: VotingPattern) => {
          const { userAgent, votes } = pattern
          
          // Check for bot indicators
          const botIndicators = [
            userAgent.toLowerCase().includes('bot'),
            userAgent.toLowerCase().includes('crawler'),
            userAgent.toLowerCase().includes('spider'),
            !userAgent.includes('Mozilla'), // Most real browsers have Mozilla in UA
            votes.every(v => v.timeBetween > 0 && v.timeBetween < 100), // Too consistent timing
            votes.length > 20 && pattern.velocity > 1 // High volume voting
          ]
          
          const botScore = botIndicators.filter(Boolean).length
          const triggered = botScore >= 2
          
          return {
            triggered,
            score: triggered ? Math.min(100, botScore * 20) : 0,
            details: { botScore, indicators: botIndicators, userAgent }
          }
        }
      },
      {
        id: 'ip_abuse',
        name: 'IP Address Abuse',
        enabled: true,
        severity: 'medium',
        threshold: 20,
        check: (pattern: VotingPattern) => {
          // This would need to be implemented with cross-pattern analysis
          // For now, checking vote velocity from single IP
          const timeWindow = 60000 // 1 minute
          const recentVotes = pattern.votes.filter(v => 
            pattern.lastVote - v.timestamp < timeWindow
          ).length
          
          const triggered = recentVotes > 10
          
          return {
            triggered,
            score: triggered ? Math.min(100, recentVotes * 5) : 0,
            details: { recentVotes, timeWindow, ipAddress: pattern.ipAddress }
          }
        }
      },
      {
        id: 'suspicious_pattern',
        name: 'Suspicious Voting Pattern',
        enabled: true,
        severity: 'medium',
        threshold: 25,
        check: (pattern: VotingPattern) => {
          const { votes } = pattern
          if (votes.length < 5) return { triggered: false, score: 0, details: {} }
          
          // Check for patterns that might indicate coordination
          const timeVariance = this.calculateTimeVariance(votes.map(v => v.timeBetween))
          const submissionPatterns = this.analyzeSubmissionPatterns(votes)
          
          const suspiciousFactors = [
            timeVariance < 100, // Very consistent timing
            submissionPatterns.sequential, // Voting in perfect order
            submissionPatterns.alternating, // Alternating pattern
            pattern.velocity > 0.5 // High velocity
          ]
          
          const suspicionLevel = suspiciousFactors.filter(Boolean).length
          const triggered = suspicionLevel >= 2
          
          return {
            triggered,
            score: triggered ? Math.min(100, suspicionLevel * 15) : 0,
            details: { 
              timeVariance, 
              suspiciousFactors: suspiciousFactors.length,
              submissionPatterns 
            }
          }
        }
      }
    ]
  }

  /**
   * Process a vote for fraud detection
   */
  async processVote(voteData: RealtimeVoteData & {
    ipAddress: string
    userAgent: string
    sessionId?: string
  }): Promise<{ allowed: boolean; alerts: FraudDetectionAlert[] }> {
    const { userId, sessionId, ipAddress, userAgent, competitionId, submissionId } = voteData
    const now = Date.now()
    
    // Create pattern key (prefer userId, fallback to sessionId or IP)
    const patternKey = userId || sessionId || ipAddress
    
    // Get or create voting pattern
    let pattern = this.patterns.get(patternKey)
    if (!pattern) {
      pattern = {
        userId,
        sessionId,
        ipAddress,
        userAgent,
        votes: [],
        firstVote: now,
        lastVote: now,
        velocity: 0,
        suspicionScore: 0
      }
      this.patterns.set(patternKey, pattern)
    }

    // Calculate time between votes
    const timeBetween = pattern.votes.length > 0 ? now - pattern.lastVote : 0
    
    // Add vote to pattern
    pattern.votes.push({
      timestamp: now,
      submissionId,
      voteType: voteData.voteType,
      timeBetween
    })
    
    // Update pattern metrics
    pattern.lastVote = now
    pattern.velocity = pattern.votes.length / ((now - pattern.firstVote) / 60000) // votes per minute
    
    // Keep only recent votes (last hour)
    const oneHourAgo = now - 3600000
    pattern.votes = pattern.votes.filter(v => v.timestamp > oneHourAgo)
    
    // Run fraud checks
    const alerts: FraudDetectionAlert[] = []
    let totalSuspicionScore = 0
    
    for (const rule of this.rules.filter(r => r.enabled)) {
      const result = rule.check(pattern)
      
      if (result.triggered && result.score >= rule.threshold) {
        const alert: FraudDetectionAlert = {
          type: rule.id as any,
          severity: rule.severity,
          userId,
          submissionId,
          competitionId,
          description: `${rule.name}: Suspicious activity detected`,
          metadata: {
            patternKey,
            ruleId: rule.id,
            score: result.score,
            details: result.details,
            pattern: {
              votes: pattern.votes.length,
              velocity: pattern.velocity,
              timeSpan: now - pattern.firstVote
            }
          },
          timestamp: new Date().toISOString()
        }
        
        alerts.push(alert)
        this.notifyAlert(alert)
      }
      
      totalSuspicionScore += result.score
    }
    
    // Update pattern suspicion score
    pattern.suspicionScore = totalSuspicionScore / this.rules.length
    
    // Store pattern in Redis for cross-server analysis
    if (this.redisClient) {
      try {
        await this.redisClient.setex(
          `pattern:${patternKey}`,
          3600, // 1 hour TTL
          JSON.stringify(pattern)
        )
      } catch (error) {
        console.error('Failed to store pattern in Redis:', error)
      }
    }
    
    // Update analytics
    this.updateAnalytics(pattern, alerts.length > 0)
    
    // Determine if vote should be allowed
    const criticalAlerts = alerts.filter(a => a.severity === 'critical')
    const allowed = criticalAlerts.length === 0 && pattern.suspicionScore < 80
    
    if (!allowed) {
      this.analytics.blockedVotes++
    }
    
    return { allowed, alerts }
  }

  /**
   * Update analytics
   */
  private updateAnalytics(pattern: VotingPattern, hasSuspiciousVote: boolean) {
    this.analytics.totalVotes++
    
    if (hasSuspiciousVote) {
      this.analytics.suspiciousVotes++
    }
    
    // Update unique voters count
    this.analytics.uniqueVoters = this.patterns.size
    
    // Update average velocity
    const totalVelocity = Array.from(this.patterns.values())
      .reduce((sum, p) => sum + p.velocity, 0)
    this.analytics.averageVelocity = totalVelocity / this.patterns.size
  }

  /**
   * Calculate time variance
   */
  private calculateTimeVariance(times: number[]): number {
    if (times.length < 2) return 0
    
    const mean = times.reduce((sum, t) => sum + t, 0) / times.length
    const variance = times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length
    return Math.sqrt(variance)
  }

  /**
   * Analyze submission patterns
   */
  private analyzeSubmissionPatterns(votes: VoteEvent[]): { 
    sequential: boolean
    alternating: boolean 
    repeated: boolean
  } {
    if (votes.length < 3) {
      return { sequential: false, alternating: false, repeated: false }
    }
    
    const submissionIds = votes.map(v => v.submissionId)
    
    // Check for sequential pattern (voting in same order)
    const isSequential = submissionIds.every((id, index) => {
      if (index === 0) return true
      return submissionIds.indexOf(id) === submissionIds.lastIndexOf(id)
    })
    
    // Check for alternating pattern
    const isAlternating = submissionIds.length >= 4 && 
      submissionIds.every((id, index) => {
        if (index < 2) return true
        return id === submissionIds[index - 2]
      })
    
    // Check for repeated submissions
    const uniqueSubmissions = new Set(submissionIds)
    const isRepeated = uniqueSubmissions.size < submissionIds.length * 0.7
    
    return {
      sequential: isSequential,
      alternating: isAlternating,
      repeated: isRepeated
    }
  }

  /**
   * Notify fraud alert
   */
  private notifyAlert(alert: FraudDetectionAlert) {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        console.error('Error in fraud alert callback:', error)
      }
    })
    
    // Log alert
    console.warn(`Fraud alert [${alert.severity}]:`, alert.description, alert.metadata)
    
    // Store alert in Redis for admin dashboard
    if (this.redisClient) {
      this.redisClient.lpush('fraud-alerts', JSON.stringify(alert))
      this.redisClient.ltrim('fraud-alerts', 0, 99) // Keep last 100 alerts
    }
  }

  /**
   * Subscribe to fraud alerts
   */
  onFraudAlert(callback: (alert: FraudDetectionAlert) => void): () => void {
    this.alertCallbacks.push(callback)
    
    return () => {
      const index = this.alertCallbacks.indexOf(callback)
      if (index > -1) {
        this.alertCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Get voting analytics
   */
  getAnalytics(): VotingAnalytics {
    const competitionId = 'current' // This would be passed in real implementation
    
    return {
      competition_id: competitionId,
      vote_velocity: this.analytics.averageVelocity,
      demographic_breakdown: this.getDemographicBreakdown(),
      sentiment_analysis: 0.5, // Would be calculated from actual sentiment data
      engagement_score: this.calculateEngagementScore(),
      controversy_index: this.calculateControversyIndex(),
      momentum_score: this.calculateMomentumScore(),
      predicted_winner: this.predictWinner()
    }
  }

  /**
   * Get demographic breakdown
   */
  private getDemographicBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {}
    
    this.patterns.forEach(pattern => {
      const key = pattern.userId ? 'registered' : 'anonymous'
      breakdown[key] = (breakdown[key] || 0) + pattern.votes.length
    })
    
    return breakdown
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(): number {
    if (this.patterns.size === 0) return 0
    
    const avgVotesPerUser = this.analytics.totalVotes / this.patterns.size
    const highEngagementUsers = Array.from(this.patterns.values())
      .filter(p => p.votes.length > avgVotesPerUser * 1.5).length
    
    return (highEngagementUsers / this.patterns.size) * 100
  }

  /**
   * Calculate controversy index
   */
  private calculateControversyIndex(): number {
    // This would need actual vote distribution data
    // For now, return based on voting patterns
    const rapidVoters = Array.from(this.patterns.values())
      .filter(p => p.velocity > 0.5).length
    
    return (rapidVoters / this.patterns.size) * 100
  }

  /**
   * Calculate momentum score
   */
  private calculateMomentumScore(): number {
    if (this.patterns.size === 0) return 0
    
    const recentVotes = Array.from(this.patterns.values())
      .reduce((sum, pattern) => {
        const fiveMinAgo = Date.now() - 300000
        return sum + pattern.votes.filter(v => v.timestamp > fiveMinAgo).length
      }, 0)
    
    return Math.min(100, (recentVotes / 50) * 100) // Normalize to 0-100
  }

  /**
   * Predict winner (placeholder)
   */
  private predictWinner(): string | undefined {
    // This would analyze voting patterns to predict winner
    return undefined
  }

  /**
   * Get fraud statistics
   */
  getFraudStats(): {
    totalVotes: number
    suspiciousVotes: number
    blockedVotes: number
    suspicionRate: number
    blockRate: number
    activePatterns: number
  } {
    return {
      totalVotes: this.analytics.totalVotes,
      suspiciousVotes: this.analytics.suspiciousVotes,
      blockedVotes: this.analytics.blockedVotes,
      suspicionRate: this.analytics.totalVotes > 0 ? 
        (this.analytics.suspiciousVotes / this.analytics.totalVotes) * 100 : 0,
      blockRate: this.analytics.totalVotes > 0 ? 
        (this.analytics.blockedVotes / this.analytics.totalVotes) * 100 : 0,
      activePatterns: this.patterns.size
    }
  }

  /**
   * Clean up old patterns
   */
  cleanup(): void {
    const oneHourAgo = Date.now() - 3600000
    
    for (const [key, pattern] of this.patterns.entries()) {
      if (pattern.lastVote < oneHourAgo) {
        this.patterns.delete(key)
      }
    }
  }

  /**
   * Shutdown fraud detector
   */
  shutdown(): void {
    if (this.redisClient) {
      this.redisClient.quit()
    }
    
    this.patterns.clear()
    this.alertCallbacks.length = 0
    
    console.log('Fraud detector shut down')
  }
}

// Export singleton instance
export const fraudDetector = new FraudDetector()

// Export utility functions
export function createFraudConfig() {
  return {
    enabled: process.env.FRAUD_DETECTION_ENABLED !== 'false',
    sensitivity: process.env.FRAUD_SENSITIVITY || 'medium',
    alertThreshold: parseInt(process.env.FRAUD_ALERT_THRESHOLD || '70'),
    blockThreshold: parseInt(process.env.FRAUD_BLOCK_THRESHOLD || '80')
  }
}