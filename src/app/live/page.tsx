'use client'

/**
 * Live Event Page - Main Hub for Real-time Features
 * 
 * Integrates all real-time components:
 * - Live voting interface
 * - Event day management
 * - Shark Tank mode
 * - Real-time dashboard
 * - Performance monitoring
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth/hooks'
import { useWebSocket } from '@/components/real-time/useWebSocket'
import { LiveVotingInterface } from '@/components/real-time/LiveVotingInterface'
import { EventDayManager } from '@/components/real-time/EventDayManager'
import { SharkTankMode } from '@/components/real-time/SharkTankMode'
import { LiveDashboard } from '@/components/real-time/LiveDashboard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { showToast } from '@/components/ui/Toast'
import type { 
  Competition, 
  EventSession, 
  Submission, 
  User, 
  QuadraticVotingBudget 
} from '@/types'

interface LivePageState {
  competitions: Competition[]
  activeCompetition?: Competition
  activeSession?: EventSession
  submissions: Submission[]
  judges: User[]
  votingBudget?: QuadraticVotingBudget
  currentSubmission?: Submission
}

type ViewMode = 'dashboard' | 'voting' | 'event' | 'shark-tank'

export default function LivePage() {
  const { user, loading: authLoading } = useAuth()
  const { isConnected, connectionStatus } = useWebSocket({ autoConnect: true })
  
  const [state, setState] = useState<LivePageState>({
    competitions: [],
    submissions: [],
    judges: []
  })
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConnectionModal, setShowConnectionModal] = useState(false)

  // Check if user has required permissions
  const canAccessLive = user && ['judge', 'admin', 'super_admin'].includes(user.role)
  const canVote = user && state.activeCompetition?.voting_enabled
  const isJudge = user?.role === 'judge'
  const isAdmin = user && ['admin', 'super_admin'].includes(user.role)

  // Load initial data
  useEffect(() => {
    if (!user || authLoading) return
    
    loadLiveData()
  }, [user, authLoading])

  // Monitor connection status
  useEffect(() => {
    if (!isConnected && !authLoading && user) {
      setShowConnectionModal(true)
    } else {
      setShowConnectionModal(false)
    }
  }, [isConnected, authLoading, user])

  /**
   * Load live event data
   */
  const loadLiveData = async () => {
    try {
      setLoading(true)
      
      // Try to load active competitions, fallback to mock data for development
      let competitions: Competition[] = []
      
      try {
        const competitionsRes = await fetch('/api/competitions')
        if (competitionsRes.ok) {
          competitions = await competitionsRes.json()
        }
      } catch (err) {
        console.warn('API not available, using mock data for development')
      }
      
      // If no competitions from API, use mock data for development
      if (competitions.length === 0) {
        // Create mock competition for development
        const mockCompetition: Competition = {
          id: 'dev-comp-1',
          name: 'NestFest Demo Competition',
          description: 'Live event demonstration',
          status: 'live',
          voting_enabled: true,
          config: {
            voting_rules: {
              type: 'quadratic',
              max_votes_per_submission: 100,
              voting_period: {
                start: new Date().toISOString(),
                end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
              }
            }
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Competition
        
        competitions = [mockCompetition]
      }
      
      // Filter to live/active competitions
      const liveCompetitions = competitions.filter(c => 
        ['live', 'judging'].includes(c.status) && c.voting_enabled
      )
      
      const activeCompetition = liveCompetitions[0] || competitions[0]
      
      // Load submissions for active competition or use mock data
      let submissions: Submission[] = []
      
      try {
        const submissionsRes = await fetch(`/api/competitions/${activeCompetition.id}/submissions`)
        if (submissionsRes.ok) {
          submissions = await submissionsRes.json()
        }
      } catch (err) {
        console.warn('Using mock submissions for development')
      }
      
      // Create mock submissions if none exist
      if (submissions.length === 0) {
        submissions = [
          {
            id: 'sub-1',
            competition_id: activeCompetition.id,
            user_id: 'user-1',
            title: 'AI-Powered Study Assistant',
            description: 'An intelligent study companion that helps students learn more effectively',
            category: 'Education Tech',
            status: 'published',
            submission_type: 'project',
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'sub-2', 
            competition_id: activeCompetition.id,
            user_id: 'user-2',
            title: 'Sustainable Campus Transport',
            description: 'Electric bike sharing system for eco-friendly campus transportation',
            category: 'Sustainability',
            status: 'published',
            submission_type: 'project',
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'sub-3',
            competition_id: activeCompetition.id,
            user_id: 'user-3',
            title: 'Mental Health Chatbot',
            description: 'Anonymous mental health support chatbot for students',
            category: 'Health Tech',
            status: 'published',
            submission_type: 'project',
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ] as Submission[]
      }
      
      // Load judges
      const judgesRes = await fetch('/api/users?role=judge')
      const judges: User[] = judgesRes.ok ? await judgesRes.json() : []
      
      // Load voting budget for current user
      let votingBudget: QuadraticVotingBudget | undefined
      if (activeCompetition.config.voting_rules.type === 'quadratic' && user) {
        const budgetRes = await fetch(`/api/votes/budget?competition_id=${activeCompetition.id}`)
        if (budgetRes.ok) {
          votingBudget = await budgetRes.json()
        }
      }
      
      // Check for active event session
      let activeSession: EventSession | undefined
      try {
        const sessionRes = await fetch(`/api/events/sessions?competition_id=${activeCompetition.id}&status=active`)
        if (sessionRes.ok) {
          const sessions = await sessionRes.json()
          activeSession = sessions[0]
        }
      } catch (err) {
        console.log('No active session found')
      }
      
      setState({
        competitions: liveCompetitions,
        activeCompetition,
        activeSession,
        submissions,
        judges,
        votingBudget,
        currentSubmission: activeSession?.current_presentation_id ? 
          submissions.find(s => s.id === activeSession.current_presentation_id) : undefined
      })
      
      // Auto-select appropriate view mode
      if (activeSession) {
        setViewMode(activeSession.name.toLowerCase().includes('shark') ? 'shark-tank' : 'event')
      } else if (canVote && submissions.length > 0) {
        setViewMode('voting')
      }
      
    } catch (err) {
      console.error('Failed to load live data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load live data')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle competition change
   */
  const handleCompetitionChange = async (competitionId: string) => {
    const competition = state.competitions.find(c => c.id === competitionId)
    if (!competition) return
    
    setState(prev => ({ ...prev, activeCompetition: competition }))
    await loadLiveData()
  }

  /**
   * Handle view mode change
   */
  const handleViewModeChange = (mode: ViewMode) => {
    // Check permissions
    if (mode === 'shark-tank' && !isJudge && !isAdmin) {
      showToast.warning('Shark Tank mode requires judge or admin access')
      return
    }
    
    if (mode === 'event' && !state.activeSession) {
      showToast.info('No active event session')
      return
    }
    
    setViewMode(mode)
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg">Loading live event data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Live Events</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={loadLiveData}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Access denied
  if (!canAccessLive) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-yellow-500 text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600">
            Live event access is restricted to judges and administrators.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">🎯 NestFest Live</h1>
              
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{isConnected ? 'Live' : 'Disconnected'}</span>
                {connectionStatus.latency > 0 && (
                  <span className="text-xs">({connectionStatus.latency}ms)</span>
                )}
              </div>
            </div>

            {/* Competition Selector */}
            <div className="flex items-center space-x-4">
              <select
                value={state.activeCompetition?.id || ''}
                onChange={(e) => handleCompetitionChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                {state.competitions.map(competition => (
                  <option key={competition.id} value={competition.id}>
                    {competition.name}
                  </option>
                ))}
              </select>
              
              {/* User Info */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊', available: true },
              { id: 'voting', label: 'Live Voting', icon: '🗳️', available: canVote },
              { id: 'event', label: 'Event Manager', icon: '🎭', available: !!state.activeSession },
              { id: 'shark-tank', label: 'Shark Tank', icon: '🦈', available: isJudge || isAdmin }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleViewModeChange(tab.id as ViewMode)}
                disabled={!tab.available}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 font-medium text-sm transition-colors ${
                  viewMode === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : tab.available
                    ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    : 'border-transparent text-gray-300 cursor-not-allowed'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {viewMode === 'dashboard' && state.activeCompetition && (
              <LiveDashboard 
                competition={state.activeCompetition}
                showSystemHealth={isAdmin}
                showGeographics={true}
                showSentiment={true}
              />
            )}

            {viewMode === 'voting' && state.activeCompetition && (
              <LiveVotingInterface
                competition={state.activeCompetition}
                submissions={state.submissions}
                currentSubmission={state.currentSubmission}
                votingBudget={state.votingBudget}
                onVoteSubmitted={(voteData) => {
                  showToast.success('Vote submitted successfully!')
                }}
                showMomentum={true}
                showFraudAlerts={isAdmin}
                disabled={!canVote}
              />
            )}

            {viewMode === 'event' && state.activeSession && (
              <EventDayManager
                session={state.activeSession}
                submissions={state.submissions}
                isAdmin={isAdmin}
                showAudienceView={!isAdmin}
              />
            )}

            {viewMode === 'shark-tank' && state.activeSession && (
              <SharkTankMode
                session={state.activeSession}
                currentSubmission={state.currentSubmission || null}
                judges={state.judges}
                isJudge={isJudge}
                isAdmin={isAdmin}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Connection Issues Modal */}
      <Modal
        isOpen={showConnectionModal}
        onClose={() => {}}
        title="Connection Issues"
        preventClose={true}
      >
        <div className="text-center space-y-4">
          <div className="text-red-500 text-5xl">⚠️</div>
          <h3 className="text-lg font-semibold">Lost Connection to Live Events</h3>
          <p className="text-gray-600">
            We're having trouble connecting to the live event server. 
            Please check your internet connection.
          </p>
          
          <div className="space-y-2">
            <div className="text-sm text-gray-500">
              Reconnection attempts: {connectionStatus.reconnectAttempts}
            </div>
            <div className="flex justify-center">
              <LoadingSpinner size="sm" />
            </div>
          </div>
          
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </Modal>

    </div>
  )
}