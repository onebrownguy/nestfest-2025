/**
 * Comprehensive Performance Testing Suite for NestFest App
 * Tests from multiple locations and provides detailed analysis
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');

class ComprehensivePerformanceTest {
  constructor() {
    this.baseUrl = 'https://nestfest.app';
    this.testPages = [
      { name: 'Homepage', path: '/' },
      { name: 'About', path: '/about' },
      { name: 'Registration', path: '/register' },
      { name: 'Terms', path: '/terms' },
      { name: 'Privacy', path: '/privacy' }
    ];
    this.imageAssets = [
      { name: 'Campus Hero', path: '/acc-campus-hero.jpg' },
      { name: 'Spatial Nest', path: '/spatial-nest.png' }
    ];
    this.results = {
      pages: [],
      images: [],
      summary: {},
      timestamp: new Date().toISOString()
    };
  }

  async runComprehensiveTests() {
    console.log('🚀 Starting Comprehensive Performance Testing for NestFest App...\n');
    console.log(`📍 Testing from: ${this.getTestLocation()}`);
    console.log(`🌐 Target URL: ${this.baseUrl}`);
    console.log(`📊 Test Pages: ${this.testPages.length}`);
    console.log(`🖼️  Image Assets: ${this.imageAssets.length}\n`);

    // Test all pages with multiple metrics
    await this.testAllPages();
    
    // Test image assets
    await this.testImageAssets();
    
    // Run concurrent load test
    await this.testConcurrentLoad();
    
    // Generate comprehensive report
    await this.generateComprehensiveReport();
  }

  async testAllPages() {
    console.log('📄 TESTING ALL PAGES...\n');
    
    for (const page of this.testPages) {
      console.log(`📊 Testing ${page.name} (${page.path})...`);
      
      // Multiple test runs for accuracy
      const testRuns = [];
      for (let i = 0; i < 3; i++) {
        const result = await this.performDetailedPageTest(page);
        testRuns.push(result);
        await this.sleep(100); // Small delay between tests
      }
      
      // Calculate averages
      const avgResult = this.calculateAverageResults(testRuns, page);
      this.results.pages.push(avgResult);
      
      this.displayPageResults(avgResult);
      console.log('');
    }
  }

  async performDetailedPageTest(pageConfig) {
    const url = `${this.baseUrl}${pageConfig.path}`;
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const parsedUrl = new URL(url);
      let dnsLookupTime = 0;
      let connectionTime = 0;
      let sslHandshakeTime = 0;
      let ttfbTime = 0;
      let contentDownloadTime = 0;
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NestFest-Performance-Test/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      };

      const req = https.request(options, (res) => {
        ttfbTime = Date.now() - startTime;
        
        let data = '';
        let firstByteTime = Date.now();
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          contentDownloadTime = Date.now() - firstByteTime;
          const totalTime = Date.now() - startTime;
          
          // Parse HTML to count resources
          const resourceCounts = this.analyzeHtmlContent(data);
          
          resolve({
            url,
            status: res.statusCode,
            totalTime,
            ttfb: ttfbTime,
            contentDownloadTime,
            dnsLookupTime,
            connectionTime,
            sslHandshakeTime,
            contentLength: data.length,
            contentType: res.headers['content-type'],
            serverHeaders: {
              server: res.headers['server'],
              cacheControl: res.headers['cache-control'],
              expires: res.headers['expires'],
              lastModified: res.headers['last-modified'],
              etag: res.headers['etag'],
              xPoweredBy: res.headers['x-powered-by'],
              cfRay: res.headers['cf-ray'],
              cfCacheStatus: res.headers['cf-cache-status']
            },
            resourceCounts,
            compressionSavings: this.calculateCompressionSavings(res.headers, data),
            performance: {
              grade: this.calculatePerformanceGrade(ttfbTime, totalTime, data.length),
              recommendations: this.generatePageRecommendations(ttfbTime, totalTime, data.length, resourceCounts)
            },
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

      req.on('socket', (socket) => {
        const lookupStart = Date.now();
        socket.on('lookup', () => {
          dnsLookupTime = Date.now() - lookupStart;
        });
        
        const connectStart = Date.now();
        socket.on('connect', () => {
          connectionTime = Date.now() - connectStart;
        });
        
        const secureStart = Date.now();
        socket.on('secureConnect', () => {
          sslHandshakeTime = Date.now() - secureStart;
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

  async testImageAssets() {
    console.log('🖼️  TESTING IMAGE ASSETS...\n');
    
    for (const image of this.imageAssets) {
      console.log(`🖼️  Testing ${image.name} (${image.path})...`);
      
      // Multiple test runs for images
      const testRuns = [];
      for (let i = 0; i < 2; i++) {
        const result = await this.performDetailedImageTest(image);
        testRuns.push(result);
        await this.sleep(50);
      }
      
      const avgResult = this.calculateAverageImageResults(testRuns, image);
      this.results.images.push(avgResult);
      
      this.displayImageResults(avgResult);
      console.log('');
    }
  }

  async performDetailedImageTest(imageConfig) {
    const url = `${this.baseUrl}${imageConfig.path}`;
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const parsedUrl = new URL(url);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname,
        method: 'HEAD', // Use HEAD to get headers without downloading full content
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NestFest-Image-Test/1.0'
        }
      };

      const req = https.request(options, (res) => {
        const headerTime = Date.now() - startTime;
        
        // Now make GET request to measure full download
        const getOptions = { ...options, method: 'GET' };
        const getReq = https.request(getOptions, (getRes) => {
          const ttfb = Date.now() - startTime;
          let data = Buffer.alloc(0);
          
          getRes.on('data', (chunk) => {
            data = Buffer.concat([data, chunk]);
          });
          
          getRes.on('end', () => {
            const totalTime = Date.now() - startTime;
            
            resolve({
              url,
              name: imageConfig.name,
              path: imageConfig.path,
              status: getRes.statusCode,
              totalTime,
              ttfb,
              headerTime,
              contentLength: data.length,
              contentType: getRes.headers['content-type'],
              lastModified: getRes.headers['last-modified'],
              cacheControl: getRes.headers['cache-control'],
              optimization: this.analyzeImageOptimization(data, getRes.headers),
              performance: {
                grade: this.calculateImageGrade(totalTime, data.length),
                recommendations: this.generateImageRecommendations(data.length, getRes.headers)
              },
              timestamp: new Date().toISOString()
            });
          });
        });
        
        getReq.on('error', (error) => {
          resolve({
            url,
            name: imageConfig.name,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        });
        
        getReq.end();
      });

      req.on('error', (error) => {
        resolve({
          url,
          name: imageConfig.name,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });

      req.setTimeout(15000, () => {
        req.destroy();
        resolve({
          url,
          name: imageConfig.name,
          error: 'Request timeout after 15 seconds',
          timestamp: new Date().toISOString()
        });
      });

      req.end();
    });
  }

  async testConcurrentLoad() {
    console.log('⚡ TESTING CONCURRENT LOAD PERFORMANCE...\n');
    
    const concurrentTests = [];
    const startTime = Date.now();
    
    // Test 5 concurrent requests to homepage
    for (let i = 0; i < 5; i++) {
      concurrentTests.push(this.performDetailedPageTest({ name: `Concurrent-${i+1}`, path: '/' }));
    }
    
    const results = await Promise.all(concurrentTests);
    const totalTime = Date.now() - startTime;
    
    const successfulResults = results.filter(r => !r.error);
    
    if (successfulResults.length > 0) {
      const avgConcurrentTime = successfulResults.reduce((sum, r) => sum + r.totalTime, 0) / successfulResults.length;
      const maxConcurrentTime = Math.max(...successfulResults.map(r => r.totalTime));
      const minConcurrentTime = Math.min(...successfulResults.map(r => r.totalTime));
      
      console.log(`   ✅ Concurrent requests completed: ${successfulResults.length}/5`);
      console.log(`   ⏱️  Total batch time: ${totalTime}ms`);
      console.log(`   📊 Average response time: ${Math.round(avgConcurrentTime)}ms`);
      console.log(`   📈 Max response time: ${maxConcurrentTime}ms`);
      console.log(`   📉 Min response time: ${minConcurrentTime}ms`);
      console.log(`   📊 Response variance: ${Math.round(maxConcurrentTime - minConcurrentTime)}ms`);
      
      this.results.concurrentLoad = {
        totalBatchTime: totalTime,
        successfulRequests: successfulResults.length,
        averageResponseTime: Math.round(avgConcurrentTime),
        maxResponseTime: maxConcurrentTime,
        minResponseTime: minConcurrentTime,
        variance: maxConcurrentTime - minConcurrentTime,
        results: results
      };
    } else {
      console.log('   ❌ All concurrent requests failed');
    }
    console.log('');
  }

  calculateAverageResults(testRuns, pageConfig) {
    const validRuns = testRuns.filter(r => !r.error);
    
    if (validRuns.length === 0) {
      return {
        pageName: pageConfig.name,
        url: `${this.baseUrl}${pageConfig.path}`,
        error: 'All test runs failed',
        failedRuns: testRuns
      };
    }
    
    const avg = (prop) => Math.round(validRuns.reduce((sum, r) => sum + (r[prop] || 0), 0) / validRuns.length);
    
    const baseResult = validRuns[0];
    
    return {
      pageName: pageConfig.name,
      url: baseResult.url,
      status: baseResult.status,
      testRuns: validRuns.length,
      averages: {
        totalTime: avg('totalTime'),
        ttfb: avg('ttfb'),
        contentDownloadTime: avg('contentDownloadTime'),
        contentLength: avg('contentLength')
      },
      best: {
        totalTime: Math.min(...validRuns.map(r => r.totalTime)),
        ttfb: Math.min(...validRuns.map(r => r.ttfb))
      },
      worst: {
        totalTime: Math.max(...validRuns.map(r => r.totalTime)),
        ttfb: Math.max(...validRuns.map(r => r.ttfb))
      },
      serverHeaders: baseResult.serverHeaders,
      resourceCounts: baseResult.resourceCounts,
      compressionSavings: baseResult.compressionSavings,
      performance: {
        grade: this.calculatePerformanceGrade(avg('ttfb'), avg('totalTime'), avg('contentLength')),
        recommendations: this.generatePageRecommendations(avg('ttfb'), avg('totalTime'), avg('contentLength'), baseResult.resourceCounts)
      },
      consistency: {
        ttfbVariance: Math.max(...validRuns.map(r => r.ttfb)) - Math.min(...validRuns.map(r => r.ttfb)),
        totalTimeVariance: Math.max(...validRuns.map(r => r.totalTime)) - Math.min(...validRuns.map(r => r.totalTime))
      },
      timestamp: new Date().toISOString()
    };
  }

  calculateAverageImageResults(testRuns, imageConfig) {
    const validRuns = testRuns.filter(r => !r.error);
    
    if (validRuns.length === 0) {
      return {
        name: imageConfig.name,
        path: imageConfig.path,
        url: `${this.baseUrl}${imageConfig.path}`,
        error: 'All test runs failed',
        failedRuns: testRuns
      };
    }
    
    const avg = (prop) => Math.round(validRuns.reduce((sum, r) => sum + (r[prop] || 0), 0) / validRuns.length);
    const baseResult = validRuns[0];
    
    return {
      name: imageConfig.name,
      path: imageConfig.path,
      url: baseResult.url,
      status: baseResult.status,
      testRuns: validRuns.length,
      averages: {
        totalTime: avg('totalTime'),
        ttfb: avg('ttfb'),
        contentLength: avg('contentLength')
      },
      best: {
        totalTime: Math.min(...validRuns.map(r => r.totalTime))
      },
      worst: {
        totalTime: Math.max(...validRuns.map(r => r.totalTime))
      },
      contentType: baseResult.contentType,
      cacheControl: baseResult.cacheControl,
      optimization: baseResult.optimization,
      performance: baseResult.performance,
      timestamp: new Date().toISOString()
    };
  }

  analyzeHtmlContent(html) {
    const scriptMatches = (html.match(/<script[^>]*>/gi) || []).length;
    const stylesheetMatches = (html.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || []).length;
    const imageMatches = (html.match(/<img[^>]*>/gi) || []).length;
    const fontMatches = (html.match(/font-family|@font-face/gi) || []).length;
    
    return {
      scripts: scriptMatches,
      stylesheets: stylesheetMatches,
      images: imageMatches,
      fonts: fontMatches,
      totalElements: scriptMatches + stylesheetMatches + imageMatches
    };
  }

  calculateCompressionSavings(headers, content) {
    const encoding = headers['content-encoding'];
    const contentLength = parseInt(headers['content-length'] || content.length);
    const actualLength = content.length;
    
    return {
      encoding: encoding || 'none',
      originalSize: actualLength,
      compressedSize: contentLength,
      savings: encoding ? Math.round(((actualLength - contentLength) / actualLength) * 100) : 0
    };
  }

  analyzeImageOptimization(imageData, headers) {
    const sizeKB = imageData.length / 1024;
    const contentType = headers['content-type'] || '';
    
    let optimizationScore = 100;
    let recommendations = [];
    
    if (sizeKB > 1000) {
      optimizationScore -= 30;
      recommendations.push('Image is very large (>1MB)');
    } else if (sizeKB > 500) {
      optimizationScore -= 15;
      recommendations.push('Image is large (>500KB)');
    }
    
    if (!contentType.includes('webp') && !contentType.includes('avif')) {
      optimizationScore -= 10;
      recommendations.push('Consider modern formats (WebP/AVIF)');
    }
    
    return {
      sizeKB: Math.round(sizeKB),
      format: contentType,
      optimizationScore: Math.max(0, optimizationScore),
      recommendations
    };
  }

  calculatePerformanceGrade(ttfb, totalTime, contentLength) {
    let score = 100;
    
    // TTFB scoring
    if (ttfb > 800) score -= 20;
    else if (ttfb > 600) score -= 15;
    else if (ttfb > 400) score -= 10;
    else if (ttfb > 200) score -= 5;
    
    // Total time scoring
    if (totalTime > 3000) score -= 25;
    else if (totalTime > 2000) score -= 15;
    else if (totalTime > 1000) score -= 10;
    else if (totalTime > 500) score -= 5;
    
    // Size scoring
    const sizeKB = contentLength / 1024;
    if (sizeKB > 500) score -= 15;
    else if (sizeKB > 200) score -= 10;
    else if (sizeKB > 100) score -= 5;
    
    return Math.max(0, score);
  }

  calculateImageGrade(totalTime, contentLength) {
    let score = 100;
    
    // Load time scoring
    if (totalTime > 3000) score -= 30;
    else if (totalTime > 2000) score -= 20;
    else if (totalTime > 1000) score -= 10;
    
    // Size scoring
    const sizeKB = contentLength / 1024;
    if (sizeKB > 1000) score -= 25;
    else if (sizeKB > 500) score -= 15;
    else if (sizeKB > 200) score -= 10;
    
    return Math.max(0, score);
  }

  generatePageRecommendations(ttfb, totalTime, contentLength, resourceCounts) {
    const recommendations = [];
    
    if (ttfb > 600) {
      recommendations.push({
        type: 'critical',
        issue: 'Slow server response time',
        current: `${ttfb}ms`,
        target: '<600ms',
        solution: 'Optimize backend performance, implement caching'
      });
    }
    
    if (totalTime > 2000) {
      recommendations.push({
        type: 'important',
        issue: 'Slow page load time',
        current: `${totalTime}ms`,
        target: '<2000ms',
        solution: 'Optimize resources, implement lazy loading'
      });
    }
    
    if (contentLength > 200 * 1024) {
      recommendations.push({
        type: 'important',
        issue: 'Large page size',
        current: `${Math.round(contentLength / 1024)}KB`,
        target: '<200KB',
        solution: 'Minify CSS/JS, compress images, remove unused code'
      });
    }
    
    if (resourceCounts && resourceCounts.totalElements > 50) {
      recommendations.push({
        type: 'suggested',
        issue: 'Many resources to load',
        current: `${resourceCounts.totalElements} resources`,
        target: '<30 resources',
        solution: 'Bundle resources, use HTTP/2, implement resource hints'
      });
    }
    
    return recommendations;
  }

  generateImageRecommendations(contentLength, headers) {
    const recommendations = [];
    const sizeKB = contentLength / 1024;
    const contentType = headers['content-type'] || '';
    
    if (sizeKB > 500) {
      recommendations.push({
        type: 'critical',
        issue: 'Large image file',
        current: `${Math.round(sizeKB)}KB`,
        target: '<300KB',
        solution: 'Compress image, use appropriate dimensions'
      });
    }
    
    if (!contentType.includes('webp')) {
      recommendations.push({
        type: 'suggested',
        issue: 'Legacy image format',
        current: contentType,
        target: 'WebP or AVIF',
        solution: 'Convert to modern image format'
      });
    }
    
    return recommendations;
  }

  displayPageResults(result) {
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
      return;
    }
    
    const avg = result.averages;
    const grade = result.performance.grade;
    const gradeIcon = grade >= 90 ? '✅' : grade >= 70 ? '⚠️' : '❌';
    
    console.log(`   ${gradeIcon} Status: ${result.status} | Grade: ${grade}/100`);
    console.log(`   ⏱️  Load Time: ${avg.totalTime}ms (best: ${result.best.totalTime}ms, worst: ${result.worst.totalTime}ms)`);
    console.log(`   🚀 TTFB: ${avg.ttfb}ms (variance: ${result.consistency.ttfbVariance}ms)`);
    console.log(`   💾 Size: ${(avg.contentLength / 1024).toFixed(2)}KB`);
    console.log(`   📦 Resources: ${result.resourceCounts?.totalElements || 'N/A'} (JS: ${result.resourceCounts?.scripts || 0}, CSS: ${result.resourceCounts?.stylesheets || 0}, Images: ${result.resourceCounts?.images || 0})`);
    
    if (result.serverHeaders?.cfCacheStatus) {
      console.log(`   ☁️  Cache Status: ${result.serverHeaders.cfCacheStatus}`);
    }
  }

  displayImageResults(result) {
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
      return;
    }
    
    const avg = result.averages;
    const grade = result.performance.grade;
    const gradeIcon = grade >= 90 ? '✅' : grade >= 70 ? '⚠️' : '❌';
    
    console.log(`   ${gradeIcon} Status: ${result.status} | Grade: ${grade}/100`);
    console.log(`   ⏱️  Load Time: ${avg.totalTime}ms (best: ${result.best.totalTime}ms, worst: ${result.worst.totalTime}ms)`);
    console.log(`   💾 Size: ${(avg.contentLength / 1024).toFixed(2)}KB`);
    console.log(`   🗂️  Format: ${result.contentType}`);
    console.log(`   🎯 Optimization Score: ${result.optimization?.optimizationScore || 'N/A'}/100`);
  }

  async generateComprehensiveReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 COMPREHENSIVE NESTFEST PERFORMANCE REPORT');
    console.log('='.repeat(80));

    const successfulPages = this.results.pages.filter(r => !r.error);
    const successfulImages = this.results.images.filter(r => !r.error);

    // Generate summary statistics
    this.results.summary = this.generateSummaryStatistics(successfulPages, successfulImages);

    // Display summary
    console.log('\n🎯 PERFORMANCE SUMMARY:');
    if (this.results.summary.pages.count > 0) {
      console.log(`   📄 Pages Tested: ${this.results.summary.pages.count}/${this.testPages.length}`);
      console.log(`   ⏱️  Average Load Time: ${this.results.summary.pages.avgLoadTime}ms`);
      console.log(`   🚀 Average TTFB: ${this.results.summary.pages.avgTtfb}ms`);
      console.log(`   💾 Total Page Size: ${this.results.summary.pages.totalSize}KB`);
      console.log(`   📊 Average Grade: ${this.results.summary.pages.avgGrade}/100`);
    }

    if (this.results.summary.images.count > 0) {
      console.log(`   🖼️  Images Tested: ${this.results.summary.images.count}/${this.imageAssets.length}`);
      console.log(`   ⏱️  Average Image Load: ${this.results.summary.images.avgLoadTime}ms`);
      console.log(`   💾 Total Image Size: ${this.results.summary.images.totalSize}KB`);
      console.log(`   📊 Average Image Grade: ${this.results.summary.images.avgGrade}/100`);
    }

    // Display top performers and issues
    this.displayPerformanceHighlights(successfulPages, successfulImages);
    
    // Display comprehensive recommendations
    this.displayComprehensiveRecommendations(successfulPages, successfulImages);

    // Save detailed JSON report
    const reportPath = 'nestfest-comprehensive-performance-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log(`\n📄 Detailed JSON report saved: ${reportPath}`);
    console.log('='.repeat(80));
  }

  generateSummaryStatistics(pages, images) {
    const summary = {
      testLocation: this.getTestLocation(),
      testTimestamp: this.results.timestamp,
      pages: {
        count: pages.length,
        avgLoadTime: pages.length > 0 ? Math.round(pages.reduce((sum, p) => sum + p.averages.totalTime, 0) / pages.length) : 0,
        avgTtfb: pages.length > 0 ? Math.round(pages.reduce((sum, p) => sum + p.averages.ttfb, 0) / pages.length) : 0,
        totalSize: pages.length > 0 ? Math.round(pages.reduce((sum, p) => sum + (p.averages.contentLength / 1024), 0)) : 0,
        avgGrade: pages.length > 0 ? Math.round(pages.reduce((sum, p) => sum + p.performance.grade, 0) / pages.length) : 0,
        fastestPage: pages.length > 0 ? pages.reduce((min, p) => p.averages.totalTime < min.averages.totalTime ? p : min) : null,
        slowestPage: pages.length > 0 ? pages.reduce((max, p) => p.averages.totalTime > max.averages.totalTime ? p : max) : null
      },
      images: {
        count: images.length,
        avgLoadTime: images.length > 0 ? Math.round(images.reduce((sum, i) => sum + i.averages.totalTime, 0) / images.length) : 0,
        totalSize: images.length > 0 ? Math.round(images.reduce((sum, i) => sum + (i.averages.contentLength / 1024), 0)) : 0,
        avgGrade: images.length > 0 ? Math.round(images.reduce((sum, i) => sum + i.performance.grade, 0) / images.length) : 0,
        largestImage: images.length > 0 ? images.reduce((max, i) => i.averages.contentLength > max.averages.contentLength ? i : max) : null
      }
    };

    return summary;
  }

  displayPerformanceHighlights(pages, images) {
    if (pages.length > 0) {
      console.log('\n🏆 PERFORMANCE HIGHLIGHTS:');
      
      const fastest = pages.reduce((min, p) => p.averages.totalTime < min.averages.totalTime ? p : min);
      const slowest = pages.reduce((max, p) => p.averages.totalTime > max.averages.totalTime ? p : max);
      const bestGrade = pages.reduce((max, p) => p.performance.grade > max.performance.grade ? p : max);
      
      console.log(`   ⚡ Fastest Page: ${fastest.pageName} (${fastest.averages.totalTime}ms)`);
      console.log(`   🐌 Slowest Page: ${slowest.pageName} (${slowest.averages.totalTime}ms)`);
      console.log(`   🎯 Best Performing: ${bestGrade.pageName} (${bestGrade.performance.grade}/100)`);
      
      // Consistency analysis
      const consistencyIssues = pages.filter(p => p.consistency.totalTimeVariance > 100);
      if (consistencyIssues.length > 0) {
        console.log(`   ⚠️  Inconsistent Performance: ${consistencyIssues.length} pages have >100ms variance`);
      }
    }

    if (images.length > 0 && this.results.summary.images.largestImage) {
      console.log(`   📦 Largest Image: ${this.results.summary.images.largestImage.name} (${(this.results.summary.images.largestImage.averages.contentLength / 1024).toFixed(2)}KB)`);
    }
  }

  displayComprehensiveRecommendations(pages, images) {
    console.log('\n🔧 COMPREHENSIVE RECOMMENDATIONS:');
    
    const allRecommendations = [];
    
    // Collect all recommendations
    pages.forEach(page => {
      if (page.performance.recommendations) {
        page.performance.recommendations.forEach(rec => {
          rec.source = `Page: ${page.pageName}`;
          allRecommendations.push(rec);
        });
      }
    });
    
    images.forEach(image => {
      if (image.performance.recommendations) {
        image.performance.recommendations.forEach(rec => {
          rec.source = `Image: ${image.name}`;
          allRecommendations.push(rec);
        });
      }
    });
    
    // Group by type
    const critical = allRecommendations.filter(r => r.type === 'critical');
    const important = allRecommendations.filter(r => r.type === 'important');
    const suggested = allRecommendations.filter(r => r.type === 'suggested');
    
    if (critical.length > 0) {
      console.log('\n   🚨 CRITICAL ISSUES:');
      critical.forEach(rec => {
        console.log(`      ${rec.issue} (${rec.source})`);
        console.log(`        Current: ${rec.current} | Target: ${rec.target}`);
        console.log(`        Solution: ${rec.solution}`);
      });
    }
    
    if (important.length > 0) {
      console.log('\n   ⚠️  IMPORTANT IMPROVEMENTS:');
      important.forEach(rec => {
        console.log(`      ${rec.issue} (${rec.source})`);
        console.log(`        Solution: ${rec.solution}`);
      });
    }
    
    if (suggested.length > 0) {
      console.log('\n   💡 SUGGESTED OPTIMIZATIONS:');
      suggested.slice(0, 5).forEach(rec => { // Limit to top 5
        console.log(`      ${rec.issue} (${rec.source})`);
        console.log(`        Solution: ${rec.solution}`);
      });
    }
    
    // Overall recommendations
    console.log('\n   🎯 OVERALL RECOMMENDATIONS:');
    console.log('      → Implement image compression and modern formats (WebP)');
    console.log('      → Enable browser caching and CDN');
    console.log('      → Optimize server response times');
    console.log('      → Monitor performance continuously');
    console.log('      → Consider implementing service worker for caching');
  }

  getTestLocation() {
    // Simple location detection based on system
    const os = require('os');
    return `${os.hostname()} (${os.platform()})`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the comprehensive performance test
async function runComprehensiveTest() {
  const testSuite = new ComprehensivePerformanceTest();
  await testSuite.runComprehensiveTests();
}

// Execute if run directly
if (require.main === module) {
  runComprehensiveTest().catch(console.error);
}

module.exports = ComprehensivePerformanceTest;