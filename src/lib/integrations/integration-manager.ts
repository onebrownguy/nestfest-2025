/**
 * Integration Manager
 * Centralized management of all external service integrations
 */

import { storageService } from './storage/storage-service';
import { emailService } from './email/email-service';
import { queueService } from './queue/queue-service';
import { webhookService } from './webhooks/webhook-service';
import { config, validateConfig } from './config';

export interface ServiceHealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  enabled: boolean;
  lastCheck: string;
  details?: any;
}

export interface IntegrationStatus {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: ServiceHealthStatus[];
  configuration: {
    valid: boolean;
    errors: string[];
  };
  timestamp: string;
}

class IntegrationManager {
  private services = {
    storage: storageService,
    email: emailService,
    queue: queueService,
    webhook: webhookService
  };

  private initialized = false;

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('Integration manager already initialized');
      return;
    }

    console.log('Initializing integration manager...');

    // Validate configuration first
    const configValidation = validateConfig();
    if (!configValidation.valid) {
      console.error('Configuration validation failed:', configValidation.errors);
      throw new Error(`Configuration validation failed: ${configValidation.errors.join(', ')}`);
    }

    // Initialize services in order of dependency
    const initPromises = [];

    // Storage service (no dependencies)
    if (config.supabaseStorage.enabled) {
      initPromises.push(
        this.services.storage.initialize().catch(error => {
          console.error('Storage service initialization failed:', error);
          return { service: 'storage', error };
        })
      );
    }

    // Queue service (requires Redis)
    if (config.redis.enabled) {
      initPromises.push(
        this.services.queue.initialize().catch(error => {
          console.error('Queue service initialization failed:', error);
          return { service: 'queue', error };
        })
      );
    }

    // Email service (no dependencies)
    if (config.sendgrid.enabled) {
      initPromises.push(
        this.services.email.initialize().catch(error => {
          console.error('Email service initialization failed:', error);
          return { service: 'email', error };
        })
      );
    }

    // Webhook service (no dependencies)
    initPromises.push(
      this.services.webhook.initialize().catch(error => {
        console.error('Webhook service initialization failed:', error);
        return { service: 'webhook', error };
      })
    );

    const results = await Promise.allSettled(initPromises);
    const failures = results
      .filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && result.value?.error))
      .map(result => {
        if (result.status === 'rejected') {
          return result.reason;
        }
        return (result as any).value;
      });

    if (failures.length > 0) {
      console.warn('Some services failed to initialize:', failures);
    }

    this.initialized = true;
    console.log('Integration manager initialized successfully');
  }

  /**
   * Get health status of all services
   */
  async getHealthStatus(): Promise<IntegrationStatus> {
    const services: ServiceHealthStatus[] = [];
    const timestamp = new Date().toISOString();

    // Check each service
    for (const [serviceName, service] of Object.entries(this.services)) {
      try {
        const health = service.getHealthStatus();
        const validation = service.validateConfiguration();

        const status: ServiceHealthStatus = {
          service: serviceName,
          status: health.enabled && validation.valid ? 'healthy' : 'unhealthy',
          enabled: health.enabled,
          lastCheck: timestamp,
          details: {
            health,
            validation
          }
        };

        // Check circuit breaker state for degraded status
        if (health.circuitBreakerState === 'OPEN') {
          status.status = 'degraded';
        }

        services.push(status);
      } catch (error) {
        services.push({
          service: serviceName,
          status: 'unhealthy',
          enabled: false,
          lastCheck: timestamp,
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    // Determine overall status
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const enabledCount = services.filter(s => s.enabled).length;
    let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (healthyCount === 0) {
      overall = 'unhealthy';
    } else if (healthyCount < enabledCount) {
      overall = 'degraded';
    }

    return {
      overall,
      services,
      configuration: validateConfig(),
      timestamp
    };
  }

  /**
   * Complete customer lifecycle automation
   */
  async processNewCustomer(customerData: {
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    phone?: string;
    university?: string;
    program?: string;
  }): Promise<{ success: boolean; results: any; errors: any[] }> {
    const results: any = {};
    const errors: any[] = [];

    try {
      // 1. Send welcome email
      if (config.sendgrid.enabled) {
        try {
          const emailResult = await emailService.sendWelcomeEmail(
            { email: customerData.email, name: customerData.name },
            {
              university: customerData.university,
              program: customerData.program
            }
          );
          results.welcomeEmail = emailResult.data;
        } catch (error) {
          errors.push({ service: 'email', action: 'welcome', error });
        }
      }

      // 2. Add analytics tracking
      if (config.redis.enabled) {
        try {
          const analyticsResult = await queueService.addAnalyticsJob({
            type: 'user_event',
            eventName: 'user_registered',
            eventData: {
              userId: customerData.id,
              email: customerData.email,
              university: customerData.university,
              program: customerData.program
            },
            userId: customerData.id
          });
          results.analytics = analyticsResult.data;
        } catch (error) {
          errors.push({ service: 'queue', action: 'analytics', error });
        }
      }

      // 3. Broadcast webhook event
      try {
        const webhookResult = await webhookService.broadcastEvent('user.registered', {
          userId: customerData.id,
          email: customerData.email,
          name: customerData.name,
          registeredAt: new Date().toISOString()
        });
        results.webhook = webhookResult.data;
      } catch (error) {
        errors.push({ service: 'webhook', action: 'broadcast', error });
      }

      return {
        success: errors.length === 0,
        results,
        errors
      };
    } catch (error) {
      errors.push({ service: 'integration-manager', action: 'process-customer', error });
      return { success: false, results, errors };
    }
  }

  /**
   * Competition event processing
   */
  async processCompetitionEvent(
    eventType: 'competition.created' | 'competition.opened' | 'competition.deadline_approaching' | 'competition.closed' | 'competition.results_published',
    competitionData: any,
    participants?: { email: string; name: string }[]
  ): Promise<{ success: boolean; results: any; errors: any[] }> {
    const results: any = {};
    const errors: any[] = [];

    try {
      // 1. Send notifications to participants
      if (participants && participants.length > 0 && config.sendgrid.enabled) {
        try {
          const emailResult = await emailService.sendCompetitionNotification(
            participants,
            {
              name: competitionData.name,
              description: competitionData.description,
              submissionDeadline: competitionData.submissionDeadline,
              eventDate: competitionData.eventDate
            },
            this.mapEventTypeToEmailType(eventType)
          );
          results.notifications = emailResult.data;
        } catch (error) {
          errors.push({ service: 'email', action: 'competition-notification', error });
        }
      }

      // 2. Log analytics event
      if (config.redis.enabled) {
        try {
          const analyticsResult = await queueService.addAnalyticsJob({
            type: 'competition_event',
            eventName: eventType,
            eventData: {
              competitionId: competitionData.id,
              competitionName: competitionData.name,
              participantCount: participants?.length || 0,
              ...competitionData
            }
          });
          results.analytics = analyticsResult.data;
        } catch (error) {
          errors.push({ service: 'queue', action: 'analytics', error });
        }
      }

      // 3. Broadcast webhook event
      try {
        const webhookResult = await webhookService.broadcastEvent(eventType, {
          competition: competitionData,
          participants: participants?.length || 0,
          timestamp: new Date().toISOString()
        });
        results.webhook = webhookResult.data;
      } catch (error) {
        errors.push({ service: 'webhook', action: 'broadcast', error });
      }

      return {
        success: errors.length === 0,
        results,
        errors
      };
    } catch (error) {
      errors.push({ service: 'integration-manager', action: 'process-competition-event', error });
      return { success: false, results, errors };
    }
  }

  /**
   * File upload and processing workflow
   */
  async processFileUpload(
    file: File | Buffer,
    userId: string,
    options: {
      folder?: string;
      generateThumbnail?: boolean;
      quality?: number;
      resizeOptions?: any;
    } = {}
  ): Promise<{ success: boolean; results: any; errors: any[] }> {
    const results: any = {};
    const errors: any[] = [];

    try {
      // 1. Upload file to storage
      if (config.supabaseStorage.enabled) {
        try {
          const uploadResult = await storageService.uploadFile(file, options);
          results.upload = uploadResult.data;

          // 2. Queue additional processing if needed
          if (config.redis.enabled && uploadResult.data?.original) {
            try {
              const processingResult = await queueService.addFileProcessingJob({
                type: 'file_validation',
                filePath: uploadResult.data.original.url,
                originalFilename: uploadResult.data.original.originalFilename,
                mimeType: uploadResult.data.original.mimeType,
                userId
              });
              results.processing = processingResult.data;
            } catch (error) {
              errors.push({ service: 'queue', action: 'file-processing', error });
            }
          }
        } catch (error) {
          errors.push({ service: 'storage', action: 'upload', error });
        }
      }

      // 3. Log analytics
      if (config.redis.enabled) {
        try {
          const analyticsResult = await queueService.addAnalyticsJob({
            type: 'user_event',
            eventName: 'file_uploaded',
            eventData: {
              userId,
              filename: results.upload?.original?.filename,
              mimeType: results.upload?.original?.mimeType,
              size: results.upload?.original?.size
            },
            userId
          });
          results.analytics = analyticsResult.data;
        } catch (error) {
          errors.push({ service: 'queue', action: 'analytics', error });
        }
      }

      return {
        success: errors.length === 0,
        results,
        errors
      };
    } catch (error) {
      errors.push({ service: 'integration-manager', action: 'process-file-upload', error });
      return { success: false, results, errors };
    }
  }

  /**
   * Graceful shutdown of all services
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down integration manager...');

    try {
      // Shutdown queue service first (stops processing jobs)
      if (this.services.queue) {
        await this.services.queue.shutdown();
      }

      console.log('Integration manager shutdown complete');
    } catch (error) {
      console.error('Error during integration manager shutdown:', error);
    }
  }

  /**
   * Utility methods
   */
  private mapEventTypeToEmailType(eventType: string): 'opening' | 'deadline_reminder' | 'results' {
    switch (eventType) {
      case 'competition.opened':
        return 'opening';
      case 'competition.deadline_approaching':
        return 'deadline_reminder';
      case 'competition.results_published':
        return 'results';
      default:
        return 'opening';
    }
  }

  /**
   * Get service instances (for direct access if needed)
   */
  getServices() {
    return this.services;
  }

  /**
   * Check if integration manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export const integrationManager = new IntegrationManager();
export default integrationManager;