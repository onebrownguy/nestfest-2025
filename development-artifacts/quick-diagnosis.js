const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function quickCheck(url, name) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  const networkErrors = [];
  page.on('response', response => {
    if (!response.ok()) {
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    const screenshotPath = path.join(process.cwd(), 'screenshots', `${name}-quick.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    const title = await page.title();
    const bodyText = await page.textContent('body');
    
    await browser.close();
    
    return {
      url,
      title,
      bodyLength: bodyText?.length || 0,
      errors,
      networkErrors,
      screenshotPath,
      success: true
    };
  } catch (error) {
    await browser.close();
    return {
      url,
      error: error.message,
      errors,
      networkErrors,
      success: false
    };
  }
}

async function main() {
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  const results = await Promise.all([
    quickCheck('https://nestfest.app', 'nestfest-app'),
    quickCheck('https://nestfest-16yjmlfne-abel-rincons-projects.vercel.app', 'vercel-deployment')
  ]);
  
  results.forEach((result, i) => {
    console.log(`\n${i === 0 ? 'PRODUCTION' : 'DEPLOYMENT'}: ${result.url}`);
    if (result.success) {
      console.log(`✅ Loaded successfully`);
      console.log(`📄 Title: ${result.title}`);
      console.log(`📏 Content: ${result.bodyLength} chars`);
      console.log(`🚨 Console errors: ${result.errors.length}`);
      console.log(`🌐 Network errors: ${result.networkErrors.length}`);
      console.log(`📸 Screenshot: ${result.screenshotPath}`);
      
      if (result.errors.length > 0) {
        console.log(`Errors: ${result.errors.join(', ')}`);
      }
      if (result.networkErrors.length > 0) {
        console.log(`Network issues: ${result.networkErrors.join(', ')}`);
      }
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
  });
}

main().catch(console.error);