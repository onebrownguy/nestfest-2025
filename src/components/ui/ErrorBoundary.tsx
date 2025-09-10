'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './Button'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

// Error Boundary Props
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  className?: string
}

// Error Boundary State
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// Main Error Boundary Component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error)
      console.error('Error Info:', errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className={`min-h-[400px] flex items-center justify-center p-6 ${this.props.className || ''}`}>
          <div className="text-center max-w-md">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={this.handleReset}
                leftIcon={<ArrowPathIcon className="h-4 w-4" />}
              >
                Try Again
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>

            {/* Error Details (Development Only) */}
            {this.props.showDetails && process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Error Details
                </summary>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-xs font-mono">
                  <div className="text-red-600 dark:text-red-400 mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </div>
                  {this.state.errorInfo && (
                    <div className="mt-4 text-gray-600 dark:text-gray-400">
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Error Fallback Component for Suspense
export interface ErrorFallbackProps {
  error?: Error
  resetError?: () => void
  title?: string
  message?: string
  showRetry?: boolean
  className?: string
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  showRetry = true,
  className
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className || ''}`}>
      <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
        {message}
      </p>
      
      {showRetry && resetError && (
        <Button
          onClick={resetError}
          leftIcon={<ArrowPathIcon className="h-4 w-4" />}
        >
          Try Again
        </Button>
      )}

      {/* Error details in development */}
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mt-6 w-full max-w-2xl">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Error Details (Development)
          </summary>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-xs font-mono overflow-auto">
            <div className="text-red-600 dark:text-red-400 mb-2">
              <strong>Error:</strong> {error.message}
            </div>
            <div className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {error.stack}
            </div>
          </div>
        </details>
      )}
    </div>
  )
}

// Network Error Component
export interface NetworkErrorProps {
  onRetry?: () => void
  title?: string
  message?: string
  className?: string
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
  onRetry,
  title = 'Connection Error',
  message = 'Unable to connect to the server. Please check your internet connection and try again.',
  className
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className || ''}`}>
      <div className="w-16 h-16 mb-4 text-gray-400">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1}
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" 
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
        {message}
      </p>
      
      {onRetry && (
        <Button
          onClick={onRetry}
          leftIcon={<ArrowPathIcon className="h-4 w-4" />}
        >
          Try Again
        </Button>
      )}
    </div>
  )
}

// 404 Not Found Component
export interface NotFoundProps {
  title?: string
  message?: string
  showHomeButton?: boolean
  className?: string
}

export const NotFound: React.FC<NotFoundProps> = ({
  title = 'Page Not Found',
  message = 'The page you are looking for does not exist or has been moved.',
  showHomeButton = true,
  className
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className || ''}`}>
      <div className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">
        404
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
        {message}
      </p>
      
      {showHomeButton && (
        <Button
          onClick={() => window.location.href = '/'}
        >
          Go Home
        </Button>
      )}
    </div>
  )
}

// Access Denied Component
export interface AccessDeniedProps {
  title?: string
  message?: string
  showLoginButton?: boolean
  className?: string
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = 'Access Denied',
  message = 'You do not have permission to access this resource.',
  showLoginButton = true,
  className
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className || ''}`}>
      <div className="w-16 h-16 mb-4 text-yellow-500">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5}
            d="M12 15v2m0-2V9m0 6h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
        {message}
      </p>
      
      {showLoginButton && (
        <Button
          onClick={() => window.location.href = '/login'}
        >
          Login
        </Button>
      )}
    </div>
  )
}

// Hook for using error boundary
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return {
    captureError,
    resetError
  }
}