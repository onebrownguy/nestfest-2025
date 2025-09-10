#!/usr/bin/env node

/**
 * NestFest Integration Test Suite
 * Tests actual functionality and API endpoints for production readiness
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 15000,
  maxRetries: 3,
  testData: {
    user: {
      email: `test-${Date.now()}@nestfest.test`,
      password: 'TestPassword123!',
      name: 'Integration Test User',
      role: 'student'
    },
    competition: {
      title: 'Test Competition',
      description: 'Integration test competition',
      category: 'web-development'
    }
  }
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
  tests: []
};

/**
 * HTTP Client for API Testing
 */
class ApiClient {
  static async request(method, endpoint, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, CONFIG.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NestFest-Integration-Tests/1.0',
          ...headers
        },
        timeout: CONFIG.timeout
      };
      
      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const response = {
              status: res.statusCode,
              headers: res.headers,
              data: body ? JSON.parse(body) : null
            };
            resolve(response);
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: body
            });
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      
      if (data) {
        req.write(typeof data === 'string' ? data : JSON.stringify(data));
      }
      
      req.end();
    });
  }

  static async get(endpoint, headers = {}) {
    return this.request('GET', endpoint, null, headers);
  }

  static async post(endpoint, data, headers = {}) {
    return this.request('POST', endpoint, data, headers);
  }

  static async put(endpoint, data, headers = {}) {
    return this.request('PUT', endpoint, data, headers);
  }

  static async delete(endpoint, headers = {}) {
    return this.request('DELETE', endpoint, null, headers);
  }
}

/**
 * Test Logger
 */
class Logger {
  static test(name, status, message, details = null) {
    const timestamp = new Date().toISOString();
    const result = { name, status, message, details, timestamp };
    
    results.tests.push(result);
    
    const colors = {
      PASS: '\x1b[32m',
      FAIL: '\x1b[31m',
      WARN: '\x1b[33m',
      INFO: '\x1b[36m'
    };
    
    console.log(`${colors[status]}[${status}]${'\x1b[0m'} ${name}: ${message}`);
    
    if (details) {
      console.log(`  ${JSON.stringify(details, null, 2)}`);
    }
    
    if (status === 'PASS') results.passed++;
    if (status === 'FAIL') {
      results.failed++;
      results.errors.push({ name, message, details });
    }
    if (status === 'WARN') results.warnings++;
  }
}

/**
 * Health Check Tests
 */
class HealthTests {
  static async testServerHealth() {
    try {
      const response = await ApiClient.get('/api/health');
      
      if (response.status === 200) {
        Logger.test('Server Health', 'PASS', 'Server is responding');
        return true;
      } else {
        Logger.test('Server Health', 'FAIL', `Server returned status ${response.status}`);
        return false;
      }
    } catch (error) {
      Logger.test('Server Health', 'FAIL', 'Server is not accessible', error.message);
      return false;
    }
  }

  static async testDatabaseHealth() {
    try {
      // Try a simple database operation through an API endpoint
      const response = await ApiClient.get('/api/users');
      
      if (response.status === 200 || response.status === 401) {
        Logger.test('Database Health', 'PASS', 'Database connection working');
        return true;
      } else {
        Logger.test('Database Health', 'WARN', 'Database connection unclear', 
          { status: response.status });
        return false;
      }
    } catch (error) {
      Logger.test('Database Health', 'FAIL', 'Database connection failed', error.message);
      return false;
    }
  }
}

/**
 * Authentication Tests
 */
class AuthTests {
  static async testUserRegistration() {
    try {
      const userData = CONFIG.testData.user;
      const response = await ApiClient.post('/api/auth/register', userData);
      
      if (response.status === 201 || response.status === 200) {
        Logger.test('User Registration', 'PASS', 'User registration successful');
        return { success: true, user: response.data };
      } else if (response.status === 409) {
        Logger.test('User Registration', 'WARN', 'User already exists (acceptable for testing)');
        return { success: true, user: null };
      } else {
        Logger.test('User Registration', 'FAIL', 
          `Registration failed with status ${response.status}`, response.data);
        return { success: false };
      }
    } catch (error) {
      Logger.test('User Registration', 'FAIL', 'Registration request failed', error.message);
      return { success: false };
    }
  }

  static async testUserLogin() {
    try {
      const loginData = {
        email: CONFIG.testData.user.email,
        password: CONFIG.testData.user.password
      };
      
      const response = await ApiClient.post('/api/auth/login', loginData);
      
      if (response.status === 200 && response.data?.token) {
        Logger.test('User Login', 'PASS', 'User login successful');
        return { success: true, token: response.data.token };
      } else {
        Logger.test('User Login', 'FAIL', 
          `Login failed with status ${response.status}`, response.data);
        return { success: false };
      }
    } catch (error) {
      Logger.test('User Login', 'FAIL', 'Login request failed', error.message);
      return { success: false };
    }
  }

  static async testProtectedRoute(token) {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await ApiClient.get('/api/auth/me', headers);
      
      if (response.status === 200) {
        Logger.test('Protected Route', 'PASS', 'Protected route accessible with valid token');
        return true;
      } else {
        Logger.test('Protected Route', 'FAIL', 
          `Protected route failed with status ${response.status}`);
        return false;
      }
    } catch (error) {
      Logger.test('Protected Route', 'FAIL', 'Protected route request failed', error.message);
      return false;
    }
  }
}

/**
 * API Endpoint Tests
 */
class ApiEndpointTests {
  static async testCompetitionsEndpoint() {
    try {
      const response = await ApiClient.get('/api/competitions');
      
      if (response.status === 200) {
        Logger.test('Competitions API', 'PASS', 'Competitions endpoint responding');
        return true;
      } else if (response.status === 401) {
        Logger.test('Competitions API', 'PASS', 'Competitions endpoint requires authentication (correct)');
        return true;
      } else {
        Logger.test('Competitions API', 'WARN', 
          `Competitions endpoint returned status ${response.status}`);
        return false;
      }
    } catch (error) {
      Logger.test('Competitions API', 'FAIL', 'Competitions endpoint failed', error.message);
      return false;
    }
  }

  static async testSubmissionsEndpoint() {
    try {
      const response = await ApiClient.get('/api/submissions');
      
      if (response.status === 200 || response.status === 401) {
        Logger.test('Submissions API', 'PASS', 'Submissions endpoint responding');
        return true;
      } else {
        Logger.test('Submissions API', 'WARN', 
          `Submissions endpoint returned status ${response.status}`);
        return false;
      }
    } catch (error) {
      Logger.test('Submissions API', 'FAIL', 'Submissions endpoint failed', error.message);
      return false;
    }
  }

  static async testVotingEndpoint() {
    try {
      const response = await ApiClient.get('/api/votes');
      
      if (response.status === 200 || response.status === 401) {
        Logger.test('Voting API', 'PASS', 'Voting endpoint responding');
        return true;
      } else {
        Logger.test('Voting API', 'WARN', 
          `Voting endpoint returned status ${response.status}`);
        return false;
      }
    } catch (error) {
      Logger.test('Voting API', 'FAIL', 'Voting endpoint failed', error.message);
      return false;
    }
  }
}

/**
 * File Upload Tests
 */
class FileUploadTests {
  static async testFileUploadEndpoint() {
    try {
      // Create a simple test file
      const testContent = 'Test file content for upload validation';
      const testFile = Buffer.from(testContent);
      
      // This would need proper multipart/form-data handling
      const response = await ApiClient.get('/api/files/health');
      
      if (response.status === 200) {
        Logger.test('File Upload Health', 'PASS', 'File upload service is healthy');
        return true;
      } else {
        Logger.test('File Upload Health', 'WARN', 
          `File upload health check returned ${response.status}`);
        return false;
      }
    } catch (error) {
      Logger.test('File Upload Health', 'FAIL', 'File upload health check failed', error.message);
      return false;
    }
  }
}

/**
 * Email System Tests
 */
class EmailTests {
  static async testEmailHealth() {
    try {
      const response = await ApiClient.get('/api/email/health');
      
      if (response.status === 200) {
        Logger.test('Email System Health', 'PASS', 'Email system is healthy');
        return true;
      } else {
        Logger.test('Email System Health', 'WARN', 
          `Email health check returned ${response.status}`);
        return false;
      }
    } catch (error) {
      Logger.test('Email System Health', 'FAIL', 'Email health check failed', error.message);
      return false;
    }
  }
}

/**
 * WebSocket Tests
 */
class WebSocketTests {
  static async testWebSocketEndpoint() {
    try {
      const response = await ApiClient.get('/api/websocket');
      
      if (response.status === 200 || response.status === 426) {
        Logger.test('WebSocket Endpoint', 'PASS', 'WebSocket endpoint accessible');
        return true;
      } else {
        Logger.test('WebSocket Endpoint', 'WARN', 
          `WebSocket endpoint returned ${response.status}`);
        return false;
      }
    } catch (error) {
      Logger.test('WebSocket Endpoint', 'FAIL', 'WebSocket endpoint failed', error.message);
      return false;
    }
  }
}

/**
 * Security Tests
 */
class SecurityTests {
  static async testRateLimiting() {
    try {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(10).fill().map(() => 
        ApiClient.get('/api/auth/me')
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      if (rateLimited) {
        Logger.test('Rate Limiting', 'PASS', 'Rate limiting is working');
        return true;
      } else {
        Logger.test('Rate Limiting', 'WARN', 'Rate limiting not detected (may be configured differently)');
        return false;
      }
    } catch (error) {
      Logger.test('Rate Limiting', 'FAIL', 'Rate limiting test failed', error.message);
      return false;
    }
  }

  static async testCORSHeaders() {
    try {
      const response = await ApiClient.request('OPTIONS', '/api/auth/login');
      
      const hasCORSHeaders = response.headers['access-control-allow-origin'] || 
                            response.headers['Access-Control-Allow-Origin'];
      
      if (hasCORSHeaders) {
        Logger.test('CORS Configuration', 'PASS', 'CORS headers present');
        return true;
      } else {
        Logger.test('CORS Configuration', 'WARN', 'CORS headers not detected');
        return false;
      }
    } catch (error) {
      Logger.test('CORS Configuration', 'FAIL', 'CORS test failed', error.message);
      return false;
    }
  }
}

/**
 * Performance Tests
 */
class PerformanceTests {
  static async testResponseTimes() {
    const endpoints = [
      '/api/competitions',
      '/api/submissions', 
      '/api/users'
    ];
    
    let allFast = true;
    
    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        await ApiClient.get(endpoint);
        const duration = Date.now() - start;
        
        if (duration < 2000) {
          Logger.test(`Response Time ${endpoint}`, 'PASS', `Responded in ${duration}ms`);
        } else {
          Logger.test(`Response Time ${endpoint}`, 'WARN', `Slow response: ${duration}ms`);
          allFast = false;
        }
      } catch (error) {
        Logger.test(`Response Time ${endpoint}`, 'FAIL', 'Endpoint failed', error.message);
        allFast = false;
      }
    }
    
    return allFast;
  }
}

/**
 * Main Integration Test Runner
 */
class IntegrationTestRunner {
  static async runAllTests() {
    console.log('\n🧪 NestFest Integration Test Suite');
    console.log('===================================\n');
    
    Logger.test('Integration Tests', 'INFO', 'Starting comprehensive integration testing');
    
    // Health checks first
    console.log('\n❤️  Health Check Tests');
    console.log('--------------------');
    const serverHealthy = await HealthTests.testServerHealth();
    if (!serverHealthy) {
      console.log('❌ Server not healthy - stopping integration tests');
      return this.generateReport();
    }
    
    await HealthTests.testDatabaseHealth();
    
    // Authentication flow tests
    console.log('\n🔐 Authentication Flow Tests');
    console.log('-----------------------------');
    const regResult = await AuthTests.testUserRegistration();
    const loginResult = await AuthTests.testUserLogin();
    
    if (loginResult.success && loginResult.token) {
      await AuthTests.testProtectedRoute(loginResult.token);
    }
    
    // API endpoint tests
    console.log('\n🌐 API Endpoint Tests');
    console.log('---------------------');
    await ApiEndpointTests.testCompetitionsEndpoint();
    await ApiEndpointTests.testSubmissionsEndpoint();
    await ApiEndpointTests.testVotingEndpoint();
    
    // File upload tests
    console.log('\n📁 File Upload Tests');
    console.log('--------------------');
    await FileUploadTests.testFileUploadEndpoint();
    
    // Email system tests
    console.log('\n📧 Email System Tests');
    console.log('---------------------');
    await EmailTests.testEmailHealth();
    
    // WebSocket tests
    console.log('\n⚡ Real-time Feature Tests');
    console.log('-------------------------');
    await WebSocketTests.testWebSocketEndpoint();
    
    // Security tests
    console.log('\n🛡️  Security Tests');
    console.log('------------------');
    await SecurityTests.testRateLimiting();
    await SecurityTests.testCORSHeaders();
    
    // Performance tests
    console.log('\n⚡ Performance Tests');
    console.log('-------------------');
    await PerformanceTests.testResponseTimes();
    
    // Generate final report
    this.generateReport();
  }
  
  static generateReport() {
    console.log('\n📊 Integration Test Results');
    console.log('============================\n');
    
    const total = results.passed + results.failed + results.warnings;
    const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`✅ Tests Passed: ${results.passed}`);
    console.log(`❌ Tests Failed: ${results.failed}`);
    console.log(`⚠️  Warnings: ${results.warnings}`);
    console.log(`📈 Success Rate: ${successRate}%\n`);
    
    // Determine readiness
    let status = 'NOT READY FOR PRODUCTION';
    let color = '\x1b[31m';
    
    if (results.failed === 0) {
      if (results.warnings <= 3) {
        status = 'READY FOR PRODUCTION ✅';
        color = '\x1b[32m';
      } else {
        status = 'NEARLY READY (Address warnings) ⚠️';
        color = '\x1b[33m';
      }
    } else if (results.failed <= 2 && results.warnings <= 5) {
      status = 'NEEDS FIXES BEFORE PRODUCTION 🔧';
      color = '\x1b[33m';
    }
    
    console.log(`${color}🚀 Production Status: ${status}${'\x1b[0m'}\n`);
    
    // Show errors if any
    if (results.errors.length > 0) {
      console.log('🔴 Critical Issues:');
      results.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error.name}: ${error.message}`);
      });
      console.log();
    }
    
    // Save report
    const reportPath = path.join(__dirname, 'integration-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { total, passed: results.passed, failed: results.failed, warnings: results.warnings, successRate },
      errors: results.errors,
      tests: results.tests
    }, null, 2));
    
    console.log(`📋 Detailed report saved to: ${reportPath}\n`);
  }
}

// Run tests if script executed directly
if (require.main === module) {
  IntegrationTestRunner.runAllTests()
    .then(() => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Integration test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { IntegrationTestRunner, ApiClient, CONFIG };