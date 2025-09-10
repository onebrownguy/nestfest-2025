/**
 * Comprehensive Performance Testing Suite for NestFest App
 * Tests Core Web Vitals, load times, and resource optimization
 */

const { chromium } = require('playwright');
const lighthouse = require('lighthouse');
const fs = require('fs');
const path = require('path');

class PerformanceTestSuite {
  constructor() {
    this.baseUrl = 'https://nestfest.app';
    this.testPages = [
      { name: 'Homepage', path: '/' },
      { name: 'About', path: '/about' },
      { name: 'Registration', path: '/register' },
      { name: 'Terms', path: '/terms' },
      { name: 'Privacy', path: '/privacy' }
    ];
    this.testResults = {};
    this.imageAssets = [
      '/acc-campus-hero.jpg',
      '/spatial-nest.png'
    ];
  }

  async runComprehensiveTests() {
    console.log('🚀 Starting comprehensive performance testing for NestFest App...\n');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    try {
      // Test each page
      for (const pageConfig of this.testPages) {
        console.log(`\n📊 Testing ${pageConfig.name} (${pageConfig.path})...`);
        await this.testPagePerformance(context, pageConfig);
      }

      // Test image optimization
      console.log('\n🖼️  Testing image optimization...');
      await this.testImageOptimization(context);

      // Generate comprehensive report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Testing error:', error);
    } finally {
      await browser.close();
    }
  }

  async testPagePerformance(context, pageConfig) {
    const page = await context.newPage();
    const url = `${this.baseUrl}${pageConfig.path}`;
    
    try {
      // Enable performance monitoring
      await page.route('**/*', (route) => {
        const request = route.request();
        route.continue();
      });

      const startTime = Date.now();
      
      // Navigate and capture timing metrics
      const response = await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      const endTime = Date.now();
      const totalLoadTime = endTime - startTime;

      // Get Core Web Vitals and performance metrics
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lcpEntry = entries.find(entry => entry.entryType === 'largest-contentful-paint');
            const fcpEntry = entries.find(entry => entry.entryType === 'paint' && entry.name === 'first-contentful-paint');
            
            setTimeout(() => {
              const navigation = performance.getEntriesByType('navigation')[0];
              const paintEntries = performance.getEntriesByType('paint');
              const resourceEntries = performance.getEntriesByType('resource');
              
              resolve({
                // Navigation Timing
                ttfb: navigation ? Math.round(navigation.responseStart - navigation.fetchStart) : null,
                domContentLoaded: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart) : null,
                loadComplete: navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : null,
                
                // Core Web Vitals
                fcp: fcpEntry ? Math.round(fcpEntry.startTime) : null,
                lcp: lcpEntry ? Math.round(lcpEntry.startTime) : null,
                
                // Resource Analysis
                totalResources: resourceEntries.length,
                imageResources: resourceEntries.filter(r => r.initiatorType === 'img').length,
                cssResources: resourceEntries.filter(r => r.initiatorType === 'link' || r.name.includes('.css')).length,
                jsResources: resourceEntries.filter(r => r.initiatorType === 'script' || r.name.includes('.js')).length,
                
                // Transfer sizes
                totalTransferSize: resourceEntries.reduce((sum, r) => sum + (r.transferSize || 0), 0),
                
                // Timing breakdown
                resourceTiming: resourceEntries.slice(0, 20).map(r => ({
                  name: r.name.split('/').pop() || r.name,
                  duration: Math.round(r.duration),
                  size: r.transferSize || 0,
                  type: r.initiatorType
                }))
              });
            }, 2000);
          });
          
          observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
        });
      });

      // Additional page-specific metrics
      const pageSize = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        return {
          totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
          imageSize: resources
            .filter(r => r.initiatorType === 'img')
            .reduce((sum, r) => sum + (r.transferSize || 0), 0),
          cssSize: resources
            .filter(r => r.initiatorType === 'link' || r.name.includes('.css'))
            .reduce((sum, r) => sum + (r.transferSize || 0), 0),
          jsSize: resources
            .filter(r => r.initiatorType === 'script' || r.name.includes('.js'))
            .reduce((sum, r) => sum + (r.transferSize || 0), 0)
        };
      });

      // Store results
      this.testResults[pageConfig.name] = {
        url,
        status: response?.status() || 'unknown',
        totalLoadTime,
        ...metrics,
        pageSize,
        timestamp: new Date().toISOString()
      };

      // Console output for real-time monitoring
      console.log(`   ✅ Status: ${response?.status() || 'N/A'}`);
      console.log(`   ⏱️  Total Load Time: ${totalLoadTime}ms`);
      console.log(`   🚀 TTFB: ${metrics.ttfb || 'N/A'}ms`);
      console.log(`   🎨 FCP: ${metrics.fcp || 'N/A'}ms`);
      console.log(`   📊 LCP: ${metrics.lcp || 'N/A'}ms`);
      console.log(`   💾 Total Size: ${(pageSize.totalSize / 1024).toFixed(2)}KB`);
      
    } catch (error) {
      console.error(`   ❌ Error testing ${pageConfig.name}:`, error.message);
      this.testResults[pageConfig.name] = {
        url,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    } finally {
      await page.close();
    }
  }

  async testImageOptimization(context) {
    const page = await context.newPage();
    
    for (const imagePath of this.imageAssets) {
      const imageUrl = `${this.baseUrl}${imagePath}`;
      console.log(`\n   🖼️  Testing ${imagePath}...`);
      
      try {
        const startTime = Date.now();
        const response = await page.goto(imageUrl, { timeout: 15000 });
        const endTime = Date.now();
        
        const contentLength = response.headers()['content-length'];
        const contentType = response.headers()['content-type'];
        
        const imageMetrics = {
          url: imageUrl,
          status: response.status(),
          loadTime: endTime - startTime,
          size: contentLength ? parseInt(contentLength) : null,
          sizeKB: contentLength ? (parseInt(contentLength) / 1024).toFixed(2) : 'Unknown',
          contentType,
          cached: response.fromServiceWorker() || response.headers()['cf-cache-status'] === 'HIT',
          timestamp: new Date().toISOString()
        };
        
        this.testResults[`Image_${imagePath.replace('/', '')}`] = imageMetrics;
        
        console.log(`     ✅ Status: ${imageMetrics.status}`);
        console.log(`     ⏱️  Load Time: ${imageMetrics.loadTime}ms`);
        console.log(`     💾 Size: ${imageMetrics.sizeKB}KB`);
        console.log(`     🗂️  Type: ${imageMetrics.contentType}`);
        
      } catch (error) {
        console.error(`     ❌ Error loading ${imagePath}:`, error.message);
        this.testResults[`Image_${imagePath.replace('/', '')}`] = {
          url: imageUrl,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }
    
    await page.close();
  }

  async generateReport() {
    console.log('\n📋 Generating comprehensive performance report...\n');
    
    const report = {
      summary: {
        testTimestamp: new Date().toISOString(),
        testedUrl: this.baseUrl,
        totalPagestested: this.testPages.length,
        totalImagesAnalyzed: this.imageAssets.length
      },
      results: this.testResults,
      analysis: this.analyzeResults(),
      recommendations: this.generateRecommendations()
    };

    // Save detailed JSON report
    const reportPath = path.join(__dirname, 'nestfest-performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    await this.generateHtmlReport(report);
    
    // Console summary
    this.printSummary();
    
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
    console.log(`📄 HTML report saved: nestfest-performance-report.html`);
  }

  analyzeResults() {
    const analysis = {
      performance: {},
      coreWebVitals: {},
      resourceOptimization: {},
      pageComparison: []
    };

    // Analyze page performance
    const pageResults = Object.entries(this.testResults)
      .filter(([key]) => !key.startsWith('Image_'))
      .map(([name, data]) => ({ name, ...data }));

    if (pageResults.length > 0) {
      const avgLoadTime = pageResults
        .filter(p => p.totalLoadTime)
        .reduce((sum, p) => sum + p.totalLoadTime, 0) / pageResults.length;
      
      const avgTtfb = pageResults
        .filter(p => p.ttfb)
        .reduce((sum, p) => sum + p.ttfb, 0) / pageResults.filter(p => p.ttfb).length;

      analysis.performance = {
        averageLoadTime: Math.round(avgLoadTime),
        averageTtfb: Math.round(avgTtfb),
        fastestPage: pageResults.reduce((min, p) => 
          (p.totalLoadTime && (!min.totalLoadTime || p.totalLoadTime < min.totalLoadTime)) ? p : min, {}),
        slowestPage: pageResults.reduce((max, p) => 
          (p.totalLoadTime && p.totalLoadTime > (max.totalLoadTime || 0)) ? p : max, {})
      };

      // Core Web Vitals analysis
      const fcpValues = pageResults.filter(p => p.fcp).map(p => p.fcp);
      const lcpValues = pageResults.filter(p => p.lcp).map(p => p.lcp);
      
      analysis.coreWebVitals = {
        fcp: {
          average: fcpValues.length > 0 ? Math.round(fcpValues.reduce((a, b) => a + b, 0) / fcpValues.length) : null,
          best: fcpValues.length > 0 ? Math.min(...fcpValues) : null,
          worst: fcpValues.length > 0 ? Math.max(...fcpValues) : null,
          status: this.getCoreWebVitalStatus(fcpValues.reduce((a, b) => a + b, 0) / fcpValues.length, 'fcp')
        },
        lcp: {
          average: lcpValues.length > 0 ? Math.round(lcpValues.reduce((a, b) => a + b, 0) / lcpValues.length) : null,
          best: lcpValues.length > 0 ? Math.min(...lcpValues) : null,
          worst: lcpValues.length > 0 ? Math.max(...lcpValues) : null,
          status: this.getCoreWebVitalStatus(lcpValues.reduce((a, b) => a + b, 0) / lcpValues.length, 'lcp')
        }
      };

      // Page comparison
      analysis.pageComparison = pageResults.map(page => ({
        name: page.name,
        loadTime: page.totalLoadTime,
        ttfb: page.ttfb,
        fcp: page.fcp,
        lcp: page.lcp,
        totalSize: page.pageSize?.totalSize,
        grade: this.calculatePageGrade(page)
      }));
    }

    return analysis;
  }

  getCoreWebVitalStatus(value, metric) {
    if (!value) return 'unknown';
    
    const thresholds = {
      fcp: { good: 1800, needsImprovement: 3000 },
      lcp: { good: 2500, needsImprovement: 4000 }
    };
    
    const threshold = thresholds[metric];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  calculatePageGrade(page) {
    let score = 100;
    
    // Deduct for slow load times
    if (page.totalLoadTime > 3000) score -= 20;
    else if (page.totalLoadTime > 2000) score -= 10;
    else if (page.totalLoadTime > 1000) score -= 5;
    
    // Deduct for poor Core Web Vitals
    if (page.lcp > 4000) score -= 15;
    else if (page.lcp > 2500) score -= 8;
    
    if (page.fcp > 3000) score -= 10;
    else if (page.fcp > 1800) score -= 5;
    
    // Deduct for slow TTFB
    if (page.ttfb > 800) score -= 10;
    else if (page.ttfb > 600) score -= 5;
    
    return Math.max(0, score);
  }

  generateRecommendations() {
    const recommendations = {
      critical: [],
      important: [],
      suggested: []
    };

    const pageResults = Object.values(this.testResults).filter(r => r.totalLoadTime);
    const avgLoadTime = pageResults.reduce((sum, p) => sum + p.totalLoadTime, 0) / pageResults.length;

    // Critical recommendations
    if (avgLoadTime > 3000) {
      recommendations.critical.push({
        issue: "Slow average page load time",
        description: `Average load time is ${Math.round(avgLoadTime)}ms, which exceeds the 3-second threshold`,
        solution: "Implement performance optimization: code splitting, image optimization, CDN usage"
      });
    }

    // Check Core Web Vitals
    const lcpValues = pageResults.filter(p => p.lcp).map(p => p.lcp);
    if (lcpValues.length > 0 && Math.max(...lcpValues) > 4000) {
      recommendations.critical.push({
        issue: "Poor Largest Contentful Paint (LCP)",
        description: "LCP values exceed 4 seconds, indicating slow content rendering",
        solution: "Optimize largest content elements, improve server response times, use faster hosting"
      });
    }

    // Important recommendations
    const imageResults = Object.entries(this.testResults)
      .filter(([key]) => key.startsWith('Image_'))
      .map(([, data]) => data);

    imageResults.forEach(img => {
      if (img.size && img.size > 500000) { // > 500KB
        recommendations.important.push({
          issue: "Large image file detected",
          description: `Image ${img.url} is ${(img.size / 1024).toFixed(2)}KB`,
          solution: "Compress images, use WebP format, implement responsive images"
        });
      }
    });

    // Suggested improvements
    const avgTtfb = pageResults
      .filter(p => p.ttfb)
      .reduce((sum, p) => sum + p.ttfb, 0) / pageResults.filter(p => p.ttfb).length;
      
    if (avgTtfb > 600) {
      recommendations.suggested.push({
        issue: "Server response time could be improved",
        description: `Average TTFB is ${Math.round(avgTtfb)}ms`,
        solution: "Optimize backend performance, use CDN, implement server-side caching"
      });
    }

    return recommendations;
  }

  async generateHtmlReport(report) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NestFest Performance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1f2937; margin-top: 30px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .metric-value { font-size: 2em; font-weight: bold; color: #1e40af; }
        .metric-label { font-size: 0.9em; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
        .status-good { color: #10b981; }
        .status-warning { color: #f59e0b; }
        .status-poor { color: #ef4444; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .recommendation { margin: 15px 0; padding: 15px; border-radius: 6px; }
        .critical { background: #fef2f2; border-left: 4px solid #ef4444; }
        .important { background: #fffbeb; border-left: 4px solid #f59e0b; }
        .suggested { background: #f0f9ff; border-left: 4px solid #3b82f6; }
        .timestamp { color: #6b7280; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 NestFest Performance Report</h1>
        <p class="timestamp">Generated: ${report.summary.testTimestamp}</p>
        
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value">${report.analysis.performance.averageLoadTime || 'N/A'}ms</div>
                <div class="metric-label">Average Load Time</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.analysis.performance.averageTtfb || 'N/A'}ms</div>
                <div class="metric-label">Average TTFB</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.analysis.coreWebVitals.fcp?.average || 'N/A'}ms</div>
                <div class="metric-label">Average FCP</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.analysis.coreWebVitals.lcp?.average || 'N/A'}ms</div>
                <div class="metric-label">Average LCP</div>
            </div>
        </div>
        
        <h2>📊 Page Performance Details</h2>
        <table>
            <thead>
                <tr>
                    <th>Page</th>
                    <th>Load Time</th>
                    <th>TTFB</th>
                    <th>FCP</th>
                    <th>LCP</th>
                    <th>Grade</th>
                </tr>
            </thead>
            <tbody>
                ${report.analysis.pageComparison.map(page => `
                    <tr>
                        <td>${page.name}</td>
                        <td>${page.loadTime || 'N/A'}ms</td>
                        <td>${page.ttfb || 'N/A'}ms</td>
                        <td>${page.fcp || 'N/A'}ms</td>
                        <td>${page.lcp || 'N/A'}ms</td>
                        <td class="${page.grade >= 80 ? 'status-good' : page.grade >= 60 ? 'status-warning' : 'status-poor'}">${page.grade}/100</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h2>🔧 Recommendations</h2>
        ${report.recommendations.critical.map(rec => `
            <div class="recommendation critical">
                <h3>🚨 Critical: ${rec.issue}</h3>
                <p><strong>Issue:</strong> ${rec.description}</p>
                <p><strong>Solution:</strong> ${rec.solution}</p>
            </div>
        `).join('')}
        
        ${report.recommendations.important.map(rec => `
            <div class="recommendation important">
                <h3>⚠️ Important: ${rec.issue}</h3>
                <p><strong>Issue:</strong> ${rec.description}</p>
                <p><strong>Solution:</strong> ${rec.solution}</p>
            </div>
        `).join('')}
        
        ${report.recommendations.suggested.map(rec => `
            <div class="recommendation suggested">
                <h3>💡 Suggested: ${rec.issue}</h3>
                <p><strong>Issue:</strong> ${rec.description}</p>
                <p><strong>Solution:</strong> ${rec.solution}</p>
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    fs.writeFileSync(path.join(__dirname, 'nestfest-performance-report.html'), htmlContent);
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 NESTFEST PERFORMANCE TEST SUMMARY');
    console.log('='.repeat(60));
    
    const pageResults = Object.entries(this.testResults)
      .filter(([key]) => !key.startsWith('Image_'));
    
    if (pageResults.length > 0) {
      console.log('\n🚀 PERFORMANCE METRICS:');
      
      pageResults.forEach(([name, data]) => {
        if (data.totalLoadTime) {
          console.log(`\n   ${name}:`);
          console.log(`     Load Time: ${data.totalLoadTime}ms`);
          console.log(`     TTFB: ${data.ttfb || 'N/A'}ms`);
          console.log(`     FCP: ${data.fcp || 'N/A'}ms`);
          console.log(`     LCP: ${data.lcp || 'N/A'}ms`);
          console.log(`     Total Size: ${data.pageSize?.totalSize ? (data.pageSize.totalSize / 1024).toFixed(2) + 'KB' : 'N/A'}`);
        }
      });
    }

    const imageResults = Object.entries(this.testResults)
      .filter(([key]) => key.startsWith('Image_'));
    
    if (imageResults.length > 0) {
      console.log('\n🖼️  IMAGE OPTIMIZATION:');
      
      imageResults.forEach(([name, data]) => {
        if (data.loadTime) {
          console.log(`\n   ${name.replace('Image_', '')}:`);
          console.log(`     Load Time: ${data.loadTime}ms`);
          console.log(`     Size: ${data.sizeKB}KB`);
          console.log(`     Type: ${data.contentType}`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Execute the performance test suite
async function runTests() {
  const testSuite = new PerformanceTestSuite();
  await testSuite.runComprehensiveTests();
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = PerformanceTestSuite;