# NestFest Production Setup Guide

## 🚀 From Deployment-First to Production-Ready

This guide transforms your stable deployment-first foundation into a professional production system.

## Phase 1: Database Setup (15 minutes)

### 1. Create Vercel Postgres Database
```bash
# In your Vercel dashboard:
1. Go to Storage → Create Database
2. Choose "Postgres" 
3. Name: "nestfest-prod"
4. Region: Choose closest to your users
5. Copy all environment variables
```

### 2. Configure Environment Variables
```bash
# Copy the template
cp .env.example .env.local

# Fill in your Vercel Postgres credentials
# Get these from Vercel Dashboard → Storage → Your Database → .env.local tab
```

### 3. Generate and Run Database Migration
```bash
# Generate migration files from schema
npm run db:generate

# Push schema to database (creates all tables)
npm run db:push

# Optional: Open database studio to verify
npm run db:studio
```

## Phase 2: OAuth Provider Setup (20 minutes)

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Add authorized redirect URLs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-app.vercel.app/api/auth/callback/google` (production)
6. Copy Client ID and Secret to `.env.local`

### GitHub OAuth Setup
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in details:
   - Homepage URL: `https://your-app.vercel.app`
   - Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`
4. Copy Client ID and Secret to `.env.local`

### NextAuth Secret
```bash
# Generate a secure secret
openssl rand -base64 32

# Add to .env.local as NEXTAUTH_SECRET
```

## Phase 3: Deploy to Production (5 minutes)

### 1. Add Environment Variables to Vercel
```bash
# Push all environment variables to Vercel
vercel env add NEXTAUTH_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET

# Database variables are automatically added by Vercel Postgres
```

### 2. Deploy
```bash
npm run build
npm run deploy:prod
```

## Phase 4: Create Initial Users (Demo Data)

### Option A: Through UI
1. Visit your production app
2. Click "Sign up" or use OAuth
3. First user automatically becomes admin

### Option B: Direct Database Insert
```sql
-- Connect to your database via Drizzle Studio or Vercel dashboard
INSERT INTO users (email, name, role, status) VALUES 
('admin@yourcompany.com', 'Admin User', 'admin', 'active'),
('judge@yourcompany.com', 'Judge User', 'judge', 'active'),
('student@yourcompany.com', 'Student User', 'student', 'active');
```

## Phase 5: Verification Checklist

### ✅ Authentication Working
- [ ] OAuth login (Google/GitHub) works
- [ ] Email/password login works  
- [ ] User sessions persist correctly
- [ ] Role-based access functions

### ✅ Database Connected
- [ ] Database connection successful
- [ ] All tables created properly
- [ ] User data saves correctly
- [ ] Relationships work as expected

### ✅ Production Ready
- [ ] No 405 errors from authentication
- [ ] Error monitoring still captures real issues
- [ ] Performance remains fast (<3s builds)
- [ ] All routes render properly

## Expected Behavior Changes

### ✅ What Now Works (vs Mock)
- **Real Authentication**: OAuth and credentials work
- **Persistent Sessions**: Users stay logged in between visits
- **Database Storage**: All data saves to real PostgreSQL
- **Multi-user Support**: Different users, roles, permissions

### ✅ What Stays The Same
- **Fast Deployments**: Still <30 second builds
- **Error Monitoring**: Continues tracking real issues  
- **UI/UX**: All interfaces work exactly the same
- **Testing**: All tests continue to pass

## Cost Breakdown (Monthly)

**Basic Production** (~$25/month):
- Vercel Pro: $20 (team features, analytics)
- Vercel Postgres: $5 (hobby tier)

**Professional** (~$50/month):
- Vercel Pro: $20
- Vercel Postgres Pro: $25 (production features)
- Custom domain: ~$1/month

**Enterprise** (~$100+/month):
- Add monitoring, security, backups

## Troubleshooting

### Database Connection Issues
```bash
# Test database connection
npm run db:studio

# Check environment variables
vercel env ls
```

### OAuth Issues
- Ensure redirect URLs match exactly (http vs https)
- Check OAuth app is approved/published
- Verify environment variables are set in Vercel

### Build Failures
- Our error monitoring will capture specific issues
- Check Vercel build logs for detailed errors
- Verify all environment variables are set

## Next Steps After Production

1. **Add Email System**: Integrate SendGrid for notifications
2. **File Uploads**: Add Vercel Blob for student submissions  
3. **Real-time Features**: Implement WebSocket for live events
4. **Analytics**: Add user behavior tracking
5. **Security Hardening**: Rate limiting, CSRF protection
6. **Performance Monitoring**: Replace lightweight tracker with professional monitoring

---

**🎉 Congratulations!** You now have a professional production system built on your stable deployment-first foundation. The Clean Slate methodology continues to protect against issues as you add features.