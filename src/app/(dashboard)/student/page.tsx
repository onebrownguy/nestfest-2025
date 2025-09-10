'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Button,
  Table,
  TableColumn,
  DashboardWidgetSkeleton,
  CompetitionCardSkeleton
} from '@/components/ui'
import { CompetitionList, SubmissionList } from '@/components/features'
import { StatsOverviewChart, ActivitySummaryChart } from '@/components/charts'
import { 
  TrophyIcon,
  DocumentTextIcon,
  ClockIcon,
  StarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

// Mock data - replace with actual API calls
const mockStats = {
  totalSubmissions: 12,
  activeCompetitions: 3,
  averageScore: 8.4,
  rank: 15
}

const mockRecentActivity = [
  { hour: 'Mon', submissions: 2, reviews: 0, votes: 1 },
  { hour: 'Tue', submissions: 1, reviews: 1, votes: 1 },
  { hour: 'Wed', submissions: 0, reviews: 0, votes: 1 },
  { hour: 'Thu', submissions: 3, reviews: 2, votes: 1 },
  { hour: 'Fri', submissions: 1, reviews: 1, votes: 1 },
  { hour: 'Sat', submissions: 2, reviews: 0, votes: 1 },
  { hour: 'Sun', submissions: 0, reviews: 1, votes: 1 }
]

const mockActiveCompetitions = [
  {
    id: '1',
    name: 'Spring Hackathon 2024',
    slug: 'spring-hackathon-2024',
    description: 'Build innovative solutions using modern web technologies',
    start_date: '2024-03-01T00:00:00Z',
    submission_deadline: '2024-03-31T23:59:59Z',
    judging_start_date: '2024-04-01T00:00:00Z',
    judging_end_date: '2024-04-15T23:59:59Z',
    event_date: '2024-04-20T10:00:00Z',
    status: 'open' as const,
    max_submissions_per_user: 1,
    allow_team_submissions: true,
    team_size_min: 2,
    team_size_max: 5,
    voting_enabled: true,
    public_voting_enabled: true,
    config: {
      voting_rules: {
        type: 'quadratic' as const,
        budget: 100,
        allow_ties: true,
        weight_multiplier: 1
      },
      advancement_rules: {
        type: 'top_n' as const,
        value: 10,
        tie_breaking_method: 'judge_preference' as const
      },
      file_restrictions: {
        max_file_size: 100 * 1024 * 1024,
        allowed_types: ['pdf', 'zip', 'mp4'],
        max_files_per_submission: 5,
        require_virus_scan: true
      },
      notification_settings: {
        email_enabled: true,
        sms_enabled: false,
        in_app_enabled: true,
        digest_frequency: 'daily' as const
      }
    },
    rounds: [],
    created_at: '2024-01-01T00:00:00Z'
  }
]

const mockRecentSubmissions = [
  {
    id: '1',
    competition_id: '1',
    round_id: '1',
    user_id: 'current-user',
    title: 'AI-Powered Task Manager',
    description: 'A smart task management app that uses AI to prioritize and organize tasks',
    category_id: 'web-development',
    status: 'submitted' as const,
    submission_number: 'S2024-001',
    submitted_at: '2024-03-15T10:30:00Z',
    last_modified_at: '2024-03-15T10:30:00Z',
    metadata: {
      category: 'Web Development',
      tags: ['React', 'AI', 'Productivity'],
      technical_requirements: []
    },
    version: 1,
    files: [
      {
        id: '1',
        submission_id: '1',
        file_type: 'document' as const,
        original_filename: 'project-documentation.pdf',
        storage_key: 'submissions/1/project-documentation.pdf',
        file_size: 2048000,
        mime_type: 'application/pdf',
        upload_status: 'ready' as const,
        virus_scan_status: 'clean' as const,
        uploaded_at: '2024-03-15T10:25:00Z'
      }
    ],
    reviews: [],
    votes: []
  }
]

export default function StudentDashboard() {
  const [loading, setLoading] = useState(false)

  const handleViewSubmission = (submission: any) => {
    // Navigate to submission detail
    window.location.href = `/submissions/${submission.id}`
  }

  const handleEditSubmission = (submission: any) => {
    // Navigate to submission edit
    window.location.href = `/submissions/${submission.id}/edit`
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Student Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your submissions and competition progress
          </p>
        </div>
        
        <Button
          leftIcon={<PlusIcon className="h-4 w-4" />}
        >
          New Submission
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.totalSubmissions}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
            +2 this week
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Competitions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.activeCompetitions}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TrophyIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
            2 closing soon
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.averageScore}/10
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <StarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
            +0.3 improvement
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Rank</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                #{mockStats.rank}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
            +5 positions
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Weekly Activity
        </h3>
        <ActivitySummaryChart data={mockRecentActivity} height={200} />
      </div>

      {/* Active Competitions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Active Competitions
          </h3>
          <Link href="/competitions">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
        
        <CompetitionList
          competitions={mockActiveCompetitions}
          loading={loading}
          viewMode="student"
          emptyMessage="No active competitions available"
        />
      </div>

      {/* Recent Submissions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Submissions
          </h3>
          <Link href="/student/submissions">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
        
        <SubmissionList
          submissions={mockRecentSubmissions}
          loading={loading}
          viewMode="student"
          onView={handleViewSubmission}
          onEdit={handleEditSubmission}
          emptyMessage="No submissions yet"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Start a New Project</h3>
          <p className="text-blue-100 mb-4">
            Browse available competitions and submit your innovative solutions
          </p>
          <Link href="/competitions">
            <Button variant="outline" className="bg-white text-blue-600 hover:bg-gray-100 border-white">
              Browse Competitions
            </Button>
          </Link>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Join a Team</h3>
          <p className="text-green-100 mb-4">
            Connect with other participants and form teams for collaborative projects
          </p>
          <Link href="/teams">
            <Button variant="outline" className="bg-white text-green-600 hover:bg-gray-100 border-white">
              Find Teams
            </Button>
          </Link>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Deadlines
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">
                Spring Hackathon 2024 - Submission Deadline
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                March 31, 2024 at 11:59 PM
              </p>
            </div>
            <div className="text-sm font-medium text-red-600 dark:text-red-400">
              2 days left
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                AI Challenge - Final Review
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                April 5, 2024 at 5:00 PM
              </p>
            </div>
            <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              1 week left
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}