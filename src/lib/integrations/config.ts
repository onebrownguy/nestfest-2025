/**
 * External Service Configuration
 * Centralized configuration for all external integrations
 */

interface ServiceConfig {
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  retryAttempts: number;
  timeout: number;
  rateLimit?: {
    requests: number;
    window: number;
  };
}

interface SupabaseStorageConfig extends ServiceConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  bucket: string;
  cdnUrl?: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
}

interface SendGridConfig extends ServiceConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  webhookSecret: string;
  templates: {
    welcome: string;
    emailVerification: string;
    passwordReset: string;
    competitionNotification: string;
    reviewAssignment: string;
    votingReminder: string;
    resultsAnnouncement: string;
  };
}

interface TwilioConfig extends ServiceConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  verifyServiceSid: string;
  webhookSecret: string;
}

interface OpenAIConfig extends ServiceConfig {
  apiKey: string;
  organizationId?: string;
  models: {
    textGeneration: string;
    contentModeration: string;
    embedding: string;
  };
}

interface SentryConfig extends ServiceConfig {
  dsn: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
  environment: string;
}

interface RedisConfig extends ServiceConfig {
  url: string;
  password?: string;
  db: number;
  keyPrefix: string;
}

export interface IntegrationConfig {
  supabaseStorage: SupabaseStorageConfig;
  sendgrid: SendGridConfig;
  twilio: TwilioConfig;
  openai: OpenAIConfig;
  sentry: SentryConfig;
  redis: RedisConfig;
  webhooks: {
    baseUrl: string;
    secret: string;
    endpoints: {
      sendgrid: string;
      twilio: string;
      stripe: string;
    };
  };
}

const getConfig = (): IntegrationConfig => ({
  supabaseStorage: {
    enabled: true,
    environment: (process.env.NODE_ENV as any) || 'development',
    retryAttempts: 3,
    timeout: 30000,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_KEY!,
    bucket: process.env.SUPABASE_STORAGE_BUCKET || 'nestfest-files',
    cdnUrl: process.env.SUPABASE_CDN_URL,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB
    allowedMimeTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/quicktime', 'video/x-msvideo',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv'
    ]
  },

  sendgrid: {
    enabled: !!process.env.SENDGRID_API_KEY,
    environment: (process.env.NODE_ENV as any) || 'development',
    retryAttempts: 3,
    timeout: 10000,
    apiKey: process.env.SENDGRID_API_KEY!,
    fromEmail: process.env.SENDGRID_FROM_EMAIL!,
    fromName: process.env.SENDGRID_FROM_NAME || 'NestFest',
    webhookSecret: process.env.SENDGRID_WEBHOOK_SECRET!,
    rateLimit: {
      requests: 100,
      window: 60000 // 1 minute
    },
    templates: {
      welcome: process.env.SENDGRID_TEMPLATE_WELCOME!,
      emailVerification: process.env.SENDGRID_TEMPLATE_EMAIL_VERIFICATION!,
      passwordReset: process.env.SENDGRID_TEMPLATE_PASSWORD_RESET!,
      competitionNotification: process.env.SENDGRID_TEMPLATE_COMPETITION_NOTIFICATION!,
      reviewAssignment: process.env.SENDGRID_TEMPLATE_REVIEW_ASSIGNMENT!,
      votingReminder: process.env.SENDGRID_TEMPLATE_VOTING_REMINDER!,
      resultsAnnouncement: process.env.SENDGRID_TEMPLATE_RESULTS_ANNOUNCEMENT!
    }
  },

  twilio: {
    enabled: !!process.env.TWILIO_ACCOUNT_SID,
    environment: (process.env.NODE_ENV as any) || 'development',
    retryAttempts: 3,
    timeout: 10000,
    accountSid: process.env.TWILIO_ACCOUNT_SID!,
    authToken: process.env.TWILIO_AUTH_TOKEN!,
    fromNumber: process.env.TWILIO_FROM_NUMBER!,
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID!,
    webhookSecret: process.env.TWILIO_WEBHOOK_SECRET!,
    rateLimit: {
      requests: 50,
      window: 60000
    }
  },

  openai: {
    enabled: !!process.env.OPENAI_API_KEY,
    environment: (process.env.NODE_ENV as any) || 'development',
    retryAttempts: 3,
    timeout: 60000,
    apiKey: process.env.OPENAI_API_KEY!,
    organizationId: process.env.OPENAI_ORGANIZATION_ID,
    models: {
      textGeneration: 'gpt-4o-mini',
      contentModeration: 'text-moderation-latest',
      embedding: 'text-embedding-3-small'
    },
    rateLimit: {
      requests: 60,
      window: 60000
    }
  },

  sentry: {
    enabled: !!process.env.SENTRY_DSN,
    environment: (process.env.NODE_ENV as any) || 'development',
    retryAttempts: 1,
    timeout: 5000,
    dsn: process.env.SENTRY_DSN!,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
    environment: process.env.NODE_ENV || 'development'
  },

  redis: {
    enabled: !!process.env.REDIS_URL,
    environment: (process.env.NODE_ENV as any) || 'development',
    retryAttempts: 5,
    timeout: 5000,
    url: process.env.REDIS_URL!,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'nestfest:'
  },

  webhooks: {
    baseUrl: process.env.WEBHOOK_BASE_URL || 'http://localhost:3000',
    secret: process.env.WEBHOOK_SECRET || 'your-webhook-secret',
    endpoints: {
      sendgrid: '/api/webhooks/sendgrid',
      twilio: '/api/webhooks/twilio',
      stripe: '/api/webhooks/stripe'
    }
  }
});

export const config = getConfig();
export default config;

// Environment validation
export const validateConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'REDIS_URL'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Conditional validations
  if (config.sendgrid.enabled && !process.env.SENDGRID_API_KEY) {
    errors.push('SendGrid enabled but SENDGRID_API_KEY not provided');
  }

  if (config.twilio.enabled && !process.env.TWILIO_ACCOUNT_SID) {
    errors.push('Twilio enabled but TWILIO_ACCOUNT_SID not provided');
  }

  if (config.openai.enabled && !process.env.OPENAI_API_KEY) {
    errors.push('OpenAI enabled but OPENAI_API_KEY not provided');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};