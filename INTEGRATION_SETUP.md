# NestFest External Service Integrations Setup Guide

This guide covers the setup and configuration of all external service integrations for the NestFest competition platform.

## 🏗️ Architecture Overview

The integration system is built with the following principles:
- **Service Abstraction**: Common base class for all external services
- **Circuit Breaker Pattern**: Automatic failure detection and recovery
- **Retry Logic**: Exponential backoff for transient failures
- **Queue System**: Background processing for heavy operations
- **Webhook Management**: Secure bi-directional webhook handling
- **Comprehensive Monitoring**: Health checks and error tracking

## 📋 Prerequisites

### Required Services
1. **Supabase** - Database and file storage
2. **Redis** - Queue system and caching (Required)

### Optional Services
1. **SendGrid** - Email delivery
2. **Twilio** - SMS and phone verification
3. **OpenAI** - Content analysis and AI features
4. **Sentry** - Error tracking and monitoring

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment template:
```bash
cp .env.example .env.local
```

Fill in your service credentials in `.env.local`:

```bash
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Required - Redis
REDIS_URL=redis://localhost:6379

# Optional - SendGrid
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourapp.com
```

### 2. Install Dependencies

The required packages are already included in package.json:
```bash
npm install
```

### 3. Initialize Services

Add to your application startup (e.g., in middleware or API route):

```typescript
import { integrationManager } from '@/lib/integrations/integration-manager';

// Initialize all services
await integrationManager.initialize();
```

### 4. Health Check

Visit the health check endpoints:
- `/api/files/health` - File storage
- `/api/email/health` - Email service
- `/api/queue/health` - Queue system
- `/api/webhooks/health` - Webhook service

## 🔧 Service Configuration

### Supabase Storage

1. Create a new bucket in Supabase:
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('nestfest-files', 'nestfest-files', true);
```

2. Set up storage policies:
```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'nestfest-files');
```

### SendGrid Email Templates

Create the following dynamic templates in SendGrid:

1. **Welcome Email** (`SENDGRID_TEMPLATE_WELCOME`)
   - Subject: "Welcome to NestFest!"
   - Variables: `firstName`, `fullName`

2. **Email Verification** (`SENDGRID_TEMPLATE_EMAIL_VERIFICATION`)
   - Subject: "Verify your email address"
   - Variables: `firstName`, `verificationUrl`

3. **Password Reset** (`SENDGRID_TEMPLATE_PASSWORD_RESET`)
   - Subject: "Reset your password"
   - Variables: `firstName`, `resetUrl`

4. **Competition Notification** (`SENDGRID_TEMPLATE_COMPETITION_NOTIFICATION`)
   - Subject: "{{competitionName}} - {{notificationType}}"
   - Variables: `competitionName`, `competitionDescription`, `notificationType`

### Redis Setup

For development, use Docker:
```bash
docker run -d --name redis-nestfest -p 6379:6379 redis:alpine
```

For production, consider managed Redis services:
- **AWS ElastiCache**
- **Azure Cache for Redis**
- **Google Cloud Memorystore**

### Webhook Endpoints

Configure webhook URLs in your external services:

- **SendGrid**: `https://yourapp.com/api/webhooks/sendgrid`
- **Twilio**: `https://yourapp.com/api/webhooks/twilio`
- **Stripe**: `https://yourapp.com/api/webhooks/stripe`

## 📚 API Usage Examples

### File Upload

```typescript
// Single file upload
const formData = new FormData();
formData.append('file', file);
formData.append('options', JSON.stringify({
  folder: 'submissions',
  generateThumbnail: true,
  quality: 85
}));

const response = await fetch('/api/files/upload', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Email Sending

```typescript
// Send welcome email
await fetch('/api/email/welcome', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    user: {
      email: 'user@example.com',
      name: 'John Doe'
    },
    additionalData: {
      university: 'MIT',
      program: 'Computer Science'
    }
  })
});
```

### Queue Jobs

```typescript
// Add email to queue for background processing
await fetch('/api/queue/email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    jobData: {
      type: 'welcome',
      user: { email: 'user@example.com', name: 'John Doe' }
    },
    options: {
      priority: 10,
      attempts: 3
    }
  })
});
```

### Webhook Management

```typescript
// Create webhook subscription
await fetch('/api/webhooks/subscriptions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    url: 'https://yourapp.com/webhooks/endpoint',
    events: ['user.registered', 'competition.created'],
    headers: {
      'Authorization': 'Bearer your-webhook-token'
    }
  })
});
```

## 🔄 Integration Workflows

### New User Registration

```typescript
import { integrationManager } from '@/lib/integrations/integration-manager';

const result = await integrationManager.processNewCustomer({
  id: user.id,
  email: user.email,
  name: user.name,
  firstName: user.firstName,
  lastName: user.lastName,
  university: user.university,
  program: user.program
});

if (!result.success) {
  console.error('Integration errors:', result.errors);
}
```

### Competition Events

```typescript
const result = await integrationManager.processCompetitionEvent(
  'competition.opened',
  {
    id: competition.id,
    name: competition.name,
    description: competition.description,
    submissionDeadline: competition.submissionDeadline,
    eventDate: competition.eventDate
  },
  participants // Array of { email, name }
);
```

### File Upload Processing

```typescript
const result = await integrationManager.processFileUpload(
  file,
  userId,
  {
    folder: 'submissions',
    generateThumbnail: true,
    quality: 85
  }
);
```

## 🏥 Health Monitoring

### Service Health Checks

```typescript
import { integrationManager } from '@/lib/integrations/integration-manager';

const healthStatus = await integrationManager.getHealthStatus();

console.log('Overall status:', healthStatus.overall);
console.log('Service details:', healthStatus.services);
```

### Circuit Breaker Status

Each service has circuit breaker protection:
- **CLOSED**: Normal operation
- **OPEN**: Service temporarily unavailable
- **HALF_OPEN**: Testing if service has recovered

## 🔒 Security Considerations

### API Keys
- Store all API keys in environment variables
- Use different keys for development/staging/production
- Rotate keys regularly

### Webhook Security
- All webhooks use signature verification
- Implement IP allowlisting where possible
- Use HTTPS for all webhook endpoints

### File Upload Security
- MIME type validation
- File size limits
- Virus scanning (configurable)
- Content analysis for inappropriate material

## 🚨 Error Handling

### Automatic Retries
- Exponential backoff for transient failures
- Circuit breaker prevents cascading failures
- Dead letter queues for permanent failures

### Error Tracking
- All errors logged with context
- Integration with Sentry for production monitoring
- Detailed error responses for debugging

## 📊 Performance Optimization

### Queue Processing
- Configurable concurrency limits
- Priority-based job processing
- Background processing for heavy operations

### File Processing
- Automatic image optimization
- CDN integration for fast delivery
- Thumbnail generation
- Progressive image loading

### Caching
- Redis-based caching for frequent operations
- Configurable TTL values
- Cache invalidation strategies

## 🔧 Troubleshooting

### Common Issues

1. **Redis Connection Errors**
   ```
   Error: Redis connection failed
   ```
   - Check if Redis is running
   - Verify REDIS_URL in environment
   - Check network connectivity

2. **SendGrid API Errors**
   ```
   Error: Unauthorized
   ```
   - Verify SENDGRID_API_KEY
   - Check API key permissions
   - Ensure from email is verified

3. **File Upload Failures**
   ```
   Error: File too large
   ```
   - Check MAX_FILE_SIZE setting
   - Verify Supabase storage quotas
   - Review allowed MIME types

### Debug Mode

Enable debug logging:
```bash
DEBUG_MODE=true
```

### Health Check Endpoints

- `/api/files/health` - Storage service status
- `/api/email/health` - Email service status
- `/api/queue/health` - Queue system status
- `/api/webhooks/health` - Webhook service status

## 🚀 Production Deployment

### Environment Variables
- Review all `.env.example` variables
- Set production-specific values
- Use secure secret management

### Scaling Considerations
- Use managed Redis for production
- Configure queue worker scaling
- Set up CDN for file delivery
- Monitor service quotas and limits

### Monitoring & Alerting
- Set up health check monitoring
- Configure error rate alerts
- Monitor queue depth and processing times
- Track service availability metrics

## 📞 Support

For issues with the integration system:

1. Check service health endpoints
2. Review application logs
3. Verify environment configuration
4. Test individual service connections

The integration system is designed to be resilient and self-healing, with comprehensive error handling and monitoring capabilities.