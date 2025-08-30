'use client'

/**
 * Enhanced Error Boundary with User-Friendly Error Messages
 * Captures React errors and provides graceful fallbacks
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { performanceMonitor } from '@/lib/monitoring/performance'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'component' | 'critical'
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props
    const { errorId } = this.state

    // Track error in performance monitoring
    performanceMonitor.trackWebVital(
      `error_${level}`,
      1,
      errorId || undefined
    )

    // Log comprehensive error information
    console.error('Error Boundary Caught Error:', {
      errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      level,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'ssr',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
    })

    // Send to external error tracking in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      this.sendErrorToTracking(error, errorInfo, errorId)
    }

    // Update state with error info
    this.setState({ errorInfo })

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }
  }

  private sendErrorToTracking(error: Error, errorInfo: ErrorInfo, errorId: string | null) {
    // Send to Vercel Analytics or other tracking service
    if (window.va) {
      window.va.track('Error', {
        errorId,
        message: error.message,
        level: this.props.level,
        component: errorInfo.componentStack?.split('\n')[1]?.trim()
      })
    }

    // Could also send to Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error, { tags: { errorId, level } })
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      })
    } else {
      // Too many retries, reload the page
      window.location.reload()
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    const { hasError, error, errorId } = this.state
    const { children, fallback, level = 'component' } = this.props

    if (hasError && error) {
      // Custom fallback provided
      if (fallback) {
        return fallback
      }

      // Different error UIs based on level
      if (level === 'critical') {
        return this.renderCriticalError()
      }

      if (level === 'page') {
        return this.renderPageError()
      }

      // Default component-level error
      return this.renderComponentError()
    }

    return children
  }

  private renderCriticalError() {
    const { error, errorId } = this.state

    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Critical System Error
          </h1>
          
          <p className="text-gray-600 mb-6">
            We're experiencing technical difficulties. Our team has been notified and is working to resolve this issue.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={this.handleReload}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Reload Application
            </button>
            
            {errorId && (
              <p className="text-xs text-gray-500">
                Error ID: {errorId}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  private renderPageError() {
    const { error, errorId } = this.state
    const canRetry = this.retryCount < this.maxRetries

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-lg shadow p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Page Error
          </h2>
          
          <p className="text-gray-600 mb-6">
            Something went wrong while loading this page. Please try again or contact support if the problem persists.
          </p>
          
          <div className="flex gap-3 justify-center">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Try Again
              </button>
            )}
            
            <button
              onClick={this.handleReload}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
          
          {errorId && (
            <p className="text-xs text-gray-500 mt-4">
              Error ID: {errorId}
            </p>
          )}
        </div>
      </div>
    )
  }

  private renderComponentError() {
    const { error, errorId } = this.state
    const canRetry = this.retryCount < this.maxRetries

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800 mb-1">
              Component Error
            </h3>
            
            <p className="text-sm text-yellow-700 mb-3">
              This component encountered an error and couldn't render properly.
            </p>
            
            <div className="flex gap-2">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors flex items-center gap-1"
                >
                  <ArrowPathIcon className="w-3 h-3" />
                  Retry ({this.maxRetries - this.retryCount} left)
                </button>
              )}
            </div>
            
            {errorId && (
              <p className="text-xs text-yellow-600 mt-2">
                Error ID: {errorId}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary

// Higher-order component for easy error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  level: 'page' | 'component' | 'critical' = 'component'
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary level={level}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}