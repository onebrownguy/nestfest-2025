'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [activeMetric, setActiveMetric] = useState<'overview' | 'users' | 'competitions' | 'engagement'>('overview')

  // Mock user for demo
  const currentUser = {
    id: '1',
    email: 'admin@nestfest.com',
    name: 'NEST FEST Admin',
    role: 'admin'
  }

  // Mock analytics data
  const overviewStats = {
    totalUsers: { current: 1247, change: +18.2, trend: 'up' },
    activeUsers: { current: 892, change: +12.8, trend: 'up' },
    totalSubmissions: { current: 168, change: +34.5, trend: 'up' },
    completionRate: { current: 73.2, change: +5.4, trend: 'up' },
    averageScore: { current: 8.4, change: -0.2, trend: 'down' },
    retentionRate: { current: 68.9, change: +2.1, trend: 'up' }
  }

  const competitionMetrics = [
    {
      id: '1',
      name: 'Tech Innovation Challenge 2025',
      participants: 156,
      submissions: 89,
      completionRate: 57.1,
      averageScore: 8.6,
      engagement: 94.2,
      prizePool: 50000,
      roi: 340.5
    },
    {
      id: '2',
      name: 'Sustainable Business Model',
      participants: 89,
      submissions: 34,
      completionRate: 38.2,
      averageScore: 8.1,
      engagement: 76.4,
      prizePool: 25000,
      roi: 280.3
    },
    {
      id: '3',
      name: 'Social Impact Startup',
      participants: 203,
      submissions: 0,
      completionRate: 0,
      averageScore: 0,
      engagement: 85.7,
      prizePool: 35000,
      roi: 0
    }
  ]

  const userDemographics = {
    universities: [
      { name: 'MIT', count: 284, percentage: 22.8 },
      { name: 'Stanford University', count: 201, percentage: 16.1 },
      { name: 'UC Berkeley', count: 156, percentage: 12.5 },
      { name: 'Harvard University', count: 134, percentage: 10.7 },
      { name: 'Carnegie Mellon', count: 98, percentage: 7.9 },
      { name: 'Other', count: 374, percentage: 30.0 }
    ],
    roles: [
      { role: 'Student', count: 1156, percentage: 92.7 },
      { role: 'Judge', count: 67, percentage: 5.4 },
      { role: 'Admin', count: 24, percentage: 1.9 }
    ],
    skills: [
      { skill: 'Software Development', count: 456, percentage: 36.6 },
      { skill: 'Business Strategy', count: 298, percentage: 23.9 },
      { skill: 'Product Management', count: 267, percentage: 21.4 },
      { skill: 'Data Analytics', count: 234, percentage: 18.8 },
      { skill: 'Design', count: 201, percentage: 16.1 }
    ]
  }

  const engagementMetrics = {
    dailyActiveUsers: [
      { date: '2025-09-17', users: 234 },
      { date: '2025-09-18', users: 267 },
      { date: '2025-09-19', users: 298 },
      { date: '2025-09-20', users: 312 },
      { date: '2025-09-21', users: 289 },
      { date: '2025-09-22', users: 345 },
      { date: '2025-09-23', users: 356 }
    ],
    topFeatures: [
      { feature: 'Team Collaboration', usage: 89.3, trend: 'up' },
      { feature: 'Competition Browse', usage: 76.8, trend: 'up' },
      { feature: 'Submission Management', usage: 68.4, trend: 'stable' },
      { feature: 'Team Discovery', usage: 45.2, trend: 'up' },
      { feature: 'Judge Dashboard', usage: 34.7, trend: 'stable' }
    ],
    sessionMetrics: {
      averageSessionTime: '24m 32s',
      pagesPerSession: 6.8,
      bounceRate: 23.4
    }
  }

  const getChangeColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
  }

  const getChangeIcon = (trend: string) => {
    if (trend === 'up') {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
      )
    } else if (trend === 'down') {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
        </svg>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                NEST FEST 2025
              </Link>
              <span className="ml-4 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                Admin Panel
              </span>
            </div>
            <nav className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {currentUser.name}</span>
              <form action="/api/auth/logout" method="POST">
                <Button variant="outline" size="sm" type="submit">
                  Logout
                </Button>
              </form>
            </nav>
          </div>
        </div>
      </header>

      {/* Navigation Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center text-sm text-gray-500">
          <Link href="/admin" className="hover:text-gray-700">Admin Dashboard</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900 font-medium">Platform Analytics</span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Platform Analytics
              </h1>
              <p className="text-gray-600">
                Comprehensive insights into platform performance, user engagement, and competition metrics.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Date Range Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Period:</span>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
              <Button variant="outline">
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Metric Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'users', label: 'Users' },
                { id: 'competitions', label: 'Competitions' },
                { id: 'engagement', label: 'Engagement' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveMetric(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeMetric === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeMetric === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{overviewStats.totalUsers.current.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center">
                    {getChangeIcon(overviewStats.totalUsers.trend)}
                    <span className={`text-sm font-medium ml-1 ${getChangeColor(overviewStats.totalUsers.trend)}`}>
                      +{overviewStats.totalUsers.change}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900">{overviewStats.activeUsers.current.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center">
                    {getChangeIcon(overviewStats.activeUsers.trend)}
                    <span className={`text-sm font-medium ml-1 ${getChangeColor(overviewStats.activeUsers.trend)}`}>
                      +{overviewStats.activeUsers.change}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                    <p className="text-3xl font-bold text-gray-900">{overviewStats.totalSubmissions.current.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center">
                    {getChangeIcon(overviewStats.totalSubmissions.trend)}
                    <span className={`text-sm font-medium ml-1 ${getChangeColor(overviewStats.totalSubmissions.trend)}`}>
                      +{overviewStats.totalSubmissions.change}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{overviewStats.completionRate.current}%</p>
                  </div>
                  <div className="flex items-center">
                    {getChangeIcon(overviewStats.completionRate.trend)}
                    <span className={`text-sm font-medium ml-1 ${getChangeColor(overviewStats.completionRate.trend)}`}>
                      +{overviewStats.completionRate.change}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Score</p>
                    <p className="text-3xl font-bold text-gray-900">{overviewStats.averageScore.current}</p>
                  </div>
                  <div className="flex items-center">
                    {getChangeIcon(overviewStats.averageScore.trend)}
                    <span className={`text-sm font-medium ml-1 ${getChangeColor(overviewStats.averageScore.trend)}`}>
                      {overviewStats.averageScore.change}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{overviewStats.retentionRate.current}%</p>
                  </div>
                  <div className="flex items-center">
                    {getChangeIcon(overviewStats.retentionRate.trend)}
                    <span className={`text-sm font-medium ml-1 ${getChangeColor(overviewStats.retentionRate.trend)}`}>
                      +{overviewStats.retentionRate.change}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeMetric === 'users' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* University Distribution */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Universities</h3>
                <div className="space-y-3">
                  {userDemographics.universities.map((university, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-sm text-gray-900">{university.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{university.count}</span>
                        <span className="text-xs text-gray-500">({university.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Role Distribution */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Roles</h3>
                <div className="space-y-3">
                  {userDemographics.roles.map((role, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${
                          role.role === 'Student' ? 'bg-blue-500' :
                          role.role === 'Judge' ? 'bg-purple-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm text-gray-900">{role.role}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{role.count}</span>
                        <span className="text-xs text-gray-500">({role.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Skills */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Skills</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {userDemographics.skills.map((skill, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{skill.count}</div>
                    <div className="text-sm text-gray-600">{skill.skill}</div>
                    <div className="text-xs text-gray-500">{skill.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Competitions Tab */}
        {activeMetric === 'competitions' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Competition Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competition</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {competitionMetrics.map((competition) => (
                      <tr key={competition.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{competition.name}</div>
                          <div className="text-sm text-gray-500">${competition.prizePool.toLocaleString()} prize</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {competition.participants}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {competition.submissions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${competition.completionRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{competition.completionRate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {competition.averageScore > 0 ? competition.averageScore : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${competition.engagement}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{competition.engagement}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {competition.roi > 0 ? `${competition.roi}%` : 'Pending'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Engagement Tab */}
        {activeMetric === 'engagement' && (
          <div className="space-y-8">
            {/* Session Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="text-3xl font-bold text-blue-600">{engagementMetrics.sessionMetrics.averageSessionTime}</div>
                <div className="text-sm text-gray-600">Average Session Time</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="text-3xl font-bold text-green-600">{engagementMetrics.sessionMetrics.pagesPerSession}</div>
                <div className="text-sm text-gray-600">Pages per Session</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="text-3xl font-bold text-yellow-600">{engagementMetrics.sessionMetrics.bounceRate}%</div>
                <div className="text-sm text-gray-600">Bounce Rate</div>
              </div>
            </div>

            {/* Feature Usage */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Usage</h3>
              <div className="space-y-4">
                {engagementMetrics.topFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{feature.feature}</span>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 mr-2">{feature.usage}%</span>
                          {getChangeIcon(feature.trend)}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${feature.usage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}