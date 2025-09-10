const { chromium } = require('playwright');
const fs = require('fs');

async function takeScreenshots() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('Taking screenshot of https://nest-fest.org/...');
    await page.goto('https://nest-fest.org/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for images to load
    await page.waitForTimeout(3000);
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'screenshots/nest-fest-org-full.png',
      fullPage: true 
    });
    
    // Take viewport screenshot
    await page.screenshot({ 
      path: 'screenshots/nest-fest-org-viewport.png'
    });
    
    // Get computed styles for background analysis
    const backgroundInfo = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const computedBody = window.getComputedStyle(body);
      const computedHtml = window.getComputedStyle(html);
      
      return {
        bodyBackground: computedBody.background,
        bodyBackgroundImage: computedBody.backgroundImage,
        bodyBackgroundColor: computedBody.backgroundColor,
        htmlBackground: computedHtml.background,
        htmlBackgroundImage: computedHtml.backgroundImage,
        htmlBackgroundColor: computedHtml.backgroundColor,
        bodyClasses: body.className,
        htmlClasses: html.className
      };
    });
    
    console.log('nest-fest.org background info:', JSON.stringify(backgroundInfo, null, 2));
    
    // Now take screenshot of nestfest.app
    console.log('Taking screenshot of https://nestfest.app/...');
    await page.goto('https://nestfest.app/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for images to load
    await page.waitForTimeout(3000);
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'screenshots/nestfest-app-full.png',
      fullPage: true 
    });
    
    // Take viewport screenshot
    await page.screenshot({ 
      path: 'screenshots/nestfest-app-viewport.png'
    });
    
    // Get computed styles for background analysis
    const backgroundInfoApp = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const computedBody = window.getComputedStyle(body);
      const computedHtml = window.getComputedStyle(html);
      
      return {
        bodyBackground: computedBody.background,
        bodyBackgroundImage: computedBody.backgroundImage,
        bodyBackgroundColor: computedBody.backgroundColor,
        htmlBackground: computedHtml.background,
        htmlBackgroundImage: computedHtml.backgroundImage,
        htmlBackgroundColor: computedHtml.backgroundColor,
        bodyClasses: body.className,
        htmlClasses: html.className
      };
    });
    
    console.log('nestfest.app background info:', JSON.stringify(backgroundInfoApp, null, 2));
    
    // Save analysis to file
    const analysis = {
      'nest-fest.org': backgroundInfo,
      'nestfest.app': backgroundInfoApp,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('screenshots/background-analysis.json', JSON.stringify(analysis, null, 2));
    
    console.log('Screenshots and analysis completed!');
    
  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots().catch(console.error);