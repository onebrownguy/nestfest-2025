'use client'

import React from 'react'
import Link from 'next/link'
import { Competition, CompetitionStatus } from '@/types'
import { Button } from '@/components/ui'
import { 
  CalendarIcon, 
  ClockIcon,
  UserGroupIcon,
  TrophyIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

interface CompetitionCardProps {
  competition: Competition
  viewMode?: 'student' | 'judge' | 'admin'
  onEdit?: (competition: Competition) => void
  onView?: (competition: Competition) => void
  className?: string
}

const statusStyles: Record<CompetitionStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
  open: { bg: 'bg-green-100', text: 'text-green-800', label: 'Open' },
  reviewing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Reviewing' },
  judging: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Judging' },
  live: { bg: 'bg-red-100', text: 'text-red-800', label: 'Live Event' },
  completed: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Completed' },
  archived: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Archived' }
}

export const CompetitionCard: React.FC<CompetitionCardProps> = ({
  competition,
  viewMode = 'student',
  onEdit,
  onView,
  className
}) => {
  const status = statusStyles[competition.status]
  const isActive = ['open', 'reviewing', 'judging', 'live'].includes(competition.status)
  
  // Calculate key dates
  const now = new Date()
  const submissionDeadline = new Date(competition.submission_deadline)
  const eventDate = new Date(competition.event_date)
  const daysUntilDeadline = Math.ceil((submissionDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTimeUntilText = () => {
    if (competition.status === 'open' && daysUntilDeadline > 0) {
      return `${daysUntilDeadline} days to submit`
    }
    if (competition.status === 'live' || (daysUntilEvent > 0 && daysUntilEvent <= 7)) {
      return `${daysUntilEvent} days to event`
    }
    return null
  }

  return (
    <div className={`
      bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700
      hover:shadow-md transition-shadow duration-200 overflow-hidden
      ${className || ''}
    `}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate mb-1">
              {competition.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {competition.slug}
            </p>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <span className={`
              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${status.bg} ${status.text}
            `}>
              {status.label}
            </span>
            
            {isActive && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </div>
        </div>

        {competition.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {competition.description}
          </p>
        )}
      </div>

      {/* Key Info */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Deadline</div>
              <div className="font-medium">{formatDate(competition.submission_deadline)}</div>
            </div>
          </div>
          
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <TrophyIcon className="h-4 w-4 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Event</div>
              <div className="font-medium">{formatDate(competition.event_date)}</div>
            </div>
          </div>
        </div>

        {/* Time until indicator */}
        {getTimeUntilText() && (
          <div className="mt-3 flex items-center text-xs text-orange-600 dark:text-orange-400">
            <ClockIcon className="h-3 w-3 mr-1" />
            {getTimeUntilText()}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          {competition.allow_team_submissions && (
            <div className="flex items-center">
              <UserGroupIcon className="h-3 w-3 mr-1" />
              Team Submissions
            </div>
          )}
          
          {competition.voting_enabled && (
            <div className="flex items-center">
              <div className="w-3 h-3 mr-1 bg-blue-500 rounded-full"></div>
              Voting Enabled
            </div>
          )}
          
          {competition.public_voting_enabled && (
            <div className="flex items-center">
              <div className="w-3 h-3 mr-1 bg-green-500 rounded-full"></div>
              Public Vote
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {competition.rounds.length} round{competition.rounds.length !== 1 ? 's' : ''}
          </div>
          
          <div className="flex items-center gap-2">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(competition)}
                leftIcon={<EyeIcon className="h-4 w-4" />}
              >
                View
              </Button>
            )}
            
            {viewMode === 'admin' && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(competition)}
                leftIcon={<PencilIcon className="h-4 w-4" />}
              >
                Edit
              </Button>
            )}
            
            {viewMode === 'student' && competition.status === 'open' && (
              <Link href={`/competitions/${competition.slug}/submit`}>
                <Button size="sm">
                  Submit Entry
                </Button>
              </Link>
            )}
            
            {viewMode === 'judge' && ['reviewing', 'judging'].includes(competition.status) && (
              <Link href={`/judge/competitions/${competition.slug}`}>
                <Button size="sm">
                  Review
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Competition List Component
interface CompetitionListProps {
  competitions: Competition[]
  loading?: boolean
  viewMode?: 'student' | 'judge' | 'admin'
  onEdit?: (competition: Competition) => void
  onView?: (competition: Competition) => void
  emptyMessage?: string
  className?: string
}

export const CompetitionList: React.FC<CompetitionListProps> = ({
  competitions,
  loading = false,
  viewMode = 'student',
  onEdit,
  onView,
  emptyMessage = 'No competitions available',
  className
}) => {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ${className || ''}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (competitions.length === 0) {
    return (
      <div className="text-center py-12">
        <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ${className || ''}`}>
      {competitions.map((competition) => (
        <CompetitionCard
          key={competition.id}
          competition={competition}
          viewMode={viewMode}
          onEdit={onEdit}
          onView={onView}
        />
      ))}
    </div>
  )
}