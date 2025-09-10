'use client'

/**
 * Event Day Management System
 * 
 * Features:
 * - Live event sessions with presentation management
 * - Real-time audience engagement (reactions, comments)
 * - Synchronized countdown timers
 * - Live leaderboards and ranking updates
 * - Admin controls for event flow management
 * - Presentation scheduling and timing
 * - Emergency controls and overrides
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebSocket } from './useWebSocket'
import { Button } from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/lib/auth/hooks'
import type { 
  EventSession, 
  Submission, 
  EventSessionState, 
  PresentationControl,
  LiveReaction,
  LiveComment,
  LiveLeaderboard,
  ReactionAnalytics
} from '@/types'

interface EventDayManagerProps {
  session: EventSession
  submissions: Submission[]
  isAdmin?: boolean
  showAudienceView?: boolean
}

export function EventDayManager({
  session,
  submissions,
  isAdmin = false,
  showAudienceView = true
}: EventDayManagerProps) {
  const { user } = useAuth()
  const { isConnected, emit, onSessionUpdate, onReactionUpdate } = useWebSocket()
  
  const [sessionState, setSessionState] = useState<EventSessionState>({
    session,
    votingActive: false,
    participantCount: 0
  })
  const [currentPresentation, setCurrentPresentation] = useState<Submission | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [reactions, setReactions] = useState<LiveReaction[]>([])
  const [comments, setComments] = useState<LiveComment[]>([])
  const [leaderboard, setLeaderboard] = useState<LiveLeaderboard | null>(null)
  const [reactionAnalytics, setReactionAnalytics] = useState<ReactionAnalytics | null>(null)
  const [showEmergencyControls, setShowEmergencyControls] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout>()
  const reactionCanvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize session
  useEffect(() => {
    emit('join_session', { sessionId: session.id })
    
    return () => {
      emit('leave_session', { sessionId: session.id })
    }
  }, [session.id, emit])

  // Listen for session updates
  useEffect(() => {
    const unsubscribe = onSessionUpdate((state: EventSessionState) => {
      setSessionState(state)
      
      if (state.currentPresentation) {
        setCurrentPresentation(state.currentPresentation)
      }
      
      if (state.timeRemaining !== undefined) {
        setTimeRemaining(state.timeRemaining)
      }
    })

    return unsubscribe
  }, [onSessionUpdate])

  // Listen for reaction updates
  useEffect(() => {
    const unsubscribe = onReactionUpdate((analytics: ReactionAnalytics) => {
      setReactionAnalytics(analytics)
      drawReactionHeatMap(analytics.heatMapData)
    })

    return unsubscribe
  }, [onReactionUpdate])

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [timeRemaining])

  // Admin controls
  const handlePresentationControl = useCallback((action: PresentationControl['action'], presentationId?: string) => {
    if (!isAdmin) return

    const control: PresentationControl = {
      action,
      sessionId: session.id,
      presentationId,
      timestamp: new Date().toISOString(),
      adminId: user!.id
    }

    emit('admin_control', { type: 'presentation_control', data: control })
  }, [isAdmin, session.id, user, emit])

  // Send reaction
  const handleReaction = useCallback((reactionType: string, intensity: number, coordinates?: { x: number, y: number }) => {
    if (!currentPresentation) return

    const reactionData = {
      sessionId: session.id,
      submissionId: currentPresentation.id,
      reactionType,
      intensity,
      coordinates
    }

    emit('send_reaction', reactionData)

    // Add optimistic update
    const newReaction: LiveReaction = {
      id: `temp-${Date.now()}`,
      session_id: session.id,
      submission_id: currentPresentation.id,
      user_id: user!.id,
      reaction_type: reactionType,
      intensity,
      timestamp: new Date().toISOString(),
      coordinates
    }

    setReactions(prev => [...prev.slice(-49), newReaction]) // Keep last 50 reactions
  }, [currentPresentation, session.id, user, emit])

  // Draw reaction heat map
  const drawReactionHeatMap = useCallback((heatMapData: any[]) => {
    const canvas = reactionCanvasRef.current
    if (!canvas || !heatMapData.length) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw heat map points
    heatMapData.forEach(point => {
      const { x, y, intensity, count } = point
      const radius = Math.min(20, count * 2)
      const alpha = Math.min(0.8, intensity / 10)

      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = `rgba(255, 69, 0, ${alpha})`
      ctx.fill()
    })
  }, [])

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Get current presentation index
  const getCurrentPresentationIndex = (): number => {
    if (!currentPresentation) return -1
    return session.presentation_order.indexOf(currentPresentation.id)
  }

  const currentIndex = getCurrentPresentationIndex()
  const totalPresentations = session.presentation_order.length

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{session.name}</h1>
            <p className="text-blue-100 mt-1">
              {sessionState.session.status === 'active' ? 'Live Now' : 
               sessionState.session.status === 'waiting' ? 'Starting Soon' :
               sessionState.session.status === 'paused' ? 'Paused' : 'Ended'}
            </p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <p className="text-sm text-blue-100 mt-1">
              {sessionState.participantCount} participants
            </p>
          </div>
        </div>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Admin Controls</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmergencyControls(!showEmergencyControls)}
            >
              Emergency Controls
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="primary"
              onClick={() => handlePresentationControl('start')}
              disabled={sessionState.session.status === 'active'}
            >
              Start Session
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => handlePresentationControl('pause')}
              disabled={sessionState.session.status !== 'active'}
            >
              Pause
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => handlePresentationControl('next')}
              disabled={currentIndex >= totalPresentations - 1}
            >
              Next
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => handlePresentationControl('previous')}
              disabled={currentIndex <= 0}
            >
              Previous
            </Button>
          </div>
        </div>
      )}

      {/* Current Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Presentation View */}
        <div className="lg:col-span-2 space-y-4">
          {currentPresentation ? (
            <motion.div
              key={currentPresentation.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{currentPresentation.title}</h2>
                  <p className="text-gray-600 mt-1">{currentPresentation.description}</p>
                </div>
                
                {timeRemaining > 0 && (
                  <div className="text-right">
                    <div className={`text-2xl font-mono font-bold ${
                      timeRemaining <= 60 ? 'text-red-600' : 
                      timeRemaining <= 300 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {formatTime(timeRemaining)}
                    </div>
                    <p className="text-sm text-gray-500">remaining</p>
                  </div>
                )}
              </div>

              {/* Progress Indicator */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                  <span>Presentation {currentIndex + 1} of {totalPresentations}</span>
                  <span>{Math.round(((currentIndex + 1) / totalPresentations) * 100)}% complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / totalPresentations) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Reaction Canvas Overlay */}
              <div className="relative bg-gray-100 rounded-lg" style={{ height: '300px' }}>
                <canvas
                  ref={reactionCanvasRef}
                  width={800}
                  height={300}
                  className="absolute inset-0 w-full h-full rounded-lg cursor-pointer"
                  onClick={(e) => {
                    if (!showAudienceView) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = ((e.clientX - rect.left) / rect.width) * 800
                    const y = ((e.clientY - rect.top) / rect.height) * 300
                    handleReaction('clap', 5, { x, y })
                  }}
                />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-gray-500 text-lg">
                    Presentation Content
                    {showAudienceView && (
                      <p className="text-sm mt-2">Click anywhere to react</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-gray-500">
                <h2 className="text-xl font-semibold mb-2">Waiting for presentation</h2>
                <p>The event will start shortly</p>
              </div>
            </div>
          )}

          {/* Reaction Controls */}
          {showAudienceView && currentPresentation && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Quick Reactions</h3>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { emoji: '👏', type: 'clap', label: 'Clap' },
                  { emoji: '🔥', type: 'fire', label: 'Fire' },
                  { emoji: '💡', type: 'idea', label: 'Idea' },
                  { emoji: '❤️', type: 'love', label: 'Love' },
                  { emoji: '🤔', type: 'thinking', label: 'Thinking' }
                ].map(reaction => (
                  <Button
                    key={reaction.type}
                    variant="outline"
                    size="sm"
                    onClick={() => handleReaction(reaction.type, 7)}
                    className="flex flex-col items-center p-2"
                  >
                    <span className="text-lg">{reaction.emoji}</span>
                    <span className="text-xs">{reaction.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Live Statistics */}
          {reactionAnalytics && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Live Engagement</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Reactions:</span>
                  <span className="font-medium">{reactionAnalytics.totalReactions}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg. Intensity:</span>
                  <span className="font-medium">{reactionAnalytics.averageIntensity.toFixed(1)}/10</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Momentum:</span>
                  <span className={`font-medium ${
                    reactionAnalytics.momentum > 0.7 ? 'text-green-600' :
                    reactionAnalytics.momentum > 0.4 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {Math.round(reactionAnalytics.momentum * 100)}%
                  </span>
                </div>
              </div>

              {/* Reaction Breakdown */}
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Reaction Types</h4>
                {Object.entries(reactionAnalytics.reactionsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="capitalize">{type}:</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Leaderboard */}
          {leaderboard && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Live Rankings</h3>
              
              <div className="space-y-2">
                {leaderboard.rankings.slice(0, 5).map(entry => (
                  <div
                    key={entry.submissionId}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                        entry.rank === 2 ? 'bg-gray-300 text-gray-700' :
                        entry.rank === 3 ? 'bg-orange-400 text-orange-900' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {entry.rank}
                      </span>
                      <span className="font-medium text-sm">{entry.title}</span>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">{entry.score}</div>
                      {entry.change !== 0 && (
                        <div className={`text-xs ${
                          entry.trend === 'up' ? 'text-green-600' : 
                          entry.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {entry.trend === 'up' ? '↑' : entry.trend === 'down' ? '↓' : '→'} {entry.change}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Presentations */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Up Next</h3>
            
            {session.presentation_order.slice(currentIndex + 1, currentIndex + 4).map((submissionId, index) => {
              const submission = submissions.find(s => s.id === submissionId)
              if (!submission) return null

              return (
                <div key={submissionId} className="flex items-center space-x-3 p-2 bg-gray-50 rounded mb-2 last:mb-0">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{submission.title}</p>
                    <p className="text-xs text-gray-500 truncate">{submission.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Emergency Controls Modal */}
      {showEmergencyControls && isAdmin && (
        <Modal
          isOpen={showEmergencyControls}
          onClose={() => setShowEmergencyControls(false)}
          title="Emergency Controls"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">Critical Actions</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => handlePresentationControl('end')}
                >
                  End Session Immediately
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-orange-600 border-orange-300 hover:bg-orange-50"
                  onClick={() => {
                    emit('admin_control', { type: 'emergency_reset', sessionId: session.id })
                  }}
                >
                  Reset All Timers
                </Button>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Moderation</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                  onClick={() => {
                    emit('admin_control', { type: 'disable_reactions', sessionId: session.id })
                  }}
                >
                  Disable Reactions
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                  onClick={() => {
                    emit('admin_control', { type: 'clear_reactions', sessionId: session.id })
                  }}
                >
                  Clear All Reactions
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}