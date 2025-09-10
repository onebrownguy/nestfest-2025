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
      redirects: [],
      summary: {
        totalPages: 0,
        successfulPages: 0,
        redirectedPages: 0,
        errors: 0,
        warnings: 0
      }
    };
    this.screenshotDir = path.resolve('./screenshots/analysis');
  }

  async init() {
    // Create screenshots directory
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }

    this.browser = await chromium.launch({ 
      headless: false,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    this.page = await this.context.newPage();

    // Listen for console messages
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.results.errors.push({
          type: 'console',
          message: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Listen for network responses
    this.page.on('response', response => {
      if (response.status() >= 400) {
        this.results.errors.push({
          type: 'network',
          status: response.status(),
          url: response.url(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        });
      }
      
      // Track redirects
      if (response.status() >= 300 && response.status() < 400) {
        this.results.redirects.push({
          from: response.url(),
          to: response.headers()['location'],
          status: response.status()
        });
      }
    });
  }

  sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
  }

  async analyzePage(pagePath, pageName) {
    console.log(`\n🔍 Analyzing ${pageName} (${pagePath})`);
    const fullUrl = `${this.baseUrl}${pagePath}`;
    
    try {
      const startTime = Date.now();
      
      // Navigate to page
      const response = await this.page.goto(fullUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Wait for page to stabilize
      await this.page.waitForTimeout(2000);
      
      const loadTime = Date.now() - startTime;
      const finalUrl = this.page.url();
      
      console.log(`   Status: ${response?.status()}, Load time: ${loadTime}ms`);
      console.log(`   Final URL: ${finalUrl}`);
      
      // Check if we were redirected
      const wasRedirected = finalUrl !== fullUrl;
      if (wasRedirected) {
        console.log(`   ⚠️  Page was redirected from ${fullUrl} to ${finalUrl}`);
      }
      
      // Take screenshot with safe filename
      const safePageName = this.sanitizeFilename(pageName);
      const screenshotPath = path.join(this.screenshotDir, `${safePageName}_desktop.png`);
      
      try {
        await this.page.screenshot({ 
          path: screenshotPath, 
          fullPage: true 
        });
        console.log(`   📸 Screenshot saved: ${screenshotPath}`);
      } catch (screenshotError) {
        console.log(`   ⚠️  Screenshot failed: ${screenshotError.message}`);
      }

      // Get page information
      const title = await this.page.title().catch(() => 'Unable to get title');
      const metaDescription = await this.page.$eval('meta[name="description"]', el => el.content).catch(() => 'Not found');

      // Analyze page content
      const pageAnalysis = {
        name: pageName,
        path: pagePath,
        requestedUrl: fullUrl,
        finalUrl: finalUrl,
        wasRedirected: wasRedirected,
        status: response?.status() || 'unknown',
        loadTime: loadTime,
        title: title,
        metaDescription: metaDescription,
        screenshot: screenshotPath,
        elements: await this.analyzePageElements(),
        forms: await this.analyzeForms(),
        accessibility: await this.checkBasicAccessibility(),
        timestamp: new Date().toISOString()
      };

      // Test responsive design
      if (!wasRedirected || finalUrl.includes('nestfest')) {
        pageAnalysis.responsive = await this.checkResponsive(safePageName);
      }

      this.results.pages.push(pageAnalysis);
      this.results.performance.push({
        page: pageName,
        loadTime: loadTime,
        status: response?.status()
      });

      console.log(`   ✅ ${pageName} analysis completed`);
      return pageAnalysis;

    } catch (error) {
      console.error(`   ❌ Error analyzing ${pageName}:`, error.message);
      this.results.errors.push({
        type: 'navigation',
        page: pageName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return {
        name: pageName,
        path: pagePath,
        error: error.message,
        status: 'failed'
      };
    }
  }

  async analyzePageElements() {
    try {
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

      // Count images and links
      elements.images = await this.page.$$('img').then(els => els.length);
      elements.links = await this.page.$$('a').then(els => els.length);

      return elements;
    } catch (error) {
      console.log(`   ⚠️  Element analysis failed: ${error.message}`);
      return { error: error.message };
    }
  }

  async analyzeForms() {
    try {
      const forms = await this.page.$$eval('form', forms => 
        forms.map(form => ({
          action: form.action,
          method: form.method || 'GET',
          inputCount: form.querySelectorAll('input, textarea, select').length,
          hasSubmitButton: form.querySelector('button[type="submit"], input[type="submit"]') !== null
        }))
      );
      return forms;
    } catch (error) {
      console.log(`   ⚠️  Form analysis failed: ${error.message}`);
      return [];
    }
  }

  async checkBasicAccessibility() {
    try {
      const issues = [];
      
      // Check for missing alt text on images
      const imagesWithoutAlt = await this.page.$$('img:not([alt]), img[alt=""]');
      if (imagesWithoutAlt.length > 0) {
        issues.push(`${imagesWithoutAlt.length} images missing alt text`);
      }

      // Check for heading hierarchy
      const h1Count = await this.page.$$('h1').then(els => els.length);
      if (h1Count === 0) {
        issues.push('No H1 heading found');
      } else if (h1Count > 1) {
        issues.push('Multiple H1 headings found');
      }

      // Check for form labels
      const inputs = await this.page.$$('input[type="text"], input[type="email"], textarea');
      const labels = await this.page.$$('label');
      if (inputs.length > 0 && labels.length === 0) {
        issues.push('Form inputs may be missing labels');
      }

      return issues;
    } catch (error) {
      console.log(`   ⚠️  Accessibility check failed: ${error.message}`);
      return [`Accessibility check failed: ${error.message}`];
    }
  }

  async checkResponsive(safePageName) {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 }
    ];

    const responsiveResults = [];

    for (const viewport of viewports) {
      try {
        await this.page.setViewportSize(viewport);
        await this.page.waitForTimeout(1000);

        const screenshotPath = path.join(this.screenshotDir, `${safePageName}_${viewport.name.toLowerCase()}.png`);
        await this.page.screenshot({ path: screenshotPath, fullPage: true });

        responsiveResults.push({
          viewport: viewport.name,
          size: `${viewport.width}x${viewport.height}`,
          screenshot: screenshotPath
        });
        
        console.log(`   📱 ${viewport.name} screenshot saved`);
      } catch (error) {
        console.log(`   ⚠️  ${viewport.name} screenshot failed: ${error.message}`);
      }
    }

    // Reset to desktop viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    return responsiveResults;
  }

  async runFullAnalysis() {
    console.log('🚀 Starting NestFest website analysis...');
    console.log(`📍 Target URL: ${this.baseUrl}`);
    
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

    console.log(`📋 Testing ${pagesToTest.length} pages...`);

    // Test each page
    for (const pageInfo of pagesToTest) {
      await this.analyzePage(pageInfo.path, pageInfo.name);
      await this.page.waitForTimeout(1000); // Brief pause between pages
    }

    // Calculate summary statistics
    this.calculateSummary();

    console.log('\n📊 Analysis Summary:');
    console.log(`   Total pages tested: ${this.results.summary.totalPages}`);
    console.log(`   Successful pages: ${this.results.summary.successfulPages}`);
    console.log(`   Redirected pages: ${this.results.summary.redirectedPages}`);
    console.log(`   Errors found: ${this.results.summary.errors}`);

    console.log('\n📝 Generating report...');
    await this.generateReport();
    
    await this.browser.close();
    return this.results;
  }

  calculateSummary() {
    this.results.summary.totalPages = this.results.pages.length;
    this.results.summary.successfulPages = this.results.pages.filter(p => p.status === 200).length;
    this.results.summary.redirectedPages = this.results.pages.filter(p => p.wasRedirected).length;
    this.results.summary.errors = this.results.errors.length;
    
    // Calculate average load time for successful pages
    const successfulPages = this.results.performance.filter(p => p.status === 200);
    if (successfulPages.length > 0) {
      const loadTimes = successfulPages.map(p => p.loadTime);
      this.results.summary.averageLoadTime = Math.round(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length);
      this.results.summary.maxLoadTime = Math.max(...loadTimes);
    } else {
      this.results.summary.averageLoadTime = 0;
      this.results.summary.maxLoadTime = 0;
    }
  }

  async generateReport() {
    const reportHtml = this.generateReportHTML();
    const reportPath = path.resolve('./nestfest-analysis-report.html');
    
    fs.writeFileSync(reportPath, reportHtml);
    console.log(`📄 HTML report saved: ${reportPath}`);
    
    // Also save raw data as JSON
    const dataPath = path.resolve('./nestfest-analysis-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(this.results, null, 2));
    console.log(`🗂️  JSON data saved: ${dataPath}`);
    
    return reportPath;
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
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 50px; padding-bottom: 30px; border-bottom: 3px solid #e9ecef; }
        .header h1 { color: #2c3e50; margin-bottom: 10px; font-size: 2.5rem; }
        .header p { color: #6c757d; font-size: 1.1rem; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 40px 0; }
        .metric { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .metric h3 { margin: 0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; }
        .metric .value { font-size: 2.2rem; font-weight: bold; margin: 15px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .success { background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important; }
        .warning { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%) !important; }
        .error { background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%) !important; }
        .section { margin: 40px 0; padding: 30px; border: 1px solid #e9ecef; border-radius: 10px; background: #fff; }
        .section h2 { color: #2c3e50; border-bottom: 2px solid #e9ecef; padding-bottom: 15px; margin-bottom: 25px; }
        .error-list { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc3545; }
        .page-card { border: 1px solid #dee2e6; border-radius: 8px; margin: 20px 0; overflow: hidden; }
        .page-header { background: #f8f9fa; padding: 20px; border-bottom: 1px solid #dee2e6; }
        .page-content { padding: 20px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
        .status-200 { background: #d4edda; color: #155724; }
        .status-404 { background: #f8d7da; color: #721c24; }
        .status-401 { background: #ffeaa7; color: #856404; }
        .status-redirect { background: #cce5ff; color: #004085; }
        .screenshot { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .responsive-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .responsive-item { text-align: center; }
        .responsive-item h4 { margin-bottom: 10px; color: #495057; }
        .responsive-item img { width: 100%; height: auto; border-radius: 8px; border: 1px solid #dee2e6; }
        .recommendations { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; border-radius: 0 8px 8px 0; }
        .recommendations ul { margin: 0; padding-left: 20px; }
        .recommendations li { margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 15px 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background-color: #f8f9fa; font-weight: 600; color: #495057; }
        tbody tr:hover { background-color: #f8f9fa; }
        .load-time { font-family: 'Courier New', monospace; background: #f8f9fa; padding: 2px 6px; border-radius: 4px; }
        .footer { text-align: center; margin-top: 50px; padding: 30px 0; color: #6c757d; border-top: 1px solid #dee2e6; }
        details { margin: 15px 0; }
        summary { cursor: pointer; padding: 10px; background: #f8f9fa; border-radius: 4px; font-weight: 500; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 NestFest Website Analysis Report</h1>
            <p>Comprehensive Playwright automation analysis conducted on <strong>${new Date(this.results.timestamp).toLocaleString()}</strong></p>
            <p><strong>Target Site:</strong> <a href="${this.results.baseUrl}" target="_blank">${this.results.baseUrl}</a></p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>Total Pages</h3>
                <div class="value">${this.results.summary.totalPages}</div>
            </div>
            <div class="metric ${this.results.summary.successfulPages > 0 ? 'success' : 'error'}">
                <h3>Successful Pages</h3>
                <div class="value">${this.results.summary.successfulPages}</div>
            </div>
            <div class="metric ${this.results.summary.redirectedPages > 0 ? 'warning' : ''}">
                <h3>Redirected Pages</h3>
                <div class="value">${this.results.summary.redirectedPages}</div>
            </div>
            <div class="metric ${this.results.summary.errors === 0 ? 'success' : 'error'}">
                <h3>Issues Found</h3>
                <div class="value">${this.results.summary.errors}</div>
            </div>
            ${this.results.summary.averageLoadTime > 0 ? `
            <div class="metric ${this.results.summary.averageLoadTime < 2000 ? 'success' : this.results.summary.averageLoadTime < 5000 ? 'warning' : 'error'}">
                <h3>Avg Load Time</h3>
                <div class="value">${this.results.summary.averageLoadTime}ms</div>
            </div>
            ` : ''}
        </div>

        ${this.results.errors.length > 0 ? `
        <div class="section">
            <h2>🚨 Issues Detected</h2>
            <div class="error-list">
                ${this.results.errors.map((error, index) => `
                    <div style="margin-bottom: ${index < this.results.errors.length - 1 ? '15px' : '0'}; padding-bottom: ${index < this.results.errors.length - 1 ? '15px' : '0'}; border-bottom: ${index < this.results.errors.length - 1 ? '1px solid rgba(114,28,36,0.2)' : 'none'};">
                        <strong>${error.type.toUpperCase()}:</strong> ${error.message || error.error}
                        ${error.url ? `<br><small><strong>URL:</strong> ${error.url}</small>` : ''}
                        ${error.page ? `<br><small><strong>Page:</strong> ${error.page}</small>` : ''}
                        ${error.status ? `<br><small><strong>Status:</strong> ${error.status}</small>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${this.results.redirects.length > 0 ? `
        <div class="section">
            <h2>🔀 Redirects Detected</h2>
            <table>
                <thead>
                    <tr>
                        <th>From URL</th>
                        <th>To URL</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.results.redirects.map(redirect => `
                        <tr>
                            <td><small>${redirect.from}</small></td>
                            <td><small>${redirect.to || 'Not specified'}</small></td>
                            <td><span class="status-badge status-redirect">${redirect.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="section">
            <h2>📊 Page Analysis Overview</h2>
            <table>
                <thead>
                    <tr>
                        <th>Page</th>
                        <th>Status</th>
                        <th>Load Time</th>
                        <th>Redirected</th>
                        <th>Title</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.results.pages.map(page => `
                        <tr>
                            <td><strong>${page.name}</strong></td>
                            <td><span class="status-badge status-${page.status}">${page.status || 'failed'}</span></td>
                            <td>${page.loadTime ? `<span class="load-time">${page.loadTime}ms</span>` : 'N/A'}</td>
                            <td>${page.wasRedirected ? '✓ Yes' : '✗ No'}</td>
                            <td>${page.title || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${this.results.pages.map(page => `
            <div class="page-card">
                <div class="page-header">
                    <h3>📄 ${page.name}</h3>
                    <p><strong>Requested:</strong> <code>${page.path}</code></p>
                    ${page.wasRedirected ? `<p><strong>Final URL:</strong> <small>${page.finalUrl}</small></p>` : ''}
                    <p>
                        <span class="status-badge status-${page.status}">${page.status || 'failed'}</span>
                        ${page.loadTime ? `<span class="load-time" style="margin-left: 10px;">${page.loadTime}ms</span>` : ''}
                    </p>
                </div>
                <div class="page-content">
                    ${page.title ? `<p><strong>Title:</strong> ${page.title}</p>` : ''}
                    ${page.metaDescription && page.metaDescription !== 'Not found' ? `<p><strong>Meta Description:</strong> ${page.metaDescription}</p>` : ''}
                    
                    ${page.screenshot && fs.existsSync(page.screenshot) ? `
                        <h4>Desktop View</h4>
                        <img src="file:///${page.screenshot.replace(/\\/g, '/')}" alt="${page.name} desktop view" class="screenshot">
                    ` : ''}
                    
                    ${page.responsive && page.responsive.length > 0 ? `
                        <h4>Responsive Design Testing</h4>
                        <div class="responsive-grid">
                            ${page.responsive.map(resp => `
                                <div class="responsive-item">
                                    <h4>${resp.viewport} (${resp.size})</h4>
                                    ${fs.existsSync(resp.screenshot) ? `
                                        <img src="file:///${resp.screenshot.replace(/\\/g, '/')}" alt="${page.name} ${resp.viewport}">
                                    ` : '<p>Screenshot not available</p>'}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${page.forms && page.forms.length > 0 ? `
                        <h4>Forms Detected (${page.forms.length})</h4>
                        ${page.forms.map(form => `
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 10px 0;">
                                <p><strong>Action:</strong> ${form.action || 'Not specified'} | <strong>Method:</strong> ${form.method}</p>
                                <p><strong>Inputs:</strong> ${form.inputCount} | <strong>Submit Button:</strong> ${form.hasSubmitButton ? 'Yes' : 'No'}</p>
                            </div>
                        `).join('')}
                    ` : ''}

                    ${page.accessibility && page.accessibility.length > 0 ? `
                        <h4>Accessibility Issues</h4>
                        <div class="error-list">
                            ${page.accessibility.map(issue => `<div>⚠️ ${issue}</div>`).join('<br>')}
                        </div>
                    ` : ''}

                    ${page.elements ? `
                        <details>
                            <summary><strong>Technical Elements Analysis</strong></summary>
                            <pre>${JSON.stringify(page.elements, null, 2)}</pre>
                        </details>
                    ` : ''}
                </div>
            </div>
        `).join('')}

        <div class="section recommendations">
            <h2>🎯 Key Findings & Recommendations</h2>
            <ul>
                ${this.generateRecommendations().map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>📋 Executive Summary</h2>
            <p>This comprehensive analysis examined <strong>${this.results.summary.totalPages} pages</strong> of the NestFest website using Playwright browser automation.</p>
            
            <h3>Key Metrics:</h3>
            <ul>
                <li><strong>Successful Pages:</strong> ${this.results.summary.successfulPages} of ${this.results.summary.totalPages}</li>
                <li><strong>Redirected Pages:</strong> ${this.results.summary.redirectedPages} (may require authentication)</li>
                <li><strong>Technical Issues:</strong> ${this.results.summary.errors} detected</li>
                ${this.results.summary.averageLoadTime > 0 ? `<li><strong>Average Load Time:</strong> ${this.results.summary.averageLoadTime}ms</li>` : ''}
            </ul>

            <h3>Overall Assessment:</h3>
            <p>${this.generateOverallAssessment()}</p>
            
            <h3>Priority Actions:</h3>
            <ol>
                <li>Review and address any critical errors identified above</li>
                <li>Implement proper authentication flow testing in staging environment</li>
                <li>Optimize page loading performance where needed</li>
                <li>Fix accessibility issues for better user experience</li>
                <li>Set up automated monitoring for production health</li>
            </ol>
        </div>

        <div class="footer">
            <p>🤖 Analysis generated by Playwright browser automation</p>
            <p>${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Authentication/redirect issues
    const redirectedPages = this.results.summary.redirectedPages;
    if (redirectedPages > 0) {
      recommendations.push(`🔐 <strong>${redirectedPages} pages are being redirected</strong> - likely requiring authentication. Test with valid user credentials.`);
    }
    
    // Performance recommendations
    if (this.results.summary.averageLoadTime > 3000) {
      recommendations.push('⚡ <strong>Optimize page loading times</strong> - current average exceeds 3 seconds');
    } else if (this.results.summary.averageLoadTime > 0 && this.results.summary.averageLoadTime < 2000) {
      recommendations.push('✅ <strong>Excellent page load performance</strong> - average load time is under 2 seconds');
    }
    
    // Error recommendations
    if (this.results.summary.errors > 0) {
      recommendations.push(`🛠️ <strong>Address ${this.results.summary.errors} technical issues</strong> found during testing`);
    } else {
      recommendations.push('✅ <strong>No critical technical errors detected</strong> - site appears stable');
    }
    
    // Accessibility recommendations
    const accessibilityIssues = this.results.pages.reduce((acc, page) => 
      acc + (page.accessibility ? page.accessibility.length : 0), 0);
    if (accessibilityIssues > 0) {
      recommendations.push(`♿ <strong>Improve accessibility</strong> - ${accessibilityIssues} issues found across pages`);
    }
    
    // SEO recommendations
    const pagesWithoutMeta = this.results.pages.filter(p => 
      p.metaDescription === 'Not found' || !p.metaDescription).length;
    if (pagesWithoutMeta > 0) {
      recommendations.push(`📝 <strong>Add meta descriptions</strong> to ${pagesWithoutMeta} pages for better SEO`);
    }
    
    // General recommendations
    recommendations.push('🧪 <strong>Test form submissions</strong> with valid data in staging environment');
    recommendations.push('📱 <strong>Validate mobile experience</strong> on real devices');
    recommendations.push('🔍 <strong>Set up monitoring</strong> for production site health');
    recommendations.push('🚀 <strong>Consider performance optimization</strong> techniques like CDN and caching');
    
    return recommendations;
  }

  generateOverallAssessment() {
    const successRate = (this.results.summary.successfulPages / this.results.summary.totalPages) * 100;
    const hasErrors = this.results.summary.errors > 0;
    const hasRedirects = this.results.summary.redirectedPages > 0;
    
    if (successRate === 100 && !hasErrors) {
      return "🌟 <strong>Excellent</strong> - All pages loaded successfully with no technical issues detected. The site appears to be functioning well.";
    } else if (successRate >= 70 && !hasErrors && hasRedirects) {
      return "⚠️ <strong>Good with Authentication</strong> - Site appears healthy, but several pages require authentication. This is expected for protected areas.";
    } else if (successRate >= 50) {
      return "⚠️ <strong>Mixed Results</strong> - Some pages loaded successfully, but issues were detected that require attention.";
    } else {
      return "🔴 <strong>Needs Attention</strong> - Significant issues detected that should be addressed before production deployment.";
    }
  }
}

// Run the analysis
const analyzer = new NestFestAnalyzer();
analyzer.runFullAnalysis().then(results => {
  console.log('\n🎉 Analysis Complete!');
  console.log('═══════════════════════════════════════');
  console.log(`📊 Total pages analyzed: ${results.summary.totalPages}`);
  console.log(`✅ Successful pages: ${results.summary.successfulPages}`);
  console.log(`🔀 Redirected pages: ${results.summary.redirectedPages}`);
  console.log(`❌ Issues detected: ${results.summary.errors}`);
  if (results.summary.averageLoadTime > 0) {
    console.log(`⚡ Average load time: ${results.summary.averageLoadTime}ms`);
  }
  console.log('═══════════════════════════════════════');
  console.log('📄 Report files generated:');
  console.log('   • nestfest-analysis-report.html');
  console.log('   • nestfest-analysis-data.json');
  console.log('   • screenshots/analysis/ (folder)');
  console.log('\n🎯 Open the HTML report in your browser to view detailed results with screenshots!');
}).catch(error => {
  console.error('❌ Analysis failed:', error);
  process.exit(1);
});