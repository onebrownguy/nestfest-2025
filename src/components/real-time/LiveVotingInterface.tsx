'use client'

/**
 * Live Voting Interface Component
 * 
 * Features:
 * - Real-time vote casting with instant feedback
 * - Live result updates with animations
 * - Voting momentum and trend tracking
 * - Fraud detection alerts
 * - Multiple voting types (simple, quadratic, ranked, approval)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebSocket } from './useWebSocket'
import { QuadraticVoting } from '@/components/features/QuadraticVoting'
import { Button } from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { showToast } from '@/components/ui/Toast'
import type { 
  Submission, 
  Competition, 
  VoteType, 
  RealtimeVoteUpdate, 
  VotingMomentum,
  FraudDetectionAlert,
  QuadraticVotingBudget
} from '@/types'

interface LiveVotingInterfaceProps {
  competition: Competition
  submissions: Submission[]
  currentSubmission?: Submission
  votingBudget?: QuadraticVotingBudget
  onVoteSubmitted?: (voteData: any) => void
  showMomentum?: boolean
  showFraudAlerts?: boolean
  disabled?: boolean
}

interface VoteCount {
  submissionId: string
  count: number
  trend: 'up' | 'down' | 'stable'
  change: number
  lastUpdate: string
}

export function LiveVotingInterface({
  competition,
  submissions,
  currentSubmission,
  votingBudget,
  onVoteSubmitted,
  showMomentum = true,
  showFraudAlerts = true,
  disabled = false
}: LiveVotingInterfaceProps) {
  const { socket, isConnected, emit, onVoteUpdate, onFraudAlert } = useWebSocket()
  
  const [voteCounts, setVoteCounts] = useState<Record<string, VoteCount>>({})
  const [userVotes, setUserVotes] = useState<Record<string, any>>({})
  const [momentum, setMomentum] = useState<Record<string, VotingMomentum>>({})
  const [isVoting, setIsVoting] = useState(false)
  const [fraudAlerts, setFraudAlerts] = useState<FraudDetectionAlert[]>([])
  const [voteHistory, setVoteHistory] = useState<RealtimeVoteUpdate[]>([])

  // Initialize vote counts
  useEffect(() => {
    const initialCounts: Record<string, VoteCount> = {}
    submissions.forEach(submission => {
      // Calculate initial vote count from submission.votes if available
      const initialCount = submission.votes?.reduce((sum, vote) => {
        return sum + (vote.vote_data?.value || vote.vote_data?.vote_count || 1)
      }, 0) || 0

      initialCounts[submission.id] = {
        submissionId: submission.id,
        count: initialCount,
        trend: 'stable',
        change: 0,
        lastUpdate: new Date().toISOString()
      }
    })
    setVoteCounts(initialCounts)
  }, [submissions])

  // Listen for real-time vote updates
  useEffect(() => {
    const unsubscribe = onVoteUpdate((update: RealtimeVoteUpdate) => {
      setVoteCounts(prev => {
        const current = prev[update.submissionId]
        const change = update.newVoteCount - (current?.count || 0)
        const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable'

        return {
          ...prev,
          [update.submissionId]: {
            submissionId: update.submissionId,
            count: update.newVoteCount,
            trend,
            change: Math.abs(change),
            lastUpdate: update.timestamp
          }
        }
      })

      // Add to vote history for momentum calculation
      setVoteHistory(prev => {
        const newHistory = [...prev, update].slice(-100) // Keep last 100 votes
        calculateMomentum(newHistory)
        return newHistory
      })

      // Animate vote count change
      animateVoteChange(update.submissionId, change > 0 ? '+' : '-')
    })

    return unsubscribe
  }, [onVoteUpdate])

  // Listen for fraud alerts
  useEffect(() => {
    if (!showFraudAlerts) return

    const unsubscribe = onFraudAlert((alert: FraudDetectionAlert) => {
      setFraudAlerts(prev => [...prev, alert].slice(-5)) // Keep last 5 alerts
      
      if (alert.severity === 'high' || alert.severity === 'critical') {
        showToast.warning(`Security Alert: ${alert.description}`)
      }
    })

    return unsubscribe
  }, [onFraudAlert, showFraudAlerts])

  // Calculate voting momentum
  const calculateMomentum = useCallback((history: RealtimeVoteUpdate[]) => {
    const now = Date.now()
    const fiveMinutesAgo = now - 5 * 60 * 1000

    submissions.forEach(submission => {
      const recentVotes = history.filter(vote => 
        vote.submissionId === submission.id &&
        new Date(vote.timestamp).getTime() > fiveMinutesAgo
      )

      const velocity = recentVotes.length / 5 // votes per minute
      const trend = recentVotes.length > 0 ? 'increasing' : 'stable'
      const peak = Math.max(...recentVotes.map(() => 1)) || 0
      const momentum_score = velocity * (trend === 'increasing' ? 1.5 : 1)

      setMomentum(prev => ({
        ...prev,
        [submission.id]: {
          submissionId: submission.id,
          velocity,
          trend: trend as 'increasing' | 'decreasing' | 'stable',
          peak,
          momentum_score
        }
      }))
    })
  }, [submissions])

  // Handle vote submission
  const handleVoteSubmit = useCallback(async (submissionId: string, voteData: any) => {
    if (!isConnected || isVoting || disabled) return

    setIsVoting(true)

    try {
      const votePayload = {
        competitionId: competition.id,
        submissionId,
        voteType: competition.config.voting_rules.type,
        voteData
      }

      // Optimistic update
      setUserVotes(prev => ({
        ...prev,
        [submissionId]: voteData
      }))

      // Emit real-time vote
      emit('cast_vote', votePayload)

      // Listen for acknowledgment
      socket?.once('vote_acknowledged', (response) => {
        showToast.success('Vote cast successfully!')
        onVoteSubmitted?.(votePayload)
      })

      socket?.once('vote_error', (error) => {
        // Revert optimistic update
        setUserVotes(prev => {
          const { [submissionId]: _, ...rest } = prev
          return rest
        })
        
        showToast.error(`Vote failed: ${error.message}`)
      })

    } catch (error) {
      console.error('Vote submission error:', error)
      showToast.error('Failed to submit vote')
      
      // Revert optimistic update
      setUserVotes(prev => {
        const { [submissionId]: _, ...rest } = prev
        return rest
      })
    } finally {
      setIsVoting(false)
    }
  }, [isConnected, isVoting, disabled, competition, emit, socket, onVoteSubmitted])

  // Animation for vote count changes
  const animateVoteChange = useCallback((submissionId: string, direction: '+' | '-') => {
    const element = document.getElementById(`vote-count-${submissionId}`)
    if (element) {
      element.classList.add(direction === '+' ? 'vote-increase' : 'vote-decrease')
      setTimeout(() => {
        element.classList.remove('vote-increase', 'vote-decrease')
      }, 1000)
    }
  }, [])

  // Render voting interface based on type
  const renderVotingInterface = useMemo(() => {
    const votingType = competition.config.voting_rules.type

    switch (votingType) {
      case 'quadratic':
        return (
          <QuadraticVoting
            submissions={submissions}
            budget={votingBudget}
            userVotes={userVotes}
            onVoteChange={handleVoteSubmit}
            disabled={disabled || isVoting}
          />
        )

      case 'simple':
        return (
          <SimpleVotingInterface
            submissions={submissions}
            userVotes={userVotes}
            onVote={handleVoteSubmit}
            disabled={disabled || isVoting}
          />
        )

      case 'ranked':
        return (
          <RankedVotingInterface
            submissions={submissions}
            userVotes={userVotes}
            onVote={handleVoteSubmit}
            disabled={disabled || isVoting}
          />
        )

      case 'approval':
        return (
          <ApprovalVotingInterface
            submissions={submissions}
            userVotes={userVotes}
            maxSelections={competition.config.voting_rules.max_selections}
            onVote={handleVoteSubmit}
            disabled={disabled || isVoting}
          />
        )

      default:
        return <div>Unsupported voting type</div>
    }
  }, [competition.config.voting_rules, submissions, votingBudget, userVotes, handleVoteSubmit, disabled, isVoting])

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            {isConnected ? 'Live Voting Active' : 'Connecting...'}
          </span>
        </div>
        
        {isVoting && (
          <div className="flex items-center space-x-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm">Processing vote...</span>
          </div>
        )}
      </div>

      {/* Live Results Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {submissions.map(submission => {
          const voteCount = voteCounts[submission.id]
          const submissionMomentum = momentum[submission.id]

          return (
            <motion.div
              key={submission.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="font-semibold text-lg mb-2">{submission.title}</h3>
              
              <div className="space-y-2">
                {/* Vote Count with Animation */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Votes:</span>
                  <motion.span
                    id={`vote-count-${submission.id}`}
                    className={`font-bold text-lg ${
                      voteCount?.trend === 'up' ? 'text-green-600' : 
                      voteCount?.trend === 'down' ? 'text-red-600' : 'text-gray-800'
                    }`}
                    animate={voteCount?.change > 0 ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {voteCount?.count || 0}
                  </motion.span>
                </div>

                {/* Momentum Indicator */}
                {showMomentum && submissionMomentum && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Momentum:</span>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        submissionMomentum.trend === 'increasing' ? 'bg-green-500' :
                        submissionMomentum.trend === 'decreasing' ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                      <span className={`text-xs ${
                        submissionMomentum.trend === 'increasing' ? 'text-green-600' :
                        submissionMomentum.trend === 'decreasing' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {submissionMomentum.velocity.toFixed(1)} votes/min
                      </span>
                    </div>
                  </div>
                )}

                {/* Change Indicator */}
                {voteCount?.change > 0 && (
                  <motion.div
                    className={`text-xs px-2 py-1 rounded ${
                      voteCount.trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    {voteCount.trend === 'up' ? '+' : '-'}{voteCount.change} votes
                  </motion.div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Voting Interface */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Cast Your Vote</h2>
        {renderVotingInterface}
      </div>

      {/* Fraud Alerts */}
      <AnimatePresence>
        {fraudAlerts.map(alert => (
          <motion.div
            key={alert.timestamp}
            className={`p-4 rounded-lg border-l-4 ${
              alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
              alert.severity === 'high' ? 'bg-orange-50 border-orange-500' :
              alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
              'bg-blue-50 border-blue-500'
            }`}
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm">Security Alert</h4>
                <p className="text-sm mt-1">{alert.description}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {alert.severity.toUpperCase()}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>


      {/* CSS for vote animations */}
      <style jsx>{`
        .vote-increase {
          animation: voteIncrease 1s ease-in-out;
        }
        
        .vote-decrease {
          animation: voteDecrease 1s ease-in-out;
        }
        
        @keyframes voteIncrease {
          0% { transform: scale(1); color: inherit; }
          50% { transform: scale(1.3); color: #10B981; }
          100% { transform: scale(1); color: inherit; }
        }
        
        @keyframes voteDecrease {
          0% { transform: scale(1); color: inherit; }
          50% { transform: scale(1.3); color: #EF4444; }
          100% { transform: scale(1); color: inherit; }
        }
      `}</style>
    </div>
  )
}

// Simple voting component
function SimpleVotingInterface({ submissions, userVotes, onVote, disabled }: any) {
  return (
    <div className="space-y-4">
      {submissions.map((submission: Submission) => (
        <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-semibold">{submission.title}</h4>
            <p className="text-sm text-gray-600">{submission.description}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map(value => (
              <Button
                key={value}
                variant={userVotes[submission.id]?.value === value ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onVote(submission.id, { value })}
                disabled={disabled}
              >
                {value}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Ranked voting component
function RankedVotingInterface({ submissions, userVotes, onVote, disabled }: any) {
  const [rankings, setRankings] = useState<Array<{ submission_id: string; rank: number }>>([])

  const handleRankChange = (submissionId: string, rank: number) => {
    const newRankings = rankings.filter(r => r.submission_id !== submissionId)
    newRankings.push({ submission_id: submissionId, rank })
    setRankings(newRankings.sort((a, b) => a.rank - b.rank))
  }

  const submitRankings = () => {
    onVote(null, { rankings })
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission: Submission, index: number) => (
        <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-semibold">{submission.title}</h4>
            <p className="text-sm text-gray-600">{submission.description}</p>
          </div>
          
          <select
            value={rankings.find(r => r.submission_id === submission.id)?.rank || ''}
            onChange={(e) => handleRankChange(submission.id, parseInt(e.target.value))}
            className="border rounded px-2 py-1"
            disabled={disabled}
          >
            <option value="">Select Rank</option>
            {submissions.map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
      ))}
      
      <Button
        onClick={submitRankings}
        disabled={disabled || rankings.length !== submissions.length}
        className="w-full"
      >
        Submit Rankings
      </Button>
    </div>
  )
}

// Approval voting component
function ApprovalVotingInterface({ submissions, userVotes, maxSelections, onVote, disabled }: any) {
  const [approvedSubmissions, setApprovedSubmissions] = useState<string[]>([])

  const toggleApproval = (submissionId: string) => {
    setApprovedSubmissions(prev => {
      const isApproved = prev.includes(submissionId)
      if (isApproved) {
        return prev.filter(id => id !== submissionId)
      } else if (!maxSelections || prev.length < maxSelections) {
        return [...prev, submissionId]
      }
      return prev
    })
  }

  const submitApprovals = () => {
    onVote(null, { approved_submissions: approvedSubmissions })
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission: Submission) => (
        <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-semibold">{submission.title}</h4>
            <p className="text-sm text-gray-600">{submission.description}</p>
          </div>
          
          <Button
            variant={approvedSubmissions.includes(submission.id) ? 'primary' : 'outline'}
            onClick={() => toggleApproval(submission.id)}
            disabled={disabled || (!approvedSubmissions.includes(submission.id) && maxSelections && approvedSubmissions.length >= maxSelections)}
          >
            {approvedSubmissions.includes(submission.id) ? 'Approved' : 'Approve'}
          </Button>
        </div>
      ))}
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {approvedSubmissions.length} / {maxSelections || submissions.length} selected
        </span>
        
        <Button
          onClick={submitApprovals}
          disabled={disabled || approvedSubmissions.length === 0}
        >
          Submit Approvals
        </Button>
      </div>
    </div>
  )
}