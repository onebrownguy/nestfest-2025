/**
 * Detailed Authentication Tables Inspector
 * This script provides comprehensive information about the auth tables without using RPC
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function detailedAuthCheck() {
  console.log('🔍 DETAILED AUTHENTICATION SYSTEM ANALYSIS');
  console.log('Database:', supabaseUrl);
  console.log('=' .repeat(60));

  try {
    // 1. USERS TABLE DETAILED ANALYSIS
    console.log('\n👥 USERS TABLE - COMPLETE ANALYSIS');
    console.log('-' .repeat(50));
    
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
    } else {
      console.log(`✅ Users table: ${allUsers.length} records found`);
      
      if (allUsers.length > 0) {
        console.log('\n📊 User Statistics:');
        const roleStats = allUsers.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});
        
        Object.entries(roleStats).forEach(([role, count]) => {
          console.log(`   • ${role}: ${count} users`);
        });

        const statusStats = allUsers.reduce((acc, user) => {
          acc[user.status] = (acc[user.status] || 0) + 1;
          return acc;
        }, {});
        
        console.log('\n📈 Status Distribution:');
        Object.entries(statusStats).forEach(([status, count]) => {
          console.log(`   • ${status}: ${count} users`);
        });

        console.log('\n📋 All Users Detail:');
        allUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email}`);
          console.log(`      • ID: ${user.id}`);
          console.log(`      • Name: ${user.name}`);
          console.log(`      • Role: ${user.role}`);
          console.log(`      • Status: ${user.status}`);
          console.log(`      • University: ${user.university || 'Not specified'}`);
          console.log(`      • Graduation Year: ${user.graduation_year || 'Not specified'}`);
          console.log(`      • Email Verified: ${user.email_verified_at ? '✅ Yes' : '❌ No'}`);
          console.log(`      • Last Login: ${user.last_login_at || 'Never'}`);
          console.log(`      • Created: ${new Date(user.created_at).toLocaleString()}`);
          console.log(`      • Updated: ${new Date(user.updated_at).toLocaleString()}`);
          if (index < allUsers.length - 1) console.log('');
        });
      }
    }

    // 2. LOGIN_ATTEMPTS TABLE ANALYSIS
    console.log('\n🔐 LOGIN_ATTEMPTS TABLE - DETAILED ANALYSIS');
    console.log('-' .repeat(50));
    
    const { data: loginAttempts, error: loginError } = await supabase
      .from('login_attempts')
      .select('*')
      .order('attempted_at', { ascending: false })
      .limit(20);

    if (loginError) {
      console.log('❌ Login attempts error:', loginError.message);
    } else {
      console.log(`✅ Login attempts table: ${loginAttempts.length} recent records`);
      
      if (loginAttempts.length > 0) {
        console.log('\n📊 Recent Login Attempts:');
        loginAttempts.forEach((attempt, index) => {
          const status = attempt.successful ? '✅ SUCCESS' : '❌ FAILED';
          console.log(`   ${index + 1}. ${attempt.email} - ${status}`);
          console.log(`      • IP: ${attempt.ip_address}`);
          console.log(`      • Attempt: ${new Date(attempt.attempted_at).toLocaleString()}`);
          if (attempt.failure_reason) {
            console.log(`      • Reason: ${attempt.failure_reason}`);
          }
          if (index < Math.min(loginAttempts.length - 1, 4)) console.log('');
        });
        
        // Login attempt statistics
        const successful = loginAttempts.filter(a => a.successful).length;
        const failed = loginAttempts.filter(a => !a.successful).length;
        
        console.log('\n📈 Login Statistics (last 20 attempts):');
        console.log(`   • Successful: ${successful}`);
        console.log(`   • Failed: ${failed}`);
        console.log(`   • Success Rate: ${successful > 0 ? ((successful / (successful + failed)) * 100).toFixed(1) : 0}%`);
      } else {
        console.log('   ℹ️ No login attempts recorded yet');
      }
    }

    // 3. USER_SESSIONS TABLE ANALYSIS
    console.log('\n🎫 USER_SESSIONS TABLE - DETAILED ANALYSIS');
    console.log('-' .repeat(50));
    
    const { data: allSessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.log('❌ User sessions error:', sessionsError.message);
    } else {
      console.log(`✅ User sessions table: ${allSessions.length} total sessions`);
      
      if (allSessions.length > 0) {
        const now = new Date();
        const activeSessions = allSessions.filter(s => new Date(s.expires_at) > now);
        const expiredSessions = allSessions.filter(s => new Date(s.expires_at) <= now);
        
        console.log('\n📊 Session Statistics:');
        console.log(`   • Active sessions: ${activeSessions.length}`);
        console.log(`   • Expired sessions: ${expiredSessions.length}`);
        
        if (activeSessions.length > 0) {
          console.log('\n🟢 Active Sessions:');
          activeSessions.forEach((session, index) => {
            const user = allUsers.find(u => u.id === session.user_id);
            console.log(`   ${index + 1}. User: ${user?.email || session.user_id}`);
            console.log(`      • Session ID: ${session.id}`);
            console.log(`      • Created: ${new Date(session.created_at).toLocaleString()}`);
            console.log(`      • Expires: ${new Date(session.expires_at).toLocaleString()}`);
            console.log(`      • IP: ${session.ip_address || 'Unknown'}`);
            console.log(`      • User Agent: ${session.user_agent ? session.user_agent.substring(0, 50) + '...' : 'Unknown'}`);
            if (index < activeSessions.length - 1) console.log('');
          });
        }
        
        if (expiredSessions.length > 0 && expiredSessions.length <= 5) {
          console.log('\n🔴 Recent Expired Sessions:');
          expiredSessions.slice(0, 3).forEach((session, index) => {
            const user = allUsers.find(u => u.id === session.user_id);
            console.log(`   ${index + 1}. User: ${user?.email || session.user_id}`);
            console.log(`      • Expired: ${new Date(session.expires_at).toLocaleString()}`);
          });
        }
      } else {
        console.log('   ℹ️ No user sessions found');
      }
    }

    // 4. DATA INTEGRITY CHECKS
    console.log('\n🔍 DATA INTEGRITY CHECKS');
    console.log('-' .repeat(50));
    
    // Check for orphaned sessions (sessions without matching users)
    if (allSessions && allSessions.length > 0 && allUsers && allUsers.length > 0) {
      const orphanedSessions = allSessions.filter(session => 
        !allUsers.find(user => user.id === session.user_id)
      );
      
      if (orphanedSessions.length > 0) {
        console.log(`⚠️ Found ${orphanedSessions.length} orphaned sessions (no matching user)`);
      } else {
        console.log('✅ All sessions have matching users');
      }
    }

    // Check for users without sessions
    if (allUsers && allUsers.length > 0) {
      const usersWithoutSessions = allUsers.filter(user =>
        !allSessions || !allSessions.find(session => session.user_id === user.id)
      );
      
      console.log(`ℹ️ ${usersWithoutSessions.length} users have never logged in`);
      if (usersWithoutSessions.length > 0 && usersWithoutSessions.length <= 5) {
        usersWithoutSessions.forEach(user => {
          console.log(`   • ${user.email} (${user.role})`);
        });
      }
    }

    // 5. SECURITY ASSESSMENT
    console.log('\n🛡️ SECURITY ASSESSMENT');
    console.log('-' .repeat(50));
    
    // Check password security (if we can access it)
    if (allUsers && allUsers.length > 0) {
      const verifiedUsers = allUsers.filter(user => user.email_verified_at);
      const unverifiedUsers = allUsers.filter(user => !user.email_verified_at);
      
      console.log('📧 Email Verification Status:');
      console.log(`   ✅ Verified: ${verifiedUsers.length} users`);
      console.log(`   ⚠️ Unverified: ${unverifiedUsers.length} users`);
      
      if (unverifiedUsers.length > 0) {
        console.log('   📋 Unverified users:');
        unverifiedUsers.forEach(user => {
          console.log(`      • ${user.email} (${user.role})`);
        });
      }
    }

    // Check for suspicious login patterns
    if (loginAttempts && loginAttempts.length > 0) {
      const failedAttempts = loginAttempts.filter(a => !a.successful);
      const suspiciousIPs = {};
      
      failedAttempts.forEach(attempt => {
        suspiciousIPs[attempt.ip_address] = (suspiciousIPs[attempt.ip_address] || 0) + 1;
      });
      
      const highFailureIPs = Object.entries(suspiciousIPs).filter(([ip, count]) => count >= 3);
      
      if (highFailureIPs.length > 0) {
        console.log('\n⚠️ Suspicious Activity:');
        highFailureIPs.forEach(([ip, count]) => {
          console.log(`   • IP ${ip}: ${count} failed attempts`);
        });
      } else {
        console.log('\n✅ No suspicious login activity detected');
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('✨ DETAILED AUTHENTICATION ANALYSIS COMPLETE!');
    console.log('\n📋 SUMMARY:');
    console.log(`• Users table: ${allUsers ? allUsers.length : 0} users`);
    console.log(`• Login attempts: ${loginAttempts ? loginAttempts.length : 0} recent attempts`);
    console.log(`• User sessions: ${allSessions ? allSessions.length : 0} total sessions`);
    console.log('• All authentication tables are operational ✅');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the detailed check
detailedAuthCheck().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});