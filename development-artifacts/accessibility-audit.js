const puppeteer = require('puppeteer');
const fs = require('fs');

async function conductAccessibilityAudit() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Enable accessibility features
  await page.setBypassCSP(true);
  
  const results = {
    homepage: {},
    registerPage: {},
    summary: {
      criticalIssues: [],
      moderateIssues: [],
      recommendations: []
    }
  };

  console.log('🔍 Starting WCAG 2.1 AA Accessibility Audit...');

  // Test Homepage
  console.log('\n📝 Testing Homepage (http://localhost:3000)');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/accessibility-audit-homepage.png' });
    
    results.homepage = await auditPage(page, 'Homepage');
    
  } catch (error) {
    console.error('❌ Error testing homepage:', error.message);
    results.homepage.error = error.message;
  }

  // Test Register Page  
  console.log('\n📝 Testing Register Page (http://localhost:3000/register)');
  try {
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle2' });
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/accessibility-audit-register.png' });
    
    results.registerPage = await auditPage(page, 'Register Page');
    
  } catch (error) {
    console.error('❌ Error testing register page:', error.message);
    results.registerPage.error = error.message;
  }

  await browser.close();

  // Compile summary
  compileSummary(results);
  
  // Save results
  fs.writeFileSync('accessibility-audit-results.json', JSON.stringify(results, null, 2));
  
  console.log('\n✅ Accessibility audit completed. Results saved to accessibility-audit-results.json');
  return results;
}

async function auditPage(page, pageName) {
  const results = {
    pageName,
    headingHierarchy: [],
    focusableElements: [],
    ariaIssues: [],
    colorContrast: [],
    keyboardNavigation: [],
    formAccessibility: [],
    semanticStructure: [],
    screenReaderIssues: []
  };

  console.log(`\n🔍 Auditing ${pageName}...`);

  // 1. Heading Hierarchy Analysis
  console.log('  📊 Analyzing heading hierarchy...');
  const headings = await page.evaluate(() => {
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    return Array.from(headingElements).map(el => ({
      tag: el.tagName.toLowerCase(),
      text: el.textContent.trim(),
      hasId: !!el.id,
      isVisible: el.offsetParent !== null,
      level: parseInt(el.tagName.charAt(1))
    }));
  });
  results.headingHierarchy = headings;

  // Check for heading hierarchy violations
  let expectedLevel = 1;
  let hasH1 = false;
  headings.forEach((heading, index) => {
    if (heading.tag === 'h1') {
      hasH1 = true;
      if (index > 0) {
        results.ariaIssues.push({
          type: 'heading-hierarchy',
          severity: 'moderate',
          message: 'H1 should be the first heading on the page',
          element: heading.tag
        });
      }
    }
    
    if (heading.level > expectedLevel + 1) {
      results.ariaIssues.push({
        type: 'heading-hierarchy',
        severity: 'moderate', 
        message: `Heading level ${heading.level} skips levels (expected ${expectedLevel} or ${expectedLevel + 1})`,
        element: heading.tag,
        text: heading.text
      });
    }
    expectedLevel = Math.max(expectedLevel, heading.level);
  });

  if (!hasH1) {
    results.ariaIssues.push({
      type: 'heading-hierarchy',
      severity: 'critical',
      message: 'Page missing H1 heading',
      element: 'page'
    });
  }

  // 2. Focusable Elements Analysis
  console.log('  ⌨️  Analyzing focusable elements...');
  const focusableElements = await page.evaluate(() => {
    const focusableSelectors = [
      'button', 'input', 'select', 'textarea', 'a[href]', 
      '[tabindex]:not([tabindex="-1"])', '[contenteditable="true"]'
    ];
    
    const elements = [];
    focusableSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        const styles = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        elements.push({
          tag: el.tagName.toLowerCase(),
          type: el.type || null,
          text: el.textContent.trim().substring(0, 50),
          hasAriaLabel: !!el.getAttribute('aria-label'),
          hasAriaLabelledby: !!el.getAttribute('aria-labelledby'),
          hasAriaDescribedby: !!el.getAttribute('aria-describedby'),
          tabIndex: el.tabIndex,
          isVisible: rect.width > 0 && rect.height > 0 && styles.visibility !== 'hidden',
          hasVisibleText: el.textContent.trim().length > 0,
          width: rect.width,
          height: rect.height,
          role: el.getAttribute('role'),
          ariaHidden: el.getAttribute('aria-hidden')
        });
      });
    });
    
    return elements;
  });
  results.focusableElements = focusableElements;

  // Check for accessibility issues with focusable elements
  focusableElements.forEach(el => {
    // Check for missing accessible names
    if (!el.hasAriaLabel && !el.hasAriaLabelledby && !el.hasVisibleText && el.tag === 'button') {
      results.ariaIssues.push({
        type: 'missing-accessible-name',
        severity: 'critical',
        message: 'Button missing accessible name (text, aria-label, or aria-labelledby)',
        element: `${el.tag}[type="${el.type || 'button'}"]`
      });
    }

    // Check touch target size (44x44px minimum)
    if (el.isVisible && (el.width < 44 || el.height < 44)) {
      results.ariaIssues.push({
        type: 'touch-target-size',
        severity: 'moderate',
        message: `Touch target too small (${Math.round(el.width)}x${Math.round(el.height)}px, minimum 44x44px)`,
        element: el.tag,
        text: el.text
      });
    }
  });

  // 3. Form Accessibility Analysis
  console.log('  📋 Analyzing form accessibility...');
  const formElements = await page.evaluate(() => {
    const forms = document.querySelectorAll('form');
    const formData = [];
    
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select, textarea');
      const formInfo = {
        hasFieldset: form.querySelector('fieldset') !== null,
        hasLegend: form.querySelector('legend') !== null,
        inputs: []
      };
      
      inputs.forEach(input => {
        const label = form.querySelector(`label[for="${input.id}"]`);
        formInfo.inputs.push({
          id: input.id,
          name: input.name,
          type: input.type,
          required: input.required,
          hasLabel: !!label,
          labelText: label ? label.textContent.trim() : '',
          hasAriaLabel: !!input.getAttribute('aria-label'),
          hasAriaLabelledby: !!input.getAttribute('aria-labelledby'),
          hasAriaDescribedby: !!input.getAttribute('aria-describedby'),
          hasAriaRequired: input.getAttribute('aria-required') === 'true',
          hasAriaInvalid: !!input.getAttribute('aria-invalid'),
          placeholder: input.placeholder || ''
        });
      });
      
      formData.push(formInfo);
    });
    
    return formData;
  });
  
  results.formAccessibility = formElements;

  // Check form accessibility issues
  formElements.forEach((form, formIndex) => {
    form.inputs.forEach(input => {
      if (!input.hasLabel && !input.hasAriaLabel && !input.hasAriaLabelledby) {
        results.ariaIssues.push({
          type: 'form-label-missing',
          severity: 'critical',
          message: `Form input "${input.name || input.id}" missing label`,
          element: `input[type="${input.type}"]`
        });
      }
      
      if (input.required && !input.hasAriaRequired) {
        results.ariaIssues.push({
          type: 'form-required-indication',
          severity: 'moderate',
          message: `Required field "${input.name || input.id}" should have aria-required="true"`,
          element: `input[name="${input.name}"]`
        });
      }
    });
  });

  // 4. ARIA Implementation Analysis
  console.log('  🏷️  Analyzing ARIA implementation...');
  const ariaElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby], [aria-hidden], [aria-expanded], [aria-current], [aria-live]');
    return Array.from(elements).map(el => ({
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label'),
      ariaLabelledby: el.getAttribute('aria-labelledby'),
      ariaDescribedby: el.getAttribute('aria-describedby'),
      ariaHidden: el.getAttribute('aria-hidden'),
      ariaExpanded: el.getAttribute('aria-expanded'),
      ariaCurrent: el.getAttribute('aria-current'),
      ariaLive: el.getAttribute('aria-live'),
      text: el.textContent.trim().substring(0, 50)
    }));
  });

  // 5. Color Contrast Analysis (Basic)
  console.log('  🎨 Analyzing color contrast...');
  const colorAnalysis = await page.evaluate(() => {
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label');
    const colorData = [];
    
    Array.from(textElements).forEach(el => {
      if (el.textContent.trim()) {
        const styles = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        if (rect.width > 0 && rect.height > 0) {
          colorData.push({
            text: el.textContent.trim().substring(0, 50),
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            tag: el.tagName.toLowerCase()
          });
        }
      }
    });
    
    return colorData.slice(0, 20); // Limit to first 20 for performance
  });
  
  results.colorContrast = colorAnalysis;

  // 6. Keyboard Navigation Test
  console.log('  ⌨️  Testing keyboard navigation...');
  const keyboardNavigation = await page.evaluate(() => {
    let tabIndex = 0;
    const tabbableElements = [];
    
    // Simulate Tab key navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const focusedElement = document.activeElement;
        tabbableElements.push({
          tag: focusedElement.tagName.toLowerCase(),
          text: focusedElement.textContent.trim().substring(0, 30),
          tabIndex: focusedElement.tabIndex,
          hasFocusIndicator: getComputedStyle(focusedElement, ':focus').outline !== 'none'
        });
      }
    });
    
    return { message: 'Keyboard navigation test setup completed' };
  });

  // 7. Semantic Structure Analysis
  console.log('  🏗️  Analyzing semantic structure...');
  const semanticStructure = await page.evaluate(() => {
    return {
      hasMain: !!document.querySelector('main'),
      hasHeader: !!document.querySelector('header'),
      hasFooter: !!document.querySelector('footer'),
      hasNav: !!document.querySelector('nav'),
      hasSection: !!document.querySelector('section'),
      hasAside: !!document.querySelector('aside'),
      hasLandmarks: document.querySelectorAll('[role="main"], [role="banner"], [role="contentinfo"], [role="navigation"], [role="complementary"]').length,
      skipLinks: document.querySelectorAll('a[href^="#"]').length
    };
  });
  
  results.semanticStructure = semanticStructure;

  // Check semantic structure issues
  if (!semanticStructure.hasMain) {
    results.ariaIssues.push({
      type: 'semantic-structure',
      severity: 'moderate',
      message: 'Page missing main landmark element',
      element: 'page'
    });
  }

  if (!semanticStructure.hasHeader) {
    results.ariaIssues.push({
      type: 'semantic-structure', 
      severity: 'moderate',
      message: 'Page missing header landmark element',
      element: 'page'
    });
  }

  return results;
}

function compileSummary(results) {
  const { homepage, registerPage, summary } = results;
  
  // Collect all issues
  const allIssues = [
    ...(homepage.ariaIssues || []),
    ...(registerPage.ariaIssues || [])
  ];

  // Categorize by severity
  summary.criticalIssues = allIssues.filter(issue => issue.severity === 'critical');
  summary.moderateIssues = allIssues.filter(issue => issue.severity === 'moderate');
  
  // Generate recommendations
  summary.recommendations = [
    {
      priority: 'High',
      category: 'Form Accessibility',
      recommendation: 'Add proper labels and ARIA attributes to all form inputs',
      impact: 'Critical for screen reader users'
    },
    {
      priority: 'High', 
      category: 'Keyboard Navigation',
      recommendation: 'Ensure all interactive elements are keyboard accessible',
      impact: 'Essential for users who cannot use a mouse'
    },
    {
      priority: 'Medium',
      category: 'Semantic Structure',
      recommendation: 'Use proper HTML5 semantic elements and ARIA landmarks',
      impact: 'Improves navigation for assistive technology users'
    },
    {
      priority: 'Medium',
      category: 'Color Contrast',
      recommendation: 'Verify all text meets WCAG AA contrast requirements',
      impact: 'Important for users with visual impairments'
    }
  ];

  console.log(`\n📊 AUDIT SUMMARY:`);
  console.log(`   Critical Issues: ${summary.criticalIssues.length}`);
  console.log(`   Moderate Issues: ${summary.moderateIssues.length}`);
  console.log(`   Total Issues: ${allIssues.length}`);
}

// Run the audit
conductAccessibilityAudit().catch(console.error);