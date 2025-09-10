import { describe, it, expect, beforeEach, vi } from 'vitest'
import { errorTracker } from './error-tracker'

// Mock window and localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

Object.defineProperty(window, 'navigator', {
  value: { userAgent: 'test-agent' },
  writable: true,
})

Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost:3000/test' },
  writable: true,
})

describe('ErrorTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    errorTracker.clearAll()
  })

  describe('Error Capture', () => {
    it('should capture custom errors', () => {
      const errorMessage = 'Test custom error'
      
      errorTracker.captureCustomError({
        message: errorMessage,
        metadata: { component: 'TestComponent' }
      })

      const errors = errorTracker.getErrors()
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toBe(errorMessage)
      expect(errors[0].type).toBe('custom')
      expect(errors[0].metadata?.component).toBe('TestComponent')
    })

    it('should generate unique error IDs', () => {
      errorTracker.captureCustomError({ message: 'Error 1' })
      errorTracker.captureCustomError({ message: 'Error 2' })

      const errors = errorTracker.getErrors()
      expect(errors[0].id).not.toBe(errors[1].id)
      expect(errors[0].id).toMatch(/^err_/)
      expect(errors[1].id).toMatch(/^err_/)
    })

    it('should limit stored errors to max limit', () => {
      // Capture more errors than the limit
      for (let i = 0; i < 150; i++) {
        errorTracker.captureCustomError({ message: `Error ${i}` })
      }

      const errors = errorTracker.getErrors()
      expect(errors.length).toBeLessThanOrEqual(100) // maxStoredItems
    })
  })

  describe('Performance Metrics', () => {
    it('should capture performance metrics', () => {
      const metric = {
        type: 'page-load' as const,
        name: 'test-page',
        duration: 1500,
        metadata: { route: '/test' }
      }

      errorTracker.captureMetric(metric)

      const metrics = errorTracker.getMetrics()
      expect(metrics).toHaveLength(1)
      expect(metrics[0].type).toBe('page-load')
      expect(metrics[0].name).toBe('test-page')
      expect(metrics[0].duration).toBe(1500)
    })
  })

  describe('Error Summary', () => {
    beforeEach(() => {
      errorTracker.clearAll()
    })

    it('should provide accurate error summary', () => {
      // Add different types of errors
      errorTracker.captureCustomError({ message: 'Custom error 1' })
      errorTracker.captureCustomError({ message: 'Custom error 2' })

      const summary = errorTracker.getErrorSummary()
      
      expect(summary.totalErrors).toBe(2)
      expect(summary.errorsByType.custom).toBe(2)
      expect(summary.sessionId).toBeDefined()
      expect(summary.suggestions).toBeDefined()
    })

    it('should generate suggestions for 405 errors', () => {
      // Simulate network error capture (this would normally be done by fetch monitoring)
      const networkError = {
        id: 'test-network-error',
        timestamp: new Date().toISOString(),
        method: 'POST',
        url: '/api/auth/login',
        status: 405,
        statusText: 'Method Not Allowed',
        responseTime: 100
      }

      // Access the private method via any casting for testing
      ;(errorTracker as any).captureNetworkError(networkError)

      const summary = errorTracker.getErrorSummary()
      expect(summary.networkErrorsCount).toBe(1)
      expect(summary.recent405Errors).toHaveLength(1)
      expect(summary.suggestions).toContain('🔧 405 Errors detected: API endpoints were removed for clean deployment.')
    })
  })

  describe('Data Persistence', () => {
    it('should attempt to persist data to localStorage', () => {
      errorTracker.captureCustomError({ message: 'Persistence test' })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'nestfest_error_monitoring',
        expect.stringContaining('errors')
      )
    })

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      expect(() => {
        errorTracker.captureCustomError({ message: 'Should not crash' })
      }).not.toThrow()
    })
  })

  describe('Clear Functionality', () => {
    it('should clear all stored data', () => {
      errorTracker.captureCustomError({ message: 'Test error' })
      errorTracker.captureMetric({ type: 'custom', name: 'test', duration: 100 })

      expect(errorTracker.getErrors()).toHaveLength(1)
      expect(errorTracker.getMetrics()).toHaveLength(1)

      errorTracker.clearAll()

      expect(errorTracker.getErrors()).toHaveLength(0)
      expect(errorTracker.getMetrics()).toHaveLength(0)
      expect(errorTracker.getNetworkErrors()).toHaveLength(0)
    })
  })
})