'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Button,
  Table,
  TableColumn,
  Select,
  Modal
} from '@/components/ui'
import { 
  DashboardWidgetSkeleton,
  TableSkeleton,
  InlineLoading 
} from '@/components/ui/LoadingStates'
import { CompetitionList } from '@/components/features'
import { UserManagement } from '@/components/admin'
import { 
  StatsOverviewChart,
  UserEngagementChart,
  CompetitionMetricsChart,
  SystemPerformanceChart,
  UserRoleDistribution
} from '@/components/charts'
import { 
  UsersIcon,
  TrophyIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

// Mock data
const mockStats = {
  totalUsers: 2847,
  activeCompetitions: 8,
  totalSubmissions: 1456,
  systemUptime: 99.9
}

const mockOverviewData = [
  { period: 'Jan', submissions: 120, reviews: 89, users: 45 },
  { period: 'Feb', submissions: 142, reviews: 156, users: 67 },
  { period: 'Mar', submissions: 189, reviews: 203, users: 89 },
  { period: 'Apr', submissions: 167, reviews: 178, users: 56 },
  { period: 'May', submissions: 198, reviews: 234, users: 78 },
  { period: 'Jun', submissions: 223, reviews: 267, users: 92 }
]

const mockUserEngagement = [
  { date: '2024-03-01', activeUsers: 234, sessionsPerUser: 2.3, avgSessionDuration: 18 },
  { date: '2024-03-02', activeUsers: 267, sessionsPerUser: 2.1, avgSessionDuration: 22 },
  { date: '2024-03-03', activeUsers: 198, sessionsPerUser: 1.9, avgSessionDuration: 15 },
  { date: '2024-03-04', activeUsers: 289, sessionsPerUser: 2.5, avgSessionDuration: 25 },
  { date: '2024-03-05', activeUsers: 312, sessionsPerUser: 2.7, avgSessionDuration: 28 },
  { date: '2024-03-06', activeUsers: 298, sessionsPerUser: 2.4, avgSessionDuration: 24 },
  { date: '2024-03-07', activeUsers: 245, sessionsPerUser: 2.0, avgSessionDuration: 19 }
]

const mockCompetitionMetrics = [
  { name: 'Spring Hackathon', submissions: 234, participants: 456, completionRate: 78, satisfaction: 4.2 },
  { name: 'AI Challenge', submissions: 189, participants: 298, completionRate: 85, satisfaction: 4.5 },
  { name: 'Web Dev Contest', submissions: 156, participants: 223, completionRate: 72, satisfaction: 4.0 },
  { name: 'Mobile App Race', submissions: 198, participants: 334, completionRate: 89, satisfaction: 4.7 }
]

const mockSystemPerformance = [
  { time: '00:00', responseTime: 145, throughput: 234, errorRate: 0.1, cpuUsage: 45 },
  { time: '04:00', responseTime: 123, throughput: 189, errorRate: 0.0, cpuUsage: 38 },
  { time: '08:00', responseTime: 167, throughput: 345, errorRate: 0.2, cpuUsage: 62 },
  { time: '12:00', responseTime: 198, throughput: 456, errorRate: 0.3, cpuUsage: 78 },
  { time: '16:00', responseTime: 189, throughput: 389, errorRate: 0.1, cpuUsage: 67 },
  { time: '20:00', responseTime: 156, throughput: 267, errorRate: 0.0, cpuUsage: 52 }
]

const mockUserRoles = [
  { role: 'Students', count: 2145, percentage: 75.3 },
  { role: 'Judges', count: 234, percentage: 8.2 },
  { role: 'Reviewers', count: 189, percentage: 6.6 },
  { role: 'Admins', count: 45, percentage: 1.6 },
  { role: 'Others', count: 234, percentage: 8.2 }
]

const mockCompetitions = [
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
    voting_enabled: true,
    public_voting_enabled: true,
    config: {} as any,
    rounds: [],
    created_at: '2024-01-01T00:00:00Z'
  }
]

export default function AdminDashboard() {
  const [timeframe, setTimeframe] = useState('monthly')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCreateCompetition = () => {
    setShowCreateModal(true)
  }

  const handleEditCompetition = (competition: any) => {
    window.location.href = `/admin/competitions/${competition.id}/edit`
  }

  const handleViewCompetition = (competition: any) => {
    window.location.href = `/competitions/${competition.slug}`
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Platform overview and management tools
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: 'daily', label: 'Daily View' },
              { value: 'weekly', label: 'Weekly View' },
              { value: 'monthly', label: 'Monthly View' }
            ]}
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          />
          <Button
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={handleCreateCompetition}
          >
            New Competition
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.totalUsers.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
            +12% from last month
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
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            3 ending this week
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.totalSubmissions.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
            +8% this week
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">System Uptime</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.systemUptime}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
            All systems operational
          </div>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Platform Activity Overview
          </h3>
          <Button variant="ghost" size="sm">
            <EyeIcon className="h-4 w-4 mr-1" />
            View Details
          </Button>
        </div>
        <StatsOverviewChart 
          data={mockOverviewData}
          height={300}
          timeframe={timeframe as any}
        />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Engagement */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Engagement Trends
          </h3>
          <UserEngagementChart data={mockUserEngagement} height={250} />
        </div>

        {/* User Role Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Role Distribution
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <UserRoleDistribution data={mockUserRoles} height={200} />
            <div className="space-y-3">
              {mockUserRoles.map((role, index) => (
                <div key={role.role} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index] }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {role.role}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {role.count.toLocaleString()} ({role.percentage}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Competition Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Competition Performance Metrics
        </h3>
        <CompetitionMetricsChart data={mockCompetitionMetrics} height={300} />
      </div>

      {/* System Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          System Performance (Last 24 Hours)
        </h3>
        <SystemPerformanceChart data={mockSystemPerformance} height={250} />
      </div>

      {/* Active Competitions Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Competition Management
          </h3>
          <Link href="/admin/competitions">
            <Button variant="outline" size="sm">
              Manage All
            </Button>
          </Link>
        </div>
        
        <CompetitionList
          competitions={mockCompetitions}
          loading={loading}
          viewMode="admin"
          onEdit={handleEditCompetition}
          onView={handleViewCompetition}
          emptyMessage="No active competitions"
        />
      </div>

      {/* User Management */}
      <UserManagement />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <CogIcon className="h-8 w-8" />
            <Button variant="outline" size="sm" className="bg-white text-green-600 hover:bg-gray-100 border-white">
              Configure
            </Button>
          </div>
          <h3 className="text-lg font-semibold mb-2">Platform Settings</h3>
          <p className="text-green-100 text-sm">
            Configure system settings, integrations, and features
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <ChartBarIcon className="h-8 w-8" />
            <Button variant="outline" size="sm" className="bg-white text-purple-600 hover:bg-gray-100 border-white">
              View
            </Button>
          </div>
          <h3 className="text-lg font-semibold mb-2">Analytics & Reports</h3>
          <p className="text-purple-100 text-sm">
            Generate detailed reports and analyze platform metrics
          </p>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Admin Activity
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                New competition "AI Innovation Challenge" created
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                2 minutes ago • By admin@nestfest.com
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                45 new user registrations approved
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                1 hour ago • Automated process
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                System maintenance window scheduled
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                3 hours ago • By system@nestfest.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Competition Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Competition"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            This will open the competition creation wizard where you can configure all aspects of your new competition.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowCreateModal(false)
              window.location.href = '/admin/competitions/create'
            }}>
              Continue
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}