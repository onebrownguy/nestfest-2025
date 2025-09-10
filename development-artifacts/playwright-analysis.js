const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class NestFestAnalyzer {
  constructor() {
    this.baseUrl = 'https://nestfest-digf0yr92-abel-rincons-projects.vercel.app';
    this.results = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      pages: [],
      performance: [],
      errors: [],
      responsive: [],
      accessibility: [],
      summary: {
        totalPages: 0,
        successfulPages: 0,
        errors: 0,
        warnings: 0
      }
    };
    this.screenshotDir = './screenshots/analysis';
  }

  async init() {
    // Create screenshots directory
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }

    this.browser = await chromium.launch({ headless: false });
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    this.page = await this.context.newPage();

    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.results.errors.push({
          type: 'console',
          message: msg.text(),
          location: msg.location()
        });
      }
    });

    // Listen for network errors
    this.page.on('response', response => {
      if (response.status() >= 400) {
        this.results.errors.push({
          type: 'network',
          status: response.status(),
          url: response.url(),
          statusText: response.statusText()
        });
      }
    });
  }

  async analyzePage(pagePath, pageName) {
    console.log(`Analyzing ${pageName} (${pagePath})`);
    const fullUrl = `${this.baseUrl}${pagePath}`;
    
    try {
      const startTime = Date.now();
      
      // Navigate to page
      const response = await this.page.goto(fullUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      const loadTime = Date.now() - startTime;
      
      // Take screenshot
      const screenshotPath = `${this.screenshotDir}/${pageName.replace(/[^a-z0-9]/gi, '_')}.png`;
      await this.page.screenshot({ 
        path: screenshotPath, 
        fullPage: true 
      });

      // Get page title and meta description
      const title = await this.page.title();
      const metaDescription = await this.page.$eval('meta[name="description"]', el => el.content).catch(() => 'Not found');

      // Check for specific elements and functionality
      const pageAnalysis = {
        name: pageName,
        path: pagePath,
        url: fullUrl,
        status: response?.status() || 'unknown',
        loadTime: loadTime,
        title: title,
        metaDescription: metaDescription,
        screenshot: screenshotPath,
        elements: await this.analyzePageElements(),
        forms: await this.analyzeForms(),
        links: await this.analyzeLinks(),
        accessibility: await this.checkAccessibility(),
        responsive: await this.checkResponsive()
      };

      this.results.pages.push(pageAnalysis);
      this.results.performance.push({
        page: pageName,
        loadTime: loadTime,
        status: response?.status()
      });

      console.log(`✓ ${pageName} analyzed successfully (${loadTime}ms)`);
      return pageAnalysis;

    } catch (error) {
      console.error(`✗ Error analyzing ${pageName}:`, error.message);
      this.results.errors.push({
        type: 'navigation',
        page: pageName,
        error: error.message
      });
      return null;
    }
  }

  async analyzePageElements() {
    const elements = {};
    
    // Check for common elements
    elements.navigation = await this.page.$('nav') !== null;
    elements.header = await this.page.$('header') !== null;
    elements.footer = await this.page.$('footer') !== null;
    elements.logo = await this.page.$('[alt*="logo"], [alt*="Logo"], img[src*="logo"]') !== null;
    
    // Check for headings structure
    elements.headings = {
      h1: await this.page.$$('h1').then(els => els.length),
      h2: await this.page.$$('h2').then(els => els.length),
      h3: await this.page.$$('h3').then(els => els.length)
    };

    // Check for images without alt text
    const imagesWithoutAlt = await this.page.$$eval('img:not([alt]), img[alt=""]', imgs => imgs.length);
    elements.accessibilityIssues = { imagesWithoutAlt };

    return elements;
  }

  async analyzeForms() {
    const forms = await this.page.$$eval('form', forms => 
      forms.map(form => ({
        action: form.action,
        method: form.method,
        inputs: Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
          type: input.type,
          name: input.name,
          required: input.required,
          placeholder: input.placeholder
        }))
      }))
    );
    return forms;
  }

  async analyzeLinks() {
    const links = await this.page.$$eval('a', links => 
      links.map(link => ({
        href: link.href,
        text: link.textContent.trim(),
        external: link.href && !link.href.includes(window.location.host)
      }))
    );
    return links;
  }

  async checkAccessibility() {
    const issues = [];
    
    // Check for missing alt text on images
    const imagesWithoutAlt = await this.page.$$('img:not([alt]), img[alt=""]');
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} images missing alt text`);
    }

    // Check for missing form labels
    const inputsWithoutLabels = await this.page.$$('input:not([aria-label]):not([aria-labelledby])');
    const labelsCount = await this.page.$$('label').then(els => els.length);
    if (inputsWithoutLabels.length > labelsCount) {
      issues.push('Some form inputs may be missing labels');
    }

    // Check for heading hierarchy
    const h1Count = await this.page.$$('h1').then(els => els.length);
    if (h1Count === 0) {
      issues.push('No H1 heading found');
    } else if (h1Count > 1) {
      issues.push('Multiple H1 headings found');
    }

    return issues;
  }

  async checkResponsive() {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    const responsiveResults = [];

    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.page.waitForTimeout(1000); // Wait for reflow

      const screenshotPath = `${this.screenshotDir}/${this.page.url().split('/').pop() || 'home'}_${viewport.name.toLowerCase()}.png`;
      await this.page.screenshot({ path: screenshotPath });

      responsiveResults.push({
        viewport: viewport.name,
        size: `${viewport.width}x${viewport.height}`,
        screenshot: screenshotPath
      });
    }

    // Reset to desktop viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    return responsiveResults;
  }

  async testFormSubmission(formSelector, testData) {
    try {
      const form = await this.page.$(formSelector);
      if (!form) return { status: 'not_found', message: 'Form not found' };

      // Fill form fields
      for (const [field, value] of Object.entries(testData)) {
        const input = await form.$(`[name="${field}"], #${field}`);
        if (input) {
          await input.fill(value);
        }
      }

      // Submit form (but don't actually submit in production)
      const submitButton = await form.$('button[type="submit"], input[type="submit"]');
      if (submitButton) {
        // Just check if button is enabled/clickable
        const isEnabled = await submitButton.isEnabled();
        return { 
          status: 'ready', 
          message: `Form is ${isEnabled ? 'ready for submission' : 'disabled'}` 
        };
      }

      return { status: 'no_submit', message: 'No submit button found' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async runFullAnalysis() {
    console.log('Starting NestFest website analysis...');
    
    await this.init();

    const pagesToTest = [
      { path: '/', name: 'Homepage' },
      { path: '/about', name: 'About' },
      { path: '/login', name: 'Login' },
      { path: '/register', name: 'Register' },
      { path: '/showcase', name: 'Showcase' },
      { path: '/live', name: 'Live' },
      { path: '/contact', name: 'Contact' },
      { path: '/privacy', name: 'Privacy Policy' },
      { path: '/terms', name: 'Terms of Service' },
      { path: '/rules', name: 'Competition Rules' }
    ];

    // Test each page
    for (const pageInfo of pagesToTest) {
      await this.analyzePage(pageInfo.path, pageInfo.name);
      await this.page.waitForTimeout(2000); // Brief pause between pages
    }

    // Test specific functionality
    await this.testSpecificFeatures();

    // Calculate summary statistics
    this.calculateSummary();

    console.log('Analysis complete. Generating report...');
    await this.generateReport();
    
    await this.browser.close();
    return this.results;
  }

  async testSpecificFeatures() {
    console.log('Testing specific features...');

    // Test login form
    await this.page.goto(`${this.baseUrl}/login`);
    const loginTest = await this.testFormSubmission('form', {
      email: 'test@example.com',
      password: 'testpassword123'
    });
    this.results.pages.find(p => p.name === 'Login').formTest = loginTest;

    // Test register form
    await this.page.goto(`${this.baseUrl}/register`);
    const registerTest = await this.testFormSubmission('form', {
      email: 'test@example.com',
      password: 'testpassword123',
      confirmPassword: 'testpassword123',
      name: 'Test User'
    });
    this.results.pages.find(p => p.name === 'Register').formTest = registerTest;

    // Test contact form
    await this.page.goto(`${this.baseUrl}/contact`);
    const contactTest = await this.testFormSubmission('form', {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message'
    });
    this.results.pages.find(p => p.name === 'Contact').formTest = contactTest;
  }

  calculateSummary() {
    this.results.summary.totalPages = this.results.pages.length;
    this.results.summary.successfulPages = this.results.pages.filter(p => p.status === 200).length;
    this.results.summary.errors = this.results.errors.length;
    
    // Calculate average load time
    const loadTimes = this.results.performance.map(p => p.loadTime);
    this.results.summary.averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
    this.results.summary.maxLoadTime = Math.max(...loadTimes);
  }

  async generateReport() {
    const reportHtml = this.generateReportHTML();
    const reportPath = './nestfest-analysis-report.html';
    
    fs.writeFileSync(reportPath, reportHtml);
    console.log(`Report generated: ${reportPath}`);
    
    // Also save raw data as JSON
    fs.writeFileSync('./nestfest-analysis-data.json', JSON.stringify(this.results, null, 2));
  }

  generateReportHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NestFest Website Analysis Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric h3 { margin: 0; color: #495057; }
        .metric .value { font-size: 2rem; font-weight: bold; margin: 10px 0; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .error { color: #dc3545; }
        .page-section { margin: 30px 0; padding: 20px; border: 1px solid #dee2e6; border-radius: 6px; }
        .page-title { color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 10px; }
        .screenshot { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0; }
        .error-list { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .performance-chart { margin: 20px 0; }
        .responsive-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .responsive-item img { width: 100%; height: auto; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .status-200 { color: #28a745; font-weight: bold; }
        .status-404 { color: #dc3545; font-weight: bold; }
        .status-401 { color: #fd7e14; font-weight: bold; }
        .load-time { font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 NestFest Website Analysis Report</h1>
            <p>Comprehensive analysis conducted on ${new Date(this.results.timestamp).toLocaleString()}</p>
            <p><strong>Site:</strong> <a href="${this.results.baseUrl}" target="_blank">${this.results.baseUrl}</a></p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>Total Pages</h3>
                <div class="value">${this.results.summary.totalPages}</div>
            </div>
            <div class="metric">
                <h3>Successful Pages</h3>
                <div class="value success">${this.results.summary.successfulPages}</div>
            </div>
            <div class="metric">
                <h3>Errors Found</h3>
                <div class="value ${this.results.summary.errors > 0 ? 'error' : 'success'}">${this.results.summary.errors}</div>
            </div>
            <div class="metric">
                <h3>Avg Load Time</h3>
                <div class="value">${Math.round(this.results.summary.averageLoadTime)}ms</div>
            </div>
        </div>

        ${this.results.errors.length > 0 ? `
        <div class="page-section">
            <h2 class="error">🚨 Critical Issues Found</h2>
            <div class="error-list">
                ${this.results.errors.map(error => `
                    <div><strong>${error.type}:</strong> ${error.message || error.error} 
                    ${error.url ? `<br><small>URL: ${error.url}</small>` : ''}
                    ${error.page ? `<br><small>Page: ${error.page}</small>` : ''}
                    </div>
                `).join('<hr>')}
            </div>
        </div>
        ` : ''}

        <div class="page-section">
            <h2>📊 Performance Overview</h2>
            <table>
                <thead>
                    <tr>
                        <th>Page</th>
                        <th>Status</th>
                        <th>Load Time</th>
                        <th>Title</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.results.pages.map(page => `
                        <tr>
                            <td><strong>${page.name}</strong></td>
                            <td><span class="status-${page.status}">${page.status}</span></td>
                            <td><span class="load-time">${page.loadTime}ms</span></td>
                            <td>${page.title}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${this.results.pages.map(page => `
            <div class="page-section">
                <h2 class="page-title">📄 ${page.name}</h2>
                <p><strong>URL:</strong> <a href="${page.url}" target="_blank">${page.path}</a></p>
                <p><strong>Status:</strong> <span class="status-${page.status}">${page.status}</span> | 
                   <strong>Load Time:</strong> ${page.loadTime}ms</p>
                <p><strong>Title:</strong> ${page.title}</p>
                <p><strong>Meta Description:</strong> ${page.metaDescription}</p>
                
                ${page.screenshot ? `
                    <h4>Desktop Screenshot</h4>
                    <img src="file://${page.screenshot.replace(/\\/g, '/')}" alt="${page.name} screenshot" class="screenshot">
                ` : ''}
                
                ${page.responsive && page.responsive.length > 0 ? `
                    <h4>Responsive Design</h4>
                    <div class="responsive-grid">
                        ${page.responsive.map(resp => `
                            <div class="responsive-item">
                                <h5>${resp.viewport} (${resp.size})</h5>
                                <img src="file://${resp.screenshot.replace(/\\/g, '/')}" alt="${page.name} ${resp.viewport}">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${page.forms && page.forms.length > 0 ? `
                    <h4>Forms Detected</h4>
                    ${page.forms.map(form => `
                        <div>
                            <p><strong>Action:</strong> ${form.action} | <strong>Method:</strong> ${form.method}</p>
                            <p><strong>Inputs:</strong> ${form.inputs.map(input => 
                                `${input.name}(${input.type})${input.required ? '*' : ''}`
                            ).join(', ')}</p>
                        </div>
                    `).join('')}
                ` : ''}

                ${page.formTest ? `
                    <h4>Form Testing</h4>
                    <p><strong>Status:</strong> ${page.formTest.status}</p>
                    <p><strong>Result:</strong> ${page.formTest.message}</p>
                ` : ''}

                ${page.accessibility && page.accessibility.length > 0 ? `
                    <h4>Accessibility Issues</h4>
                    <div class="error-list">
                        ${page.accessibility.map(issue => `<div>⚠️ ${issue}</div>`).join('')}
                    </div>
                ` : ''}

                <details>
                    <summary><strong>Technical Details</strong></summary>
                    <pre>${JSON.stringify({
                        elements: page.elements,
                        linkCount: page.links ? page.links.length : 0,
                        externalLinks: page.links ? page.links.filter(l => l.external).length : 0
                    }, null, 2)}</pre>
                </details>
            </div>
        `).join('')}

        <div class="page-section">
            <h2>🎯 Recommendations</h2>
            <ul>
                ${this.generateRecommendations().map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>

        <div class="page-section">
            <h2>📈 Summary & Next Steps</h2>
            <p>This analysis covered ${this.results.summary.totalPages} pages of the NestFest website with 
            ${this.results.summary.successfulPages} pages loading successfully and ${this.results.summary.errors} issues detected.</p>
            
            <p><strong>Overall Performance:</strong> 
            ${this.results.summary.averageLoadTime < 1000 ? 'Excellent' : 
              this.results.summary.averageLoadTime < 3000 ? 'Good' : 'Needs Improvement'} 
            (${Math.round(this.results.summary.averageLoadTime)}ms average load time)</p>
            
            <p><strong>Priority Actions:</strong></p>
            <ol>
                <li>Address any critical errors identified above</li>
                <li>Fix accessibility issues for better user experience</li>
                <li>Optimize loading performance where needed</li>
                <li>Test form submissions in a staging environment</li>
                <li>Monitor site performance regularly</li>
            </ol>
        </div>

        <footer style="text-align: center; margin-top: 40px; padding: 20px; color: #6c757d; border-top: 1px solid #dee2e6;">
            <p>Analysis generated by Playwright automation • ${new Date().toLocaleString()}</p>
        </footer>
    </div>
</body>
</html>`;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Performance recommendations
    if (this.results.summary.averageLoadTime > 3000) {
      recommendations.push('🚀 Optimize page loading times - current average is above 3 seconds');
    }
    
    // Error recommendations
    if (this.results.errors.length > 0) {
      recommendations.push(`🔧 Fix ${this.results.errors.length} critical errors found during testing`);
    }
    
    // Accessibility recommendations
    const accessibilityIssues = this.results.pages.reduce((acc, page) => 
      acc + (page.accessibility ? page.accessibility.length : 0), 0);
    if (accessibilityIssues > 0) {
      recommendations.push(`♿ Improve accessibility - ${accessibilityIssues} issues found across all pages`);
    }
    
    // SEO recommendations
    const pagesWithoutMeta = this.results.pages.filter(p => 
      p.metaDescription === 'Not found' || !p.metaDescription).length;
    if (pagesWithoutMeta > 0) {
      recommendations.push(`📝 Add meta descriptions to ${pagesWithoutMeta} pages for better SEO`);
    }
    
    // Form recommendations
    recommendations.push('📋 Test form submissions in staging environment before going live');
    recommendations.push('🔒 Implement proper form validation and security measures');
    recommendations.push('📱 Continue testing on real mobile devices');
    recommendations.push('⚡ Consider implementing Progressive Web App features');
    recommendations.push('📊 Set up analytics and monitoring for production');
    
    return recommendations;
  }
}

// Run the analysis
const analyzer = new NestFestAnalyzer();
analyzer.runFullAnalysis().then(results => {
  console.log('✅ Analysis complete!');
  console.log(`📊 Analyzed ${results.summary.totalPages} pages`);
  console.log(`⚡ Average load time: ${Math.round(results.summary.averageLoadTime)}ms`);
  console.log(`🚨 Issues found: ${results.summary.errors}`);
  console.log('📋 Report saved as nestfest-analysis-report.html');
}).catch(error => {
  console.error('❌ Analysis failed:', error);
});