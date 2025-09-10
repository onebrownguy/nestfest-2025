const { chromium } = require('playwright');

async function analyzeSites() {
  console.log('🚀 Starting site analysis...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // Analyze nest-fest.org
    console.log('📸 Analyzing nest-fest.org...');
    await page.goto('https://nest-fest.org/', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    await page.waitForTimeout(5000);
    
    const screenshotPath1 = './screenshots/nest-fest-org-reference.png';
    await page.screenshot({ 
      path: screenshotPath1, 
      fullPage: true 
    });
    console.log('✅ nest-fest.org screenshot saved');
    
    // Get design info from nest-fest.org
    const nestFestDesign = await page.evaluate(() => {
      return {
        backgroundColor: window.getComputedStyle(document.body).backgroundColor,
        backgroundImage: window.getComputedStyle(document.body).backgroundImage,
        title: document.title,
        bodyContent: document.body.textContent.substring(0, 200)
      };
    });
    
    console.log('🎨 nest-fest.org design:', nestFestDesign);
    
    // Analyze nestfest.app
    console.log('📸 Analyzing nestfest.app...');
    await page.goto('https://nestfest.app/', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    await page.waitForTimeout(5000);
    
    const screenshotPath2 = './screenshots/nestfest-app-current.png';
    await page.screenshot({ 
      path: screenshotPath2, 
      fullPage: true 
    });
    console.log('✅ nestfest.app screenshot saved');
    
    // Check background image on nestfest.app
    const nestfestDesign = await page.evaluate(() => {
      const heroSection = document.querySelector('section');
      const backgroundDiv = heroSection ? heroSection.querySelector('div') : null;
      const img = heroSection ? heroSection.querySelector('img') : null;
      
      return {
        heroBgColor: heroSection ? window.getComputedStyle(heroSection).backgroundColor : null,
        heroBgImage: heroSection ? window.getComputedStyle(heroSection).backgroundImage : null,
        divBgImage: backgroundDiv ? window.getComputedStyle(backgroundDiv).backgroundImage : null,
        imgSrc: img ? img.src : null,
        imgAlt: img ? img.alt : null,
        imgStyle: img ? img.getAttribute('style') : null,
        overlayCount: heroSection ? heroSection.querySelectorAll('div[class*="bg-"]').length : 0
      };
    });
    
    console.log('🖼️ nestfest.app background analysis:', JSON.stringify(nestfestDesign, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('🏁 Analysis complete. Check screenshots folder.');
  }
}

analyzeSites();