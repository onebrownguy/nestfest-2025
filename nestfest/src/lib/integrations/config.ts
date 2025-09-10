/**
 * Minimal Integration Configuration
 * Basic configuration for service integrations
 */

interface ServiceConfig {
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  retryAttempts: number;
  timeout: number;
}

interface EmailConfig extends ServiceConfig {
  provider: 'sendgrid' | 'ses' | 'smtp';
  apiKey?: string;
  fromEmail: string;
  fromName: string;
}

interface StorageConfig extends ServiceConfig {
  provider: 'supabase' | 's3' | 'gcs';
  bucket: string;
  maxFileSize: number;
}

interface QueueConfig extends ServiceConfig {
  provider: 'redis' | 'sqs' | 'memory';
  maxRetries: number;
}

interface WebhookConfig extends ServiceConfig {
  maxRetries: number;
  retryDelay: number;
}

export interface IntegrationConfig {
  email: EmailConfig;
  storage: StorageConfig;
  queue: QueueConfig;
  webhooks: WebhookConfig;
}

// Default configuration
export const defaultConfig: IntegrationConfig = {
  email: {
    enabled: true,
    environment: (process.env.NODE_ENV as any) || 'development',
    retryAttempts: 3,
    timeout: 30000,
    provider: 'sendgrid',
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.FROM_EMAIL || 'noreply@nestfest.com',
    fromName: process.env.FROM_NAME || 'NestFest'
  },
  storage: {
    enabled: true,
    environment: (process.env.NODE_ENV as any) || 'development',
    retryAttempts: 3,
    timeout: 30000,
    provider: 'supabase',
    bucket: process.env.SUPABASE_STORAGE_BUCKET || 'uploads',
    maxFileSize: 10 * 1024 * 1024 // 10MB
  },
  queue: {
    enabled: true,
    environment: (process.env.NODE_ENV as any) || 'development',
    retryAttempts: 5,
    timeout: 60000,
    provider: 'redis',
    maxRetries: 5
  },
  webhooks: {
    enabled: true,
    environment: (process.env.NODE_ENV as any) || 'development',
    retryAttempts: 3,
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000
  }
};

export const getConfig = (): IntegrationConfig => defaultConfig;

// Legacy export for backward compatibility
export const config = defaultConfig;