/**
 * Lightweight Error Monitoring System
 * Built from scratch for NestFest - 2025 Best Practices
 * 
 * Features:
 * - Client-side error tracking
 * - Network request monitoring  
 * - Performance metrics
 * - Console error capture
 * - localStorage persistence
 * - Real-time error reporting
 */

export interface ErrorReport {
  id: string
  timestamp: string
  type: 'javascript' | 'network' | 'promise' | 'resource' | 'custom'
  message: string
  stack?: string
  url: string
  line?: number
  column?: number
  userAgent: string
  userId?: string
  sessionId: string
  metadata?: Record<string, any>
  resolved?: boolean
}

export interface NetworkError {
  id: string
  timestamp: string
  method: string
  url: string
  status: number
  statusText: string
  responseTime: number
  requestPayload?: any
  responsePayload?: any
}

export interface PerformanceMetric {
  id: string
  timestamp: string
  type: 'page-load' | 'route-change' | 'api-call' | 'component-render'
  name: string
  duration: number
  metadata?: Record<string, any>
}

class ErrorTracker {
  private errors: ErrorReport[] = []
  private networkErrors: NetworkError[] = []
  private metrics: PerformanceMetric[] = []
  private sessionId: string
  private isInitialized = false
  private maxStoredItems = 100
  private originalConsoleError: typeof console.error

  constructor() {
    this.sessionId = this.generateSessionId()
    this.originalConsoleError = console.error.bind(console) // Store original before any overrides
    this.loadStoredData()
  }

  /**
   * Initialize error tracking
   */
  init(): void {
    if (this.isInitialized) return

    this.setupGlobalErrorHandler()
    this.setupUnhandledPromiseHandler()
    this.setupResourceErrorHandler()
    this.setupNetworkMonitoring()
    this.setupConsoleMonitoring()
    this.setupPerformanceMonitoring()

    this.isInitialized = true
    console.log('✅ NestFest Error Monitoring initialized')
  }

  /**
   * Setup global JavaScript error handler
   */
  private setupGlobalErrorHandler(): void {
    window.addEventListener('error', (event) => {
      const error: ErrorReport = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        type: 'javascript',
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        line: event.lineno,
        column: event.colno,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        metadata: {
          source: event.error?.name || 'Unknown'
        }
      }

      this.captureError(error)
    })
  }

  /**
   * Setup unhandled promise rejection handler
   */
  private setupUnhandledPromiseHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      const error: ErrorReport = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        type: 'promise',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        metadata: {
          reason: event.reason
        }
      }

      this.captureError(error)
    })
  }

  /**
   * Setup resource loading error handler
   */
  private setupResourceErrorHandler(): void {
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement
        const error: ErrorReport = {
          id: this.generateId(),
          timestamp: new Date().toISOString(),
          type: 'resource',
          message: `Failed to load resource: ${target.tagName}`,
          url: window.location.href,
          userAgent: navigator.userAgent,
          sessionId: this.sessionId,
          metadata: {
            tagName: target.tagName,
            src: (target as any).src || (target as any).href,
            resourceType: target.tagName.toLowerCase()
          }
        }

        this.captureError(error)
      }
    }, true)
  }

  /**
   * Setup network request monitoring
   */
  private setupNetworkMonitoring(): void {
    // Monitor fetch requests
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = Date.now()
      const [url, options] = args
      const requestId = this.generateId()

      try {
        const response = await originalFetch(...args)
        const duration = Date.now() - startTime

        // Log network errors (4xx, 5xx)
        if (!response.ok) {
          const networkError: NetworkError = {
            id: requestId,
            timestamp: new Date().toISOString(),
            method: options?.method || 'GET',
            url: typeof url === 'string' ? url : url.toString(),
            status: response.status,
            statusText: response.statusText,
            responseTime: duration,
            requestPayload: options?.body ? this.safeJsonParse(options.body) : undefined
          }

          this.captureNetworkError(networkError)

          // Also create a custom error report for 405s
          if (response.status === 405) {
            this.captureCustomError({
              message: `API endpoint not available: ${response.status} ${response.statusText}`,
              metadata: {
                url: networkError.url,
                method: networkError.method,
                suggestion: 'This endpoint was removed for clean deployment. Consider using mock data or implementing the API route.'
              }
            })
          }
        }

        return response
      } catch (error) {
        const duration = Date.now() - startTime
        
        const networkError: NetworkError = {
          id: requestId,
          timestamp: new Date().toISOString(),
          method: options?.method || 'GET',
          url: typeof url === 'string' ? url : url.toString(),
          status: 0,
          statusText: 'Network Error',
          responseTime: duration,
          requestPayload: options?.body ? this.safeJsonParse(options.body) : undefined
        }

        this.captureNetworkError(networkError)
        throw error
      }
    }
  }

  /**
   * Setup console monitoring for development
   */
  private setupConsoleMonitoring(): void {
    if (process.env.NODE_ENV === 'development') {
      const originalError = this.originalConsoleError
      console.error = (...args) => {
        // Prevent recursion by checking if this is from our own error tracker
        const stack = new Error().stack || ''
        if (stack.includes('notifyError') || stack.includes('ErrorTracker')) {
          originalError.apply(console, args)
          return
        }

        const error: ErrorReport = {
          id: this.generateId(),
          timestamp: new Date().toISOString(),
          type: 'custom',
          message: args.join(' '),
          url: window.location.href,
          userAgent: navigator.userAgent,
          sessionId: this.sessionId,
          metadata: {
            source: 'console.error',
            args: args
          }
        }

        this.captureError(error)
        originalError.apply(console, args)
      }
    }
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor page load performance
    window.addEventListener('load', async () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          // Get LCP asynchronously
          const largestContentfulPaint = await this.getLargestContentfulPaint()
          
          this.captureMetric({
            type: 'page-load',
            name: 'initial-load',
            duration: navigation.loadEventEnd - navigation.fetchStart,
            metadata: {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
              firstPaint: this.getFirstPaint(),
              largestContentfulPaint
            }
          })
        }
      }
    })
  }

  /**
   * Capture custom error
   */
  captureCustomError(customError: Partial<ErrorReport>): void {
    const error: ErrorReport = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type: 'custom',
      message: customError.message || 'Custom error',
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      ...customError
    }

    this.captureError(error)
  }

  /**
   * Capture error internally
   */
  private captureError(error: ErrorReport): void {
    this.errors.unshift(error)
    
    // Keep only recent errors
    if (this.errors.length > this.maxStoredItems) {
      this.errors = this.errors.slice(0, this.maxStoredItems)
    }

    this.persistData()
    this.notifyError(error)
  }

  /**
   * Capture network error
   */
  private captureNetworkError(networkError: NetworkError): void {
    this.networkErrors.unshift(networkError)
    
    if (this.networkErrors.length > this.maxStoredItems) {
      this.networkErrors = this.networkErrors.slice(0, this.maxStoredItems)
    }

    this.persistData()
  }

  /**
   * Capture performance metric
   */
  captureMetric(metric: Partial<PerformanceMetric>): void {
    const fullMetric: PerformanceMetric = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type: metric.type || 'custom',
      name: metric.name || 'unnamed',
      duration: metric.duration || 0,
      metadata: metric.metadata
    }

    this.metrics.unshift(fullMetric)
    
    if (this.metrics.length > this.maxStoredItems) {
      this.metrics = this.metrics.slice(0, this.maxStoredItems)
    }

    this.persistData()
  }

  /**
   * Get all errors
   */
  getErrors(): ErrorReport[] {
    return [...this.errors]
  }

  /**
   * Get network errors
   */
  getNetworkErrors(): NetworkError[] {
    return [...this.networkErrors]
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get error summary
   */
  getErrorSummary() {
    const totalErrors = this.errors.length
    const networkErrorsCount = this.networkErrors.length
    const errorsByType = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const recent405s = this.networkErrors
      .filter(error => error.status === 405)
      .slice(0, 5)

    return {
      totalErrors,
      networkErrorsCount,
      errorsByType,
      sessionId: this.sessionId,
      recent405Errors: recent405s,
      suggestions: this.generateSuggestions(recent405s)
    }
  }

  /**
   * Generate suggestions for common errors
   */
  private generateSuggestions(recent405s: NetworkError[]): string[] {
    const suggestions: string[] = []

    if (recent405s.length > 0) {
      suggestions.push(
        '🔧 405 Errors detected: API endpoints were removed for clean deployment.',
        '💡 Consider implementing mock data or re-adding needed API routes.',
        '📝 Check components making API calls to /api/* endpoints.'
      )
    }

    if (this.errors.some(e => e.type === 'javascript')) {
      suggestions.push('🐛 JavaScript errors found: Review console for details.')
    }

    return suggestions
  }

  /**
   * Clear all stored data
   */
  clearAll(): void {
    this.errors = []
    this.networkErrors = []
    this.metrics = []
    this.persistData()
  }

  /**
   * Utility methods
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private safeJsonParse(data: any): any {
    try {
      return typeof data === 'string' ? JSON.parse(data) : data
    } catch {
      return data
    }
  }

  private getFirstPaint(): number | undefined {
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    return firstPaint?.startTime
  }

  private getLargestContentfulPaint(): Promise<number | undefined> {
    return new Promise(resolve => {
      // Check if PerformanceObserver is supported
      if (!('PerformanceObserver' in window)) {
        resolve(undefined);
        return;
      }

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        // Disconnect the observer once an entry is found
        observer.disconnect();
        resolve(lastEntry?.startTime);
      });

      try {
        // Observe 'largest-contentful-paint' entries
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        
        // Fallback timeout in case no LCP entries are found
        setTimeout(() => {
          observer.disconnect();
          resolve(undefined);
        }, 5000);
      } catch (error) {
        // Handle cases where LCP observation is not supported
        observer.disconnect();
        resolve(undefined);
      }
    });
  }

  private notifyError(error: ErrorReport): void {
    // Temporarily disabled to prevent console noise during development
    // Re-enable after fixing all hydration issues
    /*
    if (process.env.NODE_ENV === 'development') {
      // Use original console.error to prevent recursion
      this.originalConsoleError('🚨 NestFest Error Captured:', {
        type: error.type,
        message: error.message,
        url: error.url,
        stack: error.stack,
        metadata: error.metadata
      })
    }
    */
  }

  private persistData(): void {
    if (typeof window === 'undefined') return // Skip on server-side
    
    try {
      const data = {
        errors: this.errors.slice(0, 50), // Store only recent items
        networkErrors: this.networkErrors.slice(0, 50),
        metrics: this.metrics.slice(0, 50),
        sessionId: this.sessionId,
        lastUpdated: new Date().toISOString()
      }
      
      localStorage.setItem('nestfest_error_monitoring', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to persist error monitoring data:', error)
    }
  }

  private loadStoredData(): void {
    if (typeof window === 'undefined') return // Skip on server-side
    
    try {
      const stored = localStorage.getItem('nestfest_error_monitoring')
      if (stored) {
        const data = JSON.parse(stored)
        this.errors = data.errors || []
        this.networkErrors = data.networkErrors || []
        this.metrics = data.metrics || []
      }
    } catch (error) {
      console.warn('Failed to load stored error monitoring data:', error)
    }
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker()

// Auto-initialize in browser environment (temporarily disabled)
// if (typeof window !== 'undefined') {
//   errorTracker.init()
// }