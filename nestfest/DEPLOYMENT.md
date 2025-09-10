# NestFest Deployment Guide

## Quick Start (5 minutes)

### 1. Initial Setup
```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.template .env.local

# Fill in your environment variables in .env.local
# (See .env.template for required vs optional variables)

# Sync environment variables to Vercel
npm run env:pull  # Pull from Vercel (if already set)
# OR manually add via Vercel dashboard
```

### 3. Deploy
```bash
# Preview deployment
npm run deploy:preview

# Production deployment
npm run deploy:prod
```

## Environment Variable Categories

### CRITICAL (Required for app to start)
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `NEXTAUTH_SECRET`

### OPTIONAL (App works with fallbacks)
- `SENDGRID_API_KEY` → Email disabled if missing
- `REDIS_URL` → Memory cache fallback
- `OPENAI_API_KEY` → AI features disabled

## Vercel Integration Features

### ✅ Configured
- Next.js optimizations
- API route optimization (30s timeout)
- Image optimization for Supabase
- Bundle optimization
- Custom domain support

### 📋 Available Scripts
```bash
npm run env:pull          # Pull environment variables from Vercel
npm run env:push          # Add environment variables to Vercel
npm run deploy:preview    # Deploy to preview environment
npm run deploy:prod       # Deploy to production
```

## Deployment Checklist

### Before Deployment
- [ ] `.env.local` configured with all required variables
- [ ] Build succeeds locally: `npm run build`
- [ ] Database accessible from production
- [ ] SendGrid domain verified (for email functionality)
- [ ] Custom domain DNS configured (if using)

### After Deployment
- [ ] Test authentication flow
- [ ] Verify email functionality
- [ ] Check database connectivity
- [ ] Validate environment-specific features

## Troubleshooting

### Build Fails
1. Clear Next.js cache: `rm -rf .next`
2. Check environment variables are properly set
3. Verify all required dependencies are in package.json

### Environment Variable Issues
1. Use `npm run env:pull` to sync from Vercel
2. Check Vercel dashboard for missing variables
3. Verify critical variables are set for production environment

### API Route Timeouts
- Vercel has 30-second timeout for API routes
- Long-running processes should use background jobs
- Database queries should be optimized

## Production Optimization

### Performance
- Next.js optimizations enabled
- Image optimization configured
- Bundle size optimization
- CDN delivery via Vercel Edge Network

### Monitoring
- Add Vercel Analytics: Install `@vercel/analytics`
- Set up error tracking with Sentry
- Monitor API route performance

## Custom Domain Setup

1. Add domain in Vercel dashboard
2. Configure DNS:
   ```
   Type: CNAME
   Name: nestfest (or your subdomain)
   Value: cname.vercel-dns.com
   ```
3. Update `NEXTAUTH_URL` environment variable
4. Test SSL certificate provisioning

Ready to deploy! 🚀