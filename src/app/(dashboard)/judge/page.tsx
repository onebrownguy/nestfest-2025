'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Button,
  Table,
  TableColumn,
  Select
} from '@/components/ui'
import { SubmissionList } from '@/components/features'
import { 
  VotingResultsChart, 
  SubmissionScoresChart,
  ActivitySummaryChart 
} from '@/components/charts'
import { 
  DocumentTextIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

// Mock data
const mockStats = {
  assignedSubmissions: 24,
  completedReviews: 18,
  averageReviewTime: 45, // minutes
  pendingDeadlines: 3
}

const mockAssignedSubmissions = [
  {
    id: '1',
    competition_id: '1',
    round_id: '1',
    user_id: 'user-1',
    title: 'Smart Campus Navigation System',
    description: 'An AR-powered mobile app that helps students navigate campus buildings and find resources',
    category_id: 'mobile-development',
    status: 'in_review' as const,
    submission_number: 'S2024-001',
    submitted_at: '2024-03-15T10:30:00Z',
    last_modified_at: '2024-03-15T10:30:00Z',
    metadata: {
      category: 'Mobile Development',
      tags: ['React Native', 'AR', 'Navigation'],
      technical_requirements: []
    },
    version: 1,
    files: [],
    reviews: [
      {
        id: '1',
        submission_id: '1',
        reviewer_user_id: 'current-judge',
        round_id: '1',
        status: 'in_progress' as const,
        time_spent_seconds: 1800,
        conflict_of_interest: false,
        confidence_level: 'high' as const,
        scores: {}
      }
    ],
    votes: []
  },
  {
    id: '2',
    competition_id: '1',
    round_id: '1',
    user_id: 'user-2',
    title: 'AI-Powered Code Review Assistant',
    description: 'Machine learning tool that provides intelligent code review suggestions',
    category_id: 'ai-ml',
    status: 'submitted' as const,
    submission_number: 'S2024-002',
    submitted_at: '2024-03-16T14:20:00Z',
    last_modified_at: '2024-03-16T14:20:00Z',
    metadata: {
      category: 'AI/ML',
      tags: ['Python', 'Machine Learning', 'Code Analysis'],
      technical_requirements: []
    },
    version: 1,
    files: [],
    reviews: [],
    votes: []
  }
]

const mockRecentActivity = [
  { hour: 'Mon', submissions: 0, reviews: 3, votes: 0 },
  { hour: 'Tue', submissions: 0, reviews: 4, votes: 0 },
  { hour: 'Wed', submissions: 0, reviews: 2, votes: 0 },
  { hour: 'Thu', submissions: 0, reviews: 5, votes: 0 },
  { hour: 'Fri', submissions: 0, reviews: 3, votes: 0 },
  { hour: 'Sat', submissions: 0, reviews: 1, votes: 0 },
  { hour: 'Sun', submissions: 0, reviews: 0, votes: 0 }
]

const mockVotingData = [
  { submission: 'Smart Campus', votes: 45, credits: 180, percentage: 28.5 },
  { submission: 'Code Assistant', votes: 38, credits: 142, percentage: 24.1 },
  { submission: 'Task Manager', votes: 32, credits: 95, percentage: 20.3 },
  { submission: 'Study Planner', votes: 28, credits: 88, percentage: 17.7 },
  { submission: 'Finance Tracker', votes: 15, credits: 35, percentage: 9.5 }
]

const mockScoreData = [
  { submission: 'Smart Campus', averageScore: 8.7, reviewCount: 5, category: 'Mobile' },
  { submission: 'Code Assistant', averageScore: 8.2, reviewCount: 4, category: 'AI/ML' },
  { submission: 'Task Manager', averageScore: 7.9, reviewCount: 6, category: 'Web' },
  { submission: 'Study Planner', averageScore: 7.5, reviewCount: 3, category: 'Mobile' },
  { submission: 'Finance Tracker', averageScore: 6.8, reviewCount: 4, category: 'Web' }
]

export default function JudgeDashboard() {
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const handleReviewSubmission = (submission: any) => {
    // Navigate to review interface
    window.location.href = `/judge/submissions/${submission.id}/review`
  }

  const handleViewSubmission = (submission: any) => {
    // Navigate to submission detail
    window.location.href = `/submissions/${submission.id}`
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Judge Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review submissions and manage judging assignments
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: 'all', label: 'All Competitions' },
              { value: 'spring-hackathon', label: 'Spring Hackathon' },
              { value: 'ai-challenge', label: 'AI Challenge' }
            ]}
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
          />
          <Button variant="outline">
            Export Reviews
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Assigned Submissions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.assignedSubmissions}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            6 new assignments
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed Reviews</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.completedReviews}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
            75% completion rate
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Review Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.averageReviewTime}m
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            5m faster than avg
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Deadlines</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.pendingDeadlines}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <StarIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
            1 due tomorrow
          </div>
        </div>
      </div>

      {/* Review Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Weekly Review Activity
        </h3>
        <ActivitySummaryChart data={mockRecentActivity} height={200} />
      </div>

      {/* Assigned Submissions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Assigned Submissions
          </h3>
          <div className="flex items-center gap-3">
            <Select
              options={[
                { value: 'pending', label: 'Pending Review' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'all', label: 'All Status' }
              ]}
              value="pending"
              size="sm"
            />
            <Link href="/judge/submissions">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </div>
        
        <SubmissionList
          submissions={mockAssignedSubmissions}
          loading={loading}
          viewMode="judge"
          showAuthor={true}
          onView={handleViewSubmission}
          onRate={handleReviewSubmission}
          emptyMessage="No submissions assigned for review"
        />
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voting Results */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Current Voting Results
            </h3>
            <Button variant="ghost" size="sm">
              <ChartBarIcon className="h-4 w-4 mr-1" />
              Details
            </Button>
          </div>
          <VotingResultsChart 
            data={mockVotingData}
            height={250}
            showCredits={false}
          />
        </div>

        {/* Score Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Review Scores vs Count
            </h3>
            <Button variant="ghost" size="sm">
              <EyeIcon className="h-4 w-4 mr-1" />
              Analyze
            </Button>
          </div>
          <SubmissionScoresChart 
            data={mockScoreData}
            height={250}
          />
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Review Deadlines
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  Spring Hackathon - Round 1 Reviews
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  12 submissions remaining • Due: April 1, 2024
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-red-600 dark:text-red-400">
                Tomorrow
              </div>
              <Button variant="outline" size="sm" className="mt-1">
                Start Reviews
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg flex items-center justify-center">
                <StarIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  AI Challenge - Final Scoring
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  8 submissions remaining • Due: April 5, 2024
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                5 days left
              </div>
              <Button variant="outline" size="sm" className="mt-1">
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Judge Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Judging Guidelines</h3>
          <p className="text-purple-100 mb-4">
            Review criteria, rubrics, and best practices for fair evaluation
          </p>
          <Button variant="outline" className="bg-white text-purple-600 hover:bg-gray-100 border-white">
            View Guidelines
          </Button>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Discussion Forum</h3>
          <p className="text-indigo-100 mb-4">
            Connect with other judges and discuss evaluation criteria
          </p>
          <Button variant="outline" className="bg-white text-indigo-600 hover:bg-gray-100 border-white">
            Join Discussion
          </Button>
        </div>
      </div>
    </div>
  )
}