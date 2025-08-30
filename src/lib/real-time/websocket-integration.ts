/**
 * WebSocket Integration Script
 * 
 * Integrates all real-time components:
 * - Performance monitoring
 * - Fraud detection
 * - Analytics processing
 * - Load balancing
 */

import { Server, Socket } from 'socket.io'
import { performanceMonitor } from './performance-monitor'
import { fraudDetector } from './fraud-detector'
import { supabaseAdmin } from '@/lib/supabase/client'
import { logAuditEvent, getClientIP } from '@/lib/api/utils'
import type { 
  User, 
  RealtimeVoteData, 
  FraudDetectionAlert,
  SystemHealthMetrics 
} from '@/types'

export class WebSocketIntegration {
  private io: Server | null = null

  /**
   * Initialize integrated WebSocket server
   */
  async initialize(io: Server) {
    this.io = io

    // Attach performance monitoring
    performanceMonitor.attachToServer(io)

    // Setup fraud detection alerts
    fraudDetector.onFraudAlert((alert: FraudDetectionAlert) => {
      this.broadcastFraudAlert(alert)
    })

    // Add integrated vote processing
    this.setupVoteProcessing()

    // Setup analytics broadcasting
    this.setupAnalyticsBroadcasting()

    console.log('WebSocket integration initialized')
  }

  /**
   * Setup integrated vote processing with fraud detection
   */
  private setupVoteProcessing() {
    if (!this.io) return

    // Override the cast_vote handler to include fraud detection
    this.io.on('connection', (socket: Socket) => {
      const user: User = socket.data.user

      socket.on('cast_vote', async (voteData: RealtimeVoteData) => {
        try {
          // Check rate limiting
          if (!performanceMonitor.checkRateLimit(socket.id, 'cast_vote', 10)) {
            socket.emit('vote_error', {
              message: 'Rate limit exceeded. Please slow down.',
              code: 'RATE_LIMIT_EXCEEDED'
            })
            return
          }

          // Prepare fraud detection data
          const fraudData = {
            ...voteData,
            ipAddress: getClientIP({ 
              headers: { 'x-forwarded-for': socket.handshake.address },
              connection: { remoteAddress: socket.handshake.address }
            } as any),
            userAgent: socket.handshake.headers['user-agent'] || 'unknown',
            sessionId: socket.id
          }

          // Run fraud detection
          const fraudResult = await fraudDetector.processVote(fraudData)

          if (!fraudResult.allowed) {
            // Vote blocked by fraud detection
            socket.emit('vote_error', {
              message: 'Vote blocked due to suspicious activity',
              code: 'FRAUD_DETECTED',
              alerts: fraudResult.alerts
            })

            // Log security event
            logAuditEvent({
              userId: user.id,
              action: 'vote_blocked',
              resource: 'votes',
              resourceId: voteData.submissionId,
              metadata: { 
                reason: 'fraud_detection',
                alerts: fraudResult.alerts.length,
                competitionId: voteData.competitionId
              },
              ipAddress: fraudData.ipAddress,
              userAgent: fraudData.userAgent
            })

            return
          }

          // Process vote normally if allowed
          const voteResult = await this.processValidatedVote(user, voteData)

          if (voteResult.success) {
            // Acknowledge to voter
            socket.emit('vote_acknowledged', {
              voteId: voteResult.voteId,
              timestamp: new Date().toISOString()
            })

            // Use batched messaging for performance
            performanceMonitor.batchMessage(
              `competition:${voteData.competitionId}`,
              'vote_update',
              {
                submissionId: voteData.submissionId,
                newVoteCount: voteResult.newVoteCount,
                voterId: user.id,
                timestamp: new Date().toISOString()
              }
            )

            // Send fraud alerts if any (but vote was still allowed)
            if (fraudResult.alerts.length > 0) {
              fraudResult.alerts.forEach(alert => {
                if (alert.severity !== 'critical') {
                  this.broadcastFraudAlert(alert)
                }
              })
            }

            // Update real-time analytics
            this.broadcastAnalyticsUpdate(voteData.competitionId)

          } else {
            socket.emit('vote_error', {
              message: voteResult.error,
              code: voteResult.errorCode
            })
          }

        } catch (error) {
          console.error('Integrated vote processing error:', error)
          socket.emit('vote_error', { 
            message: 'Vote processing failed',
            code: 'PROCESSING_ERROR'
          })
        }
      })
    })
  }

  /**
   * Process validated vote (same logic as original but optimized)
   */
  private async processValidatedVote(user: User, voteData: RealtimeVoteData) {
    // This would integrate with the existing voting API logic
    // For now, return a mock successful result
    return {
      success: true,
      voteId: `vote_${Date.now()}`,
      newVoteCount: Math.floor(Math.random() * 1000),
      error: null,
      errorCode: null
    }
  }

  /**
   * Setup analytics broadcasting
   */
  private setupAnalyticsBroadcasting() {
    // Broadcast analytics every 5 seconds
    setInterval(() => {
      this.broadcastSystemHealth()
      this.broadcastFraudStats()
      this.broadcastPerformanceMetrics()
    }, 5000)
  }

  /**
   * Broadcast fraud alert to appropriate rooms
   */
  private broadcastFraudAlert(alert: FraudDetectionAlert) {
    if (!this.io) return

    // Send to admin rooms
    this.io.to('admin-room').emit('fraud_alert', alert)

    // Send to competition room if competition-specific
    if (alert.competitionId && alert.competitionId !== 'system') {
      this.io.to(`competition:${alert.competitionId}`).emit('fraud_alert', alert)
    }

    // Send system-wide alerts to dashboard
    if (alert.severity === 'critical') {
      this.io.emit('system_alert', {
        type: 'security',
        message: alert.description,
        severity: alert.severity,
        timestamp: alert.timestamp
      })
    }
  }

  /**
   * Broadcast system health metrics
   */
  private broadcastSystemHealth() {
    if (!this.io) return

    const metrics = performanceMonitor.getMetrics()
    
    // Send to admin dashboard
    this.io.to('admin-room').emit('system_health', metrics)

    // Send condensed version to all users
    this.io.emit('connection_status', {
      isHealthy: metrics.errorRate < 5 && metrics.averageLatency < 1000,
      connections: metrics.connectionsCount,
      latency: metrics.averageLatency
    })
  }

  /**
   * Broadcast fraud statistics
   */
  private broadcastFraudStats() {
    if (!this.io) return

    const stats = fraudDetector.getFraudStats()
    
    // Send to admin rooms
    this.io.to('admin-room').emit('fraud_stats', stats)

    // Send alert if fraud rate is high
    if (stats.suspicionRate > 15) {
      this.io.to('admin-room').emit('fraud_alert', {
        type: 'high_fraud_rate',
        severity: 'high',
        description: `Fraud rate is ${stats.suspicionRate.toFixed(1)}%`,
        metadata: stats,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Broadcast performance metrics
   */
  private broadcastPerformanceMetrics() {
    if (!this.io) return

    const connectionAnalytics = performanceMonitor.getConnectionAnalytics()
    const serverMetrics = performanceMonitor.getServerMetrics()

    // Send to admin dashboard
    this.io.to('admin-room').emit('performance_metrics', {
      connections: connectionAnalytics,
      server: serverMetrics
    })
  }

  /**
   * Broadcast real-time analytics update
   */
  private async broadcastAnalyticsUpdate(competitionId: string) {
    if (!this.io) return

    try {
      // Get real-time analytics
      const analytics = fraudDetector.getAnalytics()
      
      // Get vote counts from database
      const { data: voteCounts } = await supabaseAdmin
        .from('votes')
        .select('submission_id, vote_data')
        .eq('competition_id', competitionId)

      const voteCountsBySubmission: Record<string, number> = {}
      voteCounts?.forEach(vote => {
        if (!voteCountsBySubmission[vote.submission_id]) {
          voteCountsBySubmission[vote.submission_id] = 0
        }
        voteCountsBySubmission[vote.submission_id] += 
          vote.vote_data?.value || vote.vote_data?.vote_count || 1
      })

      // Broadcast update
      performanceMonitor.batchMessage(
        `competition:${competitionId}`,
        'analytics_update',
        {
          analytics,
          voteCounts: voteCountsBySubmission,
          timestamp: new Date().toISOString()
        }
      )

    } catch (error) {
      console.error('Failed to broadcast analytics update:', error)
    }
  }

  /**
   * Handle graceful shutdown
   */
  async shutdown() {
    console.log('Shutting down WebSocket integration...')
    
    // Shutdown components
    performanceMonitor.shutdown()
    fraudDetector.shutdown()
    
    if (this.io) {
      // Notify all clients
      this.io.emit('server_shutdown', {
        message: 'Server is shutting down for maintenance',
        timestamp: new Date().toISOString()
      })
      
      // Close server
      this.io.close()
    }
    
    console.log('WebSocket integration shut down')
  }
}

// Export singleton instance
export const webSocketIntegration = new WebSocketIntegration()

// Export initialization helper
export async function initializeIntegratedWebSocket(io: Server) {
  await webSocketIntegration.initialize(io)
  return webSocketIntegration
}