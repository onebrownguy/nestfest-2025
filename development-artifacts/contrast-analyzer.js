const puppeteer = require('puppeteer');

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function parseColor(colorStr) {
  if (colorStr.startsWith('rgb')) {
    const matches = colorStr.match(/\d+/g);
    return {
      r: parseInt(matches[0]),
      g: parseInt(matches[1]),
      b: parseInt(matches[2])
    };
  }
  
  if (colorStr.startsWith('#')) {
    return hexToRgb(colorStr);
  }
  
  return { r: 255, g: 255, b: 255 }; // default white
}

function getLuminance(r, g, b) {
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

function getContrastRatio(color1, color2) {
  const l1 = getLuminance(color1.r, color1.g, color1.b);
  const l2 = getLuminance(color2.r, color2.g, color2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function evaluateContrast(ratio, fontSize, fontWeight) {
  const isLargeText = (fontSize >= 18 && fontWeight >= 700) || fontSize >= 24;
  const aaThreshold = isLargeText ? 3 : 4.5;
  const aaaThreshold = isLargeText ? 4.5 : 7;
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    passAA: ratio >= aaThreshold,
    passAAA: ratio >= aaaThreshold,
    isLargeText,
    aaThreshold,
    aaaThreshold
  };
}

async function analyzeColorContrast() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🎨 Analyzing Color Contrast...');
  
  const results = {
    homepage: { url: 'http://localhost:3000', issues: [] },
    registerPage: { url: 'http://localhost:3000/register', issues: [] }
  };

  // Test both pages
  for (const [pageName, data] of Object.entries(results)) {
    console.log(`\n📋 Testing ${pageName}...`);
    
    try {
      await page.goto(data.url, { waitUntil: 'networkidle2' });
      
      const contrastIssues = await page.evaluate(() => {
        const issues = [];
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, label, li, td, th, input, textarea');
        
        Array.from(textElements).forEach((el, index) => {
          if (index > 50) return; // Limit for performance
          
          const text = el.textContent?.trim();
          if (!text || text.length < 3) return;
          
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          
          const styles = getComputedStyle(el);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          const fontSize = parseFloat(styles.fontSize);
          const fontWeight = parseInt(styles.fontWeight) || 400;
          
          // Skip if transparent background
          if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
            // Try to get parent background
            let parent = el.parentElement;
            let bgColor = 'rgb(255, 255, 255)'; // default white
            
            while (parent && (styles.backgroundColor === 'rgba(0, 0, 0, 0)' || styles.backgroundColor === 'transparent')) {
              const parentStyles = getComputedStyle(parent);
              if (parentStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' && parentStyles.backgroundColor !== 'transparent') {
                bgColor = parentStyles.backgroundColor;
                break;
              }
              parent = parent.parentElement;
            }
            
            issues.push({
              element: el.tagName.toLowerCase(),
              text: text.substring(0, 50),
              color,
              backgroundColor: bgColor,
              fontSize,
              fontWeight,
              hasTransparentBg: true,
              selector: el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase()
            });
          } else {
            issues.push({
              element: el.tagName.toLowerCase(),
              text: text.substring(0, 50),
              color,
              backgroundColor,
              fontSize,
              fontWeight,
              hasTransparentBg: false,
              selector: el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase()
            });
          }
        });
        
        return issues;
      });
      
      // Calculate contrast ratios
      contrastIssues.forEach(issue => {
        const textColor = parseColor(issue.color);
        const bgColor = parseColor(issue.backgroundColor);
        
        const contrastRatio = getContrastRatio(textColor, bgColor);
        const evaluation = evaluateContrast(contrastRatio, issue.fontSize, issue.fontWeight);
        
        issue.contrast = evaluation;
        
        if (!evaluation.passAA) {
          console.log(`   ❌ FAIL: ${issue.element} "${issue.text}" - Ratio: ${evaluation.ratio}:1 (needs ${evaluation.aaThreshold}:1)`);
          data.issues.push(issue);
        } else if (!evaluation.passAAA) {
          console.log(`   ⚠️  AA: ${issue.element} "${issue.text}" - Ratio: ${evaluation.ratio}:1`);
        } else {
          console.log(`   ✅ AAA: ${issue.element} "${issue.text}" - Ratio: ${evaluation.ratio}:1`);
        }
      });
      
    } catch (error) {
      console.error(`❌ Error testing ${pageName}:`, error.message);
      data.error = error.message;
    }
  }
  
  await browser.close();
  
  // Generate summary
  const totalIssues = results.homepage.issues.length + results.registerPage.issues.length;
  console.log(`\n📊 Color Contrast Summary:`);
  console.log(`   Homepage Issues: ${results.homepage.issues.length}`);
  console.log(`   Register Page Issues: ${results.registerPage.issues.length}`);
  console.log(`   Total Issues: ${totalIssues}`);
  
  require('fs').writeFileSync('color-contrast-results.json', JSON.stringify(results, null, 2));
  console.log('\n✅ Color contrast analysis saved to color-contrast-results.json');
  
  return results;
}

analyzeColorContrast().catch(console.error);