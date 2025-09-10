const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function takeScreenshots() {
  let browser;
  
  try {
    console.log('Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // Ensure screenshots directory exists
    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots');
    }
    
    console.log('Taking screenshot of https://nest-fest.org/...');
    await page.goto('https://nest-fest.org/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for images to load
    await page.waitForTimeout(5000);
    
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
      
      // Also check main content area
      const main = document.querySelector('main') || document.querySelector('[role="main"]') || document.querySelector('.main');
      const computedMain = main ? window.getComputedStyle(main) : null;
      
      return {
        bodyBackground: computedBody.background,
        bodyBackgroundImage: computedBody.backgroundImage,
        bodyBackgroundColor: computedBody.backgroundColor,
        htmlBackground: computedHtml.background,
        htmlBackgroundImage: computedHtml.backgroundImage,
        htmlBackgroundColor: computedHtml.backgroundColor,
        mainBackground: computedMain ? computedMain.background : null,
        mainBackgroundImage: computedMain ? computedMain.backgroundImage : null,
        bodyClasses: body.className,
        htmlClasses: html.className,
        mainClasses: main ? main.className : null,
        title: document.title
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
    await page.waitForTimeout(5000);
    
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
      
      // Also check main content area
      const main = document.querySelector('main') || document.querySelector('[role="main"]') || document.querySelector('.main');
      const computedMain = main ? window.getComputedStyle(main) : null;
      
      return {
        bodyBackground: computedBody.background,
        bodyBackgroundImage: computedBody.backgroundImage,
        bodyBackgroundColor: computedBody.backgroundColor,
        htmlBackground: computedHtml.background,
        htmlBackgroundImage: computedHtml.backgroundImage,
        htmlBackgroundColor: computedHtml.backgroundColor,
        mainBackground: computedMain ? computedMain.background : null,
        mainBackgroundImage: computedMain ? computedMain.backgroundImage : null,
        bodyClasses: body.className,
        htmlClasses: html.className,
        mainClasses: main ? main.className : null,
        title: document.title
      };
    });
    
    console.log('nestfest.app background info:', JSON.stringify(backgroundInfoApp, null, 2));
    
    // Save analysis to file
    const analysis = {
      'nest-fest.org': backgroundInfo,
      'nestfest.app': backgroundInfoApp,
      timestamp: new Date().toISOString(),
      comparison: {
        backgroundImageDiff: backgroundInfo.bodyBackgroundImage !== backgroundInfoApp.bodyBackgroundImage,
        backgroundColorDiff: backgroundInfo.bodyBackgroundColor !== backgroundInfoApp.bodyBackgroundColor
      }
    };
    
    fs.writeFileSync('screenshots/background-analysis.json', JSON.stringify(analysis, null, 2));
    
    console.log('Screenshots and analysis completed!');
    console.log('Files created:');
    console.log('- screenshots/nest-fest-org-full.png');
    console.log('- screenshots/nest-fest-org-viewport.png');
    console.log('- screenshots/nestfest-app-full.png');
    console.log('- screenshots/nestfest-app-viewport.png');
    console.log('- screenshots/background-analysis.json');
    
  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

takeScreenshots().catch(console.error);