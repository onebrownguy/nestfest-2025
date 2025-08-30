# 🌐 NestFest Custom Domain Setup: nestfest.app

## 🎯 Professional Production URL Setup

**Target URL:** `https://nestfest.app`

### Step 1: Configure Domain in Vercel (2 minutes)

**Go to:** https://vercel.com/abel-rincons-projects/nestfest/settings/domains

1. Click **"Add Domain"**
2. Enter: `nestfest.app` 
3. Vercel will show DNS configuration required
4. **Also add** `www.nestfest.app` (recommended for www redirect)

### Step 2: Configure DNS Records

**In your domain registrar (where you bought nestfest.app):**

**For Root Domain (nestfest.app):**
```
Type: A
Name: @ (or leave blank)
Value: 76.76.19.61
TTL: 3600
```

**For WWW Subdomain (www.nestfest.app):**
```
Type: CNAME  
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**Alternative - Use Vercel Nameservers (Recommended):**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

### Step 3: Update OAuth Providers

**Google OAuth Configuration:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. **Replace** all redirect URIs with:
   ```
   https://nestfest.app/api/auth/callback/google
   ```
4. **Keep localhost for development:**
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:3001/api/auth/callback/google
   ```

**GitHub OAuth Configuration:**  
1. Go to: https://github.com/settings/developers
2. Find your OAuth App
3. **Update Authorization callback URL:**
   ```
   https://nestfest.app/api/auth/callback/github
   ```

### Step 4: Update Vercel Environment Variables

**Go to:** https://vercel.com/abel-rincons-projects/nestfest/settings/environment-variables

**Update these key variables:**
```bash
NEXTAUTH_URL=https://nestfest.app
```

**Keep all other variables the same:**
- `NEXTAUTH_SECRET`
- `POSTGRES_URL` 
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

### Step 5: Deploy with Domain Configuration

```bash
# Commit any changes
git add -A && git commit -m "production: Configure nestfest.app domain"

# Deploy to production  
vercel --prod
```

### Step 6: SSL Certificate & Verification

**Vercel automatically:**
- ✅ Provisions SSL certificate
- ✅ Handles HTTPS redirects  
- ✅ Configures CDN globally
- ✅ Enables HTTP/2

**Verification Steps:**
1. Wait 5-10 minutes for DNS propagation
2. Visit: https://nestfest.app
3. Verify SSL certificate is valid
4. Test OAuth login flow

## 🎯 Production URLs After Setup

**Primary URL:** `https://nestfest.app`
**OAuth Callbacks:**
- Google: `https://nestfest.app/api/auth/callback/google`
- GitHub: `https://nestfest.app/api/auth/callback/github`

**Dashboard URLs:**
- Admin: `https://nestfest.app/admin`
- Judge: `https://nestfest.app/judge`  
- Student: `https://nestfest.app/student`
- Reviewer: `https://nestfest.app/reviewer`

## 🛡️ Security Benefits

**Professional Domain provides:**
- ✅ **Trust & Credibility** - Users trust `.app` domains
- ✅ **HTTPS Enforced** - `.app` domains require HTTPS
- ✅ **Better SEO** - Search engines prefer custom domains
- ✅ **Email Integration** - Professional email addresses
- ✅ **Brand Recognition** - Memorable nestfest.app URL

## 📧 Email Configuration (Optional)

**For professional emails like admin@nestfest.app:**
1. Use your domain registrar's email service
2. Or configure Google Workspace/Microsoft 365
3. Update `FROM_EMAIL` environment variable to use @nestfest.app

## 🚀 Subdomain Strategy (Future)

**Potential subdomains for scaling:**
- `api.nestfest.app` - API endpoints
- `admin.nestfest.app` - Admin dashboard  
- `live.nestfest.app` - Live event streaming
- `docs.nestfest.app` - Documentation

## 🔄 Testing Checklist

After DNS propagation (5-10 minutes):

- [ ] `https://nestfest.app` loads correctly
- [ ] `https://www.nestfest.app` redirects to main domain
- [ ] SSL certificate shows as valid
- [ ] Google OAuth login works
- [ ] GitHub OAuth login works  
- [ ] Dashboard redirects work properly
- [ ] Database tables auto-create on first login

## ⚡ Rollback Plan

**If issues occur:**
1. DNS changes can take up to 24 hours to fully propagate
2. Keep Vercel subdomain as backup: `nestfest-2uaelm2s5-abel-rincons-projects.vercel.app`
3. Can temporarily revert OAuth URLs to Vercel subdomain
4. Domain settings can be modified in Vercel dashboard

## 🎯 Next Steps After Domain Setup

1. **Remove Deployment Protection** (if still enabled)
2. **Test Complete OAuth Flow** with custom domain
3. **Update Social Links** to use nestfest.app  
4. **Configure Analytics** (Google Analytics, etc.)
5. **Set up Professional Email** (admin@nestfest.app)

---

**🎉 Result: Professional production platform at https://nestfest.app with enterprise-grade authentication!**