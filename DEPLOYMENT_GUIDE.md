# NestFest Competition Platform - Deployment Guide

This comprehensive guide will walk you through deploying the NestFest platform from development to production, ensuring optimal performance and security for your competition events.

## 🚀 Quick Start Deployment

### Prerequisites Checklist
- [ ] Node.js 18.0+ installed
- [ ] Git repository access
- [ ] Vercel account (recommended) or alternative hosting
- [ ] Supabase project created
- [ ] Redis instance provisioned (Upstash recommended)
- [ ] Domain name (optional, for production)

### 1-Click Deployment
```bash
# Clone and deploy in one command
git clone <your-repo> && cd nestfest && npm install && vercel --prod
```

## 🏗️ Infrastructure Setup

### Database Setup (Supabase)
1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and API keys

2. **Database Schema Installation**
   ```sql
   -- Run the comprehensive database schema
   -- File: src/lib/database/auth-schema.sql
   ```

3. **Row Level Security Setup**
   ```sql
   -- Enable RLS for all tables
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
   -- ... continue for all tables
   ```

### Redis Setup (Upstash)
1. **Create Redis Instance**
   - Visit [upstash.com](https://upstash.com)
   - Create Redis database
   - Copy connection URL

2. **Configure Redis Settings**
   ```bash
   # Recommended settings for production
   maxmemory-policy: allkeys-lru
   timeout: 0
   tcp-keepalive: 60
   ```

### File Storage (Supabase Storage)
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('submissions', 'submissions', false),
('avatars', 'avatars', true),
('assets', 'assets', true);

-- Set up storage policies
CREATE POLICY "Users can upload their own files" ON storage.objects
FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
```

## 🔧 Environment Configuration

### Production Environment Variables
Create `.env.production` with the following:

```env
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# Redis Configuration
REDIS_URL=redis://default:password@host:port

# Authentication
NEXTAUTH_SECRET=your_super_secret_jwt_key_min_32_chars
NEXTAUTH_URL=https://your-domain.com

# External Services
SENDGRID_API_KEY=SG.your_sendgrid_key
OPENAI_API_KEY=sk-your_openai_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# File Upload
NEXT_PUBLIC_MAX_FILE_SIZE=104857600  # 100MB
VIRUS_SCAN_API_KEY=your_virus_scan_key

# Security
NEXT_PUBLIC_ALLOWED_ORIGINS=https://your-domain.com
CSRF_SECRET=your_csrf_secret_key
RATE_LIMIT_REDIS_URL=your_rate_limit_redis_url

# Real-time Features
NEXT_PUBLIC_SOCKET_URL=https://your-domain.com
REDIS_ADAPTER_HOST=your-redis-host
REDIS_ADAPTER_PORT=6379

# Monitoring & Analytics
SENTRY_DSN=your_sentry_dsn
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
MIXPANEL_TOKEN=your_mixpanel_token

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_SMS_NOTIFICATIONS=true
ENABLE_ADVANCED_ANALYTICS=true
ENABLE_LOAD_BALANCING=true
```

## 🌐 Vercel Deployment

### Automatic Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_KEY production
# ... continue for all environment variables
```

### Advanced Vercel Configuration
Create `vercel.json`:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "regions": ["iad1", "lhr1", "nrt1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    },
    "src/app/api/websocket/route.ts": {
      "maxDuration": 60
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "X-Requested-With, Content-Type, Authorization"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/socket.io/(.*)",
      "destination": "/api/websocket"
    }
  ]
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run test:security

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  load-test:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: node load-test.js --target=https://your-domain.com
```

## 📊 Performance Optimization

### Database Optimization
```sql
-- Create performance indexes
CREATE INDEX CONCURRENTLY idx_submissions_competition_status ON submissions(competition_id, status);
CREATE INDEX CONCURRENTLY idx_votes_competition_time ON votes(competition_id, created_at);
CREATE INDEX CONCURRENTLY idx_users_role_status ON users(role, status);
CREATE INDEX CONCURRENTLY idx_reviews_assignment_status ON reviews(reviewer_user_id, status);

-- Set up connection pooling
-- Configure in Supabase dashboard: Pool Size = 25, Max Client Connections = 100
```

### Redis Configuration
```redis
# Production Redis settings
maxmemory 256mb
maxmemory-policy allkeys-lru
timeout 300
tcp-keepalive 60
save 900 1
save 300 10
save 60 10000
```

### Next.js Optimization
Update `next.config.ts`:
```typescript
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'recharts'],
    serverComponentsExternalPackages: ['sharp'],
  },
  images: {
    domains: ['supabase-storage-domain.com'],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
}
```

## 🔒 Security Hardening

### Security Headers
Add to `middleware.ts`:
```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // CSP Header
  response.headers.set('Content-Security-Policy', `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' wss: https:;
    font-src 'self' https://fonts.gstatic.com;
  `.replace(/\n/g, ''))
  
  return response
}
```

### Production Security Checklist
- [ ] All secrets stored in environment variables
- [ ] HTTPS enforced with HSTS headers
- [ ] CSP headers configured
- [ ] Rate limiting enabled on all endpoints
- [ ] Input validation on all user inputs
- [ ] File upload restrictions enforced
- [ ] Database connection pooling configured
- [ ] Redis AUTH enabled
- [ ] Audit logging enabled
- [ ] Error reporting configured (Sentry)

## 📈 Monitoring & Observability

### Monitoring Stack Setup
1. **Application Monitoring (Sentry)**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Performance Monitoring (Vercel Analytics)**
   ```bash
   npm install @vercel/analytics
   ```

3. **User Analytics (PostHog/Mixpanel)**
   ```bash
   npm install posthog-js
   ```

### Health Check Endpoints
Ensure these endpoints return 200 OK:
- `/api/health` - General application health
- `/api/database/health` - Database connectivity
- `/api/redis/health` - Redis connectivity
- `/api/email/health` - Email service status
- `/api/websocket/health` - WebSocket server status

### Alerting Setup
Configure alerts for:
- API response times > 1000ms
- Error rate > 1%
- Database connections > 80%
- Redis memory usage > 90%
- WebSocket connection failures
- Authentication failures > threshold

## 🧪 Load Testing & Validation

### Pre-Production Testing
```bash
# Install k6 for load testing
npm install -g k6

# Run comprehensive load tests
k6 run load-test.js

# Test specific scenarios
npm run test:voting-load    # 10,000 concurrent voters
npm run test:api-load       # API endpoint stress testing
npm run test:websocket-load # WebSocket connection testing
```

### Production Validation Checklist
- [ ] Load test passes with 10,000 concurrent users
- [ ] All API endpoints respond within SLA
- [ ] WebSocket connections stable under load
- [ ] Database queries optimized (< 100ms average)
- [ ] File uploads work correctly
- [ ] Email notifications deliver successfully
- [ ] Real-time voting functions properly
- [ ] Security scans pass
- [ ] Accessibility compliance verified
- [ ] Mobile responsiveness confirmed

## 🔧 Troubleshooting

### Common Issues & Solutions

**Database Connection Issues**
```bash
# Check connection pooling settings
# Verify Supabase connection limits
# Monitor active connections in dashboard
```

**WebSocket Connection Failures**
```bash
# Check Redis adapter configuration
# Verify CORS settings
# Monitor connection counts
```

**High Memory Usage**
```bash
# Check Redis memory usage
# Monitor Node.js heap size
# Review image processing jobs
```

**Slow API Responses**
```bash
# Check database query performance
# Review Redis cache hit rates
# Monitor external service latency
```

### Production Support Contacts
- **Database Issues**: Supabase Support
- **Hosting Issues**: Vercel Support  
- **Redis Issues**: Upstash Support
- **Email Issues**: SendGrid Support

## 📚 Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-to-prod)
- [Vercel Performance Guide](https://vercel.com/docs/concepts/analytics)
- [Socket.io Deployment Guide](https://socket.io/docs/v4/deployment/)

---

**🎯 Ready for Production!**

Your NestFest platform is now configured for enterprise-scale deployment with comprehensive monitoring, security, and performance optimization. The platform can handle university-scale competition events with thousands of concurrent participants while maintaining excellent user experience and data integrity.

For ongoing support and optimization, refer to the monitoring dashboards and maintain regular security audits.