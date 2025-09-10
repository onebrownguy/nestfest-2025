// Test Authentication Script for NestFest
// This script tests all three user accounts to verify authentication is working

async function testAuth() {
  const baseUrl = 'http://localhost:3000/api/auth/login';
  
  const testAccounts = [
    { email: 'admin@nestfest.com', password: 'NestFest2024!Secure', role: 'admin' },
    { email: 'judge@nestfest.com', password: 'NestFest2024!Secure', role: 'judge' },
    { email: 'participant@nestfest.com', password: 'NestFest2024!Secure', role: 'participant' }
  ];

  console.log('========================================');
  console.log('NestFest Authentication Test');
  console.log('========================================\n');

  for (const account of testAccounts) {
    console.log(`Testing ${account.role.toUpperCase()} account...`);
    console.log(`Email: ${account.email}`);
    
    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: account.email,
          password: account.password,
          rememberMe: false
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`✅ SUCCESS: ${account.role} login successful!`);
        console.log(`   User ID: ${data.user.id}`);
        console.log(`   Role: ${data.user.role}`);
        console.log(`   Session ID: ${data.sessionId}`);
        console.log(`   Token expires in: ${data.expiresIn} seconds`);
      } else {
        console.log(`❌ FAILED: ${account.role} login failed`);
        console.log(`   Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: Could not connect to server`);
      console.log(`   ${error.message}`);
    }
    
    console.log('----------------------------------------\n');
  }

  // Test invalid login
  console.log('Testing INVALID credentials...');
  console.log('Email: fake@email.com');
  
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'fake@email.com',
        password: 'wrongpassword'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log(`✅ EXPECTED: Invalid login correctly rejected`);
      console.log(`   Error: ${data.error}`);
    } else {
      console.log(`❌ UNEXPECTED: Invalid login was accepted!`);
    }
  } catch (error) {
    console.log(`❌ ERROR: Could not connect to server`);
    console.log(`   ${error.message}`);
  }

  console.log('\n========================================');
  console.log('Authentication Test Complete');
  console.log('========================================');
}

// Run the test
testAuth().catch(console.error);