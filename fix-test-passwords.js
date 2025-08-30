// Fix Test User Passwords in Database
// This script updates the test users with properly hashed passwords

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function updateTestPasswords() {
  console.log('========================================');
  console.log('Updating Test User Passwords');
  console.log('========================================\n');

  // Generate a new hash for 'password123'
  const password = 'password123';
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  console.log('Generated new password hash for: password123');
  console.log('Hash:', hashedPassword);
  console.log('');

  const testUsers = [
    'admin@nestfest.com',
    'judge@nestfest.com', 
    'participant@nestfest.com'
  ];

  for (const email of testUsers) {
    console.log(`Updating password for: ${email}`);
    
    const { data, error } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (error) {
      console.log(`❌ Error updating ${email}:`, error.message);
    } else {
      console.log(`✅ Successfully updated ${email}`);
    }
    console.log('');
  }

  // Verify the updates
  console.log('----------------------------------------');
  console.log('Verifying updates...\n');
  
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('email, role, status, email_verified')
    .in('email', testUsers);

  if (users) {
    console.log('Current test users:');
    users.forEach(user => {
      console.log(`  ${user.email}:`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Status: ${user.status}`);
      console.log(`    Email Verified: ${user.email_verified}`);
    });
  }

  console.log('\n========================================');
  console.log('Password Update Complete');
  console.log('All test users now use: password123');
  console.log('========================================');
}

updateTestPasswords().catch(console.error);