// Verify sessions were created in database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function verifySessionsCreated() {
  console.log('========================================');
  console.log('Verifying Session Creation in Database');
  console.log('========================================\n');

  try {
    // Get all sessions
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('❌ Error fetching sessions:', error.message);
      return;
    }

    console.log(`Total sessions in database: ${sessions?.length || 0}\n`);

    if (sessions && sessions.length > 0) {
      console.log('Recent Sessions:\n');
      sessions.slice(0, 5).forEach(session => {
        console.log(`Session ID: ${session.id}`);
        console.log(`  User ID: ${session.user_id}`);
        console.log(`  IP Address: ${session.ip_address}`);
        console.log(`  Active: ${session.is_active ? '✅ Yes' : '❌ No'}`);
        console.log(`  Created: ${new Date(session.created_at).toLocaleString()}`);
        console.log(`  Expires: ${new Date(session.expires_at).toLocaleString()}`);
        console.log('');
      });
    }

    // Get active sessions count per user
    const { data: users } = await supabase
      .from('users')
      .select('id, email, role')
      .in('email', ['admin@nestfest.com', 'judge@nestfest.com', 'participant@nestfest.com']);

    if (users) {
      console.log('Active Sessions by User:\n');
      for (const user of users) {
        const { data: userSessions } = await supabase
          .from('user_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        console.log(`${user.email} (${user.role}): ${userSessions?.length || 0} active sessions`);
      }
    }

    console.log('\n========================================');
    console.log('Session Verification Complete');
    console.log('========================================');
  } catch (err) {
    console.error('Error:', err);
  }
}

verifySessionsCreated().catch(console.error);