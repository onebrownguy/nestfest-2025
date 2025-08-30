#!/usr/bin/env node

/**
 * Automated Error Monitoring Test Suite
 * Comprehensive testing for error handling and monitoring systems
 */

import { runStandardErrorTests, ErrorTestRunner, ErrorTestScenario } from '../lib/testing/error-test-utils'
import { errorMonitor, captureError } from '../lib/monitoring/error-logger'

// Custom test scenarios for NestFest specific errors
const nestfestErrorScenarios: ErrorTestScenario[] = [
  {
    name: 'Next.js App Router Error',
    description: 'Test error handling in Next.js 15 App Router',
    setup: () => {},
    execute: () => {
      const error = new Error('Page not found in app directory')
      error.name = 'NotFoundError'
      return error
    },
    expectedSeverity: 'medium',
    expectedTags: ['nextjs', 'app-router']
  },

  {
    name: 'React 19 Hydration Error',
    description: 'Test React hydration mismatch handling',
    setup: () => {},
    execute: () => {
      const error = new Error('Text content does not match server-rendered HTML')
      error.name = 'HydrationError'
      return error
    },
    expectedSeverity: 'high',
    expectedTags: ['react', 'hydration']
  },

  {
    name: 'API Route Error',
    description: 'Test API route error handling',
    setup: () => {},
    execute: () => {
      const error = new Error('Internal Server Error')
      error.name = 'APIError'
      return error
    },
    expectedSeverity: 'high',
    expectedTags: ['api', 'server']
  },

  {
    name: 'Client-Side Navigation Error',
    description: 'Test client-side routing errors',
    setup: () => {},
    execute: () => {
      const error = new Error('Navigation cancelled')
      error.name = 'NavigationError'
      return error
    },
    expectedSeverity: 'low',
    expectedTags: ['navigation', 'client']
  }
]

/**
 * Build Error Detection Tests
 * Tests that catch configuration and build errors
 */
const buildErrorScenarios: ErrorTestScenario[] = [
  {
    name: 'TypeScript Configuration Error',
    description: 'Simulate TypeScript config issues',
    setup: () => {},
    execute: () => {
      const error = new Error('Cannot find module or its type declarations')
      error.name = 'TypeScriptError'
      return error
    },
    expectedSeverity: 'critical',
    expectedTags: ['build', 'typescript']
  },

  {
    name: 'Import Resolution Error',
    description: 'Test import path resolution failures',
    setup: () => {},
    execute: () => {
      const error = new Error('Module not found: Cannot resolve')
      error.name = 'ModuleNotFoundError'
      return error
    },
    expectedSeverity: 'critical',
    expectedTags: ['build', 'import']
  },

  {
    name: 'Environment Variable Error',
    description: 'Test missing environment variables',
    setup: () => {},
    execute: () => {
      const error = new Error('Required environment variable is missing')
      error.name = 'EnvironmentError'
      return error
    },
    expectedSeverity: 'critical',
    expectedTags: ['config', 'environment']
  }
]

/**
 * Main test execution function
 */
async function runErrorMonitoringTests() {
  console.log('🚀 Starting Error Monitoring Test Suite\n')

  try {
    const runner = new ErrorTestRunner()

    // Test 1: Standard Error Scenarios
    console.log('📋 Running standard error tests...')
    const standardReports = await runner.runScenarios(nestfestErrorScenarios)
    
    // Test 2: Build Error Detection
    console.log('\n🏗️ Running build error detection tests...')
    const buildReports = await runner.runScenarios(buildErrorScenarios)

    // Test 3: Error Pattern Detection
    console.log('\n🔍 Testing error pattern detection...')
    await testErrorPatternDetection()

    // Test 4: Error Severity Classification
    console.log('\n📊 Testing error severity classification...')
    await testSeverityClassification()

    // Generate comprehensive report
    const summary = runner.getSummary()
    const report = runner.generateReport()
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 FINAL TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Total Tests Passed: ${summary.passed}`)
    console.log(`❌ Total Tests Failed: ${summary.failed}`)
    console.log(`📈 Overall Pass Rate: ${summary.passRate.toFixed(1)}%`)
    console.log('='.repeat(60))

    // Save report to file
    if (typeof require !== 'undefined') {
      const fs = require('fs')
      const path = require('path')
      const reportPath = path.join(process.cwd(), 'error-monitoring-test-report.md')
      fs.writeFileSync(reportPath, report)
      console.log(`📝 Detailed report saved to: ${reportPath}`)
    }

    // Return success/failure status
    return summary.failed === 0

  } catch (error) {
    console.error('❌ Test suite execution failed:', error)
    return false
  }
}

/**
 * Test error pattern detection functionality
 */
async function testErrorPatternDetection() {
  console.log('   🔄 Testing duplicate error detection...')
  
  // Create the same error multiple times
  const testError = new Error('Recurring test error')
  
  // Capture the error multiple times
  for (let i = 0; i < 3; i++) {
    captureError(testError, { 
      component: 'PatternTest',
      attempt: i + 1
    }, ['pattern-test'])
    
    // Wait a bit between captures
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  const stats = errorMonitor.getErrorStats()
  const patternDetected = stats.patterns > 0
  
  console.log(`   ${patternDetected ? '✅' : '❌'} Pattern detection: ${patternDetected ? 'Working' : 'Failed'}`)
  
  if (stats.topPatterns.length > 0) {
    console.log(`   📊 Top pattern: "${stats.topPatterns[0].message}" (${stats.topPatterns[0].count}x)`)
  }
}

/**
 * Test error severity classification
 */
async function testSeverityClassification() {
  const testCases = [
    { error: new Error('ChunkLoadError: Loading chunk failed'), expectedSeverity: 'critical' },
    { error: new TypeError('Cannot read properties of undefined'), expectedSeverity: 'high' },
    { error: new Error('Network request failed'), expectedSeverity: 'medium' },
    { error: new Error('Minor validation error'), expectedSeverity: 'low' }
  ]

  let correct = 0
  
  for (const testCase of testCases) {
    testCase.error.name = testCase.error.constructor.name
    const errorId = captureError(testCase.error, {}, ['severity-test'])
    
    // Give time for processing
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const recentErrors = errorMonitor.getRecentErrors(1)
    const capturedError = recentErrors.find(e => e.id === errorId)
    
    if (capturedError && capturedError.severity === testCase.expectedSeverity) {
      correct++
      console.log(`   ✅ ${testCase.error.name}: ${testCase.expectedSeverity}`)
    } else {
      console.log(`   ❌ ${testCase.error.name}: expected ${testCase.expectedSeverity}, got ${capturedError?.severity || 'unknown'}`)
    }
  }

  console.log(`   📊 Severity classification accuracy: ${correct}/${testCases.length} (${(correct/testCases.length*100).toFixed(1)}%)`)
}

/**
 * Continuous monitoring test
 */
export async function runContinuousMonitoring() {
  console.log('🔄 Starting continuous error monitoring...')
  
  let errorCount = 0
  const startTime = Date.now()
  
  // Monitor for 5 minutes or until stopped
  const monitorInterval = setInterval(() => {
    const stats = errorMonitor.getErrorStats()
    const currentErrors = stats.lastHour
    
    if (currentErrors > errorCount) {
      console.log(`⚠️ New error detected! Total: ${currentErrors}`)
      errorCount = currentErrors
      
      // Check for patterns
      if (stats.patterns > 0) {
        console.log(`🔍 Error patterns detected: ${stats.patterns}`)
        stats.topPatterns.slice(0, 3).forEach(pattern => {
          console.log(`   - "${pattern.message}" (${pattern.count}x)`)
        })
      }
    }
    
    // Stop after 5 minutes
    if (Date.now() - startTime > 300000) {
      clearInterval(monitorInterval)
      console.log('✅ Continuous monitoring completed')
    }
  }, 10000) // Check every 10 seconds

  return () => clearInterval(monitorInterval)
}

// Run tests if this script is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runErrorMonitoringTests().then(success => {
    process.exit(success ? 0 : 1)
  })
}

export { runErrorMonitoringTests }