/**
 * SendGrid Email Service Test
 * Tests API key validity, email delivery, and service configuration
 */

const sgMail = require('@sendgrid/mail');
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

async function testSendGridConfiguration() {
  console.log('📧 SendGrid Email Service Configuration Test\n');
  
  try {
    // Load environment variables
    loadEnvVariables();
    
    // Test 1: Check API Key Configuration
    console.log('1. Testing API Key Configuration:');
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      console.log('   ❌ SENDGRID_API_KEY not found in environment variables');
      return;
    }
    
    if (!apiKey.startsWith('SG.')) {
      console.log('   ❌ API key format appears invalid (should start with "SG.")');
      return;
    }
    
    console.log(`   ✅ API Key found: ${apiKey.substring(0, 10)}...`);
    sgMail.setApiKey(apiKey);
    
    // Test 2: Validate API Key with SendGrid
    console.log('\n2. Validating API Key with SendGrid:');
    try {
      // Test with sandbox mode to avoid sending actual emails
      const testMsg = {
        to: 'test@example.com',
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@nestfest.com',
        subject: 'SendGrid API Key Test',
        text: 'This is a test email to validate the SendGrid API key.',
        html: '<p>This is a test email to validate the SendGrid API key.</p>',
        mailSettings: {
          sandboxMode: { enable: true }
        }
      };
      
      const [response] = await sgMail.send(testMsg);
      console.log('   ✅ API Key is valid and active');
      console.log(`   ✅ Response Status: ${response.statusCode}`);
      
    } catch (error) {
      if (error.code === 400 && error.response?.body?.errors) {
        console.log('   ❌ API Key validation failed:');
        error.response.body.errors.forEach(err => {
          console.log(`      - ${err.message}`);
        });
      } else {
        console.log(`   ❌ API Key validation error: ${error.message}`);
      }
      return;
    }
    
    // Test 3: Test Actual Email Sending (Optional)
    console.log('\n3. Testing Email Delivery (Real Send):');
    const testEmail = process.env.TEST_EMAIL || 'admin@nestfest.com';
    
    try {
      const realMsg = {
        to: testEmail,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@nestfest.com',
        subject: 'NestFest Email Service Test',
        text: 'This is a test email from the NestFest platform to verify email delivery is working correctly.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3498db;">NestFest Email Service Test</h2>
            <p>This is a test email from the NestFest platform to verify email delivery is working correctly.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Test Details:</h3>
              <ul>
                <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
                <li><strong>Service:</strong> SendGrid</li>
                <li><strong>Environment:</strong> Development</li>
              </ul>
            </div>
            <p>If you received this email, the SendGrid integration is working correctly!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              This is an automated test email from the NestFest Event Platform.
            </p>
          </div>
        `,
        categories: ['test', 'email-service-validation'],
        customArgs: {
          'test_type': 'service_validation',
          'platform': 'nestfest'
        }
      };
      
      console.log(`   📤 Sending test email to: ${testEmail}`);
      const [realResponse] = await sgMail.send(realMsg);
      console.log('   ✅ Test email sent successfully!');
      console.log(`   ✅ Response Status: ${realResponse.statusCode}`);
      console.log(`   ✅ Message ID: ${realResponse.headers['x-message-id']}`);
      
    } catch (error) {
      console.log('   ❌ Failed to send test email:');
      if (error.response?.body?.errors) {
        error.response.body.errors.forEach(err => {
          console.log(`      - ${err.message}`);
          if (err.field) console.log(`        Field: ${err.field}`);
        });
      } else {
        console.log(`      Error: ${error.message}`);
      }
    }
    
    // Test 4: Configuration Summary
    console.log('\n4. Configuration Summary:');
    console.log(`   From Email: ${process.env.SENDGRID_FROM_EMAIL || 'Not configured'}`);
    console.log(`   From Name: ${process.env.SENDGRID_FROM_NAME || 'Not configured'}`);
    console.log(`   Webhook Secret: ${process.env.SENDGRID_WEBHOOK_SECRET ? 'Configured' : 'Not configured'}`);
    
    console.log('\n✅ SendGrid configuration test completed successfully!');
    console.log('\n📋 Recommendations:');
    console.log('   1. Configure SENDGRID_FROM_EMAIL in environment variables');
    console.log('   2. Configure SENDGRID_FROM_NAME for better email branding');
    console.log('   3. Set up webhook endpoints for email event tracking');
    console.log('   4. Create email templates for consistent branding');
    
  } catch (error) {
    console.error('❌ SendGrid test failed:', error.message);
    console.error('   Make sure all dependencies are installed and environment variables are set');
  }
}

// Install required dependency if not available
async function checkDependencies() {
  try {
    require('@sendgrid/mail');
    console.log('✅ @sendgrid/mail dependency found\n');
  } catch (error) {
    console.log('❌ @sendgrid/mail not installed. Installing...\n');
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec('npm install @sendgrid/mail', (error, stdout, stderr) => {
        if (error) {
          console.error('Failed to install @sendgrid/mail:', error);
          reject(error);
        } else {
          console.log('✅ @sendgrid/mail installed successfully\n');
          resolve(stdout);
        }
      });
    });
  }
}

// Run the test
async function runTest() {
  try {
    await checkDependencies();
    await testSendGridConfiguration();
  } catch (error) {
    console.error('Test execution failed:', error.message);
  }
}

runTest().catch(console.error);