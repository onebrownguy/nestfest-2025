#!/usr/bin/env node

/**
 * NestFest Event Load Testing Suite
 * Simulates event day traffic patterns and validates platform performance
 */

const http = require('http');
const https = require('https');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');

// Load test configuration
const LOAD_TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  scenarios: {
    // Event day simulation scenarios
    registration: {
      name: 'User Registration Burst',
      concurrent: 20,
      duration: 30000, // 30 seconds
      endpoint: '/api/auth/register',
      method: 'POST',
      dataGenerator: () => ({
        email: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@test.com`,
        password: 'TestPass123!',
        name: `Test User ${Math.random().toString(36).substr(2, 5)}`,
        role: 'student'
      })
    },
    voting: {
      name: 'Peak Voting Period',
      concurrent: 50,
      duration: 60000, // 1 minute
      endpoint: '/api/votes',
      method: 'POST',
      dataGenerator: () => ({
        submission_id: `sub-${Math.floor(Math.random() * 100)}`,
        vote_type: 'quadratic',
        points: Math.floor(Math.random() * 10) + 1
      })
    },
    submissions: {
      name: 'Submission Deadline Rush',
      concurrent: 15,
      duration: 45000, // 45 seconds  
      endpoint: '/api/submissions',
      method: 'GET'
    },
    liveUpdates: {
      name: 'Live Dashboard Updates',
      concurrent: 100,
      duration: 30000, // 30 seconds
      endpoint: '/api/competitions/1',
      method: 'GET'
    }
  },
  performance: {
    maxResponseTime: 5000, // 5 seconds
    errorRate: 0.05, // 5% max error rate
    throughput: 100 // requests per second target
  }
};

// Results tracking
const testResults = {
  scenarios: {},
  summary: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Infinity,
    errorRate: 0,
    throughput: 0
  },
  issues: []
};

/**
 * HTTP Client for Load Testing
 */
class LoadTestClient {
  static async makeRequest(method, endpoint, data = null, headers = {}) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const url = new URL(endpoint, LOAD_TEST_CONFIG.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NestFest-LoadTest/1.0',
          ...headers
        },
        timeout: 10000
      };
      
      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 400,
            status: res.statusCode,
            responseTime,
            data: body
          });
        });
      });
      
      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        resolve({
          success: false,
          status: 0,
          responseTime,
          error: error.message
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        resolve({
          success: false,
          status: 0,
          responseTime,
          error: 'Request timeout'
        });
      });
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }
}

/**
 * Load Test Worker
 */
async function runLoadTestWorker() {
  const { scenario, duration } = workerData;
  const results = [];
  const startTime = Date.now();
  
  while (Date.now() - startTime < duration) {
    try {
      const data = scenario.dataGenerator ? scenario.dataGenerator() : null;
      const result = await LoadTestClient.makeRequest(scenario.method, scenario.endpoint, data);
      
      results.push({
        timestamp: Date.now(),
        success: result.success,
        status: result.status,
        responseTime: result.responseTime,
        error: result.error
      });
      
      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      results.push({
        timestamp: Date.now(),
        success: false,
        status: 0,
        responseTime: 0,
        error: error.message
      });
    }
  }
  
  parentPort.postMessage({ workerId: workerData.workerId, results });
}

/**
 * Load Test Orchestrator
 */
class LoadTestRunner {
  static async runScenario(scenarioName, scenario) {
    console.log(`\n🚀 Running ${scenario.name}`);
    console.log(`   Concurrent Users: ${scenario.concurrent}`);
    console.log(`   Duration: ${scenario.duration / 1000}s`);
    console.log(`   Endpoint: ${scenario.method} ${scenario.endpoint}`);
    
    const workers = [];
    const results = [];
    
    // Create worker threads for concurrent load
    for (let i = 0; i < scenario.concurrent; i++) {
      const worker = new Worker(__filename, {
        workerData: { scenario, duration: scenario.duration, workerId: i }
      });
      
      workers.push(new Promise((resolve) => {
        worker.on('message', (data) => {
          results.push(...data.results);
          resolve();
        });
        
        worker.on('error', (error) => {
          console.error(`Worker ${i} error:`, error);
          resolve();
        });
      }));
    }
    
    // Wait for all workers to complete
    await Promise.all(workers);
    
    // Analyze results
    return this.analyzeResults(scenarioName, results, scenario);
  }
  
  static analyzeResults(scenarioName, results, scenario) {
    const totalRequests = results.length;
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const responseTimes = results.map(r => r.responseTime);
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    const errorRate = failedRequests / totalRequests;
    const throughput = totalRequests / (scenario.duration / 1000);
    
    const scenarioResult = {
      scenario: scenarioName,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime),
      maxResponseTime,
      minResponseTime,
      errorRate: (errorRate * 100).toFixed(2),
      throughput: throughput.toFixed(2)
    };
    
    // Performance evaluation
    const issues = [];
    if (averageResponseTime > LOAD_TEST_CONFIG.performance.maxResponseTime) {
      issues.push(`High average response time: ${averageResponseTime}ms`);
    }
    if (errorRate > LOAD_TEST_CONFIG.performance.errorRate) {
      issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
    }
    if (throughput < LOAD_TEST_CONFIG.performance.throughput / 2) {
      issues.push(`Low throughput: ${throughput} req/s`);
    }
    
    scenarioResult.issues = issues;
    scenarioResult.passed = issues.length === 0;
    
    // Log results
    console.log(`   ✅ Requests: ${successfulRequests}/${totalRequests}`);
    console.log(`   ⏱️  Avg Response: ${scenarioResult.averageResponseTime}ms`);
    console.log(`   📈 Throughput: ${scenarioResult.throughput} req/s`);
    console.log(`   ❌ Error Rate: ${scenarioResult.errorRate}%`);
    
    if (issues.length > 0) {
      console.log(`   ⚠️  Issues: ${issues.join(', ')}`);
    }
    
    testResults.scenarios[scenarioName] = scenarioResult;
    
    return scenarioResult;
  }
  
  static async runAllScenarios() {
    console.log('\n🎯 NestFest Event Day Load Testing');
    console.log('===================================');
    console.log('Simulating realistic event traffic patterns...\n');
    
    let allPassed = true;
    
    for (const [name, scenario] of Object.entries(LOAD_TEST_CONFIG.scenarios)) {
      try {
        const result = await this.runScenario(name, scenario);
        if (!result.passed) allPassed = false;
        
        // Brief pause between scenarios
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Scenario ${name} failed:`, error);
        allPassed = false;
      }
    }
    
    this.generateLoadTestReport(allPassed);
  }
  
  static generateLoadTestReport(allPassed) {
    console.log('\n📊 Load Test Results Summary');
    console.log('=============================\n');
    
    // Calculate overall metrics
    let totalRequests = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    let totalResponseTime = 0;
    let maxResponseTime = 0;
    let minResponseTime = Infinity;
    
    for (const result of Object.values(testResults.scenarios)) {
      totalRequests += result.totalRequests;
      totalSuccessful += result.successfulRequests;
      totalFailed += result.failedRequests;
      totalResponseTime += result.averageResponseTime * result.totalRequests;
      maxResponseTime = Math.max(maxResponseTime, result.maxResponseTime);
      minResponseTime = Math.min(minResponseTime, result.minResponseTime);
    }
    
    const overallAvgResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
    const overallErrorRate = totalRequests > 0 ? (totalFailed / totalRequests) * 100 : 0;
    
    console.log(`📈 Total Requests: ${totalRequests}`);
    console.log(`✅ Successful: ${totalSuccessful} (${((totalSuccessful/totalRequests)*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${totalFailed} (${overallErrorRate.toFixed(1)}%)`);
    console.log(`⏱️  Average Response Time: ${overallAvgResponseTime.toFixed(0)}ms`);
    console.log(`🔥 Max Response Time: ${maxResponseTime}ms`);
    console.log(`⚡ Min Response Time: ${minResponseTime}ms\n`);
    
    // Performance verdict
    let performanceLevel = 'POOR PERFORMANCE ❌';
    let color = '\x1b[31m';
    
    if (allPassed && overallErrorRate < 2 && overallAvgResponseTime < 2000) {
      performanceLevel = 'EXCELLENT PERFORMANCE ✅';
      color = '\x1b[32m';
    } else if (overallErrorRate < 5 && overallAvgResponseTime < 3000) {
      performanceLevel = 'GOOD PERFORMANCE ⚡';
      color = '\x1b[33m';
    } else if (overallErrorRate < 10) {
      performanceLevel = 'ACCEPTABLE PERFORMANCE ⚠️';
      color = '\x1b[33m';
    }
    
    console.log(`${color}🎯 Event Day Readiness: ${performanceLevel}${'\x1b[0m'}\n`);
    
    // Scenario breakdown
    console.log('📋 Scenario Performance Breakdown:');
    console.log('===================================');
    for (const [name, result] of Object.entries(testResults.scenarios)) {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.scenario}: ${result.throughput} req/s, ${result.averageResponseTime}ms avg`);
      
      if (result.issues.length > 0) {
        console.log(`     Issues: ${result.issues.join(', ')}`);
      }
    }
    
    // Recommendations
    console.log('\n💡 Performance Recommendations:');
    console.log('================================');
    
    if (!allPassed || overallErrorRate > 2) {
      console.log('1. 🔧 Optimize database queries and add proper indexing');
      console.log('2. 📈 Implement caching for frequently accessed data');
      console.log('3. ⚡ Add CDN for static assets');
      console.log('4. 🔄 Implement connection pooling');
      console.log('5. 📊 Add application performance monitoring');
    } else {
      console.log('1. ✅ Performance is ready for event day');
      console.log('2. 📊 Monitor performance during the event');
      console.log('3. 🚨 Set up alerting for performance degradation');
    }
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRequests,
        successfulRequests: totalSuccessful,
        failedRequests: totalFailed,
        overallErrorRate: overallErrorRate.toFixed(2),
        averageResponseTime: overallAvgResponseTime.toFixed(0),
        maxResponseTime,
        minResponseTime,
        performanceLevel: performanceLevel.replace(/[^\w\s]/gi, ''),
        allScenariosPassed: allPassed
      },
      scenarios: testResults.scenarios
    };
    
    const reportPath = path.join(__dirname, 'load-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📋 Detailed load test report saved to: ${reportPath}`);
  }
}

// Main execution
if (require.main === module) {
  if (isMainThread) {
    LoadTestRunner.runAllScenarios()
      .then(() => {
        const allPassed = Object.values(testResults.scenarios).every(r => r.passed);
        process.exit(allPassed ? 0 : 1);
      })
      .catch(error => {
        console.error('❌ Load test suite failed:', error);
        process.exit(1);
      });
  } else {
    runLoadTestWorker();
  }
}

module.exports = { LoadTestRunner, LoadTestClient };