# 🔧 Git Setup Guide for New D Drive Location

## 🎯 Current Status
- ✅ Files copied to D drive
- ❌ Git repositories need to be re-initialized
- ✅ GitHub repos still exist and are live

## 🚀 Setup Instructions

### For Netlify Deployment

```bash
# Navigate to netlify directory
cd "D:\NEST-FEST-2025\netlify-deployment"

# Initialize git repository
git init

# Add GitHub remote (existing repo)
git remote add origin https://github.com/onebrownguy/netlifyversionAugust.git

# Fetch latest from GitHub
git fetch origin

# Set up main branch
git checkout -b main origin/main

# Add current files
git add .
git commit -m "Moved to organized D drive structure"

# Push to sync
git push origin main
```

### For Vercel Deployment  

```bash
# Navigate to vercel directory
cd "D:\NEST-FEST-2025\vercel-deployment"

# Initialize git repository
git init

# Add remote (if different repo, or create new one)
# Option A: If existing repo
git remote add origin https://github.com/YOUR-USERNAME/nestfest-vercel.git

# Option B: Create new repo if needed
gh repo create nest-fest-vercel --private --source=. --remote=origin --push
```

## 🔄 Alternative: Fresh Clone Approach

### Option 1: Clone Fresh (Recommended)

```bash
# Remove copied directories
rm -rf "/d/NEST-FEST-2025/netlify-deployment"
rm -rf "/d/NEST-FEST-2025/vercel-deployment"

# Clone directly from GitHub
cd "/d/NEST-FEST-2025"
git clone https://github.com/onebrownguy/netlifyversionAugust.git netlify-deployment

# For Vercel, if separate repo exists
git clone https://github.com/YOUR-USERNAME/nestfest-vercel.git vercel-deployment
```

## 📋 GitHub Repository Status

**Known Repositories:**
- **Netlify**: `onebrownguy/netlifyversionAugust` (active, deployed)
- **Vercel**: May need new repository or find existing one

## ⚡ Quick Test Commands

After git setup, test deployments:

```bash
# Test Netlify deployment
cd "D:\NEST-FEST-2025\netlify-deployment"
netlify status
netlify deploy --prod

# Test Vercel deployment  
cd "D:\NEST-FEST-2025\vercel-deployment"
vercel --prod
```

## 🎯 Expected Workflow After Setup

1. **Edit files** in `D:\NEST-FEST-2025\[deployment-type]\`
2. **Commit changes**: `git add . && git commit -m "Description"`
3. **Deploy**:
   - Netlify: `git push` (auto-deploys)
   - Vercel: `vercel --prod` (manual deploy)

## 🚨 Important Notes

- **Don't delete Desktop** until git is working from D drive
- **Test deployments** before removing original folders
- **Both sites remain live** during this transition
- **Email system continues working** (no interruption)

---
*Git setup guide for organized D drive structure*