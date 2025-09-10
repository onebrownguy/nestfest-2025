/**
 * Quick Performance Test for NestFest App
 * Fast load time testing with essential metrics
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class QuickPerformanceTest {
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

  async testPageLoadTime(url) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const parsedUrl = new URL(url);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Performance-Test/1.0'
        }
      };

      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = client.request(options, (res) => {
        const ttfbTime = Date.now() - startTime; // TTFB
        
        let data = '';
        let firstByteReceived = false;
        
        res.on('data', (chunk) => {
          if (!firstByteReceived) {
            firstByteReceived = true;
          }
          data += chunk;
        });
        
        res.on('end', () => {
          const totalTime = Date.now() - startTime;
          const contentLength = res.headers['content-length'] || data.length;
          
          resolve({
            url,
            status: res.statusCode,
            ttfb: ttfbTime,
            totalTime,
            contentLength: parseInt(contentLength),
            contentType: res.headers['content-type'],
            server: res.headers['server'],
            cacheControl: res.headers['cache-control'],
            lastModified: res.headers['last-modified'],
            etag: res.headers['etag'],
            timestamp: new Date().toISOString()
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          url,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });

      req.setTimeout(30000, () => {
        req.destroy();
        resolve({
          url,
          error: 'Request timeout after 30 seconds',
          timestamp: new Date().toISOString()
        });
      });

      req.end();
    });
  }

  async testImageAsset(imagePath) {
    const imageUrl = `${this.baseUrl}${imagePath}`;
    return this.testPageLoadTime(imageUrl);
  }

  async runAllTests() {
    console.log('🚀 Starting Quick Performance Tests for NestFest App...\n');
    
    // Test all pages
    for (const page of this.testPages) {
      const url = `${this.baseUrl}${page.path}`;
      console.log(`📊 Testing ${page.name} (${page.path})...`);
      
      const result = await this.testPageLoadTime(url);
      result.pageName = page.name;
      this.results.push(result);
      
      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      } else {
        console.log(`   ✅ Status: ${result.status}`);
        console.log(`   ⚡ TTFB: ${result.ttfb}ms`);
        console.log(`   ⏱️  Total: ${result.totalTime}ms`);
        console.log(`   💾 Size: ${(result.contentLength / 1024).toFixed(2)}KB`);
      }
      console.log('');
    }
    
    // Test image assets
    console.log('🖼️  Testing Image Assets...\n');
    const imageAssets = ['/acc-campus-hero.jpg', '/spatial-nest.png'];
    
    for (const imagePath of imageAssets) {
      console.log(`🖼️  Testing ${imagePath}...`);
      
      const result = await this.testImageAsset(imagePath);
      result.pageName = `Image: ${imagePath}`;
      result.assetType = 'image';
      this.results.push(result);
      
      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      } else {
        console.log(`   ✅ Status: ${result.status}`);
        console.log(`   ⏱️  Load Time: ${result.totalTime}ms`);
        console.log(`   💾 Size: ${(result.contentLength / 1024).toFixed(2)}KB`);
        console.log(`   🗂️  Type: ${result.contentType}`);
      }
      console.log('');
    }
    
    this.generateReport();
  }

  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📋 NESTFEST PERFORMANCE REPORT');
    console.log('='.repeat(70));
    
    const pageResults = this.results.filter(r => !r.assetType && !r.error);
    const imageResults = this.results.filter(r => r.assetType === 'image' && !r.error);
    const errorResults = this.results.filter(r => r.error);
    
    if (pageResults.length > 0) {
      console.log('\n🚀 PAGE PERFORMANCE SUMMARY:');
      
      // Calculate averages
      const avgTtfb = pageResults.reduce((sum, r) => sum + r.ttfb, 0) / pageResults.length;
      const avgTotal = pageResults.reduce((sum, r) => sum + r.totalTime, 0) / pageResults.length;
      const totalSize = pageResults.reduce((sum, r) => sum + r.contentLength, 0);
      
      console.log(`   📊 Average TTFB: ${Math.round(avgTtfb)}ms`);
      console.log(`   ⏱️  Average Load Time: ${Math.round(avgTotal)}ms`);
      console.log(`   💾 Total Page Size: ${(totalSize / 1024).toFixed(2)}KB`);
      
      // Individual page results
      console.log('\n   📄 Individual Page Results:');
      pageResults.forEach(result => {
        const grade = this.calculateGrade(result);
        console.log(`      ${result.pageName}:`);
        console.log(`        TTFB: ${result.ttfb}ms | Total: ${result.totalTime}ms | Size: ${(result.contentLength / 1024).toFixed(2)}KB | Grade: ${grade}`);
      });
      
      // Performance analysis
      console.log('\n   🎯 Performance Analysis:');
      const fastestPage = pageResults.reduce((min, r) => r.totalTime < min.totalTime ? r : min);
      const slowestPage = pageResults.reduce((max, r) => r.totalTime > max.totalTime ? r : max);
      
      console.log(`      Fastest Page: ${fastestPage.pageName} (${fastestPage.totalTime}ms)`);
      console.log(`      Slowest Page: ${slowestPage.pageName} (${slowestPage.totalTime}ms)`);
      
      // Performance grades
      const grades = pageResults.map(r => this.calculateGrade(r));
      const avgGrade = grades.reduce((sum, g) => sum + parseFloat(g), 0) / grades.length;
      console.log(`      Overall Grade: ${avgGrade.toFixed(1)}/100`);
    }
    
    if (imageResults.length > 0) {
      console.log('\n🖼️  IMAGE ASSET PERFORMANCE:');
      imageResults.forEach(result => {
        const optimizationStatus = this.analyzeImageOptimization(result);
        console.log(`   ${result.pageName}:`);
        console.log(`     Load Time: ${result.totalTime}ms`);
        console.log(`     Size: ${(result.contentLength / 1024).toFixed(2)}KB`);
        console.log(`     Optimization: ${optimizationStatus}`);
      });
    }
    
    if (errorResults.length > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:');
      errorResults.forEach(result => {
        console.log(`   ${result.pageName || result.url}: ${result.error}`);
      });
    }
    
    // Generate recommendations
    this.generateRecommendations(pageResults, imageResults);
    
    // Save detailed JSON report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPagesTest: pageResults.length,
        totalImagesTest: imageResults.length,
        totalErrors: errorResults.length,
        averageTtfb: pageResults.length > 0 ? Math.round(pageResults.reduce((sum, r) => sum + r.ttfb, 0) / pageResults.length) : null,
        averageLoadTime: pageResults.length > 0 ? Math.round(pageResults.reduce((sum, r) => sum + r.totalTime, 0) / pageResults.length) : null
      },
      results: this.results,
      analysis: this.analyzeResults(pageResults, imageResults)
    };
    
    require('fs').writeFileSync('nestfest-quick-performance-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed JSON report saved: nestfest-quick-performance-report.json');
    console.log('='.repeat(70));
  }

  calculateGrade(result) {
    let score = 100;
    
    // TTFB scoring
    if (result.ttfb > 1000) score -= 25;
    else if (result.ttfb > 800) score -= 15;
    else if (result.ttfb > 600) score -= 10;
    else if (result.ttfb > 400) score -= 5;
    
    // Total load time scoring
    if (result.totalTime > 5000) score -= 30;
    else if (result.totalTime > 3000) score -= 20;
    else if (result.totalTime > 2000) score -= 10;
    else if (result.totalTime > 1000) score -= 5;
    
    // Content size scoring
    const sizeKB = result.contentLength / 1024;
    if (sizeKB > 1000) score -= 15;
    else if (sizeKB > 500) score -= 10;
    else if (sizeKB > 200) score -= 5;
    
    return Math.max(0, score).toFixed(1);
  }

  analyzeImageOptimization(result) {
    const sizeKB = result.contentLength / 1024;
    const loadTime = result.totalTime;
    
    if (sizeKB > 500 && loadTime > 2000) return '❌ Poor - Large & Slow';
    if (sizeKB > 500) return '⚠️  Needs Compression';
    if (loadTime > 2000) return '⚠️  Slow Loading';
    if (sizeKB < 100 && loadTime < 500) return '✅ Excellent';
    return '✅ Good';
  }

  generateRecommendations(pageResults, imageResults) {
    console.log('\n🔧 PERFORMANCE RECOMMENDATIONS:');
    
    const avgLoadTime = pageResults.reduce((sum, r) => sum + r.totalTime, 0) / pageResults.length;
    const avgTtfb = pageResults.reduce((sum, r) => sum + r.ttfb, 0) / pageResults.length;
    
    // Critical issues
    if (avgLoadTime > 3000) {
      console.log('\n   🚨 CRITICAL: Slow average load time');
      console.log(`      Current: ${Math.round(avgLoadTime)}ms | Target: <2000ms`);
      console.log('      → Implement code splitting and lazy loading');
      console.log('      → Use CDN for static assets');
      console.log('      → Optimize server response times');
    }
    
    if (avgTtfb > 800) {
      console.log('\n   🚨 CRITICAL: Slow server response time');
      console.log(`      Current TTFB: ${Math.round(avgTtfb)}ms | Target: <600ms`);
      console.log('      → Optimize backend performance');
      console.log('      → Implement server-side caching');
      console.log('      → Consider faster hosting solution');
    }
    
    // Important improvements
    const largePages = pageResults.filter(r => r.contentLength > 500 * 1024);
    if (largePages.length > 0) {
      console.log('\n   ⚠️  IMPORTANT: Large page sizes detected');
      largePages.forEach(page => {
        console.log(`      ${page.pageName}: ${(page.contentLength / 1024).toFixed(2)}KB`);
      });
      console.log('      → Minimize CSS and JavaScript');
      console.log('      → Compress text assets with gzip/brotli');
      console.log('      → Remove unused code');
    }
    
    // Image optimization
    const largeImages = imageResults.filter(r => r.contentLength > 300 * 1024);
    if (largeImages.length > 0) {
      console.log('\n   ⚠️  IMPORTANT: Image optimization needed');
      largeImages.forEach(img => {
        console.log(`      ${img.pageName}: ${(img.contentLength / 1024).toFixed(2)}KB`);
      });
      console.log('      → Compress images (WebP format recommended)');
      console.log('      → Implement responsive images');
      console.log('      → Use lazy loading for below-fold images');
    }
    
    // Additional recommendations
    console.log('\n   💡 SUGGESTED IMPROVEMENTS:');
    console.log('      → Implement browser caching headers');
    console.log('      → Use HTTP/2 server push for critical resources');
    console.log('      → Implement service worker for offline caching');
    console.log('      → Monitor Core Web Vitals with real user data');
  }

  analyzeResults(pageResults, imageResults) {
    return {
      performance: {
        averageLoadTime: pageResults.length > 0 ? Math.round(pageResults.reduce((sum, r) => sum + r.totalTime, 0) / pageResults.length) : null,
        averageTtfb: pageResults.length > 0 ? Math.round(pageResults.reduce((sum, r) => sum + r.ttfb, 0) / pageResults.length) : null,
        fastestPage: pageResults.length > 0 ? pageResults.reduce((min, r) => r.totalTime < min.totalTime ? r : min) : null,
        slowestPage: pageResults.length > 0 ? pageResults.reduce((max, r) => r.totalTime > max.totalTime ? r : max) : null
      },
      images: {
        totalSize: imageResults.reduce((sum, r) => sum + r.contentLength, 0),
        averageLoadTime: imageResults.length > 0 ? Math.round(imageResults.reduce((sum, r) => sum + r.totalTime, 0) / imageResults.length) : null,
        largestImage: imageResults.length > 0 ? imageResults.reduce((max, r) => r.contentLength > max.contentLength ? r : max) : null
      },
      grades: {
        pages: pageResults.map(r => ({ name: r.pageName, grade: this.calculateGrade(r) })),
        overall: pageResults.length > 0 ? (pageResults.reduce((sum, r) => sum + parseFloat(this.calculateGrade(r)), 0) / pageResults.length).toFixed(1) : null
      }
    };
  }
}

// Run the quick performance test
async function runQuickTest() {
  const testSuite = new QuickPerformanceTest();
  await testSuite.runAllTests();
}

// Execute if run directly
if (require.main === module) {
  runQuickTest().catch(console.error);
}

module.exports = QuickPerformanceTest;