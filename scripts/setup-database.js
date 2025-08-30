/**
 * NestFest Database Setup Script
 * Configures both primary (Vercel Postgres) and backup (Supabase) databases
 */

const https = require('https');
const { promisify } = require('util');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function setupDatabases() {
  console.log('🚀 Starting NestFest Database Setup...\n');
  
  const baseUrl = 'https://nestfest.app';
  
  console.log('=' .repeat(60));
  console.log('🔍 CHECKING CURRENT DATABASE STATUS');
  console.log('=' .repeat(60));
  
  // Check primary database status
  console.log('\n📊 Checking primary database (Vercel Postgres)...');
  try {
    const primaryStatus = await makeRequest(`${baseUrl}/api/init-database`, {
      method: 'GET'
    });
    
    console.log('Primary Database Status:', primaryStatus.data);
    
    if (!primaryStatus.data.success) {
      console.log('⚠️  Primary database needs setup');
      
      // Attempt to initialize primary database
      console.log('🔄 Attempting to initialize primary database...');
      const primaryInit = await makeRequest(`${baseUrl}/api/init-database`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('Primary Database Init Result:', primaryInit.data);
    } else {
      console.log('✅ Primary database is operational');
    }
  } catch (error) {
    console.log('❌ Could not connect to primary database:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🔍 CHECKING BACKUP DATABASE (SUPABASE)');
  console.log('=' .repeat(60));
  
  // Check Supabase backup status
  console.log('\n📊 Checking Supabase backup database...');
  try {
    const supabaseStatus = await makeRequest(`${baseUrl}/api/supabase-init`, {
      method: 'GET'
    });
    
    console.log('Supabase Backup Status:', supabaseStatus.data);
    
    if (!supabaseStatus.data.success || supabaseStatus.data.status !== 'operational') {
      console.log('⚠️  Supabase backup database needs setup');
      
      // Attempt to initialize Supabase backup
      console.log('🔄 Attempting to initialize Supabase backup...');
      const supabaseInit = await makeRequest(`${baseUrl}/api/supabase-init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('Supabase Init Result:', supabaseInit.data);
    } else {
      console.log('✅ Supabase backup database is operational');
    }
  } catch (error) {
    console.log('❌ Could not connect to Supabase backup:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🧪 TESTING API ENDPOINTS');
  console.log('=' .repeat(60));
  
  const endpoints = [
    '/api/seed-users',
    '/api/admin/invite-user',
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing ${endpoint}...`);
    try {
      const test = await makeRequest(`${baseUrl}${endpoint}`, {
        method: 'GET'
      });
      
      if (test.status === 200 || test.status === 405) {
        console.log(`✅ ${endpoint} is accessible`);
      } else {
        console.log(`⚠️  ${endpoint} returned status ${test.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} failed:`, error.message);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 SETUP SUMMARY & RECOMMENDATIONS');
  console.log('=' .repeat(60));
  
  console.log(`
🎯 DATABASE CONFIGURATION STATUS:

1. PRIMARY DATABASE (Vercel Postgres):
   - Production URL: ${baseUrl}/api/init-database
   - Status: Check results above
   - Purpose: Main production database

2. BACKUP DATABASE (Supabase):
   - Production URL: ${baseUrl}/api/supabase-init
   - Status: Check results above
   - Purpose: Backup and redundancy system

🔧 MANUAL SETUP REQUIRED (if errors above):

1. Vercel Postgres Database:
   - Go to Vercel Dashboard > Your Project > Storage
   - Create a new Postgres database
   - Environment variables will be auto-added

2. Supabase Configuration:
   - Add these environment variables in Vercel:
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
     SUPABASE_SERVICE_KEY=your-service-role-key
     SUPABASE_ANON_KEY=your-anon-key

3. After adding environment variables:
   - Redeploy the project: vercel --prod
   - Run this script again to verify

🚀 AUTHENTICATION SYSTEM:
   - OAuth providers: Google, GitHub, Microsoft
   - Custom email/password authentication
   - JWT session management
   - Role-based access control (student, judge, admin)

📊 COMPETITION FEATURES:
   - Team formation and management
   - Submission tracking
   - Quadratic voting system
   - Real-time judging interface
   - Live dashboard with WebSocket updates
  `);
  
  console.log('\n✨ Database setup analysis complete!');
  console.log('🔄 Please address any issues shown above and redeploy if needed.\n');
}

// Run the setup
setupDatabases().catch(console.error);