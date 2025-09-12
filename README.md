# NEST FEST 2025 - Organized Project Structure

## 📁 Directory Structure

```
D:\NEST-FEST-2025\
├── README.md                     # This file
├── netlify-deployment/           # Netlify static site + serverless functions
│   ├── functions/                # Netlify serverless functions (43 functions)
│   │   ├── submit.js             # Main registration handler
│   │   ├── participate.js        # Participation form handler  
│   │   └── [41 other functions]  # Auth, email, analytics, etc.
│   ├── legal/                    # Legal pages (Privacy Policy, Terms)
│   │   ├── privacy-policy.html   # Updated Sep 9, 2025
│   │   └── terms-of-service.html
│   ├── index.html               # Main registration page
│   ├── participate.html         # Participation selection page
│   ├── package.json             # Dependencies
│   └── netlify.toml             # Deployment config
├── vercel-deployment/           # Next.js React application
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   │   ├── layout.tsx       # Global layout (includes Footer)
│   │   │   ├── page.tsx         # Homepage
│   │   │   ├── register/        # Registration form
│   │   │   ├── privacy/         # Privacy policy (React)
│   │   │   └── terms/           # Terms page (React)
│   │   └── components/          # React components
│   │       ├── Footer.tsx       # Legal footer component
│   │       ├── ui/              # UI components
│   │       └── features/        # Feature components
│   ├── public/
│   │   └── participate.html     # Static participation page
│   ├── package.json             # Next.js dependencies
│   ├── next.config.js           # Next.js configuration
│   └── vercel.json              # Vercel deployment config
├── docs/                       # 📚 Organized Documentation Hub (23 files)
│   ├── architecture/           # System design & component architecture
│   ├── infrastructure/         # Core services & integrations (email, APIs)
│   ├── testing/               # Test reports & troubleshooting guides
│   ├── deployment/            # Deployment guides & API documentation
│   ├── sessions/              # Session handoffs & progress reports
│   ├── guides/               # Setup guides & quick starts
│   └── README.md             # 📋 Complete documentation index
└── backups/                     # Backup files
```

## 🚀 Development Commands

### Netlify Development (Registration & Email System)
```bash
cd D:\NEST-FEST-2025\netlify-deployment
npm install
netlify dev                      # Local development server
netlify deploy --prod           # Deploy to production
```

### Vercel Development (Next.js App)
```bash
cd D:\NEST-FEST-2025\vercel-deployment  
npm install
npm run dev                     # Next.js development server (localhost:3000)
vercel --prod                   # Deploy to production
```

## 🌐 Live Deployments

- **Netlify**: https://nestfestdash.netlify.app/ (registration + email system)
- **Vercel**: https://nestfest.app/ (Next.js app + participate page)

## 📧 Email System

- **Service**: SendGrid integration (fully operational)
- **Sender**: admin@edge-team.org 
- **Recipients**: rinconabel@gmail.com, admin@edge-team.org (verified)
- **Gmail API**: OAuth configured for programmatic access
- **Test Status**: ✅ Working (verified Sep 11, 2025)
- **📋 Full Documentation**: [docs/infrastructure/EMAIL_INFRASTRUCTURE_DOCUMENTATION.md](./docs/infrastructure/EMAIL_INFRASTRUCTURE_DOCUMENTATION.md)

## 🔄 User Flow

1. **Discovery**: https://nestfest.app/participate.html (Vercel)
2. **Selection**: User chooses participation type
3. **Registration**: Redirects to https://nestfestdash.netlify.app/ (Netlify)
4. **Processing**: Dual email system (participant + admin notifications)
5. **Legal**: Both sites have Privacy Policy & Terms links

## ⚙️ Current Status

- ✅ **Deployments**: Both Netlify and Vercel operational
- ✅ **Dashboard**: 5 submissions displaying, admin functions working  
- ✅ **Judge System**: Complete architecture deployed (26 APIs)
- ✅ **Email Infrastructure**: SendGrid + Gmail API fully configured
- ✅ **Documentation**: 23 files organized in intelligent structure
- ✅ **Authentication**: Development tokens working, production auth ready
- ✅ **Legal Compliance**: Privacy policy & terms implemented

**📋 Latest Status**: [docs/sessions/PROGRESS_CHECKPOINT_2025-09-11.md](./docs/sessions/PROGRESS_CHECKPOINT_2025-09-11.md)

## 🛠️ Technical Stack

**Netlify:**
- Static HTML + CSS + JavaScript
- Netlify Functions (Node.js serverless)
- SendGrid email integration
- Google Sheets API integration

**Vercel:**
- Next.js 14 (React 19)
- TypeScript
- Tailwind CSS
- App Router architecture

---
*Organized and documented: September 9, 2025*
*Original location: C:\Users\ICS Spare\Desktop\*