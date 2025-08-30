#!/usr/bin/env node
/**
 * Vercel Setup Script
 * Automates Vercel CLI setup and environment sync
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Vercel integration...\n');

function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description} exists`);
    return true;
  } else {
    console.log(`❌ ${description} missing`);
    return false;
  }
}

async function setupVercel() {
  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI already installed\n');
  } catch {
    console.log('📦 Installing Vercel CLI...');
    runCommand('npm install -g vercel', 'Vercel CLI installation');
  }

  // Check required files
  console.log('🔍 Checking project configuration...');
  const hasVercelConfig = checkFile(path.join(__dirname, '..', 'vercel.json'), 'vercel.json');
  const hasEnvTemplate = checkFile(path.join(__dirname, '..', '.env.template'), '.env.template');
  const hasEnvLocal = checkFile(path.join(__dirname, '..', '.env.local'), '.env.local');
  
  if (!hasEnvLocal) {
    console.log('\n⚠️  .env.local not found. Copy .env.template to .env.local and fill in your values');
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Run: vercel login (if not already logged in)');
  console.log('2. Run: vercel link (to link this project)');
  console.log('3. Run: npm run env:pull (to sync environment variables)');
  console.log('4. Run: npm run deploy:preview (for preview deployment)');
  console.log('\n🎯 Your project is ready for Vercel deployment!');
}

setupVercel().catch(console.error);