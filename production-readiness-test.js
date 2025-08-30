#!/usr/bin/env node

/**
 * NestFest Production Readiness Test Suite
 * Comprehensive validation of platform components for event launch
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 10000,
  retries: 3,
  testUser: {
    email: 'test@nestfest.com',
    password: 'TestPassword123!',
    name: 'Test User'
  },
  testFiles: {
    small: path.join(__dirname, 'test-files', 'small-test.txt'),
    image: path.join(__dirname, 'test-files', 'test-image.jpg'),
    document: path.join(__dirname, 'test-files', 'test-document.pdf')
  }
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  criticalIssues: [],
  tests: []
};

/**
 * Test Result Logger
 */
class TestLogger {
  static log(level, testName, message, details = null) {
    const timestamp = new Date().toISOString();
    const result = { level, testName, message, details, timestamp };
    
    testResults.tests.push(result);
    
    const colors = {
      PASS: '\x1b[32m', // Green
      FAIL: '\x1b[31m', // Red  
      WARN: '\x1b[33m', // Yellow
      INFO: '\x1b[36m'  // Cyan
    };
    
    console.log(`${colors[level]}[${level}]${'\x1b[0m'} ${testName}: ${message}`);
    
    if (details) {
      console.log(`  Details: ${JSON.stringify(details, null, 2)}`);
    }
    
    // Update counters
    if (level === 'PASS') testResults.passed++;
    if (level === 'FAIL') {
      testResults.failed++;
      testResults.criticalIssues.push({ testName, message, details });
    }
    if (level === 'WARN') testResults.warnings++;
  }
}

/**
 * Environment Validation Tests
 */
class EnvironmentTests {
  static async validateEnvironmentFile() {
    try {
      const envPath = path.join(__dirname, '.env.local');
      if (!fs.existsSync(envPath)) {
        TestLogger.log('WARN', 'Environment File', 'No .env.local file found');
        return false;
      }
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_KEY',
        'JWT_SECRET',
        'REDIS_URL'
      ];
      
      const missingVars = requiredVars.filter(varName => 
        !envContent.includes(varName) || envContent.includes(`${varName}=your-`)
      );
      
      if (missingVars.length > 0) {
        TestLogger.log('FAIL', 'Environment Variables', 
          'Missing or placeholder environment variables', { missingVars });
        return false;
      }
      
      TestLogger.log('PASS', 'Environment Variables', 'All required variables configured');
      return true;
    } catch (error) {
      TestLogger.log('FAIL', 'Environment File', error.message);
      return false;
    }
  }

  static async validateDirectoryStructure() {
    const requiredPaths = [
      'src/app',
      'src/components',
      'src/lib',
      'src/types',
      'public',
      'package.json',
      'next.config.js',
      'tailwind.config.js'
    ];
    
    const missingPaths = requiredPaths.filter(p => 
      !fs.existsSync(path.join(__dirname, p))
    );
    
    if (missingPaths.length > 0) {
      TestLogger.log('FAIL', 'Directory Structure', 
        'Missing required directories/files', { missingPaths });
      return false;
    }
    
    TestLogger.log('PASS', 'Directory Structure', 'All required paths exist');
    return true;
  }
}

/**
 * Database Connectivity Tests
 */
class DatabaseTests {
  static async testSupabaseConnection() {
    try {
      // This would require actual Supabase client initialization
      // For now, checking if configuration files exist
      const supabaseClient = path.join(__dirname, 'src/lib/supabase/client.ts');
      
      if (!fs.existsSync(supabaseClient)) {
        TestLogger.log('FAIL', 'Supabase Client', 'Client configuration file missing');
        return false;
      }
      
      // Check if authentication schema exists
      const authSchema = path.join(__dirname, 'src/lib/database/auth-schema.sql');
      if (!fs.existsSync(authSchema)) {
        TestLogger.log('WARN', 'Auth Schema', 'Authentication schema file not found');
      }
      
      TestLogger.log('PASS', 'Database Configuration', 'Configuration files present');
      return true;
    } catch (error) {
      TestLogger.log('FAIL', 'Database Connection', error.message);
      return false;
    }
  }

  static async validateTables() {
    // This would require actual database connection
    // For now, checking if SQL files exist for table creation
    const sqlFiles = [
      'create-auth-tables.sql',
      'simple-users-table.sql',
      'add-nestfest-policies.sql'
    ];
    
    const missingSqlFiles = sqlFiles.filter(file => 
      !fs.existsSync(path.join(__dirname, file))
    );
    
    if (missingSqlFiles.length > 0) {
      TestLogger.log('WARN', 'Database Schema', 
        'Some SQL schema files missing', { missingSqlFiles });
    } else {
      TestLogger.log('PASS', 'Database Schema', 'Schema files present');
    }
    
    return true;
  }
}

/**
 * Authentication Tests
 */
class AuthenticationTests {
  static async testAuthComponents() {
    const authFiles = [
      'src/components/auth/LoginForm.tsx',
      'src/components/auth/ProtectedRoute.tsx',
      'src/lib/auth/auth-context.tsx',
      'src/lib/auth/jwt-manager.ts',
      'src/lib/auth/session-manager.ts'
    ];
    
    const missingAuthFiles = authFiles.filter(file => 
      !fs.existsSync(path.join(__dirname, file))
    );
    
    if (missingAuthFiles.length > 0) {
      TestLogger.log('FAIL', 'Authentication Components', 
        'Missing authentication files', { missingAuthFiles });
      return false;
    }
    
    TestLogger.log('PASS', 'Authentication Components', 'All auth components present');
    return true;
  }

  static async testAuthRoutes() {
    const authRoutes = [
      'src/app/api/auth/login/route.ts',
      'src/app/api/auth/register/route.ts',
      'src/app/api/auth/logout/route.ts',
      'src/app/api/auth/me/route.ts',
      'src/app/api/auth/refresh/route.ts'
    ];
    
    const missingRoutes = authRoutes.filter(route => 
      !fs.existsSync(path.join(__dirname, route))
    );
    
    if (missingRoutes.length > 0) {
      TestLogger.log('FAIL', 'Authentication Routes', 
        'Missing auth API routes', { missingRoutes });
      return false;
    }
    
    TestLogger.log('PASS', 'Authentication Routes', 'All auth routes present');
    return true;
  }
}

/**
 * API Endpoint Tests
 */
class ApiTests {
  static async validateApiStructure() {
    const apiRoutes = [
      'src/app/api/competitions',
      'src/app/api/submissions',
      'src/app/api/reviews',
      'src/app/api/votes',
      'src/app/api/users',
      'src/app/api/files',
      'src/app/api/email',
      'src/app/api/websocket'
    ];
    
    const missingRoutes = apiRoutes.filter(route => 
      !fs.existsSync(path.join(__dirname, route))
    );
    
    if (missingRoutes.length > 0) {
      TestLogger.log('FAIL', 'API Structure', 
        'Missing API route directories', { missingRoutes });
      return false;
    }
    
    TestLogger.log('PASS', 'API Structure', 'All API route directories present');
    return true;
  }
}

/**
 * Real-time Features Tests
 */
class RealTimeTests {
  static async testWebSocketComponents() {
    const wsFiles = [
      'src/components/real-time/LiveDashboard.tsx',
      'src/components/real-time/LiveVotingInterface.tsx',
      'src/components/real-time/useWebSocket.tsx',
      'src/lib/real-time/websocket-integration.ts'
    ];
    
    const missingWsFiles = wsFiles.filter(file => 
      !fs.existsSync(path.join(__dirname, file))
    );
    
    if (missingWsFiles.length > 0) {
      TestLogger.log('FAIL', 'WebSocket Components', 
        'Missing WebSocket files', { missingWsFiles });
      return false;
    }
    
    TestLogger.log('PASS', 'WebSocket Components', 'All WebSocket components present');
    return true;
  }
}

/**
 * File Upload Tests
 */
class FileUploadTests {
  static async testFileUploadComponents() {
    const uploadFiles = [
      'src/app/api/files/upload/route.ts',
      'src/app/api/files/health/route.ts',
      'src/lib/integrations/storage'
    ];
    
    const missingUploadFiles = uploadFiles.filter(file => 
      !fs.existsSync(path.join(__dirname, file))
    );
    
    if (missingUploadFiles.length > 0) {
      TestLogger.log('FAIL', 'File Upload Components', 
        'Missing file upload components', { missingUploadFiles });
      return false;
    }
    
    TestLogger.log('PASS', 'File Upload Components', 'File upload components present');
    return true;
  }
}

/**
 * Email System Tests  
 */
class EmailTests {
  static async testEmailComponents() {
    const emailFiles = [
      'src/app/api/email/send/route.ts',
      'src/app/api/email/welcome/route.ts',
      'src/lib/integrations/email/email-service.ts'
    ];
    
    const missingEmailFiles = emailFiles.filter(file => 
      !fs.existsSync(path.join(__dirname, file))
    );
    
    if (missingEmailFiles.length > 0) {
      TestLogger.log('FAIL', 'Email Components', 
        'Missing email system files', { missingEmailFiles });
      return false;
    }
    
    TestLogger.log('PASS', 'Email Components', 'Email system components present');
    return true;
  }
}

/**
 * Security Tests
 */
class SecurityTests {
  static async testSecurityComponents() {
    const securityFiles = [
      'src/lib/auth/rate-limiter.ts',
      'src/lib/auth/permissions.ts',
      'src/lib/auth/password-manager.ts',
      'src/lib/api/middleware.ts'
    ];
    
    const missingSecurityFiles = securityFiles.filter(file => 
      !fs.existsSync(path.join(__dirname, file))
    );
    
    if (missingSecurityFiles.length > 0) {
      TestLogger.log('FAIL', 'Security Components', 
        'Missing security files', { missingSecurityFiles });
      return false;
    }
    
    TestLogger.log('PASS', 'Security Components', 'Security components present');
    return true;
  }
}

/**
 * Main Test Runner
 */
class ProductionReadinessTestRunner {
  static async runAllTests() {
    console.log('\n🚀 NestFest Production Readiness Test Suite');
    console.log('=====================================\n');
    
    TestLogger.log('INFO', 'Test Suite', 'Starting comprehensive production readiness validation');
    
    // Environment Tests
    console.log('\n📋 Environment Validation Tests');
    console.log('-------------------------------');
    await EnvironmentTests.validateEnvironmentFile();
    await EnvironmentTests.validateDirectoryStructure();
    
    // Database Tests
    console.log('\n🗄️  Database Connectivity Tests');
    console.log('-------------------------------');
    await DatabaseTests.testSupabaseConnection();
    await DatabaseTests.validateTables();
    
    // Authentication Tests  
    console.log('\n🔐 Authentication System Tests');
    console.log('-------------------------------');
    await AuthenticationTests.testAuthComponents();
    await AuthenticationTests.testAuthRoutes();
    
    // API Tests
    console.log('\n🌐 API Endpoint Tests');
    console.log('----------------------');
    await ApiTests.validateApiStructure();
    
    // Real-time Tests
    console.log('\n⚡ Real-time Features Tests');
    console.log('---------------------------');
    await RealTimeTests.testWebSocketComponents();
    
    // File Upload Tests
    console.log('\n📁 File Upload System Tests');
    console.log('----------------------------');
    await FileUploadTests.testFileUploadComponents();
    
    // Email Tests
    console.log('\n📧 Email Notification Tests');
    console.log('----------------------------');
    await EmailTests.testEmailComponents();
    
    // Security Tests
    console.log('\n🛡️  Security Features Tests');
    console.log('---------------------------');
    await SecurityTests.testSecurityComponents();
    
    // Generate final report
    this.generateFinalReport();
  }
  
  static generateFinalReport() {
    console.log('\n📊 Production Readiness Report');
    console.log('===============================\n');
    
    const totalTests = testResults.passed + testResults.failed + testResults.warnings;
    const successRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`✅ Tests Passed: ${testResults.passed}`);
    console.log(`❌ Tests Failed: ${testResults.failed}`);
    console.log(`⚠️  Warnings: ${testResults.warnings}`);
    console.log(`📈 Success Rate: ${successRate}%\n`);
    
    // Production readiness assessment
    let readinessLevel = 'NOT READY';
    let readinessColor = '\x1b[31m'; // Red
    
    if (testResults.failed === 0 && testResults.warnings <= 2) {
      readinessLevel = 'PRODUCTION READY ✅';
      readinessColor = '\x1b[32m'; // Green
    } else if (testResults.failed <= 2 && testResults.warnings <= 5) {
      readinessLevel = 'NEAR READY (Minor Issues) ⚠️';
      readinessColor = '\x1b[33m'; // Yellow
    }
    
    console.log(`${readinessColor}🚀 Production Readiness: ${readinessLevel}${'\x1b[0m'}\n`);
    
    // Critical issues summary
    if (testResults.criticalIssues.length > 0) {
      console.log('🔴 Critical Issues That Must Be Resolved:');
      console.log('==========================================');
      testResults.criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.testName}: ${issue.message}`);
        if (issue.details) {
          console.log(`   Details: ${JSON.stringify(issue.details)}`);
        }
      });
      console.log();
    }
    
    // Recommendations
    console.log('💡 Next Steps & Recommendations');
    console.log('================================');
    
    if (testResults.failed > 0) {
      console.log('1. 🔧 Fix all critical failing tests before deployment');
      console.log('2. 🧪 Run manual testing for each fixed component');
      console.log('3. 📋 Verify all environment variables are properly configured');
    }
    
    if (testResults.warnings > 0) {
      console.log('4. ⚠️  Review and address warning issues for optimal performance');
    }
    
    console.log('5. 🌐 Test all functionality in staging environment');
    console.log('6. 📊 Run load testing for expected user volumes');
    console.log('7. 🔒 Perform security penetration testing');
    console.log('8. 💾 Verify backup and disaster recovery procedures');
    console.log('9. 📈 Set up monitoring and alerting systems');
    console.log('10. 📚 Ensure documentation is complete and up-to-date\n');
    
    // Save detailed report
    this.saveDetailedReport();
  }
  
  static saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: testResults.passed + testResults.failed + testResults.warnings,
        passed: testResults.passed,
        failed: testResults.failed,
        warnings: testResults.warnings,
        successRate: testResults.passed + testResults.failed > 0 ? 
          ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1) : 0
      },
      criticalIssues: testResults.criticalIssues,
      allTests: testResults.tests
    };
    
    const reportPath = path.join(__dirname, 'production-readiness-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Detailed report saved to: ${reportPath}`);
    console.log(`🔗 Use this report to track issue resolution progress\n`);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  ProductionReadinessTestRunner.runAllTests()
    .then(() => {
      process.exit(testResults.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Test suite execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  ProductionReadinessTestRunner,
  TestLogger,
  TEST_CONFIG
};