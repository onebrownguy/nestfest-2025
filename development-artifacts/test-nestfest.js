const { chromium } = require('playwright');

async function testNestFestApp() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Listen for console messages and errors
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            url: page.url()
        });
        console.log(`Console ${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', error => {
        errors.push({
            message: error.message,
            stack: error.stack,
            url: page.url()
        });
        console.log(`Page Error: ${error.message}`);
    });

    try {
        console.log('🚀 Testing NestFest.app...\n');

        // Test 1: Main page
        console.log('📍 Testing main page: https://nestfest.app');
        await page.goto('https://nestfest.app', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        
        await page.screenshot({ 
            path: 'screenshots/nestfest-homepage.png', 
            fullPage: true 
        });
        console.log('✅ Homepage screenshot saved');

        // Check for basic content
        const title = await page.title();
        console.log(`Page Title: ${title}`);

        // Test 2: Navigation to /login
        console.log('\n📍 Testing login page');
        try {
            await page.goto('https://nestfest.app/login', { waitUntil: 'networkidle' });
            await page.waitForTimeout(2000);
            await page.screenshot({ 
                path: 'screenshots/nestfest-login.png', 
                fullPage: true 
            });
            console.log('✅ Login page screenshot saved');
        } catch (error) {
            console.log(`❌ Login page error: ${error.message}`);
            errors.push({ page: '/login', error: error.message });
        }

        // Test 3: Navigation to /register
        console.log('\n📍 Testing register page');
        try {
            await page.goto('https://nestfest.app/register', { waitUntil: 'networkidle' });
            await page.waitForTimeout(2000);
            await page.screenshot({ 
                path: 'screenshots/nestfest-register.png', 
                fullPage: true 
            });
            console.log('✅ Register page screenshot saved');
        } catch (error) {
            console.log(`❌ Register page error: ${error.message}`);
            errors.push({ page: '/register', error: error.message });
        }

        // Test 4: Navigation to /live
        console.log('\n📍 Testing live page');
        try {
            await page.goto('https://nestfest.app/live', { waitUntil: 'networkidle' });
            await page.waitForTimeout(2000);
            await page.screenshot({ 
                path: 'screenshots/nestfest-live.png', 
                fullPage: true 
            });
            console.log('✅ Live page screenshot saved');
        } catch (error) {
            console.log(`❌ Live page error: ${error.message}`);
            errors.push({ page: '/live', error: error.message });
        }

        // Test 5: Check for broken links/images
        console.log('\n📍 Checking for broken resources');
        await page.goto('https://nestfest.app', { waitUntil: 'networkidle' });
        
        const brokenImages = await page.evaluate(() => {
            const images = document.querySelectorAll('img');
            const broken = [];
            images.forEach(img => {
                if (!img.complete || img.naturalHeight === 0) {
                    broken.push(img.src);
                }
            });
            return broken;
        });

        if (brokenImages.length > 0) {
            console.log(`❌ Found ${brokenImages.length} broken images:`);
            brokenImages.forEach(src => console.log(`  - ${src}`));
        } else {
            console.log('✅ No broken images found');
        }

        // Test 6: Check navigation elements
        console.log('\n📍 Testing navigation elements');
        const navLinks = await page.$$eval('nav a, header a', links => 
            links.map(link => ({ text: link.textContent, href: link.href }))
        );
        console.log('Navigation links found:', navLinks.length);
        navLinks.forEach(link => console.log(`  - ${link.text}: ${link.href}`));

    } catch (error) {
        console.error('❌ Critical error during testing:', error);
        errors.push({ page: 'general', error: error.message });
    }

    // Summary Report
    console.log('\n' + '='.repeat(60));
    console.log('📊 NESTFEST.APP TEST REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n🖼️  Screenshots saved in ./screenshots/`);
    console.log(`📝 Console messages: ${consoleMessages.length}`);
    console.log(`❌ Errors found: ${errors.length}`);

    if (consoleMessages.length > 0) {
        console.log('\n📝 Console Messages:');
        consoleMessages.forEach(msg => {
            if (msg.type === 'error') {
                console.log(`  ❌ ERROR: ${msg.text}`);
            } else if (msg.type === 'warning') {
                console.log(`  ⚠️  WARNING: ${msg.text}`);
            } else if (msg.type === 'log' && msg.text.includes('error')) {
                console.log(`  ⚠️  LOG: ${msg.text}`);
            }
        });
    }

    if (errors.length > 0) {
        console.log('\n❌ Errors Summary:');
        errors.forEach(error => {
            console.log(`  - ${error.page || 'Unknown'}: ${error.message || error.error}`);
        });
    }

    console.log('\n✅ Testing completed!');
    await browser.close();

    return {
        consoleMessages,
        errors,
        screenshots: [
            'screenshots/nestfest-homepage.png',
            'screenshots/nestfest-login.png',
            'screenshots/nestfest-register.png',
            'screenshots/nestfest-live.png'
        ]
    };
}

testNestFestApp().catch(console.error);