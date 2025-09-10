/**
 * Real-time Components Export Index
 * 
 * Centralized exports for all NestFest real-time features
 */

// Core WebSocket functionality
export { useWebSocket } from './useWebSocket'

// Main real-time components
export { LiveVotingInterface } from './LiveVotingInterface'
export { EventDayManager } from './EventDayManager'
export { SharkTankMode } from './SharkTankMode'
export { LiveDashboard } from './LiveDashboard'

// Utility components and hooks
export type { 
  WebSocketOptions,
  UseWebSocketReturn 
} from './useWebSocket'

// Performance and fraud detection (from lib)
export { performanceMonitor } from '@/lib/real-time/performance-monitor'
export { fraudDetector } from '@/lib/real-time/fraud-detector'