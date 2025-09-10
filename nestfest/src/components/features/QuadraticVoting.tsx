'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Submission, QuadraticVotingBudget } from '@/types'
import { Button } from '@/components/ui'
import { 
  PlusIcon, 
  MinusIcon,
  SparklesIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface QuadraticVoteAllocation {
  submissionId: string
  votes: number
  credits: number
}

interface QuadraticVotingProps {
  submissions: Submission[]
  budget: QuadraticVotingBudget
  existingVotes?: Record<string, number> // submissionId -> vote count
  onVoteChange?: (allocations: QuadraticVoteAllocation[]) => void
  onSubmit?: (allocations: QuadraticVoteAllocation[]) => Promise<void>
  disabled?: boolean
  showBudgetDetails?: boolean
  className?: string
}

// Calculate quadratic cost: votes^2
const calculateCost = (votes: number) => votes * votes

// Calculate maximum votes possible with given credits
const calculateMaxVotes = (credits: number) => Math.floor(Math.sqrt(credits))

export const QuadraticVoting: React.FC<QuadraticVotingProps> = ({
  submissions,
  budget,
  existingVotes = {},
  onVoteChange,
  onSubmit,
  disabled = false,
  showBudgetDetails = true,
  className
}) => {
  const [allocations, setAllocations] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  // Initialize allocations from existing votes
  useEffect(() => {
    if (Object.keys(existingVotes).length > 0) {
      setAllocations(existingVotes)
    }
  }, [existingVotes])

  // Calculate totals
  const totals = useMemo(() => {
    const totalVotes = Object.values(allocations).reduce((sum, votes) => sum + votes, 0)
    const totalCredits = Object.values(allocations).reduce((sum, votes) => sum + calculateCost(votes), 0)
    const remainingCredits = budget.total_credits - budget.spent_credits - totalCredits
    
    return {
      totalVotes,
      totalCredits,
      remainingCredits,
      isOverBudget: remainingCredits < 0
    }
  }, [allocations, budget])

  // Create allocation array for callbacks
  const allocationArray = useMemo(() => {
    return Object.entries(allocations)
      .filter(([_, votes]) => votes > 0)
      .map(([submissionId, votes]) => ({
        submissionId,
        votes,
        credits: calculateCost(votes)
      }))
  }, [allocations])

  // Notify parent of changes
  useEffect(() => {
    onVoteChange?.(allocationArray)
  }, [allocationArray, onVoteChange])

  const updateVotes = (submissionId: string, newVotes: number) => {
    if (disabled || newVotes < 0) return

    const maxPossibleVotes = calculateMaxVotes(totals.remainingCredits + calculateCost(allocations[submissionId] || 0))
    const clampedVotes = Math.min(newVotes, maxPossibleVotes)

    setAllocations(prev => ({
      ...prev,
      [submissionId]: clampedVotes
    }))
  }

  const incrementVotes = (submissionId: string) => {
    const currentVotes = allocations[submissionId] || 0
    const newVotes = currentVotes + 1
    const additionalCost = calculateCost(newVotes) - calculateCost(currentVotes)
    
    if (additionalCost <= totals.remainingCredits) {
      updateVotes(submissionId, newVotes)
    }
  }

  const decrementVotes = (submissionId: string) => {
    const currentVotes = allocations[submissionId] || 0
    if (currentVotes > 0) {
      updateVotes(submissionId, currentVotes - 1)
    }
  }

  const handleSubmit = async () => {
    if (totals.isOverBudget || allocationArray.length === 0 || !onSubmit) return

    setIsSubmitting(true)
    try {
      await onSubmit(allocationArray)
    } catch (error) {
      console.error('Vote submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetVotes = () => {
    setAllocations({})
  }

  const getMaxVotesForSubmission = (submissionId: string) => {
    const currentVotes = allocations[submissionId] || 0
    const currentCost = calculateCost(currentVotes)
    const availableCredits = totals.remainingCredits + currentCost
    return calculateMaxVotes(availableCredits)
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Budget Overview */}
      {showBudgetDetails && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Voting Budget
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
              leftIcon={<InformationCircleIcon className="h-4 w-4" />}
            >
              How it works
            </Button>
          </div>

          {/* Budget Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {budget.total_credits - budget.spent_credits}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Credits</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                totals.remainingCredits < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {totals.remainingCredits}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Remaining</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {totals.totalVotes}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Votes</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {totals.totalCredits}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Credits Used</div>
            </div>
          </div>

          {/* Budget Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                totals.isOverBudget ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ 
                width: `${Math.min(100, (totals.totalCredits / (budget.total_credits - budget.spent_credits)) * 100)}%` 
              }}
            />
          </div>
          
          {totals.isOverBudget && (
            <div className="flex items-center text-sm text-red-600 dark:text-red-400 mt-2">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              Over budget by {Math.abs(totals.remainingCredits)} credits
            </div>
          )}

          {/* Info Panel */}
          {showInfo && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                How Quadratic Voting Works
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Each vote costs quadratically more credits (1 vote = 1 credit, 2 votes = 4 credits, 3 votes = 9 credits)</li>
                <li>• This system prevents wealthy voters from dominating and encourages diverse participation</li>
                <li>• You can allocate votes across multiple submissions based on your preferences</li>
                <li>• The cost increases exponentially to encourage thoughtful voting</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Submission Voting */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cast Your Votes
          </h3>
          
          {Object.keys(allocations).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetVotes}
              disabled={disabled}
            >
              Reset All
            </Button>
          )}
        </div>

        <div className="grid gap-4">
          {submissions.map((submission) => {
            const currentVotes = allocations[submission.id] || 0
            const currentCost = calculateCost(currentVotes)
            const maxVotes = getMaxVotesForSubmission(submission.id)
            const canIncrement = currentVotes < maxVotes && !disabled
            const canDecrement = currentVotes > 0 && !disabled

            return (
              <div
                key={submission.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 mr-4">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {submission.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                      {submission.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>#{submission.submission_number}</span>
                      {submission.metadata.category && (
                        <span>{submission.metadata.category}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Vote Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => decrementVotes(submission.id)}
                        disabled={!canDecrement}
                        className="w-8 h-8 p-0"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </Button>

                      <div className="text-center min-w-[60px]">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {currentVotes}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {currentCost} credit{currentCost !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => incrementVotes(submission.id)}
                        disabled={!canIncrement}
                        className="w-8 h-8 p-0"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Vote Indicator */}
                    {currentVotes > 0 && (
                      <div className="flex items-center text-blue-600 dark:text-blue-400">
                        <SparklesIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">Voted</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Max votes indicator */}
                {maxVotes > currentVotes && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Max possible votes with current budget: {maxVotes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Submit Button */}
      {onSubmit && (
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleSubmit}
            disabled={disabled || isSubmitting || totals.isOverBudget || allocationArray.length === 0}
            loading={isSubmitting}
            leftIcon={<CheckCircleIcon className="h-4 w-4" />}
            size="lg"
          >
            Submit Votes ({totals.totalVotes} vote{totals.totalVotes !== 1 ? 's' : ''})
          </Button>
        </div>
      )}
    </div>
  )
}

// Voting Results Component
interface QuadraticVotingResultsProps {
  results: Array<{
    submission: Submission
    totalVotes: number
    totalCredits: number
    voterCount: number
    averageVotes: number
  }>
  showDetails?: boolean
  className?: string
}

export const QuadraticVotingResults: React.FC<QuadraticVotingResultsProps> = ({
  results,
  showDetails = false,
  className
}) => {
  const maxVotes = Math.max(...results.map(r => r.totalVotes))

  return (
    <div className={`space-y-4 ${className || ''}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Voting Results
      </h3>

      <div className="space-y-3">
        {results
          .sort((a, b) => b.totalVotes - a.totalVotes)
          .map((result, index) => (
            <div
              key={result.submission.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                      index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                      'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}
                  `}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {result.submission.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      #{result.submission.submission_number}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {result.totalVotes} votes
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {result.totalCredits} credits
                  </div>
                </div>
              </div>

              {/* Vote Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(result.totalVotes / maxVotes) * 100}%` }}
                  />
                </div>
              </div>

              {showDetails && (
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-medium">Voters:</span> {result.voterCount}
                  </div>
                  <div>
                    <span className="font-medium">Avg Votes:</span> {result.averageVotes.toFixed(1)}
                  </div>
                  <div>
                    <span className="font-medium">Credits/Vote:</span> {(result.totalCredits / result.totalVotes).toFixed(1)}
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}