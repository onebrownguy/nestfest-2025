const { chromium } = require('playwright');

async function debugWebSocketConnection() {
  console.log('Starting WebSocket connection debug...\n');
  
  // Launch browser with debugging capabilities
  const browser = await chromium.launch({
    headless: false, // Show browser for visual debugging
    devtools: false,
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Arrays to store captured data
  const consoleMessages = [];
  const networkEvents = [];
  const webSocketFrames = [];
  const jsErrors = [];
  
  // Capture console messages
  page.on('console', msg => {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    };
    consoleMessages.push(entry);
    console.log(`[CONSOLE ${entry.type.toUpperCase()}] ${entry.text}`);
  });
  
  // Capture JavaScript errors
  page.on('pageerror', error => {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      message: error.message,
      stack: error.stack
    };
    jsErrors.push(entry);
    console.log(`[JS ERROR] ${error.message}`);
  });
  
  // Monitor network events
  page.on('request', request => {
    if (request.url().includes('socket.io') || request.url().includes('ws://')) {
      networkEvents.push({
        type: 'request',
        timestamp: new Date().toISOString(),
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
      console.log(`[NETWORK REQUEST] ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('socket.io') || response.url().includes('ws://')) {
      networkEvents.push({
        type: 'response',
        timestamp: new Date().toISOString(),
        url: response.url(),
        status: response.status(),
        headers: response.headers()
      });
      console.log(`[NETWORK RESPONSE] ${response.status()} ${response.url()}`);
    }
  });
  
  // Monitor WebSocket frames
  page.on('websocket', ws => {
    console.log(`[WEBSOCKET] Connection attempt to: ${ws.url()}`);
    
    ws.on('framesent', event => {
      webSocketFrames.push({
        type: 'sent',
        timestamp: new Date().toISOString(),
        payload: event.payload
      });
      console.log(`[WS SENT] ${event.payload}`);
    });
    
    ws.on('framereceived', event => {
      webSocketFrames.push({
        type: 'received',
        timestamp: new Date().toISOString(),
        payload: event.payload
      });
      console.log(`[WS RECEIVED] ${event.payload}`);
    });
    
    ws.on('close', () => {
      console.log(`[WEBSOCKET] Connection closed: ${ws.url()}`);
    });
  });
  
  try {
    console.log('\n=== NAVIGATING TO LIVE DASHBOARD ===');
    
    // Navigate to the live dashboard
    await page.goto('http://localhost:3000/live', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('Page loaded successfully');
    
    // Wait a moment for WebSocket connection attempts
    await page.waitForTimeout(5000);
    
    // Take screenshot of current state
    console.log('\n=== TAKING SCREENSHOT ===');
    await page.screenshot({
      path: 'websocket-debug-screenshot.png',
      fullPage: true
    });
    
    // Evaluate WebSocket connection status in the browser
    console.log('\n=== CHECKING WEBSOCKET STATUS ===');
    const wsStatus = await page.evaluate(() => {
      const results = {
        socketIOGlobal: typeof io !== 'undefined',
        windowSocket: window.socket ? {
          connected: window.socket.connected,
          id: window.socket.id,
          readyState: window.socket.readyState,
          transport: window.socket.io?.engine?.transport?.name
        } : null,
        webSocketSupport: typeof WebSocket !== 'undefined',
        location: window.location.href,
        userAgent: navigator.userAgent,
        networkStatus: navigator.onLine
      };
      
      // Try to check if there are any socket.io related objects
      if (typeof io !== 'undefined') {
        results.ioManager = {
          readyState: io.readyState,
          autoConnect: io.opts?.autoConnect,
          timeout: io.opts?.timeout
        };
      }
      
      return results;
    });
    
    console.log('WebSocket Status:', JSON.stringify(wsStatus, null, 2));
    
    // Check if WebSocket server is reachable
    console.log('\n=== TESTING WEBSOCKET SERVER CONNECTIVITY ===');
    const serverTest = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const testSocket = new WebSocket('ws://localhost:8080');
        const timeout = setTimeout(() => {
          testSocket.close();
          resolve({
            success: false,
            error: 'Connection timeout after 5 seconds'
          });
        }, 5000);
        
        testSocket.onopen = () => {
          clearTimeout(timeout);
          testSocket.close();
          resolve({
            success: true,
            message: 'WebSocket server is reachable'
          });
        };
        
        testSocket.onerror = (error) => {
          clearTimeout(timeout);
          resolve({
            success: false,
            error: 'WebSocket connection failed',
            details: error.toString()
          });
        };
        
        testSocket.onclose = (event) => {
          if (!event.wasClean) {
            clearTimeout(timeout);
            resolve({
              success: false,
              error: 'WebSocket closed unexpectedly',
              code: event.code,
              reason: event.reason
            });
          }
        };
      });
    });
    
    console.log('Server connectivity test:', JSON.stringify(serverTest, null, 2));
    
    // Wait for any additional network activity
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Error during debugging:', error);
    jsErrors.push({
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      source: 'playwright'
    });
  }
  
  // Generate comprehensive report
  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE DEBUG REPORT');
  console.log('='.repeat(80));
  
  console.log('\n📋 CONSOLE MESSAGES:');
  console.log(`Total messages: ${consoleMessages.length}`);
  consoleMessages.forEach(msg => {
    console.log(`[${msg.timestamp}] ${msg.type.toUpperCase()}: ${msg.text}`);
    if (msg.location && (msg.location.url || msg.location.lineNumber)) {
      console.log(`    Location: ${msg.location.url}:${msg.location.lineNumber}:${msg.location.columnNumber}`);
    }
  });
  
  console.log('\n🚨 JAVASCRIPT ERRORS:');
  console.log(`Total errors: ${jsErrors.length}`);
  jsErrors.forEach(error => {
    console.log(`[${error.timestamp}] ${error.message}`);
    if (error.stack) {
      console.log(`Stack: ${error.stack.split('\n')[0]}`);
    }
  });
  
  console.log('\n🌐 NETWORK EVENTS:');
  console.log(`Total events: ${networkEvents.length}`);
  networkEvents.forEach(event => {
    console.log(`[${event.timestamp}] ${event.type.toUpperCase()}: ${event.url}`);
    if (event.status) {
      console.log(`    Status: ${event.status}`);
    }
  });
  
  console.log('\n🔌 WEBSOCKET FRAMES:');
  console.log(`Total frames: ${webSocketFrames.length}`);
  webSocketFrames.forEach(frame => {
    console.log(`[${frame.timestamp}] ${frame.type.toUpperCase()}: ${frame.payload.substring(0, 100)}${frame.payload.length > 100 ? '...' : ''}`);
  });
  
  // Generate recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  const recommendations = [];
  
  if (jsErrors.length > 0) {
    recommendations.push('❌ JavaScript errors detected - fix these first');
  }
  
  if (networkEvents.filter(e => e.url.includes('socket.io')).length === 0) {
    recommendations.push('⚠️  No Socket.IO requests detected - check if client is properly initialized');
  }
  
  if (!serverTest.success) {
    recommendations.push('❌ WebSocket server is not reachable - check if server is running on ws://localhost:8080');
  }
  
  const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
  if (errorMessages.some(msg => msg.text.includes('WebSocket connection') && msg.text.includes('closed before'))) {
    recommendations.push('🔧 WebSocket closes before connection - likely server not running or CORS issue');
  }
  
  if (consoleMessages.some(msg => msg.text.includes('CORS'))) {
    recommendations.push('🔧 CORS issue detected - configure server to allow WebSocket connections');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ No obvious issues detected - may need deeper investigation');
  }
  
  recommendations.forEach(rec => console.log(`   ${rec}`));
  
  console.log('\n📸 Screenshot saved as: websocket-debug-screenshot.png');
  console.log('\n='.repeat(80));
  
  // Keep browser open for 10 seconds for manual inspection
  console.log('Browser will remain open for 10 seconds for manual inspection...');
  await page.waitForTimeout(10000);
  
  await browser.close();
  
  return {
    consoleMessages,
    jsErrors,
    networkEvents,
    webSocketFrames,
    wsStatus,
    serverTest,
    recommendations
  };
}

// Run the debug function
debugWebSocketConnection().catch(console.error);