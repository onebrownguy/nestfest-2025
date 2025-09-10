/**
 * Direct API Test
 * Tests the reset-password API directly to see server logs
 */

const fetch = require('node-fetch');

async function testAPI() {
  console.log('🧪 Testing API directly at http://localhost:3003/api/auth/reset-password');
  
  try {
    const response = await fetch('http://localhost:3003/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });
    
    console.log(`📡 Response Status: ${response.status}`);
    console.log(`📡 Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    const responseBody = await response.json();
    console.log('📄 Response Body:', JSON.stringify(responseBody, null, 2));
    
    if (response.ok) {
      console.log('✅ API call succeeded');
    } else {
      console.log('❌ API call failed');
    }
    
    // Now test the email template API endpoint specifically to trigger the template error
    console.log('\n🧪 Testing sendTemplateEmail with passwordReset template...');
    
    const templateResponse = await fetch('http://localhost:3003/api/email/send/template', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        templateKey: 'passwordReset',
        to: { email: 'test@example.com', name: 'Test User' },
        templateData: {
          resetUrl: 'http://localhost:3003/reset-password?token=test'
        }
      })
    });
    
    console.log(`📡 Template API Response Status: ${templateResponse.status}`);
    const templateResponseBody = await templateResponse.json();
    console.log('📄 Template Response Body:', JSON.stringify(templateResponseBody, null, 2));
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testAPI();