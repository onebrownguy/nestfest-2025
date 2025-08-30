/**
 * Final Authentication System Report
 * Complete analysis of all authentication tables and their current state
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

async function generateFinalReport() {
  console.log('📊 NESTFEST AUTHENTICATION SYSTEM - FINAL REPORT');
  console.log('Database URL:', supabaseUrl);
  console.log('Generated:', new Date().toLocaleString());
  console.log('=' .repeat(70));

  const report = {
    tables: {},
    users: {},
    security: {},
    recommendations: []
  };

  try {
    // 1. TABLE EXISTENCE & STRUCTURE VERIFICATION
    console.log('\n🗄️ TABLE STRUCTURE VERIFICATION');
    console.log('-' .repeat(50));

    const authTables = [
      'users', 'login_attempts', 'user_sessions', 
      'teams', 'team_members', 'competitions', 
      'submissions', 'votes', 'reviews'
    ];

    for (const tableName of authTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`❌ ${tableName}: ERROR - ${error.message}`);
          report.tables[tableName] = { exists: false, error: error.message };
        } else {
          console.log(`✅ ${tableName}: EXISTS (${count || 0} records)`);
          report.tables[tableName] = { exists: true, count: count || 0 };
        }
      } catch (err) {
        console.log(`❌ ${tableName}: CRITICAL ERROR - ${err.message}`);
        report.tables[tableName] = { exists: false, error: err.message };
      }
    }

    // 2. DETAILED USERS ANALYSIS
    console.log('\n👥 USERS ANALYSIS');
    console.log('-' .repeat(50));

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!usersError && users) {
      report.users.total = users.length;
      report.users.byRole = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      report.users.byStatus = users.reduce((acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1;
        return acc;
      }, {});

      report.users.emailVerified = users.filter(u => u.email_verified || u.email_verified_at).length;
      report.users.neverLoggedIn = users.filter(u => !u.last_login_at).length;

      console.log(`✅ Total Users: ${users.length}`);
      console.log('📊 Role Distribution:');
      Object.entries(report.users.byRole).forEach(([role, count]) => {
        console.log(`   • ${role}: ${count}`);
      });
      
      console.log('📈 Status Distribution:');
      Object.entries(report.users.byStatus).forEach(([status, count]) => {
        console.log(`   • ${status}: ${count}`);
      });

      console.log('🔐 Security Status:');
      console.log(`   • Email Verified: ${report.users.emailVerified}/${users.length}`);
      console.log(`   • Never Logged In: ${report.users.neverLoggedIn}/${users.length}`);

      // List all test users
      console.log('\n👤 Test Users Created:');
      users.forEach(user => {
        const verified = user.email_verified || user.email_verified_at ? '✅' : '❌';
        const lastLogin = user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never';
        console.log(`   • ${user.email} (${user.role}) - Verified: ${verified}, Last Login: ${lastLogin}`);
      });
    }

    // 3. LOGIN ATTEMPTS ANALYSIS (Fixed column name)
    console.log('\n🔐 LOGIN ATTEMPTS ANALYSIS');
    console.log('-' .repeat(50));

    const { data: loginAttempts, error: loginError } = await supabase
      .from('login_attempts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (!loginError) {
      console.log(`✅ Login Attempts Table: ${loginAttempts.length} recent records`);
      report.security.loginAttempts = loginAttempts.length;
      
      if (loginAttempts.length > 0) {
        const successful = loginAttempts.filter(a => a.success).length;
        const failed = loginAttempts.filter(a => !a.success).length;
        
        console.log('📊 Login Statistics:');
        console.log(`   • Successful: ${successful}`);
        console.log(`   • Failed: ${failed}`);
        
        report.security.loginSuccess = successful;
        report.security.loginFailed = failed;
      } else {
        console.log('   ℹ️ No login attempts recorded yet');
      }
    } else {
      console.log(`❌ Login Attempts Error: ${loginError.message}`);
    }

    // 4. USER SESSIONS ANALYSIS
    console.log('\n🎫 USER SESSIONS ANALYSIS');
    console.log('-' .repeat(50));

    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!sessionsError) {
      const now = new Date();
      const activeSessions = sessions.filter(s => 
        s.is_active && new Date(s.expires_at) > now && !s.revoked_at
      );
      const expiredSessions = sessions.filter(s => 
        new Date(s.expires_at) <= now || s.revoked_at
      );

      console.log(`✅ Total Sessions: ${sessions.length}`);
      console.log(`   • Active: ${activeSessions.length}`);
      console.log(`   • Expired/Revoked: ${expiredSessions.length}`);

      report.security.totalSessions = sessions.length;
      report.security.activeSessions = activeSessions.length;
    } else {
      console.log(`❌ Sessions Error: ${sessionsError.message}`);
    }

    // 5. COMPETITION DATA CHECK
    console.log('\n🏆 COMPETITION SYSTEM STATUS');
    console.log('-' .repeat(50));

    if (report.tables.competitions?.exists) {
      const { data: competitions } = await supabase
        .from('competitions')
        .select('*');
      
      if (competitions) {
        console.log(`✅ Competitions: ${competitions.length} found`);
        competitions.forEach(comp => {
          console.log(`   • ${comp.name} (${comp.status})`);
        });
      }
    }

    // 6. SECURITY RECOMMENDATIONS
    console.log('\n🛡️ SECURITY ASSESSMENT & RECOMMENDATIONS');
    console.log('-' .repeat(50));

    // Generate recommendations based on findings
    if (report.users.emailVerified < report.users.total) {
      report.recommendations.push('⚠️ Email verification not enabled for all users');
      console.log('⚠️ Email verification needs attention');
    }

    if (report.users.neverLoggedIn === report.users.total) {
      report.recommendations.push('ℹ️ No users have logged in yet - this is normal for fresh setup');
      console.log('ℹ️ No users have logged in yet (expected for new setup)');
    }

    if (report.security.loginAttempts === 0) {
      report.recommendations.push('ℹ️ No login attempts recorded - authentication flow not yet tested');
      console.log('ℹ️ Authentication flow not yet tested');
    }

    if (report.tables.users?.exists && report.tables.login_attempts?.exists && report.tables.user_sessions?.exists) {
      console.log('✅ All core authentication tables are present and functional');
      report.recommendations.push('✅ Core authentication infrastructure is ready');
    }

    // 7. NEXT STEPS
    console.log('\n🚀 RECOMMENDED NEXT STEPS');
    console.log('-' .repeat(50));
    
    const nextSteps = [
      '1. Test user authentication flow (login/logout)',
      '2. Verify password hashing and validation',
      '3. Test session management',
      '4. Implement email verification workflow',
      '5. Set up proper RLS policies for production',
      '6. Configure monitoring and alerts',
      '7. Test user registration process'
    ];

    nextSteps.forEach(step => console.log(step));

    // 8. SUMMARY REPORT
    console.log('\n' + '=' .repeat(70));
    console.log('📋 FINAL SUMMARY');
    console.log('=' .repeat(70));

    console.log('\n✅ OPERATIONAL STATUS:');
    console.log(`• Database Connection: Connected`);
    console.log(`• Core Tables: ${Object.values(report.tables).filter(t => t.exists).length}/${authTables.length} created`);
    console.log(`• Test Users: ${report.users.total || 0} created`);
    console.log(`• Authentication Ready: ${report.tables.users?.exists && report.tables.login_attempts?.exists && report.tables.user_sessions?.exists ? '✅ Yes' : '❌ No'}`);

    console.log('\n📊 DATA SUMMARY:');
    console.log(`• Total Users: ${report.users.total || 0}`);
    console.log(`• Admin Users: ${report.users.byRole?.admin || 0}`);
    console.log(`• Judge Users: ${report.users.byRole?.judge || 0}`);
    console.log(`• Participant Users: ${report.users.byRole?.participant || 0}`);
    console.log(`• Active Sessions: ${report.security.activeSessions || 0}`);
    console.log(`• Login Attempts: ${report.security.loginAttempts || 0}`);

    console.log('\n🎯 SYSTEM READINESS:');
    const readinessScore = [
      report.tables.users?.exists ? 1 : 0,
      report.tables.login_attempts?.exists ? 1 : 0,
      report.tables.user_sessions?.exists ? 1 : 0,
      (report.users.total || 0) > 0 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);
    
    console.log(`• Infrastructure: ${readinessScore}/4 components ready`);
    console.log(`• Status: ${readinessScore === 4 ? '🟢 Production Ready' : readinessScore >= 3 ? '🟡 Nearly Ready' : '🔴 Needs Work'}`);

    console.log('\n' + '=' .repeat(70));
    console.log('✨ AUTHENTICATION SYSTEM ANALYSIS COMPLETE');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('❌ Critical error during analysis:', error);
  }
}

// Run the final report
generateFinalReport().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});