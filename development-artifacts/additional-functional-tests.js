const { chromium } = require('playwright');

async function runAdditionalTests() {
  console.log('Running additional functional tests on https://nestfest.app...');
  
  const browser = await chromium.launch({ headless: false }); // Show browser for demo
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();

  try {
    // Test 1: Homepage interaction and navigation flow
    console.log('📋 Test 1: Homepage navigation flow');
    await page.goto('https://nestfest.app/');
    await page.waitForLoadState('networkidle');
    
    // Check for critical elements
    const hasLogin = await page.$('text=Login') !== null;
    const hasLiveEvent = await page.$('text=Live Event') !== null;
    const hasFooter = await page.$('footer') !== null;
    
    console.log(`  ✓ Login button present: ${hasLogin}`);
    console.log(`  ✓ Live Event button present: ${hasLiveEvent}`);
    console.log(`  ✓ Footer present: ${hasFooter}`);

    // Test 2: Form validation on registration
    console.log('\n📋 Test 2: Registration form validation');
    await page.goto('https://nestfest.app/register');
    await page.waitForLoadState('networkidle');
    
    // Try submitting empty form
    const submitButton = await page.$('button[type="submit"], input[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      await page.waitForTimeout(2000); // Wait for validation messages
      
      const errorMessages = await page.$$eval(
        '[role="alert"], .error, .validation-error, .invalid-feedback, [data-error]', 
        elements => elements.map(el => el.textContent).filter(text => text.trim())
      );
      
      console.log(`  ✓ Form validation messages found: ${errorMessages.length > 0}`);
      if (errorMessages.length > 0) {
        console.log(`    Messages: ${errorMessages.slice(0, 3).join(', ')}`);
      }
    }

    // Test 3: Login form functionality
    console.log('\n📋 Test 3: Login form interaction');
    await page.goto('https://nestfest.app/login');
    await page.waitForLoadState('networkidle');
    
    // Fill in some test data (won't submit)
    const emailField = await page.$('input[name="email"], input[type="email"]');
    const passwordField = await page.$('input[name="password"], input[type="password"]');
    
    if (emailField && passwordField) {
      await emailField.fill('test@example.com');
      await passwordField.fill('testpassword');
      
      const emailValue = await emailField.inputValue();
      const passwordValue = await passwordField.inputValue();
      
      console.log(`  ✓ Email field working: ${emailValue === 'test@example.com'}`);
      console.log(`  ✓ Password field working: ${passwordValue === 'testpassword'}`);
      
      // Clear fields
      await emailField.clear();
      await passwordField.clear();
    }

    // Test 4: Contact form functionality
    console.log('\n📋 Test 4: Contact form interaction');
    await page.goto('https://nestfest.app/contact');
    await page.waitForLoadState('networkidle');
    
    const contactForm = await page.$('form');
    if (contactForm) {
      const firstNameField = await page.$('input[name="firstName"]');
      const emailField = await page.$('input[name="email"], input[type="email"]');
      const messageField = await page.$('textarea[name="message"]');
      
      if (firstNameField) {
        await firstNameField.fill('Test User');
        console.log(`  ✓ First name field working: ${(await firstNameField.inputValue()) === 'Test User'}`);
      }
      
      if (emailField) {
        await emailField.fill('test@nestfest.app');
        console.log(`  ✓ Email field working: ${(await emailField.inputValue()) === 'test@nestfest.app'}`);
      }
      
      if (messageField) {
        await messageField.fill('This is a test message from the automated testing system.');
        console.log(`  ✓ Message field working: ${(await messageField.inputValue()).includes('test message')}`);
      }
    }

    // Test 5: Responsive design check
    console.log('\n📋 Test 5: Responsive design test');
    await page.goto('https://nestfest.app/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileNav = await page.$('nav, header');
    const mobileNavVisible = mobileNav ? await mobileNav.isVisible() : false;
    console.log(`  ✓ Mobile navigation visible: ${mobileNavVisible}`);
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const tabletLayout = await page.$('main, .container, .content');
    const tabletLayoutVisible = tabletLayout ? await tabletLayout.isVisible() : false;
    console.log(`  ✓ Tablet layout working: ${tabletLayoutVisible}`);

    // Reset to desktop
    await page.setViewportSize({ width: 1366, height: 768 });

    // Test 6: Page loading performance
    console.log('\n📋 Test 6: Performance check');
    const performancePages = [
      { url: '/', name: 'Homepage' },
      { url: '/about', name: 'About' },
      { url: '/login', name: 'Login' },
      { url: '/contact', name: 'Contact' }
    ];

    for (const testPage of performancePages) {
      const startTime = Date.now();
      await page.goto(`https://nestfest.app${testPage.url}`);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      const isGood = loadTime < 3000;
      const status = isGood ? '✓' : '⚠️';
      console.log(`  ${status} ${testPage.name}: ${loadTime}ms ${isGood ? '(Good)' : '(Slow)'}`);
    }

    // Test 7: Basic SEO elements
    console.log('\n📋 Test 7: SEO elements check');
    await page.goto('https://nestfest.app/');
    
    const title = await page.title();
    const metaDescription = await page.$eval('meta[name="description"]', el => el.content).catch(() => null);
    const h1 = await page.$('h1');
    const h1Text = h1 ? await h1.textContent() : null;
    
    console.log(`  ✓ Page title: "${title}" ${title.length > 0 ? '(Good)' : '(Missing)'}`);
    console.log(`  ✓ Meta description: ${metaDescription ? `"${metaDescription.substring(0, 50)}..."` : 'Missing'}`);
    console.log(`  ✓ H1 heading: ${h1Text ? `"${h1Text}"` : 'Missing'}`);

    console.log('\n🎉 Additional testing completed successfully!');
    
    // Keep browser open for 5 seconds to see results
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('Error during additional testing:', error);
  } finally {
    await browser.close();
  }
}

runAdditionalTests().catch(console.error);