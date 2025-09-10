#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const http = require('http');
const url = require('url');

// Load credentials from JSON file
function loadCredentials() {
  try {
    const credentials = JSON.parse(fs.readFileSync('gmail-credentials.json'));
    const keys = credentials.web || credentials.installed;
    
    return {
      clientId: keys.client_id,
      clientSecret: keys.client_secret,
      redirectUri: keys.redirect_uris[0] || 'http://localhost:3001'
    };
  } catch (error) {
    console.error('❌ Error loading credentials:', error.message);
    console.log('💡 Make sure gmail-credentials.json exists with proper format');
    process.exit(1);
  }
}

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify'
];

const TOKEN_PATH = 'gmail-token.json';

// Load existing token or get new one
async function authorize() {
  const { clientId, clientSecret, redirectUri } = loadCredentials();
  
  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
  
  // Check if we have a stored token
  if (fs.existsSync(TOKEN_PATH)) {
    console.log('📱 Found existing token, loading...');
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    
    try {
      // Test if token is still valid
      await oAuth2Client.getAccessToken();
      console.log('✅ Token is valid');
      return oAuth2Client;
    } catch (error) {
      console.log('⚠️  Token expired, getting new one...');
    }
  }
  
  // Get new token
  return getNewToken(oAuth2Client, redirectUri);
}

// Get new access token using localhost server
async function getNewToken(oAuth2Client, redirectUri) {
  return new Promise((resolve, reject) => {
    const port = new URL(redirectUri).port || 3001;
    
    // Create a local server to receive the OAuth callback
    const server = http.createServer(async (req, res) => {
      const reqUrl = url.parse(req.url, true);
      
      if (reqUrl.pathname === '/' && reqUrl.query.code) {
        const code = reqUrl.query.code;
        
        // Success page
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
              <title>Gmail CLI - Authentication Success</title>
              <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                         text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                         color: white; margin: 0; }
                  .container { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; 
                              backdrop-filter: blur(10px); max-width: 500px; margin: 0 auto; }
                  h1 { margin: 0 0 20px 0; }
                  .success { font-size: 48px; margin-bottom: 20px; }
                  .message { font-size: 18px; margin-bottom: 30px; opacity: 0.9; }
                  .close { background: rgba(255,255,255,0.2); border: none; color: white; 
                          padding: 12px 24px; border-radius: 25px; font-size: 16px; cursor: pointer; }
                  .close:hover { background: rgba(255,255,255,0.3); }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="success">🎉</div>
                  <h1>Gmail CLI Authenticated!</h1>
                  <div class="message">
                      Authorization successful! Your Gmail CLI is now ready to send emails.
                  </div>
                  <button class="close" onclick="window.close()">Close Window</button>
              </div>
              <script>
                  setTimeout(() => window.close(), 5000);
              </script>
          </body>
          </html>
        `);
        
        try {
          // Exchange code for tokens
          console.log('🔄 Exchanging authorization code for tokens...');
          const { tokens } = await oAuth2Client.getToken(code);
          oAuth2Client.setCredentials(tokens);
          
          // Save tokens
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
          console.log('✅ Tokens saved successfully!');
          
          server.close();
          resolve(oAuth2Client);
          
        } catch (error) {
          console.error('❌ Error exchanging code for tokens:', error.message);
          server.close();
          reject(error);
        }
      } else {
        // Error or invalid request
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1>❌ Authentication Error</h1>
              <p>No authorization code received. Please try again.</p>
              <button onclick="window.close()">Close</button>
          </body>
          </html>
        `);
        server.close();
        reject(new Error('No authorization code received'));
      }
    });
    
    // Start server
    server.listen(port, () => {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      
      console.log('🌐 Starting OAuth flow...');
      console.log('🔗 Opening browser for authorization...');
      console.log('📝 If browser doesn\'t open, visit:', authUrl);
      
      // Try to open browser
      try {
        const { execSync } = require('child_process');
        execSync(`start "" "${authUrl}"`, { stdio: 'ignore' });
      } catch (error) {
        console.log('⚠️  Could not open browser automatically');
        console.log('📋 Please visit the URL above manually');
      }
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use. Please close other applications using this port.`);
      } else {
        console.error('❌ Server error:', error.message);
      }
      reject(error);
    });
  });
}

// Send email
async function sendEmail(auth, to, subject, body) {
  const gmail = google.gmail({ version: 'v1', auth });
  
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    body
  ].join('\n');
  
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  try {
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    console.log(`✅ Email sent successfully!`);
    console.log(`📧 Message ID: ${result.data.id}`);
    console.log(`📬 Sent to: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    return result;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw error;
  }
}

// Get recent emails
async function getRecentEmails(auth, maxResults = 5) {
  const gmail = google.gmail({ version: 'v1', auth });
  
  try {
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
      q: 'in:inbox'
    });
    
    const messages = res.data.messages || [];
    console.log(`\n📧 Recent ${messages.length} emails:`);
    
    for (const message of messages) {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date']
      });
      
      const headers = email.data.payload.headers;
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const subject = headers.find(h => h.name === 'Subject')?.value || '(No subject)';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      
      console.log(`\n   From: ${from}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Date: ${new Date(date).toLocaleString()}`);
    }
  } catch (error) {
    console.error('❌ Error fetching emails:', error.message);
  }
}

// Main CLI handler
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    console.log('🚀 Gmail CLI - Web Application OAuth\n');
    
    const auth = await authorize();
    
    switch (command) {
      case 'recent':
        const count = parseInt(args[1]) || 5;
        await getRecentEmails(auth, count);
        break;
        
      case 'send':
        if (args.length < 4) {
          console.log('Usage: node gmail-cli-web.js send <to> <subject> <body>');
          return;
        }
        await sendEmail(auth, args[1], args[2], args[3]);
        break;
        
      case 'test':
        console.log('🧪 Testing Gmail CLI...');
        await sendEmail(
          auth,
          'rinconabel@gmail.com',
          'Gmail CLI Test - Web App OAuth Success!',
          `Hello! 🎉

This email was sent using the updated Gmail CLI with proper Web application OAuth flow!

✅ Fixed OOB deprecation issue
✅ Using Web application client type
✅ Localhost redirect working perfectly  
✅ Token management operational
✅ Email sending functional

Your Gmail CLI is now fully compliant with Google's latest OAuth requirements!

Configuration:
- Client ID: ${loadCredentials().clientId}
- Redirect URI: ${loadCredentials().redirectUri}
- Scopes: Gmail read, compose, send, modify

Best regards,
Claude Code Assistant`
        );
        break;
        
      case 'reset':
        if (fs.existsSync(TOKEN_PATH)) {
          fs.unlinkSync(TOKEN_PATH);
          console.log('✅ Token file removed. Run command again to re-authenticate.');
        } else {
          console.log('No token file found.');
        }
        break;
        
      default:
        const { clientId, redirectUri } = loadCredentials();
        console.log(`
Gmail CLI - Web Application OAuth

Commands:
  test                             - Send test email to rinconabel@gmail.com
  recent [count]                   - Get recent emails (default: 5)  
  send <to> <subject> <body>       - Send an email
  reset                            - Reset authentication (removes token)

Examples:
  node gmail-cli-web.js test
  node gmail-cli-web.js recent 3
  node gmail-cli-web.js send "user@example.com" "Test" "Hello World!"

Configuration:
  Client ID: ${clientId.substring(0, 40)}...
  Redirect URI: ${redirectUri}
  Token Status: ${fs.existsSync(TOKEN_PATH) ? '✅ Authenticated' : '❌ Not authenticated'}
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('invalid_client')) {
      console.log('\n💡 Authentication issue - check your client secret');
      console.log('1. Ensure client secret is correct in gmail-credentials.json');
      console.log('2. Verify Gmail API is enabled in Google Console');
      console.log('3. Confirm redirect URI is added to OAuth client');
    }
  }
}

if (require.main === module) {
  main();
}