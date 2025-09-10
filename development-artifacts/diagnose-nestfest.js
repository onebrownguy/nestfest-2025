const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function diagnoseNestFest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Arrays to collect diagnostic data
  const consoleErrors = [];
  const networkErrors = [];
  const networkRequests = [];
  let accCampusImageFound = false;
  let accCampusImageStatus = null;

  // Listen for console messages
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
      console.log(`🔴 Console Error: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      console.log(`🟡 Console Warning: ${msg.text()}`);
    }
  });

  // Monitor network requests
  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();
    
    // Track all requests
    networkRequests.push({
      url,
      status,
      statusText: response.statusText(),
      contentType: response.headers()['content-type'] || 'unknown'
    });

    // Special attention to image requests
    if (url.includes('acc-campus-hero.jpg')) {
      accCampusImageFound = true;
      accCampusImageStatus = status;
      console.log(`🖼️  ACC Campus Hero Image: ${url} - Status: ${status}`);
    }

    // Log failed requests
    if (status >= 400) {
      networkErrors.push({
        url,
        status,
        statusText: response.statusText()
      });
      console.log(`❌ Network Error: ${status} ${response.statusText()} - ${url}`);
    }

    // Log all image requests
    const contentType = response.headers()['content-type'] || '';
    if (contentType.startsWith('image/') || url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) {
      console.log(`🖼️  Image Request: ${status} - ${url}`);
    }
  });

  // Listen for request failures
  page.on('requestfailed', (request) => {
    networkErrors.push({
      url: request.url(),
      status: 'FAILED',
      statusText: request.failure()?.errorText || 'Request failed'
    });
    console.log(`💥 Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    console.log('🚀 Navigating to https://nestfest.app...');
    
    // Navigate to the homepage
    await page.goto('https://nestfest.app', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('📸 Taking initial screenshot...');
    
    // Take screenshot of the homepage
    await page.screenshot({ 
      path: 'screenshots/nestfest-diagnosis-full.png',
      fullPage: true 
    });

    // Take screenshot of just the hero section
    await page.screenshot({ 
      path: 'screenshots/nestfest-diagnosis-hero.png',
      clip: { x: 0, y: 0, width: 1920, height: 800 }
    });

    // Wait a bit more for any lazy-loaded images
    await page.waitForTimeout(3000);

    // Check if hero image element exists and get its properties
    const heroImageInfo = await page.evaluate(() => {
      const heroSection = document.querySelector('.hero-section, [class*="hero"], .relative.min-h-screen');
      const heroImage = document.querySelector('img[src*="acc-campus"], img[alt*="ACC"], img[alt*="campus"]');
      const allImages = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        width: img.width,
        height: img.height,
        loading: img.loading,
        className: img.className
      }));

      return {
        heroSectionFound: !!heroSection,
        heroImageFound: !!heroImage,
        heroImageSrc: heroImage?.src,
        heroImageAlt: heroImage?.alt,
        heroImageComplete: heroImage?.complete,
        heroImageNaturalSize: heroImage ? `${heroImage.naturalWidth}x${heroImage.naturalHeight}` : null,
        heroImageDisplaySize: heroImage ? `${heroImage.width}x${heroImage.height}` : null,
        allImages: allImages,
        totalImages: allImages.length,
        loadedImages: allImages.filter(img => img.complete && img.naturalWidth > 0).length
      };
    });

    console.log('\n🔍 Hero Image Analysis:');
    console.log(`Hero Section Found: ${heroImageInfo.heroSectionFound}`);
    console.log(`Hero Image Found: ${heroImageInfo.heroImageFound}`);
    if (heroImageInfo.heroImageFound) {
      console.log(`Hero Image Src: ${heroImageInfo.heroImageSrc}`);
      console.log(`Hero Image Alt: ${heroImageInfo.heroImageAlt}`);
      console.log(`Hero Image Loaded: ${heroImageInfo.heroImageComplete}`);
      console.log(`Hero Image Natural Size: ${heroImageInfo.heroImageNaturalSize}`);
      console.log(`Hero Image Display Size: ${heroImageInfo.heroImageDisplaySize}`);
    }

    console.log(`\n📊 Image Summary: ${heroImageInfo.loadedImages}/${heroImageInfo.totalImages} images loaded successfully`);

    // Take final screenshot after waiting
    await page.screenshot({ 
      path: 'screenshots/nestfest-diagnosis-final.png',
      fullPage: true 
    });

    // Get page performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });

    // Generate comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      url: 'https://nestfest.app',
      consoleErrors: consoleErrors,
      networkErrors: networkErrors,
      accCampusImageFound: accCampusImageFound,
      accCampusImageStatus: accCampusImageStatus,
      heroImageInfo: heroImageInfo,
      performanceMetrics: performanceMetrics,
      totalNetworkRequests: networkRequests.length,
      failedRequests: networkErrors.length,
      imageRequests: networkRequests.filter(req => 
        req.contentType.startsWith('image/') || 
        req.url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)
      ).length
    };

    // Save detailed report
    fs.writeFileSync('nestfest-diagnosis-report.json', JSON.stringify(report, null, 2));

    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log(`🌐 Page loaded successfully: ${report.url}`);
    console.log(`⚡ DOM Content Loaded: ${Math.round(performanceMetrics.domContentLoaded)}ms`);
    console.log(`🎯 Load Complete: ${Math.round(performanceMetrics.loadComplete)}ms`);
    console.log(`🔴 Console Errors: ${consoleErrors.length}`);
    console.log(`❌ Network Errors: ${networkErrors.length}`);
    console.log(`🖼️  Total Images: ${heroImageInfo.totalImages}`);
    console.log(`✅ Loaded Images: ${heroImageInfo.loadedImages}`);
    console.log(`🏫 ACC Campus Hero Found: ${accCampusImageFound ? `YES (Status: ${accCampusImageStatus})` : 'NO'}`);

    if (consoleErrors.length > 0) {
      console.log('\n🔴 CONSOLE ERRORS:');
      consoleErrors.forEach((error, i) => {
        console.log(`${i + 1}. ${error.text}`);
      });
    }

    if (networkErrors.length > 0) {
      console.log('\n❌ NETWORK ERRORS:');
      networkErrors.forEach((error, i) => {
        console.log(`${i + 1}. ${error.status} - ${error.url}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    await browser.close();
  }
}

// Run the diagnosis
diagnoseNestFest().catch(console.error);