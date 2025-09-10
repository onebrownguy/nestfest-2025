/**
 * Core Web Vitals Performance Test for NestFest App
 * Measures LCP, FID, CLS, and other crucial metrics
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class CoreWebVitalsTest {
  constructor() {
    this.baseUrl = 'https://nestfest.app';
    this.testPages = [
      { name: 'Homepage', path: '/' },
      { name: 'About', path: '/about' },
      { name: 'Registration', path: '/register' },
      { name: 'Terms', path: '/terms' },
      { name: 'Privacy', path: '/privacy' }
    ];
    this.results = [];
  }

  async runCoreWebVitalsTest() {
    console.log('🚀 Starting Core Web Vitals Testing for NestFest App...\n');
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });

    try {
      for (const page of this.testPages) {
        console.log(`📊 Testing ${page.name} (${page.path})...`);
        await this.measurePageVitals(browser, page);
      }
      
      await this.generateDetailedReport();
      
    } catch (error) {
      console.error('❌ Testing error:', error);
    } finally {
      await browser.close();
    }
  }

  async measurePageVitals(browser, pageConfig) {
    const page = await browser.newPage();
    const url = `${this.baseUrl}${pageConfig.path}`;
    
    try {
      // Set viewport for consistent testing
      await page.setViewport({ width: 1366, height: 768 });
      
      // Enable performance monitoring
      await page.setCacheEnabled(false);
      
      const startTime = Date.now();
      
      // Navigate to page
      const response = await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      const navigationTime = Date.now() - startTime;

      // Wait for page to fully render
      await page.waitForTimeout(2000);

      // Measure Core Web Vitals
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals = {};
          
          // Measure LCP (Largest Contentful Paint)
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.lcp = Math.round(lastEntry.startTime);
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // Measure FCP (First Contentful Paint)
          const paintEntries = performance.getEntriesByType('paint');
          const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
          vitals.fcp = fcpEntry ? Math.round(fcpEntry.startTime) : null;

          // Measure CLS (Cumulative Layout Shift)
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            vitals.cls = Math.round(clsValue * 10000) / 10000;
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // Get navigation timing
          const navigation = performance.getEntriesByType('navigation')[0];
          if (navigation) {
            vitals.ttfb = Math.round(navigation.responseStart - navigation.fetchStart);
            vitals.domContentLoaded = Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart);
            vitals.loadComplete = Math.round(navigation.loadEventEnd - navigation.fetchStart);
          }

          // Get resource timing
          const resources = performance.getEntriesByType('resource');
          vitals.resourceCount = resources.length;
          vitals.totalResourceSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
          
          // Resource breakdown
          vitals.resourceBreakdown = {
            images: resources.filter(r => r.initiatorType === 'img').length,
            scripts: resources.filter(r => r.initiatorType === 'script').length,
            stylesheets: resources.filter(r => r.initiatorType === 'link').length,
            fonts: resources.filter(r => r.name.includes('font') || r.name.includes('.woff')).length
          };

          setTimeout(() => {
            resolve(vitals);
          }, 1000);
        });
      });

      // Additional performance metrics
      const performanceMetrics = await page.metrics();
      
      // Screenshot for visual validation
      const screenshotPath = `screenshots/performance-${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const result = {
        pageName: pageConfig.name,
        url,
        status: response?.status(),
        navigationTime,
        screenshot: screenshotPath,
        coreWebVitals: vitals,
        performanceMetrics,
        timestamp: new Date().toISOString()
      };

      this.results.push(result);

      // Console output
      console.log(`   ✅ Status: ${result.status}`);
      console.log(`   ⏱️  Navigation: ${navigationTime}ms`);
      console.log(`   🚀 TTFB: ${vitals.ttfb || 'N/A'}ms`);
      console.log(`   🎨 FCP: ${vitals.fcp || 'N/A'}ms`);
      console.log(`   📊 LCP: ${vitals.lcp || 'N/A'}ms`);
      console.log(`   📐 CLS: ${vitals.cls || 'N/A'}`);
      console.log(`   📦 Resources: ${vitals.resourceCount}`);
      console.log(`   💾 Total Size: ${(vitals.totalResourceSize / 1024).toFixed(2)}KB`);
      console.log('');

    } catch (error) {
      console.error(`   ❌ Error testing ${pageConfig.name}:`, error.message);
      this.results.push({
        pageName: pageConfig.name,
        url,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      await page.close();
    }
  }

  async generateDetailedReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 NESTFEST CORE WEB VITALS REPORT');
    console.log('='.repeat(80));

    const successfulTests = this.results.filter(r => !r.error);
    const failedTests = this.results.filter(r => r.error);

    if (successfulTests.length > 0) {
      // Core Web Vitals Summary
      console.log('\n🎯 CORE WEB VITALS SUMMARY:');
      
      const avgFcp = this.calculateAverage(successfulTests, 'coreWebVitals.fcp');
      const avgLcp = this.calculateAverage(successfulTests, 'coreWebVitals.lcp');
      const avgCls = this.calculateAverage(successfulTests, 'coreWebVitals.cls');
      const avgTtfb = this.calculateAverage(successfulTests, 'coreWebVitals.ttfb');

      console.log(`   🚀 Average TTFB: ${avgTtfb || 'N/A'}ms`);
      console.log(`   🎨 Average FCP: ${avgFcp || 'N/A'}ms`);
      console.log(`   📊 Average LCP: ${avgLcp || 'N/A'}ms`);
      console.log(`   📐 Average CLS: ${avgCls || 'N/A'}`);

      // Detailed page analysis
      console.log('\n📄 DETAILED PAGE ANALYSIS:');
      successfulTests.forEach(result => {
        const cwv = result.coreWebVitals;
        const grade = this.calculateCoreWebVitalGrade(cwv);
        
        console.log(`\n   ${result.pageName}:`);
        console.log(`     Status: ${result.status}`);
        console.log(`     Navigation Time: ${result.navigationTime}ms`);
        console.log(`     TTFB: ${cwv.ttfb || 'N/A'}ms ${this.getTtfbStatus(cwv.ttfb)}`);
        console.log(`     FCP: ${cwv.fcp || 'N/A'}ms ${this.getFcpStatus(cwv.fcp)}`);
        console.log(`     LCP: ${cwv.lcp || 'N/A'}ms ${this.getLcpStatus(cwv.lcp)}`);
        console.log(`     CLS: ${cwv.cls || 'N/A'} ${this.getClsStatus(cwv.cls)}`);
        console.log(`     Resources: ${cwv.resourceCount} (${(cwv.totalResourceSize / 1024).toFixed(2)}KB)`);
        console.log(`     Overall Grade: ${grade}/100`);
      });

      // Resource Analysis
      console.log('\n📦 RESOURCE ANALYSIS:');
      const totalResources = successfulTests.reduce((sum, r) => sum + (r.coreWebVitals.resourceCount || 0), 0);
      const avgResources = Math.round(totalResources / successfulTests.length);
      const totalSize = successfulTests.reduce((sum, r) => sum + (r.coreWebVitals.totalResourceSize || 0), 0);
      
      console.log(`   Total Resources: ${totalResources}`);
      console.log(`   Average per Page: ${avgResources} resources`);
      console.log(`   Total Transfer Size: ${(totalSize / 1024).toFixed(2)}KB`);
      console.log(`   Average Page Size: ${(totalSize / successfulTests.length / 1024).toFixed(2)}KB`);

      // Performance recommendations
      this.generateCoreWebVitalsRecommendations(successfulTests);
    }

    if (failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      failedTests.forEach(result => {
        console.log(`   ${result.pageName}: ${result.error}`);
      });
    }

    // Save comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      testType: 'Core Web Vitals',
      summary: {
        totalPages: this.testPages.length,
        successfulTests: successfulTests.length,
        failedTests: failedTests.length,
        averages: {
          ttfb: this.calculateAverage(successfulTests, 'coreWebVitals.ttfb'),
          fcp: this.calculateAverage(successfulTests, 'coreWebVitals.fcp'),
          lcp: this.calculateAverage(successfulTests, 'coreWebVitals.lcp'),
          cls: this.calculateAverage(successfulTests, 'coreWebVitals.cls')
        }
      },
      results: this.results,
      recommendations: this.getCoreWebVitalsRecommendations(successfulTests)
    };

    fs.writeFileSync('nestfest-core-web-vitals-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved: nestfest-core-web-vitals-report.json');
    console.log('='.repeat(80));
  }

  calculateAverage(results, path) {
    const values = results
      .map(r => this.getNestedValue(r, path))
      .filter(v => v !== null && v !== undefined && !isNaN(v));
    
    return values.length > 0 ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : null;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  calculateCoreWebVitalGrade(cwv) {
    let score = 100;

    // TTFB scoring
    if (cwv.ttfb > 800) score -= 15;
    else if (cwv.ttfb > 600) score -= 10;
    else if (cwv.ttfb > 400) score -= 5;

    // FCP scoring
    if (cwv.fcp > 3000) score -= 20;
    else if (cwv.fcp > 1800) score -= 10;
    else if (cwv.fcp > 1000) score -= 5;

    // LCP scoring
    if (cwv.lcp > 4000) score -= 25;
    else if (cwv.lcp > 2500) score -= 15;
    else if (cwv.lcp > 1500) score -= 5;

    // CLS scoring
    if (cwv.cls > 0.25) score -= 20;
    else if (cwv.cls > 0.1) score -= 10;
    else if (cwv.cls > 0.05) score -= 5;

    return Math.max(0, score);
  }

  getTtfbStatus(ttfb) {
    if (!ttfb) return '';
    if (ttfb <= 600) return '✅';
    if (ttfb <= 800) return '⚠️';
    return '❌';
  }

  getFcpStatus(fcp) {
    if (!fcp) return '';
    if (fcp <= 1800) return '✅';
    if (fcp <= 3000) return '⚠️';
    return '❌';
  }

  getLcpStatus(lcp) {
    if (!lcp) return '';
    if (lcp <= 2500) return '✅';
    if (lcp <= 4000) return '⚠️';
    return '❌';
  }

  getClsStatus(cls) {
    if (cls === null || cls === undefined) return '';
    if (cls <= 0.1) return '✅';
    if (cls <= 0.25) return '⚠️';
    return '❌';
  }

  generateCoreWebVitalsRecommendations(results) {
    console.log('\n🔧 CORE WEB VITALS RECOMMENDATIONS:');

    const avgLcp = this.calculateAverage(results, 'coreWebVitals.lcp');
    const avgFcp = this.calculateAverage(results, 'coreWebVitals.fcp');
    const avgCls = this.calculateAverage(results, 'coreWebVitals.cls');
    const avgTtfb = this.calculateAverage(results, 'coreWebVitals.ttfb');

    // LCP recommendations
    if (avgLcp > 4000) {
      console.log('\n   🚨 CRITICAL - Poor LCP (Largest Contentful Paint)');
      console.log(`      Current: ${avgLcp}ms | Target: <2500ms`);
      console.log('      → Optimize loading of largest element (images, text blocks)');
      console.log('      → Implement resource hints (preload, prefetch)');
      console.log('      → Use faster hosting/CDN');
    } else if (avgLcp > 2500) {
      console.log('\n   ⚠️  WARNING - Needs LCP Improvement');
      console.log(`      Current: ${avgLcp}ms | Target: <2500ms`);
      console.log('      → Optimize largest content element');
      console.log('      → Reduce server response times');
    }

    // FCP recommendations
    if (avgFcp > 3000) {
      console.log('\n   🚨 CRITICAL - Poor FCP (First Contentful Paint)');
      console.log(`      Current: ${avgFcp}ms | Target: <1800ms`);
      console.log('      → Eliminate render-blocking resources');
      console.log('      → Minimize main-thread work');
      console.log('      → Reduce server response times');
    } else if (avgFcp > 1800) {
      console.log('\n   ⚠️  WARNING - Needs FCP Improvement');
      console.log(`      Current: ${avgFcp}ms | Target: <1800ms`);
      console.log('      → Optimize CSS delivery');
      console.log('      → Remove unused CSS/JS');
    }

    // CLS recommendations
    if (avgCls > 0.25) {
      console.log('\n   🚨 CRITICAL - Poor CLS (Cumulative Layout Shift)');
      console.log(`      Current: ${avgCls} | Target: <0.1`);
      console.log('      → Set explicit dimensions for images and embeds');
      console.log('      → Avoid inserting content above existing content');
      console.log('      → Use font-display: swap for web fonts');
    } else if (avgCls > 0.1) {
      console.log('\n   ⚠️  WARNING - Needs CLS Improvement');
      console.log(`      Current: ${avgCls} | Target: <0.1`);
      console.log('      → Reserve space for dynamic content');
      console.log('      → Optimize font loading');
    }

    // TTFB recommendations
    if (avgTtfb > 800) {
      console.log('\n   ⚠️  WARNING - Slow Server Response');
      console.log(`      Current TTFB: ${avgTtfb}ms | Target: <600ms`);
      console.log('      → Optimize backend performance');
      console.log('      → Implement server-side caching');
      console.log('      → Use faster hosting solution');
    }
  }

  getCoreWebVitalsRecommendations(results) {
    // Return structured recommendations for JSON report
    return {
      lcp: this.getLcpRecommendations(results),
      fcp: this.getFcpRecommendations(results),
      cls: this.getClsRecommendations(results),
      ttfb: this.getTtfbRecommendations(results)
    };
  }

  getLcpRecommendations(results) {
    const avgLcp = this.calculateAverage(results, 'coreWebVitals.lcp');
    if (avgLcp > 4000) {
      return {
        priority: 'critical',
        current: avgLcp,
        target: 2500,
        actions: [
          'Optimize loading of largest element',
          'Implement resource hints',
          'Use faster hosting/CDN'
        ]
      };
    } else if (avgLcp > 2500) {
      return {
        priority: 'warning',
        current: avgLcp,
        target: 2500,
        actions: [
          'Optimize largest content element',
          'Reduce server response times'
        ]
      };
    }
    return { priority: 'good', current: avgLcp };
  }

  getFcpRecommendations(results) {
    const avgFcp = this.calculateAverage(results, 'coreWebVitals.fcp');
    if (avgFcp > 3000) {
      return {
        priority: 'critical',
        current: avgFcp,
        target: 1800,
        actions: [
          'Eliminate render-blocking resources',
          'Minimize main-thread work',
          'Reduce server response times'
        ]
      };
    } else if (avgFcp > 1800) {
      return {
        priority: 'warning',
        current: avgFcp,
        target: 1800,
        actions: [
          'Optimize CSS delivery',
          'Remove unused CSS/JS'
        ]
      };
    }
    return { priority: 'good', current: avgFcp };
  }

  getClsRecommendations(results) {
    const avgCls = this.calculateAverage(results, 'coreWebVitals.cls');
    if (avgCls > 0.25) {
      return {
        priority: 'critical',
        current: avgCls,
        target: 0.1,
        actions: [
          'Set explicit dimensions for images',
          'Avoid inserting content above existing content',
          'Use font-display: swap'
        ]
      };
    } else if (avgCls > 0.1) {
      return {
        priority: 'warning',
        current: avgCls,
        target: 0.1,
        actions: [
          'Reserve space for dynamic content',
          'Optimize font loading'
        ]
      };
    }
    return { priority: 'good', current: avgCls };
  }

  getTtfbRecommendations(results) {
    const avgTtfb = this.calculateAverage(results, 'coreWebVitals.ttfb');
    if (avgTtfb > 800) {
      return {
        priority: 'warning',
        current: avgTtfb,
        target: 600,
        actions: [
          'Optimize backend performance',
          'Implement server-side caching',
          'Use faster hosting solution'
        ]
      };
    }
    return { priority: 'good', current: avgTtfb };
  }
}

// Run Core Web Vitals test
async function runCoreWebVitalsTest() {
  const testSuite = new CoreWebVitalsTest();
  await testSuite.runCoreWebVitalsTest();
}

// Execute if run directly
if (require.main === module) {
  runCoreWebVitalsTest().catch(console.error);
}

module.exports = CoreWebVitalsTest;