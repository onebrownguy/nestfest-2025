const { chromium } = require('playwright');

async function detailedDiagnosis() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    const issues = [];
    const consoleErrors = [];
    const networkErrors = [];

    // Capture all console messages
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push({
                url: page.url(),
                message: msg.text()
            });
        }
    });

    // Capture network failures
    page.on('response', response => {
        if (!response.ok() && response.status() !== 304) {
            networkErrors.push({
                url: response.url(),
                status: response.status(),
                statusText: response.statusText()
            });
        }
    });

    try {
        console.log('🔍 Running detailed diagnosis of NestFest.app...\n');

        // Test 1: Homepage detailed analysis
        console.log('📊 Testing Homepage (https://nestfest.app)');
        await page.goto('https://nestfest.app', { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(3000);

        // Check if page loaded properly
        const pageContent = await page.content();
        const hasNestFestContent = pageContent.includes('NestFest') || pageContent.includes('nestfest');
        
        if (!hasNestFestContent) {
            issues.push({
                page: 'Homepage',
                issue: 'Page content does not contain NestFest branding - possible routing issue'
            });
        }

        // Check for main navigation elements
        const navElements = await page.$$eval('nav, header', elements => elements.length);
        if (navElements === 0) {
            issues.push({
                page: 'Homepage',
                issue: 'No navigation elements found'
            });
        }

        // Check for main content areas
        const mainContent = await page.$('main, .main, #main');
        if (!mainContent) {
            issues.push({
                page: 'Homepage',
                issue: 'No main content area found'
            });
        }

        // Test 2: Check if Next.js is loading properly
        console.log('⚙️  Checking Next.js loading...');
        const nextData = await page.evaluate(() => {
            return {
                hasNextScript: !!document.querySelector('script[src*="_next"]'),
                hasReactRoot: !!document.querySelector('#__next'),
                hasHydrationErrors: window.__NEXT_DATA__ ? false : 'No Next.js data found'
            };
        });

        if (!nextData.hasNextScript) {
            issues.push({
                page: 'Homepage',
                issue: 'Next.js scripts not loading - deployment issue'
            });
        }

        if (!nextData.hasReactRoot) {
            issues.push({
                page: 'Homepage',
                issue: 'React root element not found - hydration issue'
            });
        }

        // Test 3: Authentication pages
        console.log('🔐 Testing authentication flow...');
        
        // Login page
        await page.goto('https://nestfest.app/login', { waitUntil: 'domcontentloaded' });
        const loginForm = await page.$('form');
        if (!loginForm) {
            issues.push({
                page: 'Login',
                issue: 'Login form not found'
            });
        }

        // Register page
        try {
            await page.goto('https://nestfest.app/register', { waitUntil: 'domcontentloaded', timeout: 15000 });
            const registerForm = await page.$('form');
            if (!registerForm) {
                issues.push({
                    page: 'Register',
                    issue: 'Register form not found'
                });
            }
        } catch (error) {
            issues.push({
                page: 'Register',
                issue: `Page failed to load: ${error.message}`
            });
        }

        // Test 4: Live page
        console.log('📺 Testing live page...');
        try {
            await page.goto('https://nestfest.app/live', { waitUntil: 'domcontentloaded', timeout: 10000 });
            const liveContent = await page.$('.live, #live, [class*="live"]');
            if (!liveContent) {
                issues.push({
                    page: 'Live',
                    issue: 'No live event content found'
                });
            }
        } catch (error) {
            issues.push({
                page: 'Live',
                issue: `Page failed to load: ${error.message}`
            });
        }

        // Test 5: API endpoints check
        console.log('🔌 Testing API endpoints...');
        const apiTests = [
            '/api/auth/me',
            '/api/competitions'
        ];

        for (const endpoint of apiTests) {
            try {
                const response = await page.goto(`https://nestfest.app${endpoint}`, { waitUntil: 'domcontentloaded' });
                if (!response.ok()) {
                    issues.push({
                        page: `API ${endpoint}`,
                        issue: `API endpoint returned ${response.status()}: ${response.statusText()}`
                    });
                }
            } catch (error) {
                issues.push({
                    page: `API ${endpoint}`,
                    issue: `API endpoint failed: ${error.message}`
                });
            }
        }

    } catch (error) {
        issues.push({
            page: 'General',
            issue: `Critical error: ${error.message}`
        });
    }

    // Generate comprehensive report
    console.log('\n' + '='.repeat(80));
    console.log('🚨 NESTFEST.APP COMPREHENSIVE DIAGNOSIS REPORT');
    console.log('='.repeat(80));

    console.log(`\n📊 Summary:`);
    console.log(`   • Issues found: ${issues.length}`);
    console.log(`   • Console errors: ${consoleErrors.length}`);
    console.log(`   • Network errors: ${networkErrors.length}`);

    if (issues.length > 0) {
        console.log('\n🔥 CRITICAL ISSUES:');
        issues.forEach((issue, index) => {
            console.log(`   ${index + 1}. [${issue.page}] ${issue.issue}`);
        });
    }

    if (consoleErrors.length > 0) {
        console.log('\n❌ CONSOLE ERRORS:');
        consoleErrors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error.message}`);
            console.log(`      URL: ${error.url}`);
        });
    }

    if (networkErrors.length > 0) {
        console.log('\n🌐 NETWORK ERRORS:');
        networkErrors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error.status} ${error.statusText}`);
            console.log(`      URL: ${error.url}`);
        });
    }

    console.log('\n💡 RECOMMENDATIONS:');
    if (issues.some(i => i.issue.includes('Next.js') || i.issue.includes('React'))) {
        console.log('   • Rebuild and redeploy the application');
        console.log('   • Check Vercel deployment logs');
    }
    if (issues.some(i => i.issue.includes('API'))) {
        console.log('   • Verify API routes are properly deployed');
        console.log('   • Check database connection');
    }
    if (issues.some(i => i.issue.includes('form'))) {
        console.log('   • Verify authentication setup');
        console.log('   • Check NextAuth configuration');
    }

    await browser.close();
    return { issues, consoleErrors, networkErrors };
}

detailedDiagnosis().catch(console.error);