'use client'

/**
 * WebSocket Hook for NestFest Real-time Features
 * 
 * Provides real-time communication capabilities including:
 * - Connection management with automatic reconnection
 * - Authentication and authorization
 * - Event handling and broadcasting
 * - Performance monitoring
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/lib/auth/hooks'
import type { 
  ConnectionStatus, 
  RealtimeVoteUpdate,
  EventSessionState,
  ReactionAnalytics,
  DashboardUpdate,
  FraudDetectionAlert,
  SharkTankOffer,
  SystemHealthMetrics
} from '@/types'

interface WebSocketOptions {
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
  heartbeatInterval?: number
}

interface UseWebSocketReturn {
  socket: Socket | null
  connectionStatus: ConnectionStatus
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  emit: (event: string, data?: any) => void
  joinCompetition: (competitionId: string) => void
  joinSession: (sessionId: string) => void
  leaveCompetition: (competitionId: string) => void
  leaveSession: (sessionId: string) => void
  // Event handlers
  onVoteUpdate: (callback: (data: RealtimeVoteUpdate) => void) => () => void
  onSessionUpdate: (callback: (data: EventSessionState) => void) => () => void
  onReactionUpdate: (callback: (data: ReactionAnalytics) => void) => () => void
  onDashboardUpdate: (callback: (data: DashboardUpdate) => void) => () => void
  onFraudAlert: (callback: (data: FraudDetectionAlert) => void) => () => void
  onSharkTankOffer: (callback: (data: SharkTankOffer) => void) => () => void
  onSystemHealth: (callback: (data: SystemHealthMetrics) => void) => () => void
}

const defaultOptions: WebSocketOptions = {
  autoConnect: true,
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  heartbeatInterval: 30000
}

export function useWebSocket(options: WebSocketOptions = {}): UseWebSocketReturn {
  const { state: { user, accessToken: token } } = useAuth()
  const opts = { ...defaultOptions, ...options }
  
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    reconnectAttempts: 0,
    latency: 0,
    lastHeartbeat: '',
    serverRegion: ''
  })

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>()
  const latencyTestRef = useRef<{ start: number, id: string }>()
  
  // Event listeners registry
  const eventListenersRef = useRef<Map<string, Set<Function>>>(new Map())

  const updateConnectionStatus = useCallback((updates: Partial<ConnectionStatus>) => {
    setConnectionStatus(prev => ({ ...prev, ...updates }))
  }, [])

  const calculateLatency = useCallback(() => {
    if (!socket?.connected) return

    const testId = Math.random().toString(36)
    const startTime = Date.now()
    
    latencyTestRef.current = { start: startTime, id: testId }
    
    socket.emit('ping', { id: testId })
    socket.once(`pong_${testId}`, () => {
      const latency = Date.now() - startTime
      updateConnectionStatus({ latency })
    })
  }, [socket, updateConnectionStatus])

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (socket?.connected) {
        socket.emit('heartbeat')
        calculateLatency()
        updateConnectionStatus({ lastHeartbeat: new Date().toISOString() })
      }
    }, opts.heartbeatInterval)
  }, [socket, opts.heartbeatInterval, calculateLatency, updateConnectionStatus])

  const connect = useCallback(() => {
    if (socket?.connected) return

    const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:8081'
    
    // For development, allow connection without authentication
    const authData = user && token ? { token, userId: user.id } : { userId: `dev_user_${Date.now()}` }
    
    const newSocket = io(socketUrl, {
      auth: authData,
      transports: ['polling', 'websocket'], // Start with polling for better compatibility
      upgrade: true, // Allow upgrade from polling to websocket
      timeout: 20000,
      reconnection: true, // Enable automatic reconnection
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      forceNew: true,
      withCredentials: false, // Firefox compatibility
      extraHeaders: {}, // Firefox compatibility
      closeOnBeforeunload: false // Prevent premature closure
    })

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.id)
      
      updateConnectionStatus({
        isConnected: true,
        reconnectAttempts: 0,
        lastHeartbeat: new Date().toISOString()
      })
      
      startHeartbeat()
      
      // Clear any pending reconnection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = undefined
      }
    })

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
      
      updateConnectionStatus({ isConnected: false })
      
      // Stop heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = undefined
      }

      // Attempt reconnection for recoverable disconnections
      if (reason !== 'io client disconnect' && connectionStatus.reconnectAttempts < opts.reconnectAttempts!) {
        const delay = opts.reconnectDelay! * Math.pow(1.5, connectionStatus.reconnectAttempts)
        
        reconnectTimeoutRef.current = setTimeout(() => {
          updateConnectionStatus(prev => ({ 
            ...prev, 
            reconnectAttempts: prev.reconnectAttempts + 1 
          }))
          connect()
        }, delay)
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      updateConnectionStatus({ isConnected: false })
    })

    // Authentication response
    newSocket.on('authenticated', (data) => {
      updateConnectionStatus({ serverRegion: data.region || 'unknown' })
    })

    // Heartbeat response
    newSocket.on('heartbeat_ack', () => {
      updateConnectionStatus({ lastHeartbeat: new Date().toISOString() })
    })

    // Error handling
    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })

    setSocket(newSocket)
  }, [user, token, socket?.connected, opts.reconnectAttempts, opts.reconnectDelay, connectionStatus.reconnectAttempts, updateConnectionStatus, startHeartbeat])

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = undefined
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = undefined
    }
    
    setSocket(null)
    updateConnectionStatus({
      isConnected: false,
      reconnectAttempts: 0,
      latency: 0,
      lastHeartbeat: '',
      serverRegion: ''
    })
  }, [socket, updateConnectionStatus])

  const emit = useCallback((event: string, data?: any) => {
    if (socket?.connected) {
      socket.emit(event, data)
    } else {
      console.warn('WebSocket not connected, cannot emit event:', event)
    }
  }, [socket])

  // Room management
  const joinCompetition = useCallback((competitionId: string) => {
    emit('join_competition', { competitionId })
  }, [emit])

  const joinSession = useCallback((sessionId: string) => {
    emit('join_session', { sessionId })
  }, [emit])

  const leaveCompetition = useCallback((competitionId: string) => {
    emit('leave_competition', { competitionId })
  }, [emit])

  const leaveSession = useCallback((sessionId: string) => {
    emit('leave_session', { sessionId })
  }, [emit])

  // Generic event listener management
  const addEventListener = useCallback((event: string, callback: Function): (() => void) => {
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, new Set())
    }
    
    const listeners = eventListenersRef.current.get(event)!
    listeners.add(callback)

    // Add socket listener if this is the first listener for this event
    if (listeners.size === 1 && socket) {
      socket.on(event, (data: any) => {
        listeners.forEach(listener => {
          try {
            listener(data)
          } catch (error) {
            console.error(`Error in ${event} listener:`, error)
          }
        })
      })
    }

    // Return cleanup function
    return () => {
      listeners.delete(callback)
      
      // Remove socket listener if no more listeners
      if (listeners.size === 0 && socket) {
        socket.off(event)
        eventListenersRef.current.delete(event)
      }
    }
  }, [socket])

  // Specific event handlers
  const onVoteUpdate = useCallback((callback: (data: RealtimeVoteUpdate) => void) => {
    return addEventListener('vote_update', callback)
  }, [addEventListener])

  const onSessionUpdate = useCallback((callback: (data: EventSessionState) => void) => {
    return addEventListener('session_update', callback)
  }, [addEventListener])

  const onReactionUpdate = useCallback((callback: (data: ReactionAnalytics) => void) => {
    return addEventListener('reaction_update', callback)
  }, [addEventListener])

  const onDashboardUpdate = useCallback((callback: (data: DashboardUpdate) => void) => {
    return addEventListener('dashboard_update', callback)
  }, [addEventListener])

  const onFraudAlert = useCallback((callback: (data: FraudDetectionAlert) => void) => {
    return addEventListener('fraud_alert', callback)
  }, [addEventListener])

  const onSharkTankOffer = useCallback((callback: (data: SharkTankOffer) => void) => {
    return addEventListener('shark_tank_offer', callback)
  }, [addEventListener])

  const onSystemHealth = useCallback((callback: (data: SystemHealthMetrics) => void) => {
    return addEventListener('system_health', callback)
  }, [addEventListener])

  // Auto-connect on mount if enabled (allow dev mode without auth)
  useEffect(() => {
    if (opts.autoConnect && !socket) {
      // For development, connect even without authentication
      connect()
    }

    return () => {
      // Don't disconnect immediately on component unmount during dev
      // Let Socket.io handle connection lifecycle
    }
  }, []) // Only run once on mount

  // Update socket event listeners when socket changes
  useEffect(() => {
    if (!socket) return

    // Re-register all existing event listeners
    eventListenersRef.current.forEach((listeners, event) => {
      if (listeners.size > 0) {
        socket.on(event, (data: any) => {
          listeners.forEach(listener => {
            try {
              listener(data)
            } catch (error) {
              console.error(`Error in ${event} listener:`, error)
            }
          })
        })
      }
    })

    return () => {
      // Cleanup all listeners on socket change
      eventListenersRef.current.forEach((_, event) => {
        socket.off(event)
      })
    }
  }, [socket])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  const isConnected = useMemo(() => connectionStatus.isConnected, [connectionStatus.isConnected])

  return {
    socket,
    connectionStatus,
    isConnected,
    connect,
    disconnect,
    emit,
    joinCompetition,
    joinSession,
    leaveCompetition,
    leaveSession,
    onVoteUpdate,
    onSessionUpdate,
    onReactionUpdate,
    onDashboardUpdate,
    onFraudAlert,
    onSharkTankOffer,
    onSystemHealth
  }
}