/**
 * WebSocket Server for NestFest Real-time Features
 * 
 * Handles real-time communication for:
 * - Live voting and results
 * - Event day functionality
 * - Dashboard updates
 * - Shark Tank mode
 * - Real-time notifications
 */

import { NextRequest } from 'next/server'
import { Server } from 'socket.io'
import { createClient } from 'redis'
import { createAdapter } from '@socket.io/redis-adapter'
import { authenticate } from '@/lib/auth/middleware'
import { supabaseAdmin } from '@/lib/supabase/client'
import { logAuditEvent, getClientIP } from '@/lib/api/utils'
import { performanceMonitor } from '@/lib/real-time/performance-monitor'
import { fraudDetector } from '@/lib/real-time/fraud-detector'
import type { User, RealtimeVoteData } from '@/types'

// Socket.io server instance
let io: Server | null = null

// Redis clients for adapter
let pubClient: any = null
let subClient: any = null

// Connection management
const activeConnections = new Map<string, {
  userId: string
  role: string
  competitions: Set<string>
  lastActivity: Date
}>()

// Room management
const competitionRooms = new Map<string, Set<string>>() // competitionId -> userIds
const sessionRooms = new Map<string, Set<string>>() // sessionId -> userIds

/**
 * Initialize WebSocket server
 */
async function initializeSocketServer(): Promise<Server> {
  if (io) return io

  // Create Redis clients for horizontal scaling
  if (!pubClient) {
    pubClient = createClient({ 
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      retry_strategy: (times) => Math.min(times * 50, 2000)
    })
    await pubClient.connect()
  }

  if (!subClient) {
    subClient = pubClient.duplicate()
    await subClient.connect()
  }

  // Create Socket.io server
  io = new Server(8080, {
    cors: {
      origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e8, // 100MB for large payloads
    compression: true
  })

  // Use Redis adapter for scaling
  io.adapter(createAdapter(pubClient, subClient))

  // Connection handling
  io.use(async (socket, next) => {
    try {
      // Extract JWT token from handshake
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return next(new Error('Authentication token required'))
      }

      // Verify JWT and get user
      const jwt = require('jsonwebtoken')
      const decoded = jwt.verify(token, process.env.JWT_SECRET!)
      
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single()

      if (error || !user) {
        return next(new Error('Invalid user'))
      }

      // Check user status
      if (user.status !== 'active') {
        return next(new Error('User account is not active'))
      }

      // Attach user to socket
      socket.data.user = user
      next()
    } catch (error) {
      console.error('Socket authentication error:', error)
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket) => {
    const user: User = socket.data.user
    console.log(`User ${user.name} (${user.role}) connected: ${socket.id}`)

    // Track connection
    activeConnections.set(socket.id, {
      userId: user.id,
      role: user.role,
      competitions: new Set(),
      lastActivity: new Date()
    })

    // Audit log
    logAuditEvent({
      userId: user.id,
      action: 'socket_connected',
      resource: 'websocket',
      resourceId: socket.id,
      metadata: { role: user.role },
      ipAddress: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'] || 'unknown'
    })

    // Competition room management
    socket.on('join_competition', async (data: { competitionId: string }) => {
      try {
        const { competitionId } = data

        // Verify user has access to competition
        const hasAccess = await verifyCompetitionAccess(user, competitionId)
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to competition' })
          return
        }

        // Join competition room
        const roomName = `competition:${competitionId}`
        await socket.join(roomName)

        // Track in maps
        const connection = activeConnections.get(socket.id)
        if (connection) {
          connection.competitions.add(competitionId)
        }

        if (!competitionRooms.has(competitionId)) {
          competitionRooms.set(competitionId, new Set())
        }
        competitionRooms.get(competitionId)!.add(socket.id)

        console.log(`User ${user.name} joined competition ${competitionId}`)
        
        // Send current competition state
        const competitionState = await getCompetitionState(competitionId)
        socket.emit('competition_state', competitionState)

        // Notify others in room
        socket.to(roomName).emit('user_joined', {
          userId: user.id,
          name: user.name,
          role: user.role
        })

      } catch (error) {
        console.error('Error joining competition:', error)
        socket.emit('error', { message: 'Failed to join competition' })
      }
    })

    // Event session management
    socket.on('join_session', async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data

        // Verify session exists and user has access
        const session = await getEventSession(sessionId)
        if (!session) {
          socket.emit('error', { message: 'Session not found' })
          return
        }

        const hasAccess = await verifyCompetitionAccess(user, session.competition_id)
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to session' })
          return
        }

        // Join session room
        const roomName = `session:${sessionId}`
        await socket.join(roomName)

        // Track in maps
        if (!sessionRooms.has(sessionId)) {
          sessionRooms.set(sessionId, new Set())
        }
        sessionRooms.get(sessionId)!.add(socket.id)

        console.log(`User ${user.name} joined session ${sessionId}`)

        // Send current session state
        socket.emit('session_state', session)

        // Send active presentation if any
        if (session.current_presentation_id) {
          const presentation = await getPresentationState(session.current_presentation_id)
          socket.emit('presentation_state', presentation)
        }

      } catch (error) {
        console.error('Error joining session:', error)
        socket.emit('error', { message: 'Failed to join session' })
      }
    })

    // Real-time voting
    socket.on('cast_vote', async (voteData) => {
      try {
        // Process vote through existing API logic
        const voteResult = await processRealtimeVote(user, voteData)
        
        if (voteResult.success) {
          // Acknowledge to voter
          socket.emit('vote_acknowledged', {
            voteId: voteResult.voteId,
            timestamp: new Date().toISOString()
          })

          // Broadcast vote update to competition room
          const roomName = `competition:${voteData.competitionId}`
          io.to(roomName).emit('vote_update', {
            submissionId: voteData.submissionId,
            newVoteCount: voteResult.newVoteCount,
            voterId: user.id, // For fraud detection
            timestamp: new Date().toISOString()
          })

          // Update analytics in real-time
          broadcastAnalyticsUpdate(voteData.competitionId)
          
        } else {
          socket.emit('vote_error', {
            message: voteResult.error,
            code: voteResult.errorCode
          })
        }
      } catch (error) {
        console.error('Real-time voting error:', error)
        socket.emit('vote_error', { message: 'Vote processing failed' })
      }
    })

    // Live reactions during presentations
    socket.on('send_reaction', async (reactionData) => {
      try {
        const { sessionId, submissionId, reactionType, intensity, coordinates } = reactionData

        // Validate session access
        const session = await getEventSession(sessionId)
        if (!session || session.current_presentation_id !== submissionId) {
          socket.emit('error', { message: 'Invalid reaction context' })
          return
        }

        // Store reaction
        const reaction = await storeReaction(user.id, sessionId, submissionId, reactionType, intensity, coordinates)

        // Broadcast to session room
        const roomName = `session:${sessionId}`
        io.to(roomName).emit('reaction_update', {
          reactionId: reaction.id,
          userId: user.id,
          userName: user.name,
          reactionType,
          intensity,
          coordinates,
          timestamp: new Date().toISOString()
        })

        // Update reaction heat map
        broadcastReactionHeatMap(sessionId, submissionId)

      } catch (error) {
        console.error('Reaction error:', error)
        socket.emit('error', { message: 'Failed to send reaction' })
      }
    })

    // Admin event controls
    socket.on('admin_control', async (controlData) => {
      try {
        // Verify admin permissions
        if (!['admin', 'super_admin'].includes(user.role)) {
          socket.emit('error', { message: 'Insufficient permissions' })
          return
        }

        const result = await processAdminControl(user, controlData)
        
        if (result.success) {
          // Broadcast control update to relevant rooms
          broadcastAdminUpdate(controlData)
        } else {
          socket.emit('admin_error', { message: result.error })
        }

      } catch (error) {
        console.error('Admin control error:', error)
        socket.emit('admin_error', { message: 'Control action failed' })
      }
    })

    // Heartbeat for connection monitoring
    socket.on('heartbeat', () => {
      const connection = activeConnections.get(socket.id)
      if (connection) {
        connection.lastActivity = new Date()
      }
      socket.emit('heartbeat_ack')
    })

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${user.name} disconnected: ${reason}`)

      // Clean up tracking
      const connection = activeConnections.get(socket.id)
      if (connection) {
        // Remove from competition rooms
        connection.competitions.forEach(competitionId => {
          const room = competitionRooms.get(competitionId)
          if (room) {
            room.delete(socket.id)
            if (room.size === 0) {
              competitionRooms.delete(competitionId)
            }
          }
        })
      }

      // Clean up session rooms
      sessionRooms.forEach((userIds, sessionId) => {
        if (userIds.has(socket.id)) {
          userIds.delete(socket.id)
          if (userIds.size === 0) {
            sessionRooms.delete(sessionId)
          }
        }
      })

      activeConnections.delete(socket.id)

      // Audit log
      logAuditEvent({
        userId: user.id,
        action: 'socket_disconnected',
        resource: 'websocket',
        resourceId: socket.id,
        metadata: { reason },
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'] || 'unknown'
      })
    })

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for user ${user.name}:`, error)
    })
  })

  // Connection monitoring
  setInterval(() => {
    const now = new Date()
    const staleConnections = Array.from(activeConnections.entries())
      .filter(([, connection]) => now.getTime() - connection.lastActivity.getTime() > 300000) // 5 minutes

    staleConnections.forEach(([socketId]) => {
      const socket = io?.sockets.sockets.get(socketId)
      if (socket) {
        socket.disconnect(true)
      }
    })
  }, 60000) // Check every minute

  console.log('WebSocket server initialized on port 8080')
  return io
}

/**
 * Helper functions
 */

async function verifyCompetitionAccess(user: User, competitionId: string): Promise<boolean> {
  try {
    const { data: competition } = await supabaseAdmin
      .from('competitions')
      .select('id, status')
      .eq('id', competitionId)
      .single()

    if (!competition) return false

    // Admin and super_admin have access to all competitions
    if (['admin', 'super_admin'].includes(user.role)) return true

    // Check if user is a participant or has access
    const { data: access } = await supabaseAdmin
      .from('submissions')
      .select('id')
      .eq('competition_id', competitionId)
      .eq('user_id', user.id)
      .limit(1)

    return access && access.length > 0
  } catch {
    return false
  }
}

async function getCompetitionState(competitionId: string) {
  const { data: competition } = await supabaseAdmin
    .from('competitions')
    .select(`
      *,
      rounds:competition_rounds(*),
      submissions:submissions(*)
    `)
    .eq('id', competitionId)
    .single()

  // Get real-time vote counts
  const { data: voteCounts } = await supabaseAdmin
    .from('votes')
    .select('submission_id, vote_data')
    .eq('competition_id', competitionId)

  const voteCountsBySubmission: Record<string, number> = {}
  voteCounts?.forEach(vote => {
    if (!voteCountsBySubmission[vote.submission_id]) {
      voteCountsBySubmission[vote.submission_id] = 0
    }
    voteCountsBySubmission[vote.submission_id] += vote.vote_data.value || vote.vote_data.vote_count || 1
  })

  return {
    competition,
    voteCounts: voteCountsBySubmission,
    timestamp: new Date().toISOString()
  }
}

async function getEventSession(sessionId: string) {
  const { data: session } = await supabaseAdmin
    .from('event_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  return session
}

async function getPresentationState(presentationId: string) {
  const { data: submission } = await supabaseAdmin
    .from('submissions')
    .select('*')
    .eq('id', presentationId)
    .single()

  return submission
}

async function processRealtimeVote(user: User, voteData: any) {
  // Implementation similar to existing vote API but optimized for real-time
  // This would integrate with the existing voting system
  return { success: true, voteId: 'temp', newVoteCount: 42 }
}

async function storeReaction(userId: string, sessionId: string, submissionId: string, reactionType: string, intensity: number, coordinates?: { x: number, y: number }) {
  const { data: reaction } = await supabaseAdmin
    .from('live_reactions')
    .insert({
      session_id: sessionId,
      submission_id: submissionId,
      user_id: userId,
      reaction_type: reactionType,
      intensity,
      coordinates,
      timestamp: new Date().toISOString()
    })
    .select()
    .single()

  return reaction
}

async function broadcastAnalyticsUpdate(competitionId: string) {
  // Calculate and broadcast real-time analytics
  const analytics = await calculateRealTimeAnalytics(competitionId)
  io?.to(`competition:${competitionId}`).emit('analytics_update', analytics)
}

async function broadcastReactionHeatMap(sessionId: string, submissionId: string) {
  // Calculate and broadcast reaction heat map data
  const heatMapData = await calculateReactionHeatMap(sessionId, submissionId)
  io?.to(`session:${sessionId}`).emit('reaction_heatmap', heatMapData)
}

async function processAdminControl(user: User, controlData: any) {
  // Process admin controls for event management
  return { success: true }
}

async function broadcastAdminUpdate(controlData: any) {
  // Broadcast admin control updates
}

async function calculateRealTimeAnalytics(competitionId: string) {
  // Calculate real-time voting analytics
  return {}
}

async function calculateReactionHeatMap(sessionId: string, submissionId: string) {
  // Calculate reaction heat map data
  return {}
}

// API route handler
export async function GET(request: NextRequest) {
  try {
    const server = await initializeSocketServer()
    
    return new Response(JSON.stringify({
      status: 'WebSocket server running',
      port: 8080,
      connections: activeConnections.size,
      competitions: competitionRooms.size,
      sessions: sessionRooms.size
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('WebSocket server error:', error)
    return new Response(JSON.stringify({
      error: 'Failed to initialize WebSocket server'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Export for external use
// Note: Route handlers should only export HTTP method functions
// Internal functions are not exported