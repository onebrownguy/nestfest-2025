/**
 * Simple Auth Test - Test individual auth components without full app
 */

async function testAuthComponents() {
  console.log('🔧 Testing Auth Components...\n');

  try {
    // Test 1: Environment Variables
    console.log('1. Testing Environment Variables:');
    const requiredEnvs = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_KEY', 
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET'
    ];
    
    for (const env of requiredEnvs) {
      const value = process.env[env];
      console.log(`   ${env}: ${value ? '✓ Set' : '✗ Missing'}`);
    }
    console.log('');

    // Test 2: Password Hashing
    console.log('2. Testing Password Hashing:');
    const bcrypt = require('bcryptjs');
    const testPassword = 'TestPassword123!';
    const hash = await bcrypt.hash(testPassword, 12);
    const isValid = await bcrypt.compare(testPassword, hash);
    console.log(`   Hashing: ${hash ? '✓ Success' : '✗ Failed'}`);
    console.log(`   Verification: ${isValid ? '✓ Success' : '✗ Failed'}`);
    console.log('');

    // Test 3: JWT Generation
    console.log('3. Testing JWT Generation:');
    const jwt = require('jsonwebtoken');
    const payload = { userId: 'test-123', email: 'test@example.com', role: 'student' };
    const accessSecret = process.env.JWT_ACCESS_SECRET || 'test-secret';
    
    try {
      const token = jwt.sign(payload, accessSecret, { expiresIn: '15m' });
      const decoded = jwt.verify(token, accessSecret);
      console.log(`   Token Generation: ✓ Success`);
      console.log(`   Token Verification: ✓ Success`);
      console.log(`   User ID: ${decoded.userId}`);
    } catch (error) {
      console.log(`   JWT Error: ✗ ${error.message}`);
    }
    console.log('');

    // Test 4: Supabase Connection
    console.log('4. Testing Supabase Connection:');
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        // Simple test query
        const { data, error } = await supabase.from('users').select('count').limit(1);
        console.log(`   Connection: ${error ? '✗ Failed' : '✓ Success'}`);
        if (error) console.log(`   Error: ${error.message}`);
      } else {
        console.log(`   Connection: ✗ Missing credentials`);
      }
    } catch (error) {
      console.log(`   Connection: ✗ ${error.message}`);
    }
    console.log('');

    console.log('✅ Auth component tests completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Load environment variables manually
const fs = require('fs');
const path = require('path');

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
  console.log('Warning: Could not load .env.local');
}

// Run tests
testAuthComponents().catch(console.error);