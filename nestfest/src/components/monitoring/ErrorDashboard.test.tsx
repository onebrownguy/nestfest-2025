import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorDashboard } from './ErrorDashboard'
import { errorTracker } from '@/lib/monitoring/error-tracker'

// Mock the error tracker
vi.mock('@/lib/monitoring/error-tracker', () => ({
  errorTracker: {
    getErrors: vi.fn(() => []),
    getNetworkErrors: vi.fn(() => []),
    getMetrics: vi.fn(() => []),
    getErrorSummary: vi.fn(() => ({
      totalErrors: 0,
      networkErrorsCount: 0,
      errorsByType: {},
      sessionId: 'test-session-123',
      recent405Errors: [],
      suggestions: []
    })),
    clearAll: vi.fn(),
  }
}))

const mockErrorTracker = errorTracker as any

describe('ErrorDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementations
    mockErrorTracker.getErrors.mockReturnValue([])
    mockErrorTracker.getNetworkErrors.mockReturnValue([])
    mockErrorTracker.getMetrics.mockReturnValue([])
    mockErrorTracker.getErrorSummary.mockReturnValue({
      totalErrors: 0,
      networkErrorsCount: 0,
      errorsByType: {},
      sessionId: 'test-session-123',
      recent405Errors: [],
      suggestions: []
    })
  })

  it('should render error counter button when dashboard is closed', () => {
    render(<ErrorDashboard />)
    
    expect(screen.getByTitle('Open Error Dashboard (Ctrl+Shift+E)')).toBeInTheDocument()
    expect(screen.getByText('🚨 0')).toBeInTheDocument()
  })

  it('should show error count in the button', () => {
    mockErrorTracker.getErrorSummary.mockReturnValue({
      totalErrors: 5,
      networkErrorsCount: 2,
      errorsByType: { javascript: 3, custom: 2 },
      sessionId: 'test-session-123',
      recent405Errors: [],
      suggestions: []
    })

    render(<ErrorDashboard />)
    expect(screen.getByText('🚨 5')).toBeInTheDocument()
  })

  it('should open dashboard when button is clicked', async () => {
    const user = userEvent.setup()
    render(<ErrorDashboard />)
    
    const openButton = screen.getByTitle('Open Error Dashboard (Ctrl+Shift+E)')
    await user.click(openButton)
    
    expect(screen.getByText('🚨 NestFest Error Monitoring Dashboard')).toBeInTheDocument()
  })

  it('should display error statistics in dashboard', async () => {
    const user = userEvent.setup()
    mockErrorTracker.getErrorSummary.mockReturnValue({
      totalErrors: 3,
      networkErrorsCount: 1,
      errorsByType: { javascript: 2, custom: 1 },
      sessionId: 'session_123456',
      recent405Errors: [],
      suggestions: []
    })
    mockErrorTracker.getMetrics.mockReturnValue([
      {
        id: 'metric-1',
        timestamp: new Date().toISOString(),
        type: 'page-load',
        name: 'initial-load',
        duration: 1500
      }
    ])

    render(<ErrorDashboard />)
    
    // Open dashboard
    await user.click(screen.getByTitle('Open Error Dashboard (Ctrl+Shift+E)'))
    
    // Check statistics
    expect(screen.getByText('3')).toBeInTheDocument() // Total Errors
    expect(screen.getByText('1')).toBeInTheDocument() // Network Errors  
    expect(screen.getByText('123456')).toBeInTheDocument() // Session ID (last 8 chars)
  })

  it('should display suggestions when available', async () => {
    const user = userEvent.setup()
    mockErrorTracker.getErrorSummary.mockReturnValue({
      totalErrors: 1,
      networkErrorsCount: 1,
      errorsByType: {},
      sessionId: 'test-session',
      recent405Errors: [{
        id: 'net-1',
        timestamp: new Date().toISOString(),
        method: 'POST',
        url: '/api/auth/login',
        status: 405,
        statusText: 'Method Not Allowed',
        responseTime: 100
      }],
      suggestions: [
        '🔧 405 Errors detected: API endpoints were removed for clean deployment.',
        '💡 Consider implementing mock data or re-adding needed API routes.'
      ]
    })

    render(<ErrorDashboard />)
    await user.click(screen.getByTitle('Open Error Dashboard (Ctrl+Shift+E)'))
    
    expect(screen.getByText('💡 Suggestions:')).toBeInTheDocument()
    expect(screen.getByText(/405 Errors detected/)).toBeInTheDocument()
    expect(screen.getByText(/Consider implementing mock data/)).toBeInTheDocument()
  })

  it('should display recent 405 errors', async () => {
    const user = userEvent.setup()
    const recentError = {
      id: 'net-405-1',
      timestamp: new Date().toISOString(),
      method: 'POST',
      url: '/api/auth/login',
      status: 405,
      statusText: 'Method Not Allowed',
      responseTime: 150
    }
    
    mockErrorTracker.getErrorSummary.mockReturnValue({
      totalErrors: 0,
      networkErrorsCount: 1,
      errorsByType: {},
      sessionId: 'test-session',
      recent405Errors: [recentError],
      suggestions: []
    })

    render(<ErrorDashboard />)
    await user.click(screen.getByTitle('Open Error Dashboard (Ctrl+Shift+E)'))
    
    expect(screen.getByText('🔒 Recent 405 Errors:')).toBeInTheDocument()
    expect(screen.getByText('POST /api/auth/login')).toBeInTheDocument()
  })

  it('should clear all data when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<ErrorDashboard />)
    
    // Open dashboard
    await user.click(screen.getByTitle('Open Error Dashboard (Ctrl+Shift+E)'))
    
    // Click clear button
    const clearButton = screen.getByRole('button', { name: /clear all/i })
    await user.click(clearButton)
    
    expect(mockErrorTracker.clearAll).toHaveBeenCalled()
  })

  it('should close dashboard when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<ErrorDashboard />)
    
    // Open dashboard
    await user.click(screen.getByTitle('Open Error Dashboard (Ctrl+Shift+E)'))
    expect(screen.getByText('🚨 NestFest Error Monitoring Dashboard')).toBeInTheDocument()
    
    // Close dashboard
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(screen.queryByText('🚨 NestFest Error Monitoring Dashboard')).not.toBeInTheDocument()
    expect(screen.getByTitle('Open Error Dashboard (Ctrl+Shift+E)')).toBeInTheDocument()
  })

  it('should handle keyboard shortcut to toggle dashboard', async () => {
    render(<ErrorDashboard />)
    
    // Initially dashboard should be closed
    expect(screen.queryByText('🚨 NestFest Error Monitoring Dashboard')).not.toBeInTheDocument()
    
    // Simulate Ctrl+Shift+E
    fireEvent.keyDown(window, { key: 'E', ctrlKey: true, shiftKey: true })
    
    await waitFor(() => {
      expect(screen.getByText('🚨 NestFest Error Monitoring Dashboard')).toBeInTheDocument()
    })
    
    // Toggle again to close
    fireEvent.keyDown(window, { key: 'E', ctrlKey: true, shiftKey: true })
    
    await waitFor(() => {
      expect(screen.queryByText('🚨 NestFest Error Monitoring Dashboard')).not.toBeInTheDocument()
    })
  })

  it('should show "no errors" message when no errors exist', async () => {
    const user = userEvent.setup()
    render(<ErrorDashboard />)
    
    await user.click(screen.getByTitle('Open Error Dashboard (Ctrl+Shift+E)'))
    
    expect(screen.getByText('✅ No errors detected!')).toBeInTheDocument()
    expect(screen.getByText('✅ No network errors detected!')).toBeInTheDocument()
  })
})