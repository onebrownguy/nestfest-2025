/**
 * Direct Email Service Test
 * Tests the email service directly to identify template issues
 */

const fs = require('fs');
const path = require('path');

// Mock Next.js environment
process.env.NODE_ENV = 'development';

async function testEmailServiceDirect() {
  console.log('🧪 Direct Email Service Test');
  console.log('='.repeat(50));

  try {
    // Since we can't directly import the ES modules in a simple Node script,
    // let's analyze the email service file directly
    
    const emailServicePath = path.join(__dirname, 'src/lib/integrations/email/email-service.ts');
    const configPath = path.join(__dirname, 'src/lib/integrations/config/index.ts');
    
    console.log('📁 Analyzing email service file...');
    
    if (!fs.existsSync(emailServicePath)) {
      throw new Error(`Email service file not found at: ${emailServicePath}`);
    }

    const emailServiceContent = fs.readFileSync(emailServicePath, 'utf8');
    
    // Analysis 1: Check sendPasswordResetEmail method
    console.log('\n🔍 Analysis 1: sendPasswordResetEmail Method');
    const passwordResetMatch = emailServiceContent.match(/async sendPasswordResetEmail\(([\s\S]*?)\{([\s\S]*?)(?=\n  \})/);
    
    if (passwordResetMatch) {
      console.log('✅ sendPasswordResetEmail method found');
      
      const methodBody = passwordResetMatch[2];
      
      // Check if it uses HTML directly
      if (methodBody.includes('html: `')) {
        console.log('✅ Method uses HTML content directly (CORRECT)');
      } else if (methodBody.includes('templateId')) {
        console.log('❌ Method uses templateId (POTENTIAL ISSUE)');
      }
      
      // Check if it uses sendEmail method
      if (methodBody.includes('return this.sendEmail(')) {
        console.log('✅ Uses sendEmail method');
      }
      
    } else {
      console.log('❌ sendPasswordResetEmail method not found');
    }

    // Analysis 2: Check sendTemplateEmail method usage
    console.log('\n🔍 Analysis 2: Template Usage Analysis');
    const sendTemplateEmailUsage = emailServiceContent.includes('sendTemplateEmail');
    const templateIdUsage = emailServiceContent.includes("templateKey: keyof typeof config.sendgrid.templates");
    
    if (sendTemplateEmailUsage) {
      console.log('⚠️  sendTemplateEmail method exists - check if used incorrectly');
    }
    
    if (templateIdUsage) {
      console.log('⚠️  Template configuration referenced - potential template issue');
    }

    // Analysis 3: Look for specific error patterns
    console.log('\n🔍 Analysis 3: Error Pattern Detection');
    
    const errorPatterns = [
      { pattern: 'Template not found', description: 'Template lookup error' },
      { pattern: 'passwordReset', description: 'Password reset template reference' },
      { pattern: 'config.sendgrid.templates', description: 'SendGrid template configuration' },
      { pattern: 'templateId:', description: 'Template ID usage' }
    ];
    
    errorPatterns.forEach(({ pattern, description }) => {
      if (emailServiceContent.includes(pattern)) {
        console.log(`⚠️  Found: ${pattern} - ${description}`);
      }
    });

    // Analysis 4: Check the actual sendPasswordResetEmail implementation
    console.log('\n🔍 Analysis 4: sendPasswordResetEmail Implementation Details');
    
    const sendPasswordResetEmailSection = emailServiceContent.match(/async sendPasswordResetEmail\(([\s\S]*?)^\s*\}/m);
    
    if (sendPasswordResetEmailSection) {
      const implementation = sendPasswordResetEmailSection[0];
      
      console.log('Method implementation found. Checking for issues...');
      
      // Check if it calls sendTemplateEmail instead of sendEmail
      if (implementation.includes('sendTemplateEmail')) {
        console.log('❌ ISSUE FOUND: Method calls sendTemplateEmail instead of sendEmail');
        console.log('   This would cause "Template not found" errors');
        console.log('   SOLUTION: Should call this.sendEmail() with HTML content');
      } else if (implementation.includes('this.sendEmail(')) {
        console.log('✅ Method correctly calls sendEmail');
      }
      
      // Check for template ID references
      if (implementation.includes('templateId')) {
        console.log('❌ ISSUE FOUND: Method references templateId');
        console.log('   This suggests template-based approach is being used');
      } else {
        console.log('✅ No templateId references found');
      }
      
      // Check for HTML content
      if (implementation.includes('subject: ') && implementation.includes('html: `')) {
        console.log('✅ Method contains HTML content');
      } else {
        console.log('⚠️  Method might not contain proper HTML content');
      }
    }

    // Analysis 5: Check config file for template configuration
    console.log('\n🔍 Analysis 5: Configuration Analysis');
    
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      if (configContent.includes('passwordReset')) {
        console.log('⚠️  Found passwordReset template configuration');
        console.log('   This might be causing the template lookup');
      }
      
      if (configContent.includes('templates:')) {
        console.log('⚠️  Found template configuration section');
        console.log('   Check if this is interfering with HTML approach');
      }
    }

    // Analysis 6: Generate recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('Based on the code analysis:');
    console.log('1. Verify sendPasswordResetEmail calls this.sendEmail() not this.sendTemplateEmail()');
    console.log('2. Ensure the method passes HTML content directly, not templateId');
    console.log('3. Check that no template configurations are interfering');
    console.log('4. Run the Playwright test to confirm runtime behavior');

    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Run: node playwright-password-reset-test.js');
    console.log('2. Start your development server first: npm run dev');
    console.log('3. Check the generated test report for runtime errors');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Show email service method for manual inspection
function showEmailServiceMethod() {
  console.log('\n📖 EMAIL SERVICE METHOD INSPECTION');
  console.log('='.repeat(50));
  
  const emailServicePath = path.join(__dirname, 'src/lib/integrations/email/email-service.ts');
  
  if (!fs.existsSync(emailServicePath)) {
    console.log('❌ Email service file not found');
    return;
  }

  const content = fs.readFileSync(emailServicePath, 'utf8');
  const lines = content.split('\n');
  
  // Find the sendPasswordResetEmail method
  let methodStart = -1;
  let methodEnd = -1;
  let braceCount = 0;
  let inMethod = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('async sendPasswordResetEmail(') && !inMethod) {
      methodStart = i;
      inMethod = true;
      braceCount = 0;
    }
    
    if (inMethod) {
      // Count braces to find method end
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceCount += openBraces - closeBraces;
      
      if (braceCount === 0 && line.includes('}') && i > methodStart) {
        methodEnd = i;
        break;
      }
    }
  }
  
  if (methodStart >= 0 && methodEnd >= 0) {
    console.log(`📍 Found sendPasswordResetEmail method (lines ${methodStart + 1}-${methodEnd + 1}):`);
    console.log('-'.repeat(50));
    
    for (let i = methodStart; i <= methodEnd; i++) {
      console.log(`${String(i + 1).padStart(3)}: ${lines[i]}`);
    }
    
    console.log('-'.repeat(50));
  } else {
    console.log('❌ Could not locate sendPasswordResetEmail method');
  }
}

// Run the analysis
if (require.main === module) {
  testEmailServiceDirect();
  showEmailServiceMethod();
}