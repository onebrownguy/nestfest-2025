# 🚀 NEST FEST 2025 - Quick Start Guide

## 📍 New Organized Location
**D:\NEST-FEST-2025\** (moved from messy Desktop structure)

## ⚡ Quick Development Setup

### Option 1: Netlify Development (Registration System)
```bash
# Navigate to Netlify deployment
cd "D:\NEST-FEST-2025\netlify-deployment"

# Install dependencies (only needed once)
npm install

# Start local development server
netlify dev

# Your local server: http://localhost:8888
# Functions available at: http://localhost:8888/.netlify/functions/
```

### Option 2: Vercel Development (Next.js App)
```bash
# Navigate to Vercel deployment  
cd "D:\NEST-FEST-2025\vercel-deployment"

# Install dependencies (only needed once)
npm install

# Start Next.js development server
npm run dev

# Your local server: http://localhost:3000
```

## 🌐 Live Sites (Already Deployed & Working)

- **Netlify**: https://nestfestdash.netlify.app/
  - Registration forms with email notifications
  - Privacy policy & terms pages
  - Admin notifications to admin@edge-team.org

- **Vercel**: https://nestfest.app/
  - Modern Next.js app with React components
  - Privacy/terms pages as React components
  - Footer component in global layout

## 📧 Email System Status
- ✅ **Working**: Admin notifications functional
- ✅ **Working**: Participant confirmations  
- ✅ **Tested**: Last verified Sep 9, 2025 8:44 PM

## 🔄 Deployment Commands

### Deploy Netlify Changes
```bash
cd "D:\NEST-FEST-2025\netlify-deployment"
git add . && git commit -m "Update: [description]" && git push
# Auto-deploys via GitHub integration
```

### Deploy Vercel Changes  
```bash
cd "D:\NEST-FEST-2025\vercel-deployment"
vercel --prod
# Deploys directly to production
```

## 🛠️ What's Been Cleaned Up

**Before (Messy Desktop):**
- Scattered across `C:\Users\ICS Spare\Desktop\`
- Mixed with PDFs, shortcuts, and other files
- Hard to find project files
- Heavy node_modules taking space

**After (Organized D Drive):**  
- Clean structure in `D:\NEST-FEST-2025\`
- Essential files only (no node_modules in backup)
- Comprehensive documentation
- Clear separation of concerns

## 🎯 Current Project Status

- ✅ **Legal Compliance**: Privacy policy & terms on both sites
- ✅ **Email Integration**: Dual notifications working  
- ✅ **Cross-Platform**: Vercel → Netlify routing working
- ✅ **Clean Architecture**: Proper React components
- ✅ **Organized Files**: D drive structure complete

---
*Ready to spin up from: **D:\NEST-FEST-2025\***
*Choose your preferred development environment above*