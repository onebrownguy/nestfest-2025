const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`${msg.type()}: ${msg.text()}`));
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 10000 });
    
    // Test accessibility - check if elements are focusable
    const accessibilityTest = await page.evaluate(() => {
      const results = {
        focusableElements: 0,
        buttonsWithLabels: 0,
        imagesWithAlt: 0,
        formsWithLabels: 0,
        headingHierarchy: []
      };
      
      // Count focusable elements
      const focusableSelectors = 'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])';
      results.focusableElements = document.querySelectorAll(focusableSelectors).length;
      
      // Check button accessibility
      document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.trim() || btn.getAttribute('aria-label')) {
          results.buttonsWithLabels++;
        }
      });
      
      // Check images
      document.querySelectorAll('img').forEach(img => {
        if (img.getAttribute('alt')) {
          results.imagesWithAlt++;
        }
      });
      
      // Check form labels
      document.querySelectorAll('input').forEach(input => {
        const hasLabel = document.querySelector(`label[for="${input.id}"]`) || 
                    input.closest('label') ||
                    input.getAttribute('aria-label') ||
                    input.getAttribute('placeholder');
        if (hasLabel) {
          results.formsWithLabels++;
        }
      });
      
      // Check heading hierarchy
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
        const count = document.querySelectorAll(tag).length;
        if (count > 0) {
          results.headingHierarchy.push(`${tag}: ${count}`);
        }
      });
      
      return results;
    });
    
    console.log('Accessibility analysis:', JSON.stringify(accessibilityTest, null, 2));
    console.log('Console messages found:', consoleLogs.length);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();