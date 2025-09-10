const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function diagnoseSite(url, urlName) {
  console.log(`\n🔍 Diagnosing: ${url}`);
  console.log(`="=".repeat(60)`);
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down to observe
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
    console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  // Capture network failures
  const networkFailures = [];
  page.on('response', response => {
    if (!response.ok()) {
      networkFailures.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
      console.log(`[NETWORK ERROR] ${response.status()} ${response.url()}`);
    }
  });
  
  // Capture unhandled errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
    console.log(`[PAGE ERROR] ${error.message}`);
  });
  
  try {
    console.log(`\n⏳ Navigating to ${url}...`);
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait a bit for any lazy loading
    await page.waitForTimeout(3000);
    
    console.log(`\n📸 Taking screenshot...`);
    const screenshotPath = path.join(process.cwd(), 'screenshots', `${urlName}-current-state.png`);
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    console.log(`Screenshot saved: ${screenshotPath}`);
    
    // Check what's actually rendered
    const title = await page.title();
    console.log(`\n📄 Page Title: "${title}"`);
    
    // Check for key elements
    const bodyText = await page.textContent('body');
    const bodyLength = bodyText ? bodyText.trim().length : 0;
    console.log(`📏 Body content length: ${bodyLength} characters`);
    
    if (bodyLength < 100) {
      console.log(`⚠️  Very little content detected!`);
      console.log(`Body text preview: "${bodyText?.substring(0, 200)}"`);
    }
    
    // Check for specific NestFest elements
    const nestfestElements = await page.evaluate(() => {
      const elements = {
        hasNavigation: !!document.querySelector('nav, [role="navigation"]'),
        hasHeader: !!document.querySelector('header, h1, .header'),
        hasMainContent: !!document.querySelector('main, .main-content, .container'),
        hasCompetitionInfo: document.body.textContent.toLowerCase().includes('competition'),
        hasNestFest: document.body.textContent.toLowerCase().includes('nestfest'),
        hasButtons: document.querySelectorAll('button, .btn').length,
        hasLinks: document.querySelectorAll('a').length,
        hasImages: document.querySelectorAll('img').length
      };
      return elements;
    });
    
    console.log(`\n🧩 Element Analysis:`);
    Object.entries(nestfestElements).forEach(([key, value]) => {
      const icon = value ? '✅' : '❌';
      console.log(`  ${icon} ${key}: ${value}`);
    });
    
    // Check for error messages
    const errorIndicators = await page.evaluate(() => {
      const errorTexts = ['error', '404', '500', 'not found', 'something went wrong', 'application error'];
      const bodyText = document.body.textContent.toLowerCase();
      return errorTexts.filter(text => bodyText.includes(text));
    });
    
    if (errorIndicators.length > 0) {
      console.log(`\n🚨 Error indicators found: ${errorIndicators.join(', ')}`);
    }
    
    // Check loading states
    const loadingElements = await page.evaluate(() => {
      const selectors = ['.loading', '.spinner', '[aria-busy="true"]', '.skeleton'];
      return selectors.filter(selector => document.querySelector(selector)).length;
    });
    
    if (loadingElements > 0) {
      console.log(`\n⏳ Loading elements still visible: ${loadingElements}`);
    }
    
    return {
      url,
      title,
      consoleLogs,
      networkFailures,
      pageErrors,
      bodyLength,
      nestfestElements,
      errorIndicators,
      loadingElements,
      screenshotPath
    };
    
  } catch (error) {
    console.log(`\n💥 Failed to load ${url}:`);
    console.log(`Error: ${error.message}`);
    
    // Try to screenshot even if page failed
    try {
      const errorScreenshotPath = path.join(process.cwd(), 'screenshots', `${urlName}-error-state.png`);
      await page.screenshot({ 
        path: errorScreenshotPath,
        fullPage: true 
      });
      console.log(`Error screenshot saved: ${errorScreenshotPath}`);
    } catch (screenshotError) {
      console.log(`Could not capture error screenshot: ${screenshotError.message}`);
    }
    
    return {
      url,
      error: error.message,
      consoleLogs,
      networkFailures,
      pageErrors
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  // Ensure screenshots directory exists
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  console.log(`🚀 Starting NestFest Deployment Diagnosis`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  const urls = [
    { url: 'https://nestfest.app', name: 'production' },
    { url: 'https://nestfest-16yjmlfne-abel-rincons-projects.vercel.app', name: 'latest-deployment' }
  ];
  
  const results = [];
  
  for (const { url, name } of urls) {
    const result = await diagnoseSite(url, name);
    results.push(result);
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate summary report
  console.log(`\n\n📋 DIAGNOSIS SUMMARY`);
  console.log(`${"=".repeat(60)}`);
  
  results.forEach((result, index) => {
    console.log(`\n🌐 ${urls[index].name.toUpperCase()}: ${result.url}`);
    
    if (result.error) {
      console.log(`❌ FAILED TO LOAD: ${result.error}`);
    } else {
      console.log(`📄 Title: ${result.title}`);
      console.log(`📏 Content: ${result.bodyLength} characters`);
      console.log(`🚨 Console Errors: ${result.consoleLogs.filter(log => log.type === 'error').length}`);
      console.log(`🌐 Network Failures: ${result.networkFailures.length}`);
      console.log(`💥 Page Errors: ${result.pageErrors.length}`);
      
      if (result.errorIndicators?.length > 0) {
        console.log(`⚠️  Error keywords: ${result.errorIndicators.join(', ')}`);
      }
      
      // Key element status
      const criticalElements = ['hasNestFest', 'hasMainContent', 'hasHeader'];
      const missingCritical = criticalElements.filter(key => !result.nestfestElements?.[key]);
      if (missingCritical.length > 0) {
        console.log(`🚫 Missing critical elements: ${missingCritical.join(', ')}`);
      }
    }
  });
  
  console.log(`\n\n🎯 RECOMMENDED NUCLEAR FIX APPROACH:`);
  
  const productionResult = results[0];
  const deploymentResult = results[1];
  
  if (productionResult.error && deploymentResult.error) {
    console.log(`❌ BOTH SITES COMPLETELY BROKEN`);
    console.log(`   → Check build process and dependencies`);
    console.log(`   → Verify environment variables`);
    console.log(`   → Consider reverting to last working commit`);
  } else if (productionResult.bodyLength < 100 || deploymentResult.bodyLength < 100) {
    console.log(`❌ MINIMAL/NO CONTENT RENDERING`);
    console.log(`   → Likely Next.js routing or component issue`);
    console.log(`   → Check app/page.tsx or pages/index.tsx`);
    console.log(`   → Verify component imports and exports`);
  } else if ((productionResult.pageErrors?.length > 0) || (deploymentResult.pageErrors?.length > 0)) {
    console.log(`❌ JAVASCRIPT RUNTIME ERRORS`);
    console.log(`   → Fix component errors first`);
    console.log(`   → Check React component syntax`);
    console.log(`   → Verify all imports resolve correctly`);
  }
  
  console.log(`\n📁 Screenshots saved in: ${screenshotsDir}`);
  console.log(`🔍 Check the screenshots to see exact visual state`);
}

main().catch(console.error);