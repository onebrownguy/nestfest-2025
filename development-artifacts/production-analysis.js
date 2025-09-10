const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const PRODUCTION_URL = 'https://nestfest.app';
const REPORT_DIR = './production-analysis-report';
const SCREENSHOT_DIR = path.join(REPORT_DIR, 'screenshots');

// Pages to test
const PAGES_TO_TEST = [
  { url: '/', name: 'homepage' },
  { url: '/about', name: 'about' },
  { url: '/login', name: 'login' },
  { url: '/register', name: 'register' },
  { url: '/showcase', name: 'showcase' },
  { url: '/live', name: 'live' },
  { url: '/contact', name: 'contact' },
  { url: '/privacy', name: 'privacy' },
  { url: '/terms', name: 'terms' },
  { url: '/rules', name: 'rules' }
];

// Viewport sizes to test
const VIEWPORTS = [
  { width: 1920, height: 1080, name: 'desktop-large' },
  { width: 1366, height: 768, name: 'desktop' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 375, height: 667, name: 'mobile' }
];

class ProductionAnalyzer {
  constructor() {
    this.results = {
      overview: {
        testDate: new Date().toISOString(),
        totalPages: PAGES_TO_TEST.length,
        totalViewports: VIEWPORTS.length,
        browsers: ['Chromium', 'Firefox', 'WebKit']
      },
      pages: {},
      performance: {},
      accessibility: {},
      functionality: {},
      issues: [],
      recommendations: []
    };
  }

  async createDirectories() {
    try {
      await fs.mkdir(REPORT_DIR, { recursive: true });
      await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
      console.log('✓ Created report directories');
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  async testPage(browser, page, pageInfo, viewport) {
    const fullUrl = `${PRODUCTION_URL}${pageInfo.url}`;
    const testKey = `${pageInfo.name}_${viewport.name}`;
    
    console.log(`Testing ${fullUrl} on ${viewport.name}...`);

    try {
      // Set viewport
      await page.setViewportSize(viewport);

      // Start performance monitoring
      const startTime = Date.now();
      
      // Navigate to page
      const response = await page.goto(fullUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      const loadTime = Date.now() - startTime;

      // Basic page info
      const title = await page.title();
      const url = page.url();
      const status = response?.status() || 'unknown';

      // Take screenshot
      const screenshotPath = path.join(SCREENSHOT_DIR, `${testKey}.png`);
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true
      });

      // Check for JavaScript errors
      const jsErrors = [];
      page.on('pageerror', error => {
        jsErrors.push(error.message);
      });

      // Test accessibility
      const accessibilityIssues = await this.checkAccessibility(page);

      // Test forms if present
      const formTests = await this.testForms(page);

      // Test navigation
      const navigationTests = await this.testNavigation(page);

      // Check for broken links
      const brokenLinks = await this.checkBrokenLinks(page);

      // Performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });

      // Store results
      this.results.pages[testKey] = {
        url: fullUrl,
        viewport: viewport.name,
        title,
        status,
        loadTime,
        performanceMetrics,
        jsErrors,
        accessibilityIssues,
        formTests,
        navigationTests,
        brokenLinks,
        screenshotPath
      };

      console.log(`✓ ${testKey} - ${status} (${loadTime}ms)`);

    } catch (error) {
      console.error(`✗ ${testKey} - Error:`, error.message);
      this.results.issues.push({
        page: testKey,
        type: 'navigation',
        message: error.message,
        severity: 'high'
      });
    }
  }

  async checkAccessibility(page) {
    try {
      // Check for basic accessibility features
      const accessibilityChecks = await page.evaluate(() => {
        const issues = [];
        
        // Check for alt text on images
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
          if (!img.alt && !img.getAttribute('aria-label')) {
            issues.push(`Image ${index + 1} missing alt text`);
          }
        });

        // Check for form labels
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea');
        inputs.forEach((input, index) => {
          const hasLabel = document.querySelector(`label[for="${input.id}"]`) || input.getAttribute('aria-label');
          if (!hasLabel) {
            issues.push(`Input ${index + 1} missing label`);
          }
        });

        // Check for headings hierarchy
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        if (headings.length === 0) {
          issues.push('No headings found on page');
        }

        // Check for skip links
        const skipLinks = document.querySelector('a[href^="#"]');
        if (!skipLinks) {
          issues.push('No skip links found');
        }

        return issues;
      });

      return accessibilityChecks;
    } catch (error) {
      return [`Accessibility check failed: ${error.message}`];
    }
  }

  async testForms(page) {
    try {
      const forms = await page.$$('form');
      const formTests = [];

      for (let i = 0; i < forms.length; i++) {
        const form = forms[i];
        const formTest = {
          index: i,
          action: await form.getAttribute('action'),
          method: await form.getAttribute('method'),
          inputs: [],
          validation: []
        };

        // Test form inputs
        const inputs = await form.$$('input, textarea, select');
        for (const input of inputs) {
          const inputInfo = {
            type: await input.getAttribute('type'),
            name: await input.getAttribute('name'),
            required: await input.getAttribute('required') !== null,
            placeholder: await input.getAttribute('placeholder')
          };
          formTest.inputs.push(inputInfo);
        }

        // Test form submission (without actually submitting)
        const submitButton = await form.$('button[type="submit"], input[type="submit"]');
        if (submitButton) {
          formTest.hasSubmitButton = true;
          
          // Test validation by trying to submit empty form
          try {
            await submitButton.click();
            // Check for validation messages
            const validationMessages = await page.$$eval('[role="alert"], .error, .validation-error', 
              elements => elements.map(el => el.textContent)
            );
            formTest.validation = validationMessages;
          } catch (e) {
            // Form might prevent default submission
          }
        }

        formTests.push(formTest);
      }

      return formTests;
    } catch (error) {
      return [{ error: `Form testing failed: ${error.message}` }];
    }
  }

  async testNavigation(page) {
    try {
      const navigationTests = {
        mainNavigation: [],
        footerNavigation: [],
        breadcrumbs: false,
        mobileMenu: false
      };

      // Test main navigation
      const mainNavLinks = await page.$$('nav a, header a');
      for (const link of mainNavLinks) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        if (href && text) {
          navigationTests.mainNavigation.push({
            text: text.trim(),
            href,
            internal: href.startsWith('/') || href.includes('nestfest.app')
          });
        }
      }

      // Test footer navigation
      const footerNavLinks = await page.$$('footer a');
      for (const link of footerNavLinks) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        if (href && text) {
          navigationTests.footerNavigation.push({
            text: text.trim(),
            href,
            internal: href.startsWith('/') || href.includes('nestfest.app')
          });
        }
      }

      // Check for breadcrumbs
      const breadcrumbs = await page.$('[aria-label*="breadcrumb"], .breadcrumb, nav ol');
      navigationTests.breadcrumbs = !!breadcrumbs;

      // Check for mobile menu
      const mobileMenu = await page.$('[aria-label*="menu"], .mobile-menu, button[aria-expanded]');
      navigationTests.mobileMenu = !!mobileMenu;

      return navigationTests;
    } catch (error) {
      return { error: `Navigation testing failed: ${error.message}` };
    }
  }

  async checkBrokenLinks(page) {
    try {
      const links = await page.$$eval('a[href]', links => 
        links.map(link => ({
          href: link.href,
          text: link.textContent?.trim() || '',
          internal: link.href.includes(window.location.hostname)
        }))
      );

      const brokenLinks = [];
      
      // Only check internal links to avoid external rate limiting
      const internalLinks = links.filter(link => link.internal && link.href !== page.url());
      
      for (const link of internalLinks.slice(0, 10)) { // Limit to first 10 to avoid timeout
        try {
          const response = await page.request.get(link.href);
          if (response.status() >= 400) {
            brokenLinks.push({
              href: link.href,
              text: link.text,
              status: response.status()
            });
          }
        } catch (error) {
          brokenLinks.push({
            href: link.href,
            text: link.text,
            error: error.message
          });
        }
      }

      return brokenLinks;
    } catch (error) {
      return [{ error: `Link checking failed: ${error.message}` }];
    }
  }

  async runAnalysis() {
    console.log('Starting comprehensive production analysis...');
    
    await this.createDirectories();

    // Test with Chromium (most comprehensive)
    const browser = await chromium.launch({ headless: true });
    
    try {
      for (const pageInfo of PAGES_TO_TEST) {
        for (const viewport of VIEWPORTS) {
          const page = await browser.newPage();
          await this.testPage(browser, page, pageInfo, viewport);
          await page.close();
        }
      }

      // Generate overall performance and recommendations
      this.generateRecommendations();
      
      // Save results
      await this.generateReport();
      
      console.log('\n✓ Analysis complete! Check the report directory for results.');
      
    } finally {
      await browser.close();
    }
  }

  generateRecommendations() {
    const { pages, issues } = this.results;
    
    // Analyze load times
    const loadTimes = Object.values(pages).map(p => p.loadTime).filter(Boolean);
    const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
    
    if (avgLoadTime > 3000) {
      this.results.recommendations.push({
        type: 'performance',
        severity: 'medium',
        message: `Average load time of ${Math.round(avgLoadTime)}ms is above recommended 3s threshold`,
        suggestion: 'Consider optimizing images, implementing lazy loading, or using a CDN'
      });
    }

    // Check for common issues across pages
    const accessibilityIssues = Object.values(pages)
      .flatMap(p => p.accessibilityIssues || [])
      .filter((issue, index, arr) => arr.indexOf(issue) === index);

    if (accessibilityIssues.length > 0) {
      this.results.recommendations.push({
        type: 'accessibility',
        severity: 'high',
        message: `Found ${accessibilityIssues.length} accessibility issues`,
        suggestion: 'Review and fix accessibility issues to improve user experience and compliance'
      });
    }

    // Check for JavaScript errors
    const jsErrorCount = Object.values(pages)
      .reduce((count, p) => count + (p.jsErrors?.length || 0), 0);

    if (jsErrorCount > 0) {
      this.results.recommendations.push({
        type: 'functionality',
        severity: 'high',
        message: `Found ${jsErrorCount} JavaScript errors across pages`,
        suggestion: 'Review and fix JavaScript errors to ensure proper functionality'
      });
    }
  }

  async generateReport() {
    const reportPath = path.join(REPORT_DIR, 'production-analysis-report.json');
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    await this.generateHTMLReport();
    
    console.log(`Report saved to: ${reportPath}`);
  }

  async generateHTMLReport() {
    const htmlContent = this.generateHTMLContent();
    const htmlPath = path.join(REPORT_DIR, 'index.html');
    await fs.writeFile(htmlPath, htmlContent);
    console.log(`HTML report saved to: ${htmlPath}`);
  }

  generateHTMLContent() {
    const { overview, pages, recommendations, issues } = this.results;
    
    const pageResults = Object.entries(pages).map(([key, data]) => `
      <div class="page-result">
        <h3>${data.url} (${data.viewport})</h3>
        <div class="metrics">
          <span class="metric">Status: ${data.status}</span>
          <span class="metric">Load Time: ${data.loadTime}ms</span>
          <span class="metric">Title: ${data.title}</span>
        </div>
        <div class="screenshot">
          <img src="screenshots/${key}.png" alt="Screenshot of ${data.url}" loading="lazy">
        </div>
        <div class="details">
          <h4>Performance Metrics</h4>
          <ul>
            <li>DOM Content Loaded: ${data.performanceMetrics?.domContentLoaded || 'N/A'}ms</li>
            <li>Load Complete: ${data.performanceMetrics?.loadComplete || 'N/A'}ms</li>
            <li>First Paint: ${data.performanceMetrics?.firstPaint || 'N/A'}ms</li>
            <li>First Contentful Paint: ${data.performanceMetrics?.firstContentfulPaint || 'N/A'}ms</li>
          </ul>
          
          ${data.accessibilityIssues?.length > 0 ? `
            <h4>Accessibility Issues</h4>
            <ul>${data.accessibilityIssues.map(issue => `<li>${issue}</li>`).join('')}</ul>
          ` : ''}
          
          ${data.jsErrors?.length > 0 ? `
            <h4>JavaScript Errors</h4>
            <ul>${data.jsErrors.map(error => `<li>${error}</li>`).join('')}</ul>
          ` : ''}
          
          ${data.brokenLinks?.length > 0 ? `
            <h4>Broken Links</h4>
            <ul>${data.brokenLinks.map(link => `<li>${link.href} - ${link.status || link.error}</li>`).join('')}</ul>
          ` : ''}
        </div>
      </div>
    `).join('');

    const recommendationsHtml = recommendations.map(rec => `
      <div class="recommendation ${rec.severity}">
        <h4>${rec.type.charAt(0).toUpperCase() + rec.type.slice(1)} - ${rec.severity.toUpperCase()}</h4>
        <p><strong>Issue:</strong> ${rec.message}</p>
        <p><strong>Suggestion:</strong> ${rec.suggestion}</p>
      </div>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NestFest Production Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
        .header h1 { color: #007bff; margin: 0; }
        .overview { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .overview-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .overview-card h3 { margin: 0 0 10px 0; color: #495057; }
        .overview-card .number { font-size: 2em; font-weight: bold; color: #007bff; }
        .recommendations { margin-bottom: 40px; }
        .recommendation { margin: 15px 0; padding: 15px; border-radius: 5px; border-left: 4px solid; }
        .recommendation.high { background: #f8d7da; border-color: #dc3545; }
        .recommendation.medium { background: #fff3cd; border-color: #ffc107; }
        .recommendation.low { background: #d4edda; border-color: #28a745; }
        .page-result { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .page-result h3 { margin: 0 0 15px 0; color: #495057; }
        .metrics { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
        .metric { background: #e9ecef; padding: 5px 10px; border-radius: 3px; font-size: 0.9em; }
        .screenshot img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; }
        .details { margin-top: 20px; }
        .details h4 { color: #495057; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .details ul { margin: 10px 0; }
        .details li { margin: 5px 0; }
        @media (max-width: 768px) {
            .metrics { flex-direction: column; }
            .overview { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 NestFest Production Analysis Report</h1>
            <p>Comprehensive testing results for <strong>https://nestfest.app</strong></p>
            <p>Generated on: ${new Date(overview.testDate).toLocaleString()}</p>
        </div>

        <div class="overview">
            <div class="overview-card">
                <h3>Pages Tested</h3>
                <div class="number">${overview.totalPages}</div>
            </div>
            <div class="overview-card">
                <h3>Viewports</h3>
                <div class="number">${overview.totalViewports}</div>
            </div>
            <div class="overview-card">
                <h3>Total Tests</h3>
                <div class="number">${Object.keys(pages).length}</div>
            </div>
            <div class="overview-card">
                <h3>Recommendations</h3>
                <div class="number">${recommendations.length}</div>
            </div>
        </div>

        <section class="recommendations">
            <h2>🎯 Key Recommendations</h2>
            ${recommendationsHtml || '<p>No critical issues found - excellent work!</p>'}
        </section>

        <section class="results">
            <h2>📊 Detailed Test Results</h2>
            ${pageResults}
        </section>

        <footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #6c757d;">
            <p>Report generated by NestFest Production Analysis Tool</p>
        </footer>
    </div>
</body>
</html>`;
  }
}

// Run the analysis
async function main() {
  const analyzer = new ProductionAnalyzer();
  await analyzer.runAnalysis();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ProductionAnalyzer;