const { chromium } = require('playwright');
const fs = require('fs');

async function testPitchFlow() {
  console.log('🚀 Starting NEST FEST Pitch Flow Testing...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { passed: 0, failed: 0, total: 0 }
  };

  try {
    // Test 1: Navigation to Pitch Section (Desktop)
    console.log('📍 Test 1: Desktop Pitch Navigation');
    const startTime = Date.now();
    
    await page.goto('https://nestfest.app');
    await page.waitForLoadState('networkidle');
    
    // Check if pitch section exists
    const pitchSection = await page.locator('#pitch').count();
    if (pitchSection === 0) {
      throw new Error('Pitch section with id="pitch" not found');
    }
    
    // Click desktop pitch navigation
    await page.locator('nav a[href="#pitch"]').first().click();
    await page.waitForTimeout(1000); // Allow scroll animation
    
    const scrollTime = Date.now() - startTime;
    
    // Verify we're at the pitch section
    const pitchSectionVisible = await page.locator('#pitch').isVisible();
    
    results.tests.push({
      test: 'Desktop Pitch Navigation',
      status: pitchSectionVisible ? 'PASSED' : 'FAILED',
      duration: `${scrollTime}ms`,
      details: pitchSectionVisible ? 'Successfully navigated to pitch section' : 'Failed to navigate to pitch section'
    });
    
    if (pitchSectionVisible) results.summary.passed++;
    else results.summary.failed++;
    results.summary.total++;
    
    console.log(`   ${pitchSectionVisible ? '✅' : '❌'} Navigation completed in ${scrollTime}ms`);
    
    // Test 2: Mobile Navigation
    console.log('\n📱 Test 2: Mobile Pitch Navigation');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const mobileStartTime = Date.now();
    
    // Open mobile menu
    await page.locator('button[aria-controls="mobile-menu"]').click();
    await page.waitForTimeout(500);
    
    // Click mobile pitch link
    await page.locator('#mobile-menu a[href="#pitch"]').click();
    await page.waitForTimeout(1000);
    
    const mobileScrollTime = Date.now() - mobileStartTime;
    const mobilePitchVisible = await page.locator('#pitch').isVisible();
    
    results.tests.push({
      test: 'Mobile Pitch Navigation',
      status: mobilePitchVisible ? 'PASSED' : 'FAILED',
      duration: `${mobileScrollTime}ms`,
      details: mobilePitchVisible ? 'Successfully navigated via mobile menu' : 'Failed mobile navigation'
    });
    
    if (mobilePitchVisible) results.summary.passed++;
    else results.summary.failed++;
    results.summary.total++;
    
    console.log(`   ${mobilePitchVisible ? '✅' : '❌'} Mobile navigation completed in ${mobileScrollTime}ms`);
    
    // Test 3: Content Verification
    console.log('\n📝 Test 3: Pitch Content Verification');
    await page.setViewportSize({ width: 1280, height: 720 });
    
    const pitchContent = await page.locator('#pitch').textContent();
    const hasSharkTank = pitchContent.includes('shark tank');
    const hasCompetition = pitchContent.includes('competition');
    const hasNestFest = pitchContent.includes('NEST FEST');
    
    const contentValid = hasSharkTank && hasCompetition && hasNestFest;
    
    results.tests.push({
      test: 'Pitch Content Verification',
      status: contentValid ? 'PASSED' : 'FAILED',
      duration: 'N/A',
      details: `Shark Tank: ${hasSharkTank}, Competition: ${hasCompetition}, NEST FEST: ${hasNestFest}`
    });
    
    if (contentValid) results.summary.passed++;
    else results.summary.failed++;
    results.summary.total++;
    
    console.log(`   ${contentValid ? '✅' : '❌'} Content verification: ${contentValid ? 'All key terms found' : 'Missing key terms'}`);
    
    // Test 4: CTA Button Functionality
    console.log('\n🔗 Test 4: Call-to-Action Buttons');
    
    // Test Register button
    const registerButton = page.locator('#pitch a[href="/register"] button').first();
    const registerExists = await registerButton.count() > 0;
    
    if (registerExists) {
      await registerButton.click();
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();
      const registerWorks = currentUrl.includes('/register');
      
      results.tests.push({
        test: 'Register CTA Button',
        status: registerWorks ? 'PASSED' : 'FAILED',
        duration: 'N/A',
        details: registerWorks ? `Successfully navigated to ${currentUrl}` : 'Failed to navigate to register page'
      });
      
      if (registerWorks) results.summary.passed++;
      else results.summary.failed++;
      results.summary.total++;
      
      console.log(`   ${registerWorks ? '✅' : '❌'} Register button: ${registerWorks ? 'Working correctly' : 'Failed'}`);
      
      // Navigate back
      await page.goto('https://nestfest.app');
      await page.waitForLoadState('networkidle');
    }
    
    // Test Get Started button
    const getStartedButton = page.locator('#pitch a[href="#contact"] button').first();
    const getStartedExists = await getStartedButton.count() > 0;
    
    if (getStartedExists) {
      const beforeScroll = await page.evaluate(() => window.pageYOffset);
      await getStartedButton.click();
      await page.waitForTimeout(1000);
      const afterScroll = await page.evaluate(() => window.pageYOffset);
      
      const scrolled = afterScroll > beforeScroll;
      
      results.tests.push({
        test: 'Get Started CTA Button',
        status: scrolled ? 'PASSED' : 'FAILED',
        duration: 'N/A',
        details: scrolled ? 'Successfully scrolled to contact section' : 'Failed to scroll to contact'
      });
      
      if (scrolled) results.summary.passed++;
      else results.summary.failed++;
      results.summary.total++;
      
      console.log(`   ${scrolled ? '✅' : '❌'} Get Started button: ${scrolled ? 'Scrolled to contact' : 'Failed'}`);
    }
    
    // Test 5: Performance Check
    console.log('\n⚡ Test 5: Navigation Performance');
    const perfStartTime = Date.now();
    
    await page.goto('https://nestfest.app');
    await page.waitForLoadState('networkidle');
    
    const navClickTime = Date.now();
    await page.locator('nav a[href="#pitch"]').first().click();
    await page.waitForTimeout(100); // Minimal wait
    
    const navigationSpeed = Date.now() - navClickTime;
    const performanceGood = navigationSpeed < 500; // Should be very fast
    
    results.tests.push({
      test: 'Navigation Performance',
      status: performanceGood ? 'PASSED' : 'FAILED',
      duration: `${navigationSpeed}ms`,
      details: `Navigation speed: ${navigationSpeed}ms (target: <500ms)`
    });
    
    if (performanceGood) results.summary.passed++;
    else results.summary.failed++;
    results.summary.total++;
    
    console.log(`   ${performanceGood ? '✅' : '❌'} Navigation speed: ${navigationSpeed}ms`);
    
    // Take final screenshot
    await page.locator('#pitch').scrollIntoViewIfNeeded();
    await page.screenshot({ 
      path: 'C:\\Users\\ICS Spare\\Desktop\\NestFest Event\\screenshots\\pitch-flow-test.png',
      fullPage: true 
    });
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    results.tests.push({
      test: 'Test Execution',
      status: 'FAILED',
      duration: 'N/A',
      details: `Error: ${error.message}`
    });
    results.summary.failed++;
    results.summary.total++;
  } finally {
    await browser.close();
  }
  
  // Generate Report
  console.log('\n📊 PITCH FLOW TEST RESULTS');
  console.log('================================');
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Success Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`);
  
  console.log('\nDetailed Results:');
  results.tests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.test}: ${test.status} (${test.duration})`);
    console.log(`   ${test.details}`);
  });
  
  // Save results
  fs.writeFileSync(
    'C:\\Users\\ICS Spare\\Desktop\\NestFest Event\\pitch-flow-test-results.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n📄 Results saved to: pitch-flow-test-results.json');
  console.log('📸 Screenshot saved to: screenshots/pitch-flow-test.png');
  
  return results;
}

if (require.main === module) {
  testPitchFlow()
    .then((results) => {
      const successRate = (results.summary.passed / results.summary.total) * 100;
      console.log(`\n🎯 FINAL GRADE: ${successRate >= 90 ? 'A+' : successRate >= 80 ? 'A' : successRate >= 70 ? 'B' : 'C'} (${successRate.toFixed(1)}%)`);
      process.exit(results.summary.failed === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testPitchFlow };