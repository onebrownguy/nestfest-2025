'use client'

import React from 'react'
import Link from 'next/link'
import { Submission, SubmissionStatus, User } from '@/types'
import { Button } from '@/components/ui'
import { 
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  PresentationChartBarIcon,
  CodeBracketIcon,
  PaperClipIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline'

interface SubmissionCardProps {
  submission: Submission
  viewMode?: 'student' | 'judge' | 'admin' | 'public'
  showAuthor?: boolean
  onEdit?: (submission: Submission) => void
  onDelete?: (submission: Submission) => void
  onView?: (submission: Submission) => void
  onRate?: (submission: Submission) => void
  className?: string
}

const statusStyles: Record<SubmissionStatus, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  draft: { 
    bg: 'bg-gray-100 dark:bg-gray-700', 
    text: 'text-gray-800 dark:text-gray-300', 
    label: 'Draft',
    icon: <PencilIcon className="h-3 w-3" />
  },
  submitted: { 
    bg: 'bg-blue-100 dark:bg-blue-900/30', 
    text: 'text-blue-800 dark:text-blue-300', 
    label: 'Submitted',
    icon: <CheckCircleIcon className="h-3 w-3" />
  },
  in_review: { 
    bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
    text: 'text-yellow-800 dark:text-yellow-300', 
    label: 'In Review',
    icon: <ClockIcon className="h-3 w-3" />
  },
  accepted: { 
    bg: 'bg-green-100 dark:bg-green-900/30', 
    text: 'text-green-800 dark:text-green-300', 
    label: 'Accepted',
    icon: <CheckCircleIcon className="h-3 w-3" />
  },
  rejected: { 
    bg: 'bg-red-100 dark:bg-red-900/30', 
    text: 'text-red-800 dark:text-red-300', 
    label: 'Rejected',
    icon: <XCircleIcon className="h-3 w-3" />
  },
  advanced: { 
    bg: 'bg-purple-100 dark:bg-purple-900/30', 
    text: 'text-purple-800 dark:text-purple-300', 
    label: 'Advanced',
    icon: <StarIcon className="h-3 w-3" />
  },
  eliminated: { 
    bg: 'bg-gray-100 dark:bg-gray-700', 
    text: 'text-gray-800 dark:text-gray-400', 
    label: 'Eliminated',
    icon: <XCircleIcon className="h-3 w-3" />
  },
  winner: { 
    bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
    text: 'text-yellow-800 dark:text-yellow-300', 
    label: 'Winner',
    icon: <StarIcon className="h-3 w-3 text-yellow-500" />
  }
}

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'document':
      return <DocumentTextIcon className="h-4 w-4" />
    case 'image':
      return <PhotoIcon className="h-4 w-4" />
    case 'video':
      return <VideoCameraIcon className="h-4 w-4" />
    case 'slide':
      return <PresentationChartBarIcon className="h-4 w-4" />
    case 'code':
      return <CodeBracketIcon className="h-4 w-4" />
    default:
      return <PaperClipIcon className="h-4 w-4" />
  }
}

export const SubmissionCard: React.FC<SubmissionCardProps> = ({
  submission,
  viewMode = 'student',
  showAuthor = false,
  onEdit,
  onDelete,
  onView,
  onRate,
  className
}) => {
  const status = statusStyles[submission.status]
  const canEdit = viewMode === 'student' && ['draft', 'submitted'].includes(submission.status)
  const canDelete = viewMode === 'student' && submission.status === 'draft'

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate average score if reviews exist
  const averageScore = submission.reviews && submission.reviews.length > 0
    ? submission.reviews.reduce((acc, review) => acc + (review.overall_score || 0), 0) / submission.reviews.length
    : null

  // Count votes
  const voteCount = submission.votes?.length || 0

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
              {submission.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              #{submission.submission_number}
            </p>
            {showAuthor && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {/* Author information would come from joined user data */}
                Submitted by Team/User
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <span className={`
              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1
              ${status.bg} ${status.text}
            `}>
              {status.icon}
              {status.label}
            </span>
          </div>
        </div>

        {submission.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {submission.description}
          </p>
        )}
      </div>

      {/* Files */}
      {submission.files && submission.files.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <PaperClipIcon className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Files ({submission.files.length})
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {submission.files.slice(0, 3).map((file) => (
              <div 
                key={file.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs"
              >
                {getFileIcon(file.file_type)}
                <span className="text-gray-700 dark:text-gray-300 truncate max-w-24">
                  {file.original_filename}
                </span>
              </div>
            ))}
            {submission.files.length > 3 && (
              <div className="flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs text-gray-600 dark:text-gray-400">
                +{submission.files.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {submission.submitted_at && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Submitted</div>
              <div className="font-medium text-gray-700 dark:text-gray-300">
                {formatDate(submission.submitted_at)}
              </div>
            </div>
          )}
          
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Category</div>
            <div className="font-medium text-gray-700 dark:text-gray-300">
              {submission.category_id}
            </div>
          </div>
        </div>

        {/* Tags */}
        {submission.metadata.tags && submission.metadata.tags.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1">
              {submission.metadata.tags.slice(0, 3).map((tag) => (
                <span 
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                >
                  {tag}
                </span>
              ))}
              {submission.metadata.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  +{submission.metadata.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Score and Votes */}
      {(averageScore !== null || voteCount > 0) && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-6 text-sm">
            {averageScore !== null && (
              <div className="flex items-center gap-2">
                <StarIcon className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {averageScore.toFixed(1)}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  ({submission.reviews?.length} review{submission.reviews?.length !== 1 ? 's' : ''})
                </span>
              </div>
            )}
            
            {voteCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {voteCount}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  vote{voteCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Version {submission.version}
          </div>
          
          <div className="flex items-center gap-2">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(submission)}
                leftIcon={<EyeIcon className="h-4 w-4" />}
              >
                View
              </Button>
            )}
            
            {canEdit && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(submission)}
                leftIcon={<PencilIcon className="h-4 w-4" />}
              >
                Edit
              </Button>
            )}
            
            {onRate && viewMode === 'judge' && (
              <Button
                size="sm"
                onClick={() => onRate(submission)}
                leftIcon={<StarIcon className="h-4 w-4" />}
              >
                Rate
              </Button>
            )}
            
            {canDelete && onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(submission)}
                leftIcon={<TrashIcon className="h-4 w-4" />}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Submission List Component
interface SubmissionListProps {
  submissions: Submission[]
  loading?: boolean
  viewMode?: 'student' | 'judge' | 'admin' | 'public'
  showAuthor?: boolean
  onEdit?: (submission: Submission) => void
  onDelete?: (submission: Submission) => void
  onView?: (submission: Submission) => void
  onRate?: (submission: Submission) => void
  emptyMessage?: string
  className?: string
}

export const SubmissionList: React.FC<SubmissionListProps> = ({
  submissions,
  loading = false,
  viewMode = 'student',
  showAuthor = false,
  onEdit,
  onDelete,
  onView,
  onRate,
  emptyMessage = 'No submissions found',
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
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
              </div>
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ${className || ''}`}>
      {submissions.map((submission) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          viewMode={viewMode}
          showAuthor={showAuthor}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onRate={onRate}
        />
      ))}
    </div>
  )
}