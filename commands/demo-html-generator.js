// Demo HTML Report Generator for NestFest Event
// Generates professional HTML reports from demo-builder agent output

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function generateDemoHTML(demoData = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').split('T')[0] + '_' + 
                    new Date().toISOString().replace(/[:.]/g, '').split('T')[1].substring(0, 6);
  
  // Parse demo data or use defaults
  const {
    projectName = 'NestFest Event Platform',
    summary = 'Enterprise-grade competition platform with revolutionary features',
    keyFeatures = [
      { name: 'Quadratic Voting System', description: 'Industry-first credit-based preference voting', impact: 'Revolutionary' },
      { name: 'Shark Tank Mode', description: 'Live judge offers and investment pools', impact: 'High Engagement' },
      { name: 'AI Fraud Detection', description: '94%+ accuracy anomaly detection', impact: 'Enterprise Security' },
      { name: 'Real-Time Architecture', description: 'WebSocket-based live collaboration', impact: 'Instant Updates' }
    ],
    metrics = {
      marketSize: '$1.2B+',
      costSavings: '$50K+ annually',
      satisfaction: '300% increase',
      scalability: '10,000+ concurrent users'
    },
    demoScripts = {
      investor: { duration: '3-5 min', focus: 'ROI & Market Opportunity' },
      customer: { duration: '10-15 min', focus: 'Features & Benefits' },
      internal: { duration: '5-7 min', focus: 'Technical Capabilities' }
    }
  } = demoData;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName} - Demo Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --primary: #6366f1;
            --secondary: #8b5cf6;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --dark: #1f2937;
            --light: #f3f4f6;
            --white: #ffffff;
            --gradient: linear-gradient(135deg, var(--primary), var(--secondary));
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: var(--dark);
            background: var(--light);
        }
        
        .header {
            background: var(--gradient);
            color: var(--white);
            padding: 3rem 2rem;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .header .subtitle {
            font-size: 1.2rem;
            opacity: 0.95;
        }
        
        .header .timestamp {
            margin-top: 1rem;
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .section {
            background: var(--white);
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .section h2 {
            color: var(--primary);
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--light);
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
        }
        
        .metric-card {
            background: linear-gradient(135deg, var(--white), var(--light));
            padding: 1.5rem;
            border-radius: 8px;
            border-left: 4px solid var(--primary);
            transition: transform 0.3s ease;
        }
        
        .metric-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 12px rgba(99, 102, 241, 0.2);
        }
        
        .metric-card .label {
            color: #6b7280;
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .metric-card .value {
            color: var(--primary);
            font-size: 2rem;
            font-weight: bold;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        
        .feature-card {
            background: var(--white);
            border: 2px solid var(--light);
            border-radius: 8px;
            padding: 1.5rem;
            transition: all 0.3s ease;
        }
        
        .feature-card:hover {
            border-color: var(--primary);
            box-shadow: 0 4px 8px rgba(99, 102, 241, 0.1);
        }
        
        .feature-card h3 {
            color: var(--dark);
            margin-bottom: 0.5rem;
        }
        
        .feature-card .description {
            color: #6b7280;
            margin-bottom: 1rem;
        }
        
        .feature-card .impact {
            display: inline-block;
            background: var(--gradient);
            color: var(--white);
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        
        .demo-scripts {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        
        .script-card {
            background: var(--light);
            border-radius: 8px;
            padding: 1.5rem;
            border: 2px solid transparent;
            transition: all 0.3s ease;
        }
        
        .script-card:hover {
            border-color: var(--secondary);
            transform: translateY(-3px);
        }
        
        .script-card h3 {
            color: var(--secondary);
            margin-bottom: 1rem;
            text-transform: capitalize;
        }
        
        .script-card .info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            color: #6b7280;
        }
        
        .script-card .info strong {
            color: var(--dark);
        }
        
        .timeline {
            position: relative;
            padding-left: 2rem;
        }
        
        .timeline::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 2px;
            background: var(--gradient);
        }
        
        .timeline-item {
            position: relative;
            padding: 1rem 0;
            padding-left: 2rem;
        }
        
        .timeline-item::before {
            content: '';
            position: absolute;
            left: -2rem;
            top: 1.5rem;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--primary);
            border: 2px solid var(--white);
            box-shadow: 0 0 0 4px var(--light);
        }
        
        .timeline-item h3 {
            color: var(--primary);
            margin-bottom: 0.5rem;
        }
        
        .timeline-item p {
            color: #6b7280;
        }
        
        .action-buttons {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            margin-top: 2rem;
        }
        
        .button {
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            display: inline-block;
            border: none;
            cursor: pointer;
        }
        
        .button-primary {
            background: var(--gradient);
            color: var(--white);
        }
        
        .button-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(99, 102, 241, 0.3);
        }
        
        .button-secondary {
            background: var(--white);
            color: var(--primary);
            border: 2px solid var(--primary);
        }
        
        .button-secondary:hover {
            background: var(--primary);
            color: var(--white);
        }
        
        .footer {
            text-align: center;
            padding: 2rem;
            color: #6b7280;
            background: var(--white);
            margin-top: 3rem;
            border-top: 2px solid var(--light);
        }
        
        @media print {
            .header {
                background: none;
                color: var(--dark);
            }
            
            .button {
                display: none;
            }
            
            .section {
                break-inside: avoid;
            }
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .metrics-grid,
            .features-grid,
            .demo-scripts {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${projectName}</h1>
        <div class="subtitle">${summary}</div>
        <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
    </div>
    
    <div class="container">
        <!-- Key Metrics Section -->
        <section class="section">
            <h2>Key Performance Metrics</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="label">Market Opportunity</div>
                    <div class="value">${metrics.marketSize}</div>
                </div>
                <div class="metric-card">
                    <div class="label">Annual Cost Savings</div>
                    <div class="value">${metrics.costSavings}</div>
                </div>
                <div class="metric-card">
                    <div class="label">User Satisfaction</div>
                    <div class="value">${metrics.satisfaction}</div>
                </div>
                <div class="metric-card">
                    <div class="label">Scalability</div>
                    <div class="value">${metrics.scalability}</div>
                </div>
            </div>
        </section>
        
        <!-- Key Features Section -->
        <section class="section">
            <h2>Revolutionary Features</h2>
            <div class="features-grid">
                ${keyFeatures.map(feature => `
                <div class="feature-card">
                    <h3>${feature.name}</h3>
                    <div class="description">${feature.description}</div>
                    <span class="impact">${feature.impact}</span>
                </div>
                `).join('')}
            </div>
        </section>
        
        <!-- Demo Scripts Section -->
        <section class="section">
            <h2>Demo Scripts by Audience</h2>
            <div class="demo-scripts">
                ${Object.entries(demoScripts).map(([audience, details]) => `
                <div class="script-card">
                    <h3>${audience} Demo</h3>
                    <div class="info">
                        <span>Duration:</span>
                        <strong>${details.duration}</strong>
                    </div>
                    <div class="info">
                        <span>Focus:</span>
                        <strong>${details.focus}</strong>
                    </div>
                </div>
                `).join('')}
            </div>
        </section>
        
        <!-- Implementation Timeline -->
        <section class="section">
            <h2>Implementation Timeline</h2>
            <div class="timeline">
                <div class="timeline-item">
                    <h3>Phase 1: Core Platform (Completed)</h3>
                    <p>Authentication, competition management, basic voting system</p>
                </div>
                <div class="timeline-item">
                    <h3>Phase 2: Advanced Features (Completed)</h3>
                    <p>Quadratic voting, Shark Tank mode, real-time collaboration</p>
                </div>
                <div class="timeline-item">
                    <h3>Phase 3: AI Integration (Current)</h3>
                    <p>Fraud detection, predictive analytics, intelligent matching</p>
                </div>
                <div class="timeline-item">
                    <h3>Phase 4: Enterprise Scale (Next)</h3>
                    <p>Multi-tenant support, advanced analytics, white-labeling</p>
                </div>
            </div>
        </section>
        
        <!-- Action Items -->
        <section class="section">
            <h2>Next Steps</h2>
            <div class="action-buttons">
                <button class="button button-primary" onclick="window.print()">Print Report</button>
                <button class="button button-secondary" onclick="copyToClipboard()">Copy Summary</button>
                <button class="button button-secondary" onclick="exportJSON()">Export Data</button>
            </div>
        </section>
    </div>
    
    <div class="footer">
        <p>NestFest Event Platform Demo Report</p>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>
    
    <script>
        function copyToClipboard() {
            const summary = \`${projectName}
${summary}

Key Metrics:
- Market: ${metrics.marketSize}
- Savings: ${metrics.costSavings}
- Satisfaction: ${metrics.satisfaction}
- Scale: ${metrics.scalability}\`;
            
            navigator.clipboard.writeText(summary).then(() => {
                alert('Summary copied to clipboard!');
            });
        }
        
        function exportJSON() {
            const data = {
                projectName: '${projectName}',
                summary: '${summary}',
                keyFeatures: ${JSON.stringify(keyFeatures)},
                metrics: ${JSON.stringify(metrics)},
                demoScripts: ${JSON.stringify(demoScripts)},
                generatedAt: '${new Date().toISOString()}'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'nestfest-demo-data.json';
            a.click();
        }
    </script>
</body>
</html>`;

  return { html, timestamp, fileName: `cc_genui_nestfest_demo_${timestamp}.html` };
}

// Main function to generate and save HTML report
async function generateDemoReport(demoData = {}) {
  const { html, fileName } = generateDemoHTML(demoData);
  const filePath = path.join('C:\\temp', fileName);
  
  // Ensure temp directory exists
  if (!fs.existsSync('C:\\temp')) {
    fs.mkdirSync('C:\\temp', { recursive: true });
  }
  
  // Write HTML file
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Demo report generated: ${filePath}`);
  
  // Open in browser
  exec(`start "${filePath}"`, (error) => {
    if (error) {
      console.error('Error opening browser:', error);
    } else {
      console.log('Demo report opened in browser');
    }
  });
  
  return filePath;
}

// Export for use in other scripts
module.exports = {
  generateDemoHTML,
  generateDemoReport
};

// If run directly, generate a sample report
if (require.main === module) {
  generateDemoReport();
}