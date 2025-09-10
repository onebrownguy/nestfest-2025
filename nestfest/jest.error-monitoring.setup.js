/**
 * Jest Setup for Error Monitoring Tests
 * Configure testing environment for error handling scenarios
 */

import '@testing-library/jest-dom'

// Mock console methods to capture error logs during tests
const originalConsole = { ...console }
global.mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}

// Global test setup
beforeAll(() => {
  // Mock localStorage for error persistence testing
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }
  global.localStorage = localStorageMock

  // Mock performance API for memory testing
  global.performance = {
    ...global.performance,
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000000
    }
  }

  // Mock window object for browser-specific error testing
  global.window = {
    ...global.window,
    location: {
      href: 'http://localhost:3000/test',
      pathname: '/test',
      search: '',
      hash: ''
    }
  }

  // Mock navigator for user agent testing
  global.navigator = {
    ...global.navigator,
    userAgent: 'Jest Test Runner'
  }
})

beforeEach(() => {
  // Reset console mocks before each test
  Object.keys(mockConsole).forEach(method => {
    mockConsole[method].mockClear()
  })

  // Clear localStorage mocks
  if (localStorage.getItem && typeof localStorage.getItem.mockClear === 'function') {
    localStorage.getItem.mockClear()
    localStorage.setItem.mockClear()
    localStorage.removeItem.mockClear()
    localStorage.clear.mockClear()
  }

  // Reset any global error states
  if (global.__errorMonitorState) {
    global.__errorMonitorState = null
  }
})

afterEach(() => {
  // Clean up after each test
  jest.clearAllTimers()
  jest.useRealTimers()
})

// Custom matchers for error testing
expect.extend({
  toHaveBeenCapturedWithSeverity(received, expectedSeverity) {
    const pass = received && received.severity === expectedSeverity
    
    if (pass) {
      return {
        message: () => 
          `Expected error to not have severity ${expectedSeverity}, but it did`,
        pass: true,
      }
    } else {
      return {
        message: () => 
          `Expected error to have severity ${expectedSeverity}, but got ${received?.severity || 'undefined'}`,
        pass: false,
      }
    }
  },

  toHaveErrorPattern(received, expectedPattern) {
    const pass = received && received.includes && received.includes(expectedPattern)
    
    if (pass) {
      return {
        message: () => 
          `Expected error message to not contain pattern "${expectedPattern}", but it did`,
        pass: true,
      }
    } else {
      return {
        message: () => 
          `Expected error message to contain pattern "${expectedPattern}", but got "${received}"`,
        pass: false,
      }
    }
  },

  toHaveBeenLoggedWithLevel(received, expectedLevel) {
    let loggedWithLevel = false
    
    switch (expectedLevel) {
      case 'error':
        loggedWithLevel = mockConsole.error.mock.calls.length > 0
        break
      case 'warn':
        loggedWithLevel = mockConsole.warn.mock.calls.length > 0
        break
      case 'info':
        loggedWithLevel = mockConsole.info.mock.calls.length > 0
        break
      case 'log':
        loggedWithLevel = mockConsole.log.mock.calls.length > 0
        break
    }
    
    if (loggedWithLevel) {
      return {
        message: () => 
          `Expected nothing to be logged at level ${expectedLevel}, but something was`,
        pass: true,
      }
    } else {
      return {
        message: () => 
          `Expected something to be logged at level ${expectedLevel}, but nothing was`,
        pass: false,
      }
    }
  }
})

// Global error boundary testing utilities
global.renderWithErrorBoundary = (component, errorBoundaryProps = {}) => {
  const { render } = require('@testing-library/react')
  const { GlobalErrorBoundary } = require('../src/components/monitoring/GlobalErrorBoundary')
  
  return render(
    React.createElement(GlobalErrorBoundary, errorBoundaryProps, component)
  )
}

// Utility to trigger errors for testing
global.triggerError = (errorType = 'generic', message = 'Test error') => {
  switch (errorType) {
    case 'TypeError':
      throw new TypeError(message)
    case 'ReferenceError':
      throw new ReferenceError(message)
    case 'ChunkLoadError':
      const chunkError = new Error(message)
      chunkError.name = 'ChunkLoadError'
      throw chunkError
    case 'NetworkError':
      throw new Error('Failed to fetch')
    default:
      throw new Error(message)
  }
}

// Utility to wait for async error processing
global.waitForErrorProcessing = (timeout = 1000) => {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

// Mock timers for pattern detection testing
global.setupTimers = () => {
  jest.useFakeTimers()
}

global.advanceTimers = (ms) => {
  jest.advanceTimersByTime(ms)
}

// Console utilities for test debugging
global.suppressConsole = () => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'info').mockImplementation(() => {})
}

global.restoreConsole = () => {
  console.log.mockRestore?.()
  console.warn.mockRestore?.()
  console.error.mockRestore?.()
  console.info.mockRestore?.()
}

// Environment detection for conditional tests
global.isTestEnvironment = () => process.env.NODE_ENV === 'test'
global.isDevelopmentTest = () => process.env.NODE_ENV === 'development'

console.info('✅ Error monitoring test environment configured')