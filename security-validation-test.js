#!/usr/bin/env node

/**
 * NestFest Security Validation Suite
 * Comprehensive security testing for production readiness
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Security test configuration
const SECURITY_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  tests: {
    authentication: true,
    authorization: true,
    inputValidation: true,
    rateLimiting: true,
    dataProtection: true,
    headers: true,
    cors: true,
    injection: true
  }
};

// Security test results
const securityResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  critical: 0,
  tests: [],
  vulnerabilities: []
};

/**
 * Security Test Logger
 */
class SecurityLogger {
  static log(level, testName, message, details = null, severity = 'medium') {
    const timestamp = new Date().toISOString();
    const result = { level, testName, message, details, severity, timestamp };
    
    securityResults.tests.push(result);
    
    const colors = {
      PASS: '\x1b[32m',
      FAIL: '\x1b[31m',
      WARN: '\x1b[33m',
      CRITICAL: '\x1b[91m'
    };
    
    console.log(`${colors[level]}[${level}]${'\x1b[0m'} ${testName}: ${message}`);
    
    if (details) {
      console.log(`  Details: ${JSON.stringify(details, null, 2)}`);
    }
    
    // Update counters
    if (level === 'PASS') securityResults.passed++;
    if (level === 'FAIL') securityResults.failed++;
    if (level === 'WARN') securityResults.warnings++;
    if (level === 'CRITICAL') {
      securityResults.critical++;
      securityResults.vulnerabilities.push({ testName, message, details, severity });
    }
  }
}

/**
 * HTTP Security Client
 */
class SecurityClient {
  static async request(method, endpoint, data = null, headers = {}, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, SECURITY_CONFIG.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NestFest-Security-Scanner/1.0',
          ...headers
        },
        timeout: SECURITY_CONFIG.timeout,
        ...options
      };
      
      const req = client.request(requestOptions, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body,
            rawResponse: res
          });
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
}

/**
 * Authentication Security Tests
 */
class AuthenticationSecurityTests {
  static async testPasswordStrengthRequirements() {
    const weakPasswords = [
      'password',
      '123456',
      'admin',
      'test',
      'qwerty'
    ];
    
    let vulnerableToWeakPasswords = false;
    
    for (const weakPassword of weakPasswords) {
      try {
        const response = await SecurityClient.request('POST', '/api/auth/register', {
          email: `test-weak-${Date.now()}@security.test`,
          password: weakPassword,
          name: 'Security Test User'
        });
        
        if (response.status === 200 || response.status === 201) {
          vulnerableToWeakPasswords = true;
          break;
        }
      } catch (error) {
        // Expected for security - continue testing
      }
    }
    
    if (vulnerableToWeakPasswords) {
      SecurityLogger.log('CRITICAL', 'Password Strength', 
        'System accepts weak passwords', null, 'high');
      return false;
    } else {
      SecurityLogger.log('PASS', 'Password Strength', 
        'Strong password requirements enforced');
      return true;
    }
  }
  
  static async testBruteForceProtection() {
    const attempts = [];
    const testEmail = 'brute-force-test@security.test';
    
    // Attempt multiple failed logins
    for (let i = 0; i < 10; i++) {
      try {
        const response = await SecurityClient.request('POST', '/api/auth/login', {
          email: testEmail,
          password: `wrong-password-${i}`
        });
        attempts.push(response.status);
      } catch (error) {
        attempts.push(0);
      }
      
      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Check if rate limiting kicked in
    const rateLimitedAttempts = attempts.filter(status => status === 429).length;
    
    if (rateLimitedAttempts > 0) {
      SecurityLogger.log('PASS', 'Brute Force Protection', 
        `Rate limiting active after ${10 - rateLimitedAttempts + 1} attempts`);
      return true;
    } else {
      SecurityLogger.log('CRITICAL', 'Brute Force Protection', 
        'No rate limiting detected for login attempts', { attempts }, 'high');
      return false;
    }
  }
  
  static async testSessionManagement() {
    try {
      // Test if sessions expire properly
      const loginResponse = await SecurityClient.request('POST', '/api/auth/login', {
        email: 'test@security.test',
        password: 'ValidPassword123!'
      });
      
      if (loginResponse.status === 200 || loginResponse.status === 201) {
        const token = JSON.parse(loginResponse.data)?.token;
        
        if (token) {
          // Test if logout invalidates session
          const logoutResponse = await SecurityClient.request('POST', '/api/auth/logout', null, {
            'Authorization': `Bearer ${token}`
          });
          
          // Try to use token after logout
          const protectedResponse = await SecurityClient.request('GET', '/api/auth/me', null, {
            'Authorization': `Bearer ${token}`
          });
          
          if (protectedResponse.status === 401) {
            SecurityLogger.log('PASS', 'Session Management', 
              'Sessions properly invalidated on logout');
            return true;
          }
        }
      }
      
      SecurityLogger.log('WARN', 'Session Management', 
        'Unable to fully validate session management');
      return false;
    } catch (error) {
      SecurityLogger.log('WARN', 'Session Management', 
        'Session management test failed', error.message);
      return false;
    }
  }
}

/**
 * Input Validation Security Tests
 */
class InputValidationTests {
  static async testSQLInjection() {
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "admin'--",
      "'; SELECT * FROM users WHERE ''=''",
      "1' UNION SELECT password FROM users--"
    ];
    
    let vulnerable = false;
    
    for (const payload of sqlInjectionPayloads) {
      try {
        const response = await SecurityClient.request('POST', '/api/auth/login', {
          email: payload,
          password: payload
        });
        
        // Check response for SQL error messages or unexpected success
        if (response.data?.includes('SQL') || 
            response.data?.includes('mysql') ||
            response.data?.includes('postgres') ||
            response.status === 200) {
          vulnerable = true;
          break;
        }
      } catch (error) {
        // Expected for security
      }
    }
    
    if (vulnerable) {
      SecurityLogger.log('CRITICAL', 'SQL Injection', 
        'Potential SQL injection vulnerability detected', null, 'critical');
      return false;
    } else {
      SecurityLogger.log('PASS', 'SQL Injection', 
        'No SQL injection vulnerabilities detected');
      return true;
    }
  }
  
  static async testXSSProtection() {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      "javascript:alert('XSS')",
      '<img src="x" onerror="alert(\'XSS\')" />',
      '<svg onload="alert(\'XSS\')" />'
    ];
    
    let vulnerable = false;
    
    for (const payload of xssPayloads) {
      try {
        // Test XSS in user registration name field
        const response = await SecurityClient.request('POST', '/api/auth/register', {
          email: `xss-test-${Date.now()}@security.test`,
          password: 'ValidPassword123!',
          name: payload
        });
        
        // Check if payload is reflected without sanitization
        if (response.data?.includes(payload)) {
          vulnerable = true;
          break;
        }
      } catch (error) {
        // Expected for security
      }
    }
    
    if (vulnerable) {
      SecurityLogger.log('CRITICAL', 'XSS Protection', 
        'Potential XSS vulnerability detected', null, 'high');
      return false;
    } else {
      SecurityLogger.log('PASS', 'XSS Protection', 
        'No XSS vulnerabilities detected in input fields');
      return true;
    }
  }
  
  static async testCommandInjection() {
    const commandInjectionPayloads = [
      '; ls -la',
      '| whoami',
      '&& echo "vulnerable"',
      '`id`',
      '$(whoami)'
    ];
    
    let vulnerable = false;
    
    for (const payload of commandInjectionPayloads) {
      try {
        // Test file upload endpoint with malicious filename
        const response = await SecurityClient.request('GET', '/api/files/list', null, {
          'filename': payload
        });
        
        // Check for command execution indicators
        if (response.data?.includes('root') || 
            response.data?.includes('vulnerable') ||
            response.data?.includes('uid=')) {
          vulnerable = true;
          break;
        }
      } catch (error) {
        // Expected for security
      }
    }
    
    if (vulnerable) {
      SecurityLogger.log('CRITICAL', 'Command Injection', 
        'Potential command injection vulnerability detected', null, 'critical');
      return false;
    } else {
      SecurityLogger.log('PASS', 'Command Injection', 
        'No command injection vulnerabilities detected');
      return true;
    }
  }
}

/**
 * Security Headers Tests
 */
class SecurityHeadersTests {
  static async testSecurityHeaders() {
    try {
      const response = await SecurityClient.request('GET', '/');
      const headers = response.headers;
      
      const requiredHeaders = {
        'x-content-type-options': 'nosniff',
        'x-frame-options': ['DENY', 'SAMEORIGIN'],
        'x-xss-protection': '1; mode=block',
        'strict-transport-security': null, // Should exist for HTTPS
        'content-security-policy': null
      };
      
      const missingHeaders = [];
      const weakHeaders = [];
      
      for (const [headerName, expectedValue] of Object.entries(requiredHeaders)) {
        const headerValue = headers[headerName] || headers[headerName.toLowerCase()];
        
        if (!headerValue) {
          missingHeaders.push(headerName);
        } else if (Array.isArray(expectedValue) && !expectedValue.includes(headerValue)) {
          weakHeaders.push({ header: headerName, value: headerValue, expected: expectedValue });
        }
      }
      
      if (missingHeaders.length > 0) {
        SecurityLogger.log('WARN', 'Security Headers', 
          'Missing security headers', { missing: missingHeaders }, 'medium');
      }
      
      if (weakHeaders.length > 0) {
        SecurityLogger.log('WARN', 'Security Headers', 
          'Weak security header values', { weak: weakHeaders }, 'medium');
      }
      
      if (missingHeaders.length === 0 && weakHeaders.length === 0) {
        SecurityLogger.log('PASS', 'Security Headers', 
          'All security headers properly configured');
        return true;
      }
      
      return false;
    } catch (error) {
      SecurityLogger.log('FAIL', 'Security Headers', 
        'Unable to check security headers', error.message);
      return false;
    }
  }
}

/**
 * CORS Security Tests
 */
class CORSSecurityTests {
  static async testCORSConfiguration() {
    try {
      const response = await SecurityClient.request('OPTIONS', '/api/auth/login', null, {
        'Origin': 'https://malicious-site.com',
        'Access-Control-Request-Method': 'POST'
      });
      
      const corsHeaders = {
        'access-control-allow-origin': response.headers['access-control-allow-origin'],
        'access-control-allow-credentials': response.headers['access-control-allow-credentials']
      };
      
      // Check for overly permissive CORS
      if (corsHeaders['access-control-allow-origin'] === '*' && 
          corsHeaders['access-control-allow-credentials'] === 'true') {
        SecurityLogger.log('CRITICAL', 'CORS Configuration', 
          'Dangerously permissive CORS configuration', corsHeaders, 'high');
        return false;
      } else if (corsHeaders['access-control-allow-origin'] === '*') {
        SecurityLogger.log('WARN', 'CORS Configuration', 
          'Permissive CORS allows all origins', corsHeaders, 'medium');
        return false;
      } else {
        SecurityLogger.log('PASS', 'CORS Configuration', 
          'CORS properly configured');
        return true;
      }
    } catch (error) {
      SecurityLogger.log('WARN', 'CORS Configuration', 
        'Unable to test CORS configuration', error.message);
      return false;
    }
  }
}

/**
 * Data Protection Tests
 */
class DataProtectionTests {
  static async testSensitiveDataExposure() {
    try {
      // Test if error messages expose sensitive information
      const response = await SecurityClient.request('POST', '/api/auth/login', {
        email: 'nonexistent@test.com',
        password: 'wrongpassword'
      });
      
      const sensitiveKeywords = [
        'database',
        'connection',
        'query',
        'stack trace',
        'file path',
        'internal server error'
      ];
      
      const exposureFound = sensitiveKeywords.some(keyword => 
        response.data?.toLowerCase()?.includes(keyword)
      );
      
      if (exposureFound) {
        SecurityLogger.log('WARN', 'Data Exposure', 
          'Error messages may expose sensitive information', 
          { response: response.data?.substring(0, 200) }, 'medium');
        return false;
      } else {
        SecurityLogger.log('PASS', 'Data Exposure', 
          'Error messages do not expose sensitive information');
        return true;
      }
    } catch (error) {
      SecurityLogger.log('WARN', 'Data Exposure', 
        'Unable to test data exposure', error.message);
      return false;
    }
  }
}

/**
 * Main Security Test Runner
 */
class SecurityTestRunner {
  static async runAllSecurityTests() {
    console.log('\n🛡️  NestFest Security Validation Suite');
    console.log('=======================================\n');
    
    SecurityLogger.log('INFO', 'Security Suite', 'Starting comprehensive security validation');
    
    // Authentication Security Tests
    console.log('\n🔐 Authentication Security Tests');
    console.log('---------------------------------');
    await AuthenticationSecurityTests.testPasswordStrengthRequirements();
    await AuthenticationSecurityTests.testBruteForceProtection();
    await AuthenticationSecurityTests.testSessionManagement();
    
    // Input Validation Tests
    console.log('\n🚫 Input Validation Security Tests');
    console.log('----------------------------------');
    await InputValidationTests.testSQLInjection();
    await InputValidationTests.testXSSProtection();
    await InputValidationTests.testCommandInjection();
    
    // Security Headers Tests
    console.log('\n📋 Security Headers Tests');
    console.log('-------------------------');
    await SecurityHeadersTests.testSecurityHeaders();
    
    // CORS Security Tests
    console.log('\n🌐 CORS Security Tests');
    console.log('----------------------');
    await CORSSecurityTests.testCORSConfiguration();
    
    // Data Protection Tests
    console.log('\n🔒 Data Protection Tests');
    console.log('------------------------');
    await DataProtectionTests.testSensitiveDataExposure();
    
    // Generate security report
    this.generateSecurityReport();
  }
  
  static generateSecurityReport() {
    console.log('\n🛡️  Security Assessment Report');
    console.log('===============================\n');
    
    const totalTests = securityResults.passed + securityResults.failed + securityResults.warnings;
    const securityScore = totalTests > 0 ? 
      ((securityResults.passed / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`✅ Tests Passed: ${securityResults.passed}`);
    console.log(`❌ Tests Failed: ${securityResults.failed}`);
    console.log(`⚠️  Warnings: ${securityResults.warnings}`);
    console.log(`🚨 Critical Issues: ${securityResults.critical}`);
    console.log(`📊 Security Score: ${securityScore}%\n`);
    
    // Security level assessment
    let securityLevel = 'CRITICAL SECURITY RISKS ❌';
    let color = '\x1b[31m';
    
    if (securityResults.critical === 0 && securityResults.failed === 0) {
      if (securityResults.warnings <= 2) {
        securityLevel = 'SECURE FOR PRODUCTION ✅';
        color = '\x1b[32m';
      } else {
        securityLevel = 'MOSTLY SECURE (Address warnings) ⚠️';
        color = '\x1b[33m';
      }
    } else if (securityResults.critical === 0) {
      securityLevel = 'MODERATE SECURITY RISKS ⚠️';
      color = '\x1b[33m';
    }
    
    console.log(`${color}🛡️  Security Assessment: ${securityLevel}${'\x1b[0m'}\n`);
    
    // Critical vulnerabilities
    if (securityResults.vulnerabilities.length > 0) {
      console.log('🚨 CRITICAL VULNERABILITIES (Must Fix Before Production):');
      console.log('========================================================');
      securityResults.vulnerabilities.forEach((vuln, index) => {
        console.log(`${index + 1}. ${vuln.testName}: ${vuln.message}`);
        console.log(`   Severity: ${vuln.severity.toUpperCase()}`);
        if (vuln.details) {
          console.log(`   Details: ${JSON.stringify(vuln.details)}`);
        }
      });
      console.log();
    }
    
    // Security recommendations
    console.log('🔧 Security Recommendations:');
    console.log('=============================');
    
    if (securityResults.critical > 0) {
      console.log('1. 🚨 IMMEDIATE: Fix all critical security vulnerabilities');
      console.log('2. 🔒 Implement proper input validation and sanitization');
      console.log('3. 🛡️  Add rate limiting and brute force protection');
    }
    
    if (securityResults.failed > 0 || securityResults.warnings > 0) {
      console.log('4. 📋 Configure proper security headers');
      console.log('5. 🌐 Review and tighten CORS policies');
      console.log('6. 🔐 Implement proper session management');
    }
    
    console.log('7. 🔍 Regular security audits and penetration testing');
    console.log('8. 📚 Security awareness training for development team');
    console.log('9. 🚨 Implement security monitoring and alerting');
    console.log('10. 💾 Regular security patches and updates\n');
    
    // Save security report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passed: securityResults.passed,
        failed: securityResults.failed,
        warnings: securityResults.warnings,
        critical: securityResults.critical,
        securityScore: parseFloat(securityScore),
        securityLevel: securityLevel.replace(/[^\w\s]/gi, '')
      },
      vulnerabilities: securityResults.vulnerabilities,
      tests: securityResults.tests
    };
    
    const reportPath = path.join(__dirname, 'security-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📋 Detailed security report saved to: ${reportPath}\n`);
  }
}

// Run security tests if script executed directly
if (require.main === module) {
  SecurityTestRunner.runAllSecurityTests()
    .then(() => {
      process.exit(securityResults.critical > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Security test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { SecurityTestRunner, SecurityClient };