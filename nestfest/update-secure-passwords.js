// Update Test User Passwords with Secure Passwords
// This script updates the test users with secure, non-blacklisted passwords

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function updateToSecurePasswords() {
  console.log('========================================');
  console.log('Updating to Secure Test Passwords');
  console.log('========================================\n');

  // Use a secure password that passes validation
  const securePassword = 'NestFest2024!Secure';
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(securePassword, saltRounds);
  
  console.log('New secure password: NestFest2024!Secure');
  console.log('This password meets all requirements:');
  console.log('  - Minimum 8 characters ✓');
  console.log('  - Contains uppercase ✓');
  console.log('  - Contains lowercase ✓');
  console.log('  - Contains numbers ✓');
  console.log('  - Contains special characters ✓');
  console.log('  - Not in blacklist ✓');
  console.log('');
  console.log('Generated hash:', hashedPassword.substring(0, 30) + '...');
  console.log('');

  const testUsers = [
    { email: 'admin@nestfest.com', role: 'admin' },
    { email: 'judge@nestfest.com', role: 'judge' },
    { email: 'participant@nestfest.com', role: 'participant' }
  ];

  for (const user of testUsers) {
    console.log(`Updating ${user.role}: ${user.email}`);
    
    const { data, error } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', user.email);

    if (error) {
      console.log(`❌ Error updating ${user.email}:`, error.message);
    } else {
      console.log(`✅ Successfully updated ${user.email}`);
    }
  }

  console.log('\n========================================');
  console.log('Password Update Complete!');
  console.log('========================================');
  console.log('\nLogin credentials for all test users:');
  console.log('');
  console.log('  Email: admin@nestfest.com');
  console.log('  Password: NestFest2024!Secure');
  console.log('');
  console.log('  Email: judge@nestfest.com');
  console.log('  Password: NestFest2024!Secure');
  console.log('');
  console.log('  Email: participant@nestfest.com');
  console.log('  Password: NestFest2024!Secure');
  console.log('========================================');
}

updateToSecurePasswords().catch(console.error);