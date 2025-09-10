'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/provider'
import { Button } from '@/components/ui'
import { 
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  LinkIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

// Mock submissions data
const mockSubmissions = [
  {
    id: 1,
    title: 'EcoTracker - Carbon Footprint App',
    competition: 'Sustainability Innovation Challenge',
    status: 'submitted',
    submittedAt: '2025-01-20T10:30:00Z',
    lastModified: '2025-01-19T16:45:00Z',
    description: 'A mobile application that helps users track and reduce their carbon footprint through gamification and community challenges.',
    teamMembers: ['You', 'Sarah Chen', 'Mike Johnson'],
    files: [
      { name: 'presentation.pdf', size: '2.4 MB', type: 'pdf' },
      { name: 'demo_video.mp4', size: '15.2 MB', type: 'video' },
      { name: 'source_code.zip', size: '8.7 MB', type: 'archive' }
    ],
    links: [
      { name: 'Live Demo', url: 'https://ecotracker-demo.vercel.app' },
      { name: 'GitHub Repository', url: 'https://github.com/team/ecotracker' }
    ],
    feedback: null,
    score: null
  },
  {
    id: 2,
    title: 'StudyBuddy - AI Study Assistant',
    competition: 'AI for Good Hackathon',
    status: 'draft',
    submittedAt: null,
    lastModified: '2025-01-22T14:20:00Z',
    description: 'An AI-powered study assistant that creates personalized study plans and provides intelligent tutoring.',
    teamMembers: ['You', 'Alex Rivera'],
    files: [
      { name: 'prototype.pdf', size: '1.8 MB', type: 'pdf' },
      { name: 'wireframes.fig', size: '5.3 MB', type: 'design' }
    ],
    links: [
      { name: 'Figma Prototype', url: 'https://figma.com/proto/studybuddy' }
    ],
    feedback: null,
    score: null
  },
  {
    id: 3,
    title: 'GreenMarket - Local Food Network',
    competition: 'Student Entrepreneur Pitch',
    status: 'under_review',
    submittedAt: '2025-01-15T09:15:00Z',
    lastModified: '2025-01-15T09:15:00Z',
    description: 'A platform connecting local farmers with consumers to reduce food waste and support sustainable agriculture.',
    teamMembers: ['You', 'Emma Davis', 'Carlos Rodriguez', 'Priya Patel'],
    files: [
      { name: 'business_plan.pdf', size: '3.1 MB', type: 'pdf' },
      { name: 'pitch_deck.pptx', size: '12.4 MB', type: 'presentation' },
      { name: 'market_research.xlsx', size: '892 KB', type: 'spreadsheet' }
    ],
    links: [
      { name: 'MVP Website', url: 'https://greenmarket-mvp.com' },
      { name: 'Market Analysis', url: 'https://docs.google.com/spreadsheets/d/abc123' }
    ],
    feedback: 'Initial review looks promising. Please provide more detailed financial projections for the next round.',
    score: 78
  }
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'submitted':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />
    case 'draft':
      return <DocumentTextIcon className="h-5 w-5 text-gray-400" />
    case 'under_review':
      return <ClockIcon className="h-5 w-5 text-yellow-500" />
    case 'reviewed':
      return <CheckCircleIcon className="h-5 w-5 text-blue-500" />
    case 'rejected':
      return <XCircleIcon className="h-5 w-5 text-red-500" />
    default:
      return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'submitted':
      return 'Submitted'
    case 'draft':
      return 'Draft'
    case 'under_review':
      return 'Under Review'
    case 'reviewed':
      return 'Reviewed'
    case 'rejected':
      return 'Not Selected'
    default:
      return 'Unknown'
  }
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'submitted':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    case 'under_review':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'reviewed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <DocumentTextIcon className="h-5 w-5 text-red-500" />
    case 'video':
      return <PhotoIcon className="h-5 w-5 text-purple-500" />
    case 'archive':
      return <DocumentTextIcon className="h-5 w-5 text-blue-500" />
    case 'presentation':
      return <DocumentTextIcon className="h-5 w-5 text-orange-500" />
    case 'spreadsheet':
      return <DocumentTextIcon className="h-5 w-5 text-green-500" />
    case 'design':
      return <PhotoIcon className="h-5 w-5 text-pink-500" />
    default:
      return <DocumentTextIcon className="h-5 w-5 text-gray-500" />
  }
}

export default function StudentSubmissionsPage() {
  const { user } = useAuth()
  const [selectedFilter, setSelectedFilter] = useState('all')

  const filteredSubmissions = mockSubmissions.filter(submission => {
    if (selectedFilter === 'all') return true
    return submission.status === selectedFilter
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Submissions</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage and track your competition submissions
          </p>
        </div>
        <Link href="/competitions">
          <Button variant="primary" leftIcon={<PlusIcon className="h-4 w-4" />}>
            New Submission
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
        >
          <option value="all">All Submissions</option>
          <option value="draft">Drafts</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="reviewed">Reviewed</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Submissions</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{mockSubmissions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Submitted</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {mockSubmissions.filter(s => s.status === 'submitted').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Under Review</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {mockSubmissions.filter(s => s.status === 'under_review').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-gray-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Drafts</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {mockSubmissions.filter(s => s.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-6">
        {filteredSubmissions.map((submission) => (
          <div key={submission.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    {getStatusIcon(submission.status)}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {submission.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(submission.status)}`}>
                          {getStatusText(submission.status)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {submission.competition}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {submission.description}
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {submission.score && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">{submission.score}/100</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Score</div>
                    </div>
                  )}
                  <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                    {submission.submittedAt ? (
                      <>
                        <div>Submitted</div>
                        <div>{formatDate(submission.submittedAt)}</div>
                      </>
                    ) : (
                      <>
                        <div>Last Modified</div>
                        <div>{formatDate(submission.lastModified)}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Team Members:</h4>
                <div className="flex flex-wrap gap-2">
                  {submission.teamMembers.map((member, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full"
                    >
                      {member}
                    </span>
                  ))}
                </div>
              </div>

              {/* Files */}
              {submission.files.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attached Files:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {submission.files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {file.size}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {submission.links.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Links:</h4>
                  <div className="space-y-1">
                    {submission.links.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <LinkIcon className="h-4 w-4" />
                        {link.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {submission.feedback && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Judge Feedback:</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-300">{submission.feedback}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" leftIcon={<EyeIcon className="h-4 w-4" />} className="flex-1">
                  View Details
                </Button>
                {submission.status === 'draft' && (
                  <>
                    <Button variant="outline" leftIcon={<PencilIcon className="h-4 w-4" />}>
                      Continue Editing
                    </Button>
                    <Button variant="primary" leftIcon={<CloudArrowUpIcon className="h-4 w-4" />}>
                      Submit
                    </Button>
                  </>
                )}
                {submission.status === 'submitted' && (
                  <Button variant="outline" leftIcon={<PencilIcon className="h-4 w-4" />}>
                    Update Submission
                  </Button>
                )}
                <Button variant="outline" className="text-red-600 hover:text-red-700" leftIcon={<TrashIcon className="h-4 w-4" />}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSubmissions.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {selectedFilter === 'all' ? 'No submissions yet' : `No ${selectedFilter} submissions`}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {selectedFilter === 'all' 
              ? 'Get started by creating your first submission for a competition.'
              : `Try changing the filter to see submissions with different statuses.`
            }
          </p>
          {selectedFilter === 'all' && (
            <div className="mt-6">
              <Link href="/competitions">
                <Button variant="primary" leftIcon={<PlusIcon className="h-4 w-4" />}>
                  Browse Competitions
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}