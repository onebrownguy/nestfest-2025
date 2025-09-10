/**
 * Global Error Boundary Test Suite
 * Tests for React error boundary functionality and error capture
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { GlobalErrorBoundary, useErrorHandler, withErrorBoundary } from '../GlobalErrorBoundary'
import { errorMonitor } from '@/lib/monitoring/error-logger'

// Test component that throws errors on demand
const ErrorThrowingComponent: React.FC<{ shouldThrow?: boolean; errorType?: string }> = ({ 
  shouldThrow = false, 
  errorType = 'Error' 
}) => {
  if (shouldThrow) {
    switch (errorType) {
      case 'TypeError':
        throw new TypeError('Component TypeError')
      case 'ReferenceError':
        throw new ReferenceError('Component ReferenceError')
      default:
        throw new Error('Component Error')
    }
  }
  return <div data-testid="working-component">Component is working</div>
}

// Test component that uses the error handler hook
const ErrorHandlerComponent: React.FC<{ triggerError?: boolean }> = ({ triggerError = false }) => {
  const handleError = useErrorHandler()
  
  React.useEffect(() => {
    if (triggerError) {
      try {
        throw new Error('Hook error test')
      } catch (error) {
        handleError(error as Error, { componentStack: 'Test stack' })
      }
    }
  }, [triggerError, handleError])
  
  return <div data-testid="error-handler-component">Error handler component</div>
}

describe('GlobalErrorBoundary', () => {
  beforeEach(() => {
    // Reset error monitor state before each test
    errorMonitor.clearErrors()
    jest.clearAllMocks()
    
    // Suppress console errors for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Error Boundary Functionality', () => {
    it('should render children when no error occurs', () => {
      render(
        <GlobalErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByTestId('working-component')).toBeInTheDocument()
      expect(screen.getByText('Component is working')).toBeInTheDocument()
    })

    it('should catch and display error when child component throws', () => {
      render(
        <GlobalErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Try again')).toBeInTheDocument()
      expect(screen.getByText('Go to homepage')).toBeInTheDocument()
      expect(screen.queryByTestId('working-component')).not.toBeInTheDocument()
    })

    it('should capture error with monitoring system', async () => {
      render(
        <GlobalErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      // Wait for error processing
      await waitForErrorProcessing(100)

      const recentErrors = errorMonitor.getRecentErrors(1)
      expect(recentErrors).toHaveLength(1)
      
      const capturedError = recentErrors[0]
      expect(capturedError.error.message).toBe('Component Error')
      expect(capturedError.context.component).toBe('GlobalErrorBoundary')
      expect(capturedError.context.errorBoundary).toBe(true)
      expect(capturedError.tags).toContain('error-boundary')
      expect(capturedError.tags).toContain('react-component')
    })

    it('should display error ID when error is captured', async () => {
      render(
        <GlobalErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      await waitForErrorProcessing(100)

      const errorIdElement = screen.getByText(/Error ID:/)
      expect(errorIdElement).toBeInTheDocument()
      
      const recentErrors = errorMonitor.getRecentErrors(1)
      const errorId = recentErrors[0].id
      expect(errorIdElement.textContent).toContain(errorId)
    })

    it('should classify different error types with appropriate severity', async () => {
      const errorTypes = [
        { type: 'TypeError', expectedSeverity: 'high' },
        { type: 'ReferenceError', expectedSeverity: 'high' },
        { type: 'Error', expectedSeverity: 'critical' } // Because it's in error boundary
      ]

      for (const { type, expectedSeverity } of errorTypes) {
        errorMonitor.clearErrors()
        
        render(
          <GlobalErrorBoundary>
            <ErrorThrowingComponent shouldThrow={true} errorType={type} />
          </GlobalErrorBoundary>
        )

        await waitForErrorProcessing(100)

        const recentErrors = errorMonitor.getRecentErrors(1)
        expect(recentErrors[0]).toHaveBeenCapturedWithSeverity(expectedSeverity)
      }
    })
  })

  describe('Error Boundary Reset', () => {
    it('should reset error state when "Try again" is clicked', async () => {
      const { rerender } = render(
        <GlobalErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      // Error should be displayed
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Click "Try again"
      fireEvent.click(screen.getByText('Try again'))

      // Re-render with working component
      rerender(
        <GlobalErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByTestId('working-component')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('should navigate to homepage when "Go to homepage" is clicked', () => {
      // Mock window.location
      delete (window as any).location
      window.location = { href: '' } as any

      render(
        <GlobalErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      fireEvent.click(screen.getByText('Go to homepage'))
      expect(window.location.href).toBe('/')
    })
  })

  describe('Custom Fallback Component', () => {
    const CustomFallback: React.FC<{ error: Error; errorId: string | null; resetError: () => void }> = ({
      error,
      errorId,
      resetError
    }) => (
      <div data-testid="custom-fallback">
        <h2>Custom Error Fallback</h2>
        <p>Error: {error.message}</p>
        <p>ID: {errorId}</p>
        <button onClick={resetError}>Custom Reset</button>
      </div>
    )

    it('should render custom fallback component when provided', async () => {
      render(
        <GlobalErrorBoundary fallback={CustomFallback}>
          <ErrorThrowingComponent shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      await waitForErrorProcessing(100)

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom Error Fallback')).toBeInTheDocument()
      expect(screen.getByText('Error: Component Error')).toBeInTheDocument()
      expect(screen.getByText('Custom Reset')).toBeInTheDocument()
      
      // Default fallback should not be rendered
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('Development Mode Features', () => {
    const originalNodeEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv
    })

    it('should show debug information in development mode', () => {
      process.env.NODE_ENV = 'development'

      render(
        <GlobalErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByText('Debug information (development only)')).toBeInTheDocument()
      
      // Click to expand debug info
      fireEvent.click(screen.getByText('Debug information (development only)'))
      expect(screen.getByText('Error: Component Error')).toBeInTheDocument()
    })

    it('should hide debug information in production mode', () => {
      process.env.NODE_ENV = 'production'

      render(
        <GlobalErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(screen.queryByText('Debug information (development only)')).not.toBeInTheDocument()
    })
  })

  describe('Custom Error Handler', () => {
    it('should call custom onError handler when provided', async () => {
      const mockErrorHandler = jest.fn()

      render(
        <GlobalErrorBoundary onError={mockErrorHandler}>
          <ErrorThrowingComponent shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      await waitForErrorProcessing(100)

      expect(mockErrorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Component Error'
        }),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      )
    })
  })
})

describe('useErrorHandler Hook', () => {
  beforeEach(() => {
    errorMonitor.clearErrors()
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should capture errors when called', async () => {
    render(<ErrorHandlerComponent triggerError={true} />)

    await waitForErrorProcessing(100)

    const recentErrors = errorMonitor.getRecentErrors(1)
    expect(recentErrors).toHaveLength(1)
    
    const capturedError = recentErrors[0]
    expect(capturedError.error.message).toBe('Hook error test')
    expect(capturedError.context.component).toBe('useErrorHandler')
    expect(capturedError.context.componentStack).toBe('Test stack')
    expect(capturedError.tags).toContain('error-handler')
    expect(capturedError.tags).toContain('hook')
  })

  it('should not capture errors when not triggered', async () => {
    render(<ErrorHandlerComponent triggerError={false} />)

    await waitForErrorProcessing(100)

    const recentErrors = errorMonitor.getRecentErrors(1)
    expect(recentErrors).toHaveLength(0)
  })
})

describe('withErrorBoundary HOC', () => {
  beforeEach(() => {
    errorMonitor.clearErrors()
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should wrap component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(ErrorThrowingComponent)
    
    render(<WrappedComponent shouldThrow={false} />)

    expect(screen.getByTestId('working-component')).toBeInTheDocument()
  })

  it('should catch errors in wrapped component', async () => {
    const WrappedComponent = withErrorBoundary(ErrorThrowingComponent)
    
    render(<WrappedComponent shouldThrow={true} />)

    await waitForErrorProcessing(100)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    const recentErrors = errorMonitor.getRecentErrors(1)
    expect(recentErrors).toHaveLength(1)
  })

  it('should pass through error boundary props', async () => {
    const mockErrorHandler = jest.fn()
    const WrappedComponent = withErrorBoundary(ErrorThrowingComponent, {
      onError: mockErrorHandler
    })
    
    render(<WrappedComponent shouldThrow={true} />)

    await waitForErrorProcessing(100)

    expect(mockErrorHandler).toHaveBeenCalled()
  })

  it('should set correct display name', () => {
    const TestComponent: React.FC = () => <div>Test</div>
    TestComponent.displayName = 'TestComponent'
    
    const WrappedComponent = withErrorBoundary(TestComponent)
    
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)')
  })

  it('should use component name when displayName is not available', () => {
    function TestFunction() {
      return <div>Test</div>
    }
    
    const WrappedComponent = withErrorBoundary(TestFunction)
    
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestFunction)')
  })
})