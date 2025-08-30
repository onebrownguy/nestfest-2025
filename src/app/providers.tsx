'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth/provider'
import { errorTracker } from '@/lib/monitoring/error-tracker'
import { ErrorDashboard } from '@/components/monitoring/ErrorDashboard'
import ErrorBoundary from '@/components/ErrorBoundary'
import { performanceMonitor } from '@/lib/monitoring/performance'
import { SmoothScrollProvider } from '@/providers/motion-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 3,
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  // Initialize error monitoring and performance tracking
  useEffect(() => {
    errorTracker.init()
    
    // Log successful initialization
    console.log('🎯 NestFest application initialized successfully')
    
    // Track application start metric
    const appInitTime = performance.now()
    errorTracker.captureMetric({
      type: 'page-load',
      name: 'app-initialization',
      duration: appInitTime,
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    })

    // Track with performance monitor as well
    performanceMonitor.trackWebVital('app_initialization', appInitTime)

    // Set up global error handlers
    const handleUnhandledError = (event: ErrorEvent) => {
      errorTracker.captureException(new Error(event.message), {
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      })
    }

    const handleUnhandledPromiseRejection = (event: PromiseRejectionEvent) => {
      errorTracker.captureException(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        { type: 'promise-rejection' }
      )
    }

    // Add global error listeners
    window.addEventListener('error', handleUnhandledError)
    window.addEventListener('unhandledrejection', handleUnhandledPromiseRejection)

    // Cleanup function
    return () => {
      window.removeEventListener('error', handleUnhandledError)
      window.removeEventListener('unhandledrejection', handleUnhandledPromiseRejection)
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SmoothScrollProvider>
          <ErrorBoundary level="critical">
            {children}
          </ErrorBoundary>
          <Toaster 
            position="top-right"
            richColors={true}
            closeButton={true}
            expand={true}
          />
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
          <ErrorDashboard />
        </SmoothScrollProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}