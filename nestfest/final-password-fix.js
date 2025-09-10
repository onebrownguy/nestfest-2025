// Final password fix using bcryptjs (same as the app uses)
const { createClient } = require('@supabase/supabase-js');
const bcryptjs = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function finalPasswordFix() {
  console.log('========================================');
  console.log('FINAL Password Fix with bcryptjs');
  console.log('========================================\n');

  const password = 'NestFest2024!Secure';
  
  // Use bcryptjs (same library the app uses)
  const saltRounds = 12; // Same as password-manager.ts uses
  const hashedPassword = await bcryptjs.hash(password, saltRounds);
  
  console.log('Password: NestFest2024!Secure');
  console.log('Hash generated with bcryptjs (12 rounds):');
  console.log(hashedPassword);
  console.log('');

  // Test the hash
  const testMatch = await bcryptjs.compare(password, hashedPassword);
  console.log('Hash verification test:', testMatch ? '✅ PASSED' : '❌ FAILED');
  console.log('');

  const testUsers = [
    { email: 'admin@nestfest.com', role: 'admin' },
    { email: 'judge@nestfest.com', role: 'judge' },
    { email: 'participant@nestfest.com', role: 'participant' }
  ];

  console.log('Updating all test users with bcryptjs hash...\n');

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
      console.log(`❌ Error: ${error.message}`);
    } else {
      console.log(`✅ Successfully updated`);
    }
  }

  console.log('\n========================================');
  console.log('AUTHENTICATION READY!');
  console.log('========================================\n');
  console.log('You can now login with:');
  console.log('');
  console.log('Admin Account:');
  console.log('  Email: admin@nestfest.com');
  console.log('  Password: NestFest2024!Secure');
  console.log('');
  console.log('Judge Account:');
  console.log('  Email: judge@nestfest.com');
  console.log('  Password: NestFest2024!Secure');
  console.log('');
  console.log('Participant Account:');
  console.log('  Email: participant@nestfest.com');
  console.log('  Password: NestFest2024!Secure');
  console.log('========================================');
}

finalPasswordFix().catch(console.error);