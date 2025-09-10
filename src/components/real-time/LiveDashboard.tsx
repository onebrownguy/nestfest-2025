'use client'

/**
 * Live Dashboard Component
 * 
 * Features:
 * - Real-time analytics and metrics
 * - Live notifications and alerts
 * - Activity feeds and status updates
 * - Performance monitoring dashboards
 * - System health indicators
 * - Geographic voting patterns
 * - Sentiment analysis displays
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebSocket } from './useWebSocket'
import { VotingResultsChart } from '@/components/charts/VotingCharts'
import { StatsOverviewChart } from '@/components/charts/DashboardCharts'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/lib/auth/hooks'
import type {
  DashboardUpdate,
  SystemHealthMetrics,
  VotingAnalytics,
  VotingGeographics,
  DemographicBreakdown,
  SentimentAnalysis,
  FraudDetectionAlert,
  Competition,
  LiveLeaderboard
} from '@/types'

interface LiveDashboardProps {
  competition: Competition
  refreshInterval?: number
  showSystemHealth?: boolean
  showGeographics?: boolean
  showSentiment?: boolean
}

interface DashboardMetrics {
  totalVotes: number
  votingVelocity: number
  activeUsers: number
  engagementRate: number
  topSubmissions: string[]
  fraudAlerts: number
}

export function LiveDashboard({
  competition,
  refreshInterval = 5000,
  showSystemHealth = true,
  showGeographics = true,
  showSentiment = true
}: LiveDashboardProps) {
  const { user } = useAuth()
  const { 
    isConnected, 
    joinCompetition, 
    onDashboardUpdate, 
    onSystemHealth, 
    onFraudAlert 
  } = useWebSocket()

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalVotes: 0,
    votingVelocity: 0,
    activeUsers: 0,
    engagementRate: 0,
    topSubmissions: [],
    fraudAlerts: 0
  })
  const [systemHealth, setSystemHealth] = useState<SystemHealthMetrics | null>(null)
  const [votingAnalytics, setVotingAnalytics] = useState<VotingAnalytics | null>(null)
  const [geography, setGeography] = useState<VotingGeographics | null>(null)
  const [demographics, setDemographics] = useState<DemographicBreakdown | null>(null)
  const [sentiment, setSentiment] = useState<SentimentAnalysis[]>([])
  const [leaderboard, setLeaderboard] = useState<LiveLeaderboard | null>(null)
  const [alerts, setAlerts] = useState<FraudDetectionAlert[]>([])
  const [activityFeed, setActivityFeed] = useState<DashboardUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Join competition room on mount
  useEffect(() => {
    if (isConnected) {
      joinCompetition(competition.id)
    }
  }, [isConnected, competition.id, joinCompetition])

  // Listen for dashboard updates
  useEffect(() => {
    const unsubscribe = onDashboardUpdate((update: DashboardUpdate) => {
      // Add to activity feed
      setActivityFeed(prev => [update, ...prev.slice(0, 49)]) // Keep last 50 updates

      // Process update based on type
      switch (update.type) {
        case 'competition_stats':
          updateCompetitionStats(update.data)
          break
        case 'voting_update':
          updateVotingData(update.data)
          break
        case 'user_activity':
          updateUserActivity(update.data)
          break
        case 'system_alert':
          handleSystemAlert(update.data)
          break
      }
    })

    return unsubscribe
  }, [onDashboardUpdate])

  // Listen for system health updates
  useEffect(() => {
    if (!showSystemHealth) return

    const unsubscribe = onSystemHealth((health: SystemHealthMetrics) => {
      setSystemHealth(health)
    })

    return unsubscribe
  }, [onSystemHealth, showSystemHealth])

  // Listen for fraud alerts
  useEffect(() => {
    const unsubscribe = onFraudAlert((alert: FraudDetectionAlert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 9)]) // Keep last 10 alerts
      
      setMetrics(prev => ({
        ...prev,
        fraudAlerts: prev.fraudAlerts + 1
      }))
    })

    return unsubscribe
  }, [onFraudAlert])

  // Update competition statistics
  const updateCompetitionStats = useCallback((data: any) => {
    setMetrics(prev => ({
      ...prev,
      totalVotes: data.totalVotes || prev.totalVotes,
      votingVelocity: data.votingVelocity || prev.votingVelocity,
      activeUsers: data.activeUsers || prev.activeUsers,
      engagementRate: data.engagementRate || prev.engagementRate,
      topSubmissions: data.topSubmissions || prev.topSubmissions
    }))

    if (data.leaderboard) {
      setLeaderboard(data.leaderboard)
    }

    if (data.analytics) {
      setVotingAnalytics(data.analytics)
    }
  }, [])

  // Update voting data
  const updateVotingData = useCallback((data: any) => {
    if (data.geography && showGeographics) {
      setGeography(data.geography)
    }

    if (data.demographics) {
      setDemographics(data.demographics)
    }

    if (data.sentiment && showSentiment) {
      setSentiment(prev => {
        const updated = [...prev]
        const index = updated.findIndex(s => s.submissionId === data.sentiment.submissionId)
        if (index >= 0) {
          updated[index] = data.sentiment
        } else {
          updated.push(data.sentiment)
        }
        return updated
      })
    }
  }, [showGeographics, showSentiment])

  // Update user activity
  const updateUserActivity = useCallback((data: any) => {
    setMetrics(prev => ({
      ...prev,
      activeUsers: data.activeUsers || prev.activeUsers,
      engagementRate: data.engagementRate || prev.engagementRate
    }))
  }, [])

  // Handle system alerts
  const handleSystemAlert = useCallback((data: any) => {
    console.warn('System alert:', data)
    // Could trigger notifications, update UI state, etc.
  }, [])

  // Calculate health status
  const healthStatus = useMemo(() => {
    if (!systemHealth) return 'unknown'
    
    const { errorRate, averageLatency, memoryUsage, cpuUsage } = systemHealth
    
    if (errorRate > 5 || averageLatency > 1000 || memoryUsage > 90 || cpuUsage > 90) {
      return 'critical'
    } else if (errorRate > 2 || averageLatency > 500 || memoryUsage > 75 || cpuUsage > 75) {
      return 'warning'
    } else {
      return 'healthy'
    }
  }, [systemHealth])

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // Set loading state based on actual connection and data
  useEffect(() => {
    // Stop loading when connected or after a reasonable timeout
    if (isConnected) {
      setIsLoading(false)
    } else {
      // Fallback timeout to prevent infinite loading
      const timer = setTimeout(() => setIsLoading(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [isConnected])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
        <span className="ml-4 text-lg">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Dashboard</h1>
          <p className="text-gray-600 mt-1">{competition.name}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
          
          {/* System Health */}
          {showSystemHealth && systemHealth && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              healthStatus === 'healthy' ? 'bg-green-100 text-green-800' :
              healthStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              healthStatus === 'critical' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              System {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Votes"
          value={formatNumber(metrics.totalVotes)}
          trend="up"
          change={metrics.votingVelocity}
          suffix="votes/min"
        />
        
        <MetricCard
          title="Active Users"
          value={formatNumber(metrics.activeUsers)}
          trend="stable"
        />
        
        <MetricCard
          title="Engagement Rate"
          value={`${metrics.engagementRate.toFixed(1)}%`}
          trend={metrics.engagementRate > 70 ? 'up' : metrics.engagementRate > 40 ? 'stable' : 'down'}
        />
        
        <MetricCard
          title="Security Alerts"
          value={metrics.fraudAlerts.toString()}
          trend={metrics.fraudAlerts > 0 ? 'up' : 'stable'}
          isAlert={metrics.fraudAlerts > 0}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voting Analytics Chart */}
        {votingAnalytics && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Voting Analytics</h2>
            <VotingResultsChart data={votingAnalytics.results || []} />
          </div>
        )}

        {/* Live Leaderboard */}
        {leaderboard && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Live Rankings</h2>
            <div className="space-y-3">
              {leaderboard.rankings.slice(0, 10).map((entry, index) => (
                <motion.div
                  key={entry.submissionId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                      entry.rank === 2 ? 'bg-gray-300 text-gray-700' :
                      entry.rank === 3 ? 'bg-orange-400 text-orange-900' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {entry.rank}
                    </span>
                    <div>
                      <p className="font-medium">{entry.title}</p>
                      <p className="text-sm text-gray-500">{entry.author}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold">{entry.score}</div>
                    <div className="text-sm text-gray-500">{entry.voteCount} votes</div>
                    {entry.change !== 0 && (
                      <div className={`text-xs ${
                        entry.trend === 'up' ? 'text-green-600' : 
                        entry.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {entry.trend === 'up' ? '↑' : entry.trend === 'down' ? '↓' : '→'} {entry.change}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Geographic and Demographic Data */}
      {(showGeographics && geography) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Geographic Distribution */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Geographic Distribution</h2>
            <div className="space-y-3">
              {Object.entries(geography.regions).map(([region, data]) => (
                <div key={region} className="flex items-center justify-between">
                  <span className="font-medium">{region}</span>
                  <div className="text-right">
                    <div className="font-semibold">{data.votes} votes</div>
                    <div className="text-sm text-gray-500">{data.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demographics */}
          {demographics && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Voter Demographics</h2>
              <StatsOverviewChart data={demographics.breakdown || []} />
            </div>
          )}
        </div>
      )}

      {/* Sentiment Analysis */}
      {showSentiment && sentiment.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Sentiment Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sentiment.map(analysis => (
              <div key={analysis.submissionId} className="p-4 border border-gray-100 rounded-lg">
                <h4 className="font-medium mb-2">Submission Analysis</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Overall:</span>
                    <span className={`font-medium ${
                      analysis.overall > 0.3 ? 'text-green-600' :
                      analysis.overall > -0.3 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {analysis.overall > 0 ? 'Positive' : analysis.overall < 0 ? 'Negative' : 'Neutral'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Confidence:</span>
                    <span className="font-medium">{(analysis.confidence * 100).toFixed(1)}%</span>
                  </div>

                  {analysis.keywords.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">Keywords:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.keywords.slice(0, 3).map(keyword => (
                          <span
                            key={keyword}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Activity Feed</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {activityFeed.slice(0, 20).map((update, index) => (
                <motion.div
                  key={update.timestamp}
                  className={`p-3 rounded-lg border-l-4 ${
                    update.priority === 'urgent' ? 'bg-red-50 border-red-500' :
                    update.priority === 'high' ? 'bg-orange-50 border-orange-500' :
                    update.priority === 'normal' ? 'bg-blue-50 border-blue-500' :
                    'bg-gray-50 border-gray-300'
                  }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{update.type.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    {JSON.stringify(update.data).slice(0, 100)}...
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Security Alerts */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Security Alerts</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-green-600 text-lg mb-2">✓</div>
                <p>No security alerts</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.timestamp}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                    alert.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                    alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm capitalize">{alert.type.replace('_', ' ')}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700">{alert.description}</p>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Health Details */}
      {showSystemHealth && systemHealth && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SystemHealthMetric
              label="Connections"
              value={systemHealth.connectionsCount}
              status="info"
            />
            
            <SystemHealthMetric
              label="Messages/sec"
              value={systemHealth.messagesPerSecond}
              status="info"
            />
            
            <SystemHealthMetric
              label="Avg Latency"
              value={`${systemHealth.averageLatency}ms`}
              status={systemHealth.averageLatency > 1000 ? 'error' : systemHealth.averageLatency > 500 ? 'warning' : 'success'}
            />
            
            <SystemHealthMetric
              label="Error Rate"
              value={`${systemHealth.errorRate}%`}
              status={systemHealth.errorRate > 5 ? 'error' : systemHealth.errorRate > 2 ? 'warning' : 'success'}
            />
            
            <SystemHealthMetric
              label="Memory Usage"
              value={`${systemHealth.memoryUsage}%`}
              status={systemHealth.memoryUsage > 90 ? 'error' : systemHealth.memoryUsage > 75 ? 'warning' : 'success'}
            />
            
            <SystemHealthMetric
              label="CPU Usage"
              value={`${systemHealth.cpuUsage}%`}
              status={systemHealth.cpuUsage > 90 ? 'error' : systemHealth.cpuUsage > 75 ? 'warning' : 'success'}
            />
            
            <SystemHealthMetric
              label="Redis Health"
              value={systemHealth.redisHealth}
              status={systemHealth.redisHealth === 'healthy' ? 'success' : systemHealth.redisHealth === 'degraded' ? 'warning' : 'error'}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Metric card component
function MetricCard({ 
  title, 
  value, 
  trend, 
  change, 
  suffix, 
  isAlert = false 
}: {
  title: string
  value: string
  trend?: 'up' | 'down' | 'stable'
  change?: number
  suffix?: string
  isAlert?: boolean
}) {
  return (
    <motion.div
      className={`bg-white border rounded-lg p-6 ${isAlert ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${isAlert ? 'text-red-600' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
        
        {trend && (
          <div className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' :
            trend === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </div>
        )}
      </div>
      
      {change !== undefined && (
        <p className="text-sm text-gray-500 mt-2">
          {change > 0 ? '+' : ''}{change} {suffix}
        </p>
      )}
    </motion.div>
  )
}

// System health metric component
function SystemHealthMetric({ 
  label, 
  value, 
  status 
}: {
  label: string
  value: string | number
  status: 'success' | 'warning' | 'error' | 'info'
}) {
  return (
    <div className={`p-4 rounded-lg border-l-4 ${
      status === 'success' ? 'bg-green-50 border-green-500' :
      status === 'warning' ? 'bg-yellow-50 border-yellow-500' :
      status === 'error' ? 'bg-red-50 border-red-500' :
      'bg-blue-50 border-blue-500'
    }`}>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className={`text-lg font-bold ${
        status === 'success' ? 'text-green-700' :
        status === 'warning' ? 'text-yellow-700' :
        status === 'error' ? 'text-red-700' :
        'text-blue-700'
      }`}>
        {value}
      </p>
    </div>
  )
}