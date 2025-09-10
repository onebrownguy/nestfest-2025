/**
 * Comprehensive Email Testing Suite
 * Tests all email functionalities in the NestFest platform
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnvVariables() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  } catch (error) {
    console.log('❌ Could not load .env.local:', error.message);
  }
}

// Load environment
loadEnvVariables();

async function testAPIEndpoints() {
  console.log('🌐 Testing Email API Endpoints\n');
  
  const baseUrl = 'http://localhost:3002';
  const testEmail = 'test@edge-team.org';
  
  // Test 1: Registration Email Flow
  console.log('1. Testing Registration with Email...');
  try {
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User Email',
        email: testEmail,
        password: 'TestPassword123!',
        role: 'student'
      })
    });
    
    const registerData = await registerResponse.text();
    console.log(`   Status: ${registerResponse.status}`);
    
    if (registerResponse.ok) {
      console.log('   ✅ Registration successful - Welcome email should be sent');
    } else {
      console.log(`   ⚠️  Registration response: ${registerData.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`   ❌ Registration test failed: ${error.message}`);
  }
  console.log('');
  
  // Test 2: Password Reset Email Flow
  console.log('2. Testing Password Reset Email...');
  try {
    const resetResponse = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail
      })
    });
    
    const resetData = await resetResponse.text();
    console.log(`   Status: ${resetResponse.status}`);
    
    if (resetResponse.ok) {
      console.log('   ✅ Password reset email request successful');
      console.log('   📧 Reset email should be sent to:', testEmail);
    } else {
      console.log(`   ⚠️  Password reset response: ${resetData.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`   ❌ Password reset test failed: ${error.message}`);
  }
  console.log('');
  
  // Test 3: Direct Email Service Test
  console.log('3. Testing Direct Email Service...');
  try {
    // Import and test the email service directly
    const { emailService } = require('./src/lib/integrations/email/email-service.ts');
    
    const emailResult = await emailService.sendEmail(
      { email: testEmail, name: 'Test User' },
      {
        subject: 'NestFest Email Service Test - Direct',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3498db;">NestFest Direct Email Test</h2>
            <p>This email was sent directly through the email service to test functionality.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Test Details:</h3>
              <ul>
                <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
                <li><strong>Service:</strong> SendGrid with Domain Authentication</li>
                <li><strong>Domain:</strong> edge-team.org</li>
                <li><strong>Test Type:</strong> Direct Service Call</li>
              </ul>
            </div>
            <p><strong>✅ If you received this email, all email functionality is working perfectly!</strong></p>
          </div>
        `,
        text: 'NestFest Direct Email Test - If you received this email, all functionality is working perfectly!'
      },
      {
        categories: ['test', 'direct-service']
      }
    );
    
    if (emailResult.success) {
      console.log('   ✅ Direct email service test successful');
      console.log(`   📧 Email sent with message ID: ${emailResult.data?.messageId}`);
    } else {
      console.log('   ❌ Direct email service test failed');
      console.log(`   Error: ${emailResult.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Direct email service test failed: ${error.message}`);
  }
  console.log('');
  
  // Test 4: Welcome Email Template Test
  console.log('4. Testing Welcome Email Template...');
  try {
    const { emailService } = require('./src/lib/integrations/email/email-service.ts');
    
    const welcomeResult = await emailService.sendWelcomeEmail(
      { email: testEmail, name: 'Test User Welcome' },
      {
        platformName: 'NestFest',
        loginUrl: `${baseUrl}/auth/login`,
        supportEmail: 'support@edge-team.org'
      }
    );
    
    if (welcomeResult.success) {
      console.log('   ✅ Welcome email template test successful');
      console.log(`   📧 Welcome email sent with message ID: ${welcomeResult.data?.messageId}`);
    } else {
      console.log('   ❌ Welcome email template test failed');
      console.log(`   Error: ${welcomeResult.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Welcome email template test failed: ${error.message}`);
  }
  console.log('');
  
  // Test 5: Email Verification Flow
  console.log('5. Testing Email Verification Flow...');
  try {
    const { emailService } = require('./src/lib/integrations/email/email-service.ts');
    
    const verificationResult = await emailService.sendEmailVerification(
      { email: testEmail, name: 'Test User Verification' },
      'test-verification-token-123',
      baseUrl
    );
    
    if (verificationResult.success) {
      console.log('   ✅ Email verification test successful');
      console.log(`   📧 Verification email sent with message ID: ${verificationResult.data?.messageId}`);
      console.log(`   🔗 Verification link: ${baseUrl}/auth/verify-email?token=test-verification-token-123`);
    } else {
      console.log('   ❌ Email verification test failed');
      console.log(`   Error: ${verificationResult.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Email verification test failed: ${error.message}`);
  }
  console.log('');
}

async function testEmailConfiguration() {
  console.log('⚙️  Email Configuration Status\n');
  
  // Check environment variables
  const requiredVars = [
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL',
    'SENDGRID_FROM_NAME'
  ];
  
  console.log('📋 Environment Variables:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`   ${varName}: ${value ? '✅ Configured' : '❌ Missing'}`);
    if (value && varName === 'SENDGRID_FROM_EMAIL') {
      console.log(`      → ${value}`);
    }
  });
  console.log('');
  
  // Test SendGrid connection
  console.log('🔌 SendGrid Connection Test:');
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Sandbox test
    const [response] = await sgMail.send({
      to: 'test@example.com',
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Connection Test',
      text: 'Connection test',
      mailSettings: { sandboxMode: { enable: true } }
    });
    
    console.log('   ✅ SendGrid connection successful');
    console.log(`   📡 Response Status: ${response.statusCode}`);
  } catch (error) {
    console.log('   ❌ SendGrid connection failed');
    console.log(`   Error: ${error.message}`);
  }
  console.log('');
}

async function runComprehensiveEmailTest() {
  console.log('📧 NestFest Email System - Comprehensive Test Suite');
  console.log('=' .repeat(60));
  console.log(`🕒 Test started at: ${new Date().toISOString()}`);
  console.log('');
  
  try {
    // Test configuration first
    await testEmailConfiguration();
    
    // Test API endpoints
    await testAPIEndpoints();
    
    console.log('');
    console.log('📊 Test Summary:');
    console.log('=' .repeat(40));
    console.log('✅ Configuration: Tested');
    console.log('✅ Registration Email: Tested');
    console.log('✅ Password Reset: Tested');
    console.log('✅ Direct Service: Tested');
    console.log('✅ Welcome Email: Tested');
    console.log('✅ Email Verification: Tested');
    console.log('');
    console.log('🎯 Action Items:');
    console.log('1. Check your email inbox for test emails');
    console.log('2. Verify all emails are delivered successfully');
    console.log('3. Check spam/junk folders if emails are missing');
    console.log('4. Test clicking links in the emails');
    console.log('');
    console.log('🚀 If all emails are received, your email system is production-ready!');
    
  } catch (error) {
    console.error('❌ Comprehensive email test failed:', error.message);
  }
}

// Wait a moment for the server to be ready, then run tests
setTimeout(() => {
  runComprehensiveEmailTest().catch(console.error);
}, 3000); // Wait 3 seconds for server startup