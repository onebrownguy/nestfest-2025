const https = require('https');
const http = require('http');
const fs = require('fs');

async function fetchSite(url, filename) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Save the HTML
        fs.writeFileSync(`analysis/${filename}.html`, data);
        
        // Look for background image references
        const bgImageMatches = data.match(/acc-campus-hero|background.*image|src=["'][^"']*\.(jpg|jpeg|png|webp)/gi) || [];
        const imageRefs = data.match(/\/([^\/\s"']*\.(jpg|jpeg|png|webp))/gi) || [];
        
        resolve({
          url,
          title: (data.match(/<title[^>]*>([^<]+)<\/title>/i) || ['', 'No title'])[1],
          hasBackgroundImage: bgImageMatches.length > 0,
          backgroundMatches: bgImageMatches,
          imageReferences: imageRefs,
          contentLength: data.length,
          hasNextImage: data.includes('_next/image'),
          hasAccCampus: data.includes('acc-campus-hero'),
          hasOverlays: data.includes('bg-white/85') || data.includes('overlay')
        });
      });
    }).on('error', reject);
  });
}

async function compareSites() {
  // Ensure analysis directory exists
  if (!fs.existsSync('analysis')) {
    fs.mkdirSync('analysis');
  }

  try {
    console.log('Fetching nest-fest.org...');
    const nestFestOrg = await fetchSite('https://nest-fest.org/', 'nest-fest-org');
    
    console.log('Fetching nestfest.app...');
    const nestFestApp = await fetchSite('https://nestfest.app/', 'nestfest-app');
    
    const comparison = {
      timestamp: new Date().toISOString(),
      'nest-fest.org': nestFestOrg,
      'nestfest.app': nestFestApp,
      differences: {
        titleDiff: nestFestOrg.title !== nestFestApp.title,
        backgroundImageDiff: nestFestOrg.hasBackgroundImage !== nestFestApp.hasBackgroundImage,
        contentSizeDiff: Math.abs(nestFestOrg.contentLength - nestFestApp.contentLength),
        accCampusDiff: nestFestOrg.hasAccCampus !== nestFestApp.hasAccCampus,
        nextImageDiff: nestFestOrg.hasNextImage !== nestFestApp.hasNextImage
      }
    };
    
    console.log('\n=== COMPARISON RESULTS ===');
    console.log(`nest-fest.org: ${nestFestOrg.title}`);
    console.log(`- Background image: ${nestFestOrg.hasBackgroundImage ? 'YES' : 'NO'}`);
    console.log(`- ACC Campus ref: ${nestFestOrg.hasAccCampus ? 'YES' : 'NO'}`);
    console.log(`- Next.js images: ${nestFestOrg.hasNextImage ? 'YES' : 'NO'}`);
    console.log(`- Content size: ${nestFestOrg.contentLength} chars`);
    
    console.log(`\nnestfest.app: ${nestFestApp.title}`);
    console.log(`- Background image: ${nestFestApp.hasBackgroundImage ? 'YES' : 'NO'}`);
    console.log(`- ACC Campus ref: ${nestFestApp.hasAccCampus ? 'YES' : 'NO'}`);
    console.log(`- Next.js images: ${nestFestApp.hasNextImage ? 'YES' : 'NO'}`);
    console.log(`- Content size: ${nestFestApp.contentLength} chars`);
    
    console.log('\n=== KEY FINDINGS ===');
    if (comparison.differences.accCampusDiff) {
      console.log('❌ ACC Campus background image reference differs between sites');
    } else {
      console.log('✅ ACC Campus background image reference consistent');
    }
    
    if (comparison.differences.nextImageDiff) {
      console.log('❌ Next.js image optimization differs between sites');
    } else {
      console.log('✅ Next.js image optimization consistent');
    }
    
    if (nestFestApp.imageReferences.length > 0) {
      console.log('📸 Image references found on nestfest.app:');
      nestFestApp.imageReferences.forEach(ref => console.log(`  - ${ref}`));
    } else {
      console.log('❌ No image references found on nestfest.app');
    }
    
    fs.writeFileSync('analysis/site-comparison.json', JSON.stringify(comparison, null, 2));
    console.log('\n📁 Detailed analysis saved to analysis/site-comparison.json');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

compareSites();