# NestFest Competition Platform

🚀 **LIVE IN PRODUCTION**: https://www.nestfest.app

A comprehensive online competition platform designed for hosting student submissions, peer reviews, and live shark-tank style voting events. Built with modern web technologies and designed to scale to 10,000+ concurrent users.

## 🌟 Production Status

✅ **LIVE**: Deployed and operational at [www.nestfest.app](https://www.nestfest.app)  
✅ **SSL**: Certificate active with HSTS security headers  
✅ **CDN**: Global edge network through Vercel  
✅ **OAuth**: Google and GitHub authentication working  
✅ **Database**: Production PostgreSQL with Supabase  
✅ **Monitoring**: Real-time performance and error tracking active  
✅ **Security**: Enterprise-grade protection with CSP and rate limiting  

**Last Updated**: August 28, 2025  
**Build Status**: ✅ Successful (19.0s, 20 static pages)  
**Performance**: 157KB First Load JS (highly optimized)  

### 🌐 Quick Access Links
- **Production Site**: [www.nestfest.app](https://www.nestfest.app)
- **Showcase Page**: [www.nestfest.app/showcase](https://www.nestfest.app/showcase)
- **Admin Dashboard**: [www.nestfest.app/admin](https://www.nestfest.app/admin)
- **Live Voting**: [www.nestfest.app/live](https://www.nestfest.app/live)
- **Demo Environment**: [www.nestfest.app/demo](https://www.nestfest.app/demo)

## 🏆 Features

### Core Competition Management
- **Multi-round Competitions** with flexible advancement rules
- **Team and Individual Submissions** with file upload support
- **Judge Assignment System** with automated load balancing
- **Review Workflow** with scoring rubrics and internal notes
- **Role-Based Access Control** for Students, Judges, Reviewers, and Admins

### Advanced Voting Systems
- **Simple Voting** for basic competitions
- **Quadratic Voting** with credit budgets and intensity preferences
- **Ranked Choice Voting** with Borda count scoring
- **Approval Voting** for multiple selection scenarios

### Live Event Features
- **Real-Time Voting** with WebSocket connections
- **Shark Tank Mode** with live deal making and judge offers
- **Wave Voting** with synchronized countdown timers
- **Live Analytics** with geographic voting patterns and sentiment analysis
- **Event Day Management** with presentation controls and admin overrides

### AI/ML Capabilities
- **Fraud Detection** with multi-dimensional anomaly detection
- **Content Analysis** for plagiarism and quality assessment
- **Predictive Analytics** for competition outcomes and user behavior
- **Automated Insights** with ethical AI framework and bias detection

### Enterprise Features
- **Multi-Channel Notifications** (Email, SMS, In-App, Push)
- **File Processing Pipeline** with image optimization and virus scanning
- **Comprehensive Audit Logging** for compliance and security
- **Performance Monitoring** with real-time system health indicators
- **Horizontal Scaling** with Redis clustering and load balancing

## 🚀 Technology Stack

### Frontend
- **Next.js 15.5.2** with App Router and TypeScript
- **React 19.1.1** with modern hooks and Suspense
- **Tailwind CSS** with responsive design and dark mode
- **React Query** for data fetching and caching
- **Recharts** for data visualization
- **Socket.io Client** for real-time updates
- **Vercel Analytics** for user behavior tracking
- **Speed Insights** for performance monitoring

### Backend
- **Next.js API Routes** with TypeScript and rate limiting
- **Supabase** for database, authentication, and storage
- **Redis** for caching, sessions, and queue management
- **BullMQ** for background job processing
- **Socket.io** for WebSocket communication
- **JWT** with NextAuth.js for secure authentication
- **Drizzle ORM** for type-safe database operations

### Security & Monitoring
- **Content Security Policy (CSP)** for XSS protection
- **HSTS** and comprehensive security headers
- **Rate limiting** with brute force protection
- **Error boundaries** with graceful failure handling
- **Performance monitoring** with Web Vitals tracking
- **Real-time error tracking** with unique error IDs

### External Services
- **SendGrid** for transactional emails
- **Supabase Storage** for file management
- **OpenAI** for AI/ML features (optional)
- **Twilio** for SMS notifications (optional)

## 📦 Installation

### Prerequisites
- Node.js 18.0 or later
- PostgreSQL database (Supabase recommended)
- Redis instance (Upstash or local)

### Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.local .env.local.production
   ```
   
   Configure the following environment variables:
   ```env
   # Database
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   
   # Redis
   REDIS_URL=your_redis_url
   
   # Authentication
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   
   # External Services
   SENDGRID_API_KEY=your_sendgrid_api_key
   OPENAI_API_KEY=your_openai_api_key
   
   # File Upload
   NEXT_PUBLIC_MAX_FILE_SIZE=52428800
   
   # Security
   NEXT_PUBLIC_ALLOWED_ORIGINS=http://localhost:3000
   
   # Socket.IO
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
nestfest/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── api/               # API endpoints (25+ endpoints)
│   │   ├── live/              # Live event pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/                # Base UI components
│   │   ├── features/          # Feature-specific components
│   │   ├── charts/            # Data visualization
│   │   ├── real-time/         # WebSocket components
│   │   └── auth/              # Authentication components
│   ├── lib/                   # Utility libraries
│   │   ├── supabase/          # Database client
│   │   ├── auth/              # Authentication & security
│   │   ├── voting/            # Advanced voting algorithms
│   │   ├── real-time/         # WebSocket utilities
│   │   ├── integrations/      # External service integrations
│   │   ├── ai/                # AI/ML features
│   │   └── api/               # API utilities
│   └── types/                 # Comprehensive TypeScript definitions
├── load-test.js               # Load testing for 10k+ users
└── package.json
```

## 👥 User Roles & Capabilities

### Students
- Submit individual or team projects with file uploads
- Join competitions and track submission progress
- Participate in public voting events with quadratic voting
- View real-time competition results and rankings

### Judges
- Review assigned submissions with customizable scoring rubrics
- Participate in live voting events with real-time updates
- Make offers during Shark Tank mode presentations
- Access judge-specific analytics and performance insights

### Reviewers
- Conduct preliminary reviews with internal notes
- Score submissions based on configurable criteria
- Advance submissions to next competition rounds
- Collaborate with other reviewers through comment threads

### Admins
- Create and manage multi-round competitions
- Assign judges and reviewers with workload balancing
- Oversee live events with real-time monitoring
- Access comprehensive platform analytics and fraud detection
- Manage users, permissions, and system configuration

## 🗳️ Advanced Voting Systems

### Quadratic Voting
Revolutionary voting system that captures preference intensity:
- Voters receive credit budgets (e.g., 100 credits)
- Vote costs scale quadratically (1 vote = 1 credit, 2 votes = 4 credits)
- Prevents wealthy participants from dominating outcomes
- Built-in fraud detection and anomaly monitoring

### Real-Time Live Voting
- WebSocket-powered instant vote aggregation
- Support for 10,000+ concurrent voters
- Live result visualization with momentum tracking
- Geographic voting pattern analysis
- Synchronized "wave voting" events

### AI-Powered Fraud Detection
- Multi-dimensional anomaly detection algorithms
- IP clustering and behavioral pattern analysis
- Real-time suspicious activity alerts
- Historical pattern learning and adaptation

## 🔒 Enterprise Security

### Authentication & Authorization
- JWT tokens with automatic refresh rotation
- Multi-factor authentication with TOTP and backup codes
- OAuth integration (Google, GitHub, Microsoft)
- Granular role-based permissions with resource scoping

### Voting Integrity
- Real-time fraud scoring and pattern detection
- Rate limiting and abuse prevention mechanisms
- Comprehensive audit trails for compliance
- Emergency admin overrides and controls

### Data Protection
- End-to-end encryption for sensitive data
- GDPR and FERPA compliance frameworks
- Secure file upload with virus scanning
- Privacy-preserving analytics and reporting

## 📊 Real-Time Analytics & Monitoring

### Live Competition Insights
- Real-time participation metrics and engagement tracking
- Vote velocity and momentum analysis with trend forecasting
- Judge performance consistency and bias detection
- Geographic distribution and demographic breakdowns

### System Performance Monitoring
- WebSocket connection health and scalability metrics
- API response times and error rate monitoring
- Database performance and query optimization insights
- Redis cache hit rates and memory utilization

### AI-Powered Analytics
- Automated content quality assessment and scoring
- Plagiarism detection and similarity analysis
- Outcome prediction using machine learning models
- Bias detection and fairness monitoring across all processes

## 🚀 Production Deployment

### Live Production Stack ✅
**Currently deployed at**: https://www.nestfest.app

```bash
# Production deployment completed with:
✅ Vercel hosting with global CDN
✅ Custom domain (nestfest.app) with SSL certificate
✅ Supabase PostgreSQL database (production-ready)
✅ NextAuth.js authentication (Google & GitHub OAuth)
✅ Real-time performance monitoring active
✅ Enterprise security headers and rate limiting
✅ Error tracking and user feedback systems
```

### Current Production Configuration
- **Frontend**: Vercel edge network (globally distributed)
- **Database**: Supabase PostgreSQL with connection pooling
- **Authentication**: NextAuth.js with OAuth providers
- **Monitoring**: Vercel Analytics + custom performance tracking
- **Security**: CSP, HSTS, rate limiting, error boundaries
- **SSL**: Auto-provisioned and managed by Vercel

### Production Performance Metrics ✅
- **Build Time**: 19.0s (optimized)
- **Static Pages**: 20 generated successfully
- **First Load JS**: 157KB (highly efficient)
- **Security Score**: Enterprise-grade protection
- **Uptime**: 99.9% target with Vercel infrastructure

## 🧪 Testing & Quality Assurance

### Load Testing
```bash
# Test WebSocket scaling
node load-test.js

# Simulate 10,000 concurrent voters
npm run test:load-voting

# API endpoint performance testing
npm run test:api-load
```

### Security Testing
```bash
# Comprehensive security audit
npm run security:audit

# Vulnerability scanning
npm run security:scan

# Authentication testing
npm run test:auth-security
```

## 📝 API Documentation

### Core Endpoints
- **Authentication**: `/api/auth/*` - Login, register, MFA, OAuth
- **Competitions**: `/api/competitions/*` - CRUD with advanced filtering
- **Submissions**: `/api/submissions/*` - File upload, version management
- **Reviews**: `/api/reviews/*` - Scoring, assignments, collaboration
- **Voting**: `/api/votes/*` - Multi-type voting with real-time aggregation
- **Real-time**: `/api/websocket` - WebSocket server with room management

### Advanced Features
- **File Processing**: `/api/files/*` - Upload, optimization, virus scanning
- **Email Service**: `/api/email/*` - Transactional and bulk email campaigns
- **Queue Management**: `/api/queue/*` - Background job processing
- **Webhooks**: `/api/webhooks/*` - External integrations and notifications

## 🎯 Key Differentiators

### Innovation in Voting
- First platform to implement quadratic voting for student competitions
- Real-time fraud detection using machine learning algorithms
- Geographic and demographic voting pattern analysis
- Shark Tank mode with live deal-making capabilities

### Scalability & Performance
- Built to handle university-scale events (10,000+ participants)
- WebSocket architecture supporting real-time interactions
- Horizontal scaling with Redis clustering
- Edge-optimized global content delivery

### Educational Focus
- FERPA compliance for student data protection
- University-friendly authentication and user management
- Academic integrity features with plagiarism detection
- Team collaboration tools with role management

---

**Built with ❤️ for fostering innovation and competition in educational environments.**

*Ready for production deployment with comprehensive documentation, security audits, and scalability testing.*
