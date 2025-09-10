/**
 * Playwright Test Suite for Password Reset Flow
 * Tests the complete password reset flow and identifies any errors
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

class PasswordResetTester {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.testResults = {
      errors: [],
      networkErrors: [],
      consoleErrors: [],
      success: false,
      screenshots: [],
      emailSent: false,
      formSubmitted: false,
      emailServiceError: null
    };
  }

  async initialize() {
    console.log('🚀 Initializing Playwright for password reset testing...');
    
    // Launch browser with debugging options
    this.browser = await chromium.launch({
      headless: false, // Set to true for CI
      slowMo: 100,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });

    // Create context with network and console logging
    this.context = await this.browser.newContext({
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
      recordVideo: {
        dir: './test-recordings/',
        size: { width: 1440, height: 900 }
      }
    });

    this.page = await this.context.newPage();
    
    // Set up event listeners
    await this.setupEventListeners();
  }

  async setupEventListeners() {
    // Network request logging
    this.page.on('request', request => {
      console.log(`🔄 Request: ${request.method()} ${request.url()}`);
    });

    // Network response logging
    this.page.on('response', response => {
      const status = response.status();
      const url = response.url();
      
      if (status >= 400) {
        console.log(`❌ Network Error: ${status} ${url}`);
        this.testResults.networkErrors.push({
          status,
          url,
          statusText: response.statusText()
        });
      } else {
        console.log(`✅ Response: ${status} ${url}`);
      }
    });

    // Console message logging
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      console.log(`📝 Console ${type}: ${text}`);
      
      if (type === 'error') {
        this.testResults.consoleErrors.push({
          type,
          text,
          location: msg.location()
        });
      }

      // Check for specific email service errors
      if (text.includes('Template not found') || text.includes('passwordReset')) {
        this.testResults.emailServiceError = text;
        console.log(`🔍 Found email service error: ${text}`);
      }
    });

    // Page error logging
    this.page.on('pageerror', error => {
      console.log(`💥 Page Error: ${error.message}`);
      this.testResults.errors.push({
        type: 'pageerror',
        message: error.message,
        stack: error.stack
      });
    });
  }

  async testPasswordResetFlow() {
    const testPorts = [3003, 3000, 3001, 3002];
    let serverFound = false;
    let workingPort = null;

    // Try different ports to find the running server
    for (const port of testPorts) {
      try {
        console.log(`🔍 Trying to connect to http://localhost:${port}...`);
        
        const response = await this.page.goto(`http://localhost:${port}/forgot-password`, {
          waitUntil: 'domcontentloaded',
          timeout: 5000
        });

        if (response && response.ok()) {
          console.log(`✅ Found server on port ${port}`);
          serverFound = true;
          workingPort = port;
          break;
        }
      } catch (error) {
        console.log(`❌ Port ${port} not available: ${error.message}`);
        continue;
      }
    }

    if (!serverFound) {
      throw new Error('No development server found on ports 3000, 3001, or 3002. Please start the Next.js development server first.');
    }

    console.log(`🌐 Testing password reset flow on port ${workingPort}`);
    
    // Take screenshot of initial page
    await this.takeScreenshot('01-initial-forgot-password-page');

    // Wait for page to fully load
    await this.page.waitForLoadState('networkidle');

    // Step 1: Verify the forgot password form is present
    console.log('🔍 Step 1: Verifying forgot password form...');
    
    const emailInput = await this.page.locator('input[name="email"]');
    const submitButton = await this.page.locator('button[type="submit"]');
    
    if (await emailInput.count() === 0) {
      throw new Error('Email input field not found');
    }
    
    if (await submitButton.count() === 0) {
      throw new Error('Submit button not found');
    }

    console.log('✅ Form elements found');

    // Step 2: Test with invalid email first
    console.log('🔍 Step 2: Testing with invalid email...');
    
    await emailInput.fill('invalid-email');
    await submitButton.click();
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot('02-invalid-email-test');

    // Step 3: Test with valid email
    console.log('🔍 Step 3: Testing with valid test email...');
    
    const testEmail = 'test@example.com';
    await emailInput.fill(testEmail);
    await this.takeScreenshot('03-before-submit');

    // Monitor for form submission
    const formSubmissionPromise = this.page.waitForResponse(
      response => response.url().includes('/api/auth/reset-password') && response.request().method() === 'POST',
      { timeout: 10000 }
    );

    await submitButton.click();
    this.testResults.formSubmitted = true;
    console.log('✅ Form submitted');

    // Wait for API response
    try {
      const response = await formSubmissionPromise;
      const status = response.status();
      const responseBody = await response.json().catch(() => ({}));
      
      console.log(`📡 API Response: ${status}`, responseBody);
      
      if (status === 200) {
        this.testResults.emailSent = responseBody.success === true;
        console.log(`📧 Email sent status: ${this.testResults.emailSent}`);
      } else {
        this.testResults.errors.push({
          type: 'api_error',
          status,
          response: responseBody
        });
      }
    } catch (error) {
      console.log(`❌ Failed to capture API response: ${error.message}`);
      this.testResults.errors.push({
        type: 'api_timeout',
        message: error.message
      });
    }

    // Wait for UI updates
    await this.page.waitForTimeout(2000);
    await this.takeScreenshot('04-after-submit');

    // Step 4: Check for success message
    console.log('🔍 Step 4: Checking for success/error messages...');
    
    const successMessage = await this.page.locator('[class*="green"]').first();
    const errorMessage = await this.page.locator('[class*="red"]').first();
    
    if (await successMessage.count() > 0) {
      const successText = await successMessage.textContent();
      console.log(`✅ Success message found: ${successText}`);
      this.testResults.success = true;
    }
    
    if (await errorMessage.count() > 0) {
      const errorText = await errorMessage.textContent();
      console.log(`❌ Error message found: ${errorText}`);
      this.testResults.errors.push({
        type: 'ui_error',
        message: errorText
      });
    }

    // Step 5: Check server logs for email service errors
    console.log('🔍 Step 5: Analyzing console logs for email service errors...');
    
    // Wait a bit more to catch any delayed console messages
    await this.page.waitForTimeout(3000);
    
    return workingPort;
  }

  async takeScreenshot(name) {
    const screenshotPath = `./test-screenshots/${name}.png`;
    await this.page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });
    this.testResults.screenshots.push(screenshotPath);
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
  }

  async checkEmailServiceConfiguration() {
    console.log('🔍 Checking email service configuration...');
    
    // Try to read the email service file to check configuration
    const emailServicePath = path.join(__dirname, 'src/lib/integrations/email/email-service.ts');
    
    if (fs.existsSync(emailServicePath)) {
      const emailServiceContent = fs.readFileSync(emailServicePath, 'utf8');
      
      // Check for template-related code
      if (emailServiceContent.includes('sendPasswordResetEmail')) {
        console.log('✅ sendPasswordResetEmail method found in email service');
        
        // Check if it uses HTML instead of templates
        if (emailServiceContent.includes('html: `')) {
          console.log('✅ Email service uses HTML templates (correct approach)');
        } else if (emailServiceContent.includes('templateId')) {
          console.log('⚠️ Email service might still use templateId');
        }
      }
    }
  }

  async generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PASSWORD RESET FLOW TEST REPORT');
    console.log('='.repeat(80));

    // Overall Status
    console.log('\n🎯 OVERALL STATUS:');
    if (this.testResults.success && this.testResults.errors.length === 0) {
      console.log('✅ Password reset flow is working correctly');
    } else {
      console.log('❌ Issues found in password reset flow');
    }

    // Form Submission
    console.log('\n📝 FORM SUBMISSION:');
    console.log(`Form submitted: ${this.testResults.formSubmitted ? '✅ Yes' : '❌ No'}`);
    console.log(`Email sent: ${this.testResults.emailSent ? '✅ Yes' : '❌ No'}`);

    // Network Errors
    console.log('\n🌐 NETWORK ISSUES:');
    if (this.testResults.networkErrors.length === 0) {
      console.log('✅ No network errors found');
    } else {
      this.testResults.networkErrors.forEach((error, index) => {
        console.log(`❌ ${index + 1}. ${error.status} ${error.statusText} - ${error.url}`);
      });
    }

    // Console Errors
    console.log('\n📋 CONSOLE ERRORS:');
    if (this.testResults.consoleErrors.length === 0) {
      console.log('✅ No console errors found');
    } else {
      this.testResults.consoleErrors.forEach((error, index) => {
        console.log(`❌ ${index + 1}. [${error.type}] ${error.text}`);
        if (error.location) {
          console.log(`   📍 Location: ${error.location.url}:${error.location.lineNumber}`);
        }
      });
    }

    // Email Service Specific Errors
    console.log('\n📧 EMAIL SERVICE ANALYSIS:');
    if (this.testResults.emailServiceError) {
      console.log(`❌ Email Service Error Found: ${this.testResults.emailServiceError}`);
      console.log('🔍 SOLUTION: The error "Template not found: passwordReset" suggests');
      console.log('   that the email service is trying to use SendGrid templates instead');
      console.log('   of the HTML email content. Check the email service configuration.');
    } else {
      console.log('✅ No specific email service errors detected in console');
    }

    // General Errors
    console.log('\n🚫 OTHER ERRORS:');
    if (this.testResults.errors.length === 0) {
      console.log('✅ No other errors found');
    } else {
      this.testResults.errors.forEach((error, index) => {
        console.log(`❌ ${index + 1}. [${error.type}] ${error.message}`);
        if (error.stack) {
          console.log(`   📚 Stack: ${error.stack.split('\n')[0]}`);
        }
      });
    }

    // Screenshots
    console.log('\n📸 SCREENSHOTS CAPTURED:');
    this.testResults.screenshots.forEach((screenshot, index) => {
      console.log(`${index + 1}. ${screenshot}`);
    });

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (this.testResults.emailServiceError) {
      console.log('1. ❗ Fix email service template error:');
      console.log('   - Check if email service is using correct HTML template approach');
      console.log('   - Verify SendGrid configuration is not trying to use template IDs');
      console.log('   - Ensure sendPasswordResetEmail method uses HTML content directly');
    }
    
    if (this.testResults.networkErrors.length > 0) {
      console.log('2. 🌐 Address network errors:');
      console.log('   - Check API endpoint response status codes');
      console.log('   - Verify database connections and queries');
    }
    
    if (this.testResults.consoleErrors.length > 0) {
      console.log('3. 🐛 Fix JavaScript errors:');
      console.log('   - Review console errors and fix any client-side issues');
    }

    if (!this.testResults.emailSent && this.testResults.formSubmitted) {
      console.log('4. 📧 Email sending issues:');
      console.log('   - Check SendGrid API configuration');
      console.log('   - Verify email service initialization');
      console.log('   - Check server logs for detailed error messages');
    }

    console.log('\n' + '='.repeat(80));

    // Save detailed report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      summary: {
        success: this.testResults.success,
        formSubmitted: this.testResults.formSubmitted,
        emailSent: this.testResults.emailSent,
        totalErrors: this.testResults.errors.length + this.testResults.networkErrors.length + this.testResults.consoleErrors.length,
        hasEmailServiceError: !!this.testResults.emailServiceError
      }
    };

    fs.writeFileSync('./password-reset-test-report.json', JSON.stringify(reportData, null, 2));
    console.log('💾 Detailed report saved to: password-reset-test-report.json');
  }

  async cleanup() {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }
}

// Main execution
async function runPasswordResetTest() {
  const tester = new PasswordResetTester();
  
  try {
    // Create directories for outputs
    const dirs = ['./test-screenshots', './test-recordings'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    await tester.initialize();
    await tester.checkEmailServiceConfiguration();
    await tester.testPasswordResetFlow();
    await tester.generateReport();
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Try to capture error screenshot if page is available
    if (tester.page) {
      try {
        await tester.takeScreenshot('error-state');
      } catch (screenshotError) {
        console.error('Failed to capture error screenshot:', screenshotError.message);
      }
    }
  } finally {
    await tester.cleanup();
  }
}

// Run the test if called directly
if (require.main === module) {
  console.log('🔬 Starting Password Reset Flow Test');
  console.log('Please ensure your Next.js development server is running on port 3000, 3001, or 3002\n');
  
  runPasswordResetTest().catch(error => {
    console.error('Failed to run password reset test:', error);
    process.exit(1);
  });
}

module.exports = { PasswordResetTester, runPasswordResetTest };