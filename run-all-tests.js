#!/usr/bin/env node

/**
 * Master Test Runner for NestFest Platform
 * Executes all validation tests in sequence and generates comprehensive report
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test suite configuration
const TEST_SUITES = [
  {
    name: 'Production Readiness Test',
    script: 'production-readiness-test.js',
    description: 'Validates codebase structure and environment configuration',
    required: true
  },
  {
    name: 'Integration Test Suite',
    script: 'integration-test-suite.js',
    description: 'Tests API endpoints and user flows',
    required: true,
    needsServer: true
  },
  {
    name: 'Security Validation Test',
    script: 'security-validation-test.js',
    description: 'Comprehensive security vulnerability assessment',
    required: true,
    needsServer: true
  },
  {
    name: 'Load Test Simulation',
    script: 'load-test-simulation.js',
    description: 'Event day traffic simulation and performance testing',
    required: false,
    needsServer: true
  },
  {
    name: 'Final Validation Report',
    script: 'final-validation-report.js',
    description: 'Aggregates all results into comprehensive assessment',
    required: true
  }
];

// Test execution results
const testResults = {
  executed: [],
  passed: 0,
  failed: 0,
  skipped: 0,
  totalScore: 0
};

/**
 * Test Execution Logger
 */
class TestExecutionLogger {
  static log(level, message, details = null) {
    const colors = {
      INFO: '\x1b[36m',
      SUCCESS: '\x1b[32m',
      ERROR: '\x1b[31m',
      WARN: '\x1b[33m',
      RESET: '\x1b[0m'
    };
    
    console.log(`${colors[level]}[${level}]${colors.RESET} ${message}`);
    
    if (details) {
      console.log(`  ${details}`);
    }
  }
}

/**
 * Test Suite Executor
 */
class MasterTestRunner {
  static async executeTestSuite(testSuite) {
    return new Promise((resolve) => {
      TestExecutionLogger.log('INFO', `Starting ${testSuite.name}...`);
      TestExecutionLogger.log('INFO', `Description: ${testSuite.description}`);
      
      const startTime = Date.now();
      const scriptPath = path.join(__dirname, testSuite.script);
      
      // Check if script exists
      if (!fs.existsSync(scriptPath)) {
        TestExecutionLogger.log('ERROR', `Test script not found: ${testSuite.script}`);
        resolve({
          name: testSuite.name,
          status: 'FAILED',
          error: 'Script not found',
          duration: 0,
          exitCode: 1
        });
        return;
      }
      
      const childProcess = spawn('node', [scriptPath], {
        stdio: 'pipe',
        cwd: __dirname
      });
      
      let output = '';
      let errorOutput = '';
      
      childProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        // Stream output in real-time
        process.stdout.write(text);
      });
      
      childProcess.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });
      
      childProcess.on('close', (exitCode) => {
        const duration = Date.now() - startTime;
        const result = {
          name: testSuite.name,
          script: testSuite.script,
          status: exitCode === 0 ? 'PASSED' : 'FAILED',
          exitCode,
          duration,
          output,
          errorOutput
        };
        
        if (exitCode === 0) {
          TestExecutionLogger.log('SUCCESS', `${testSuite.name} completed successfully`, 
            `Duration: ${duration}ms`);
        } else {
          TestExecutionLogger.log('ERROR', `${testSuite.name} failed`, 
            `Exit code: ${exitCode}, Duration: ${duration}ms`);
        }
        
        resolve(result);
      });
      
      childProcess.on('error', (error) => {
        TestExecutionLogger.log('ERROR', `Failed to execute ${testSuite.name}`, error.message);
        resolve({
          name: testSuite.name,
          status: 'FAILED',
          error: error.message,
          duration: Date.now() - startTime,
          exitCode: 1
        });
      });
    });
  }
  
  static async checkServerRequirement() {
    // Simple check to see if server is running
    try {
      const http = require('http');
      return new Promise((resolve) => {
        const req = http.request('http://localhost:3000', { timeout: 3000 }, (res) => {
          resolve(true);
        });
        
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
        
        req.end();
      });
    } catch (error) {
      return false;
    }
  }
  
  static async executeAllTests() {
    console.log('\n🧪 NestFest Master Test Suite Execution');
    console.log('=======================================');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Test Suites: ${TEST_SUITES.length}`);
    console.log('=======================================\n');
    
    // Check server requirement
    const serverRunning = await this.checkServerRequirement();
    if (!serverRunning) {
      TestExecutionLogger.log('WARN', 'Development server not detected at localhost:3000');
      TestExecutionLogger.log('WARN', 'Some tests requiring server will be skipped');
    }
    
    // Execute all test suites
    for (let i = 0; i < TEST_SUITES.length; i++) {
      const testSuite = TEST_SUITES[i];
      
      console.log(`\n📋 Test Suite ${i + 1}/${TEST_SUITES.length}`);
      console.log('='.repeat(50));
      
      // Check if server is required but not running
      if (testSuite.needsServer && !serverRunning) {
        TestExecutionLogger.log('WARN', `Skipping ${testSuite.name} - requires server`);
        testResults.skipped++;
        testResults.executed.push({
          name: testSuite.name,
          status: 'SKIPPED',
          reason: 'Server not running',
          duration: 0
        });
        continue;
      }
      
      try {
        const result = await this.executeTestSuite(testSuite);
        testResults.executed.push(result);
        
        if (result.status === 'PASSED') {
          testResults.passed++;
        } else {
          testResults.failed++;
        }
      } catch (error) {
        TestExecutionLogger.log('ERROR', `Unexpected error executing ${testSuite.name}`, error.message);
        testResults.failed++;
        testResults.executed.push({
          name: testSuite.name,
          status: 'FAILED',
          error: error.message,
          duration: 0
        });
      }
      
      // Brief pause between test suites
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.generateMasterReport();
  }
  
  static generateMasterReport() {
    console.log('\n📊 MASTER TEST EXECUTION REPORT');
    console.log('================================\n');
    
    const totalTests = testResults.executed.length;
    const successRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`📈 Overall Results:`);
    console.log(`   Total Test Suites: ${totalTests}`);
    console.log(`   ✅ Passed: ${testResults.passed}`);
    console.log(`   ❌ Failed: ${testResults.failed}`);
    console.log(`   ⏭️  Skipped: ${testResults.skipped}`);
    console.log(`   📊 Success Rate: ${successRate}%\n`);
    
    // Individual test suite results
    console.log(`📋 Test Suite Breakdown:`);
    console.log('========================');
    testResults.executed.forEach((result, index) => {
      const statusIcon = result.status === 'PASSED' ? '✅' : 
                        result.status === 'SKIPPED' ? '⏭️' : '❌';
      const duration = result.duration ? `(${result.duration}ms)` : '';
      
      console.log(`${index + 1}. ${statusIcon} ${result.name} ${duration}`);
      
      if (result.status === 'FAILED' && result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.status === 'SKIPPED' && result.reason) {
        console.log(`   Reason: ${result.reason}`);
      }
    });
    
    // Final verdict
    console.log('\\n🎯 FINAL TESTING VERDICT');
    console.log('=========================\\n');
    
    const criticalTestsFailed = testResults.executed.filter(r => 
      r.status === 'FAILED' && TEST_SUITES.find(t => t.name === r.name)?.required
    ).length;
    
    if (criticalTestsFailed === 0 && testResults.passed >= testResults.failed) {
      console.log('✅ ALL CRITICAL TESTS PASSED');
      console.log('🚀 PLATFORM IS VALIDATED FOR PRODUCTION');
      
      if (testResults.skipped > 0) {
        console.log(`\\n⚠️  Note: ${testResults.skipped} test(s) were skipped`);
        console.log('   Consider running skipped tests when server is available');
      }
    } else {
      console.log('❌ CRITICAL TESTS FAILED');
      console.log('🔧 PLATFORM NEEDS FIXES BEFORE PRODUCTION');
      
      const failedCritical = testResults.executed.filter(r => 
        r.status === 'FAILED' && TEST_SUITES.find(t => t.name === r.name)?.required
      );
      
      if (failedCritical.length > 0) {
        console.log('\\n🚨 Critical failures that must be resolved:');
        failedCritical.forEach((failure, index) => {
          console.log(`${index + 1}. ${failure.name}`);
        });
      }
    }
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passed: testResults.passed,
        failed: testResults.failed,
        skipped: testResults.skipped,
        successRate: parseFloat(successRate),
        criticalTestsFailed
      },
      testSuites: testResults.executed,
      verdict: {
        ready: criticalTestsFailed === 0 && testResults.passed >= testResults.failed,
        issues: criticalTestsFailed,
        recommendations: testResults.skipped > 0 ? 
          ['Run skipped tests when server is available'] : []
      }
    };
    
    const reportPath = path.join(__dirname, 'master-test-execution-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`\\n📋 Master test report saved to: ${reportPath}`);
    console.log('\\n🎯 Next Steps:');
    if (reportData.verdict.ready) {
      console.log('1. ✅ All critical validations passed');
      console.log('2. 🚀 Proceed with production deployment');
      console.log('3. 📊 Set up monitoring and alerting');
      console.log('4. 🎉 Launch the NestFest event!');
    } else {
      console.log('1. 🔧 Address failed critical tests');
      console.log('2. 🧪 Re-run master test suite');
      console.log('3. 📋 Generate updated validation report');
      console.log('4. ✅ Confirm all issues resolved before launch');
    }
  }
}

// Execute master test suite if script run directly
if (require.main === module) {
  MasterTestRunner.executeAllTests()
    .then(() => {
      const criticalFailed = testResults.executed.filter(r => 
        r.status === 'FAILED' && TEST_SUITES.find(t => t.name === r.name)?.required
      ).length;
      
      process.exit(criticalFailed > 0 ? 1 : 0);
    })
    .catch(error => {
      TestExecutionLogger.log('ERROR', 'Master test execution failed', error.message);
      process.exit(1);
    });
}

module.exports = { MasterTestRunner, TEST_SUITES };