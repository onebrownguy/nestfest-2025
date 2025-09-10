/**
 * Quick Test on Correct Port (3003)
 * Tests password reset form on the port where server is actually running
 */

const { chromium } = require('playwright');

async function quickTest() {
  console.log('🧪 Quick Test on Port 3003');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Set up logging
  page.on('console', msg => console.log(`📝 Console: ${msg.text()}`));
  page.on('request', request => console.log(`🔄 Request: ${request.method()} ${request.url()}`));
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status >= 400) {
      console.log(`❌ Error: ${status} ${url}`);
    } else {
      console.log(`✅ Success: ${status} ${url}`);
    }
  });
  
  try {
    console.log('🌐 Navigating to http://localhost:3003/forgot-password');
    await page.goto('http://localhost:3003/forgot-password', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: './quick-test-screenshot.png', fullPage: true });
    
    // Check if the form exists
    const emailInput = await page.locator('input[name="email"]');
    const submitButton = await page.locator('button[type="submit"]');
    
    if (await emailInput.count() === 0) {
      console.log('❌ Email input not found');
    } else {
      console.log('✅ Email input found');
    }
    
    if (await submitButton.count() === 0) {
      console.log('❌ Submit button not found');
    } else {
      console.log('✅ Submit button found');
    }
    
    // Try submitting the form
    console.log('📧 Filling form with test email...');
    await emailInput.fill('test@example.com');
    
    // Monitor for API requests
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/reset-password'),
      { timeout: 10000 }
    );
    
    console.log('🔄 Submitting form...');
    await submitButton.click();
    
    try {
      const response = await responsePromise;
      console.log(`📡 API Response: ${response.status()}`);
      const responseBody = await response.json();
      console.log('📄 Response body:', JSON.stringify(responseBody, null, 2));
    } catch (error) {
      console.log(`❌ API request failed or timed out: ${error.message}`);
    }
    
    // Wait and take final screenshot
    await page.waitForTimeout(3000);
    await page.screenshot({ path: './quick-test-final-screenshot.png', fullPage: true });
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

quickTest();