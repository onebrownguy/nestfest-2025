/**
 * Email Service Integration
 * Handles transactional emails, templates, and bulk sending using SendGrid
 */

import sgMail from '@sendgrid/mail';
import { BaseService, ServiceResponse } from '../base-service';
import { config } from '../config';
import crypto from 'crypto';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailContent {
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
}

export interface EmailOptions {
  from?: EmailRecipient;
  replyTo?: string;
  categories?: string[];
  customArgs?: Record<string, string>;
  sendAt?: number;
  batchId?: string;
  trackingSettings?: {
    clickTracking?: boolean;
    openTracking?: boolean;
    subscriptionTracking?: boolean;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  versions: {
    active: string;
    html: string;
    plain: string;
  };
}

export interface BulkEmailRequest {
  to: EmailRecipient[];
  content: EmailContent;
  options?: EmailOptions;
  personalizations?: Record<string, any>[];
}

export interface EmailWebhookEvent {
  email: string;
  timestamp: number;
  event: 'processed' | 'delivered' | 'open' | 'click' | 'bounce' | 'dropped' | 'spamreport' | 'unsubscribe' | 'group_unsubscribe' | 'group_resubscribe';
  sg_event_id?: string;
  sg_message_id?: string;
  category?: string[];
  url?: string;
  reason?: string;
  status?: string;
}

class EmailService extends BaseService {
  private templates: Map<string, EmailTemplate> = new Map();

  constructor() {
    super('email', config.sendgrid);
    
    if (config.sendgrid.enabled) {
      sgMail.setApiKey(config.sendgrid.apiKey);
    }
  }

  async initialize(): Promise<void> {
    if (!config.sendgrid.enabled) {
      console.warn('SendGrid is not enabled');
      return;
    }

    try {
      // Test the API key by making a simple request
      await sgMail.send({
        to: 'test@example.com',
        from: config.sendgrid.fromEmail,
        subject: 'Test',
        text: 'Test',
        mailSettings: {
          sandboxMode: { enable: true }
        }
      });
    } catch (error: any) {
      if (error.code !== 400) { // 400 is expected for sandbox mode
        throw new Error(`Failed to initialize SendGrid: ${error.message}`);
      }
    }

    // Load email templates
    await this.loadEmailTemplates();
  }

  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.sendgrid.apiKey) {
      errors.push('SendGrid API key is required');
    }
    
    if (!config.sendgrid.fromEmail) {
      errors.push('From email address is required');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Send single email
   */
  async sendEmail(
    to: EmailRecipient | EmailRecipient[],
    content: EmailContent,
    options: EmailOptions = {}
  ): Promise<ServiceResponse<{ messageId: string }>> {
    if (!config.sendgrid.enabled) {
      throw new Error('SendGrid is not enabled');
    }

    return this.executeWithRetry(async () => {
      const recipients = Array.isArray(to) ? to : [to];
      
      const msg: any = {
        to: recipients,
        from: options.from || {
          email: config.sendgrid.fromEmail,
          name: config.sendgrid.fromName
        },
        subject: content.subject,
        categories: options.categories || ['transactional'],
        customArgs: options.customArgs || {},
        trackingSettings: {
          clickTracking: {
            enable: options.trackingSettings?.clickTracking !== false
          },
          openTracking: {
            enable: options.trackingSettings?.openTracking !== false
          },
          subscriptionTracking: {
            enable: options.trackingSettings?.subscriptionTracking !== false
          }
        }
      };

      // Add reply-to if specified
      if (options.replyTo) {
        msg.replyTo = options.replyTo;
      }

      // Add send time if specified
      if (options.sendAt) {
        msg.sendAt = options.sendAt;
      }

      // Use template or content
      if (content.templateId) {
        msg.templateId = content.templateId;
        if (content.templateData) {
          msg.dynamicTemplateData = content.templateData;
        }
      } else {
        if (content.html) {
          msg.html = content.html;
        }
        if (content.text) {
          msg.text = content.text;
        }
      }

      const [response] = await sgMail.send(msg);
      
      return {
        messageId: response.headers['x-message-id'] || 'unknown'
      };
    });
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(
    requests: BulkEmailRequest[]
  ): Promise<ServiceResponse<{ messageIds: string[]; failed: any[] }>> {
    if (!config.sendgrid.enabled) {
      throw new Error('SendGrid is not enabled');
    }

    return this.executeWithRetry(async () => {
      const messages: any[] = [];
      
      for (const request of requests) {
        const recipients = request.to;
        
        for (const recipient of recipients) {
          const msg: any = {
            to: recipient,
            from: request.options?.from || {
              email: config.sendgrid.fromEmail,
              name: config.sendgrid.fromName
            },
            subject: request.content.subject,
            categories: request.options?.categories || ['bulk'],
            customArgs: request.options?.customArgs || {},
            trackingSettings: {
              clickTracking: {
                enable: request.options?.trackingSettings?.clickTracking !== false
              },
              openTracking: {
                enable: request.options?.trackingSettings?.openTracking !== false
              }
            }
          };

          // Use template or content
          if (request.content.templateId) {
            msg.templateId = request.content.templateId;
            if (request.content.templateData) {
              msg.dynamicTemplateData = request.content.templateData;
            }
          } else {
            if (request.content.html) {
              msg.html = request.content.html;
            }
            if (request.content.text) {
              msg.text = request.content.text;
            }
          }

          messages.push(msg);
        }
      }

      // Send in batches to respect rate limits
      const batchSize = 100;
      const messageIds: string[] = [];
      const failed: any[] = [];

      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        
        try {
          const responses = await sgMail.send(batch);
          
          for (const response of responses) {
            messageIds.push(response.headers['x-message-id'] || 'unknown');
          }
        } catch (error: any) {
          if (error.response?.body?.errors) {
            failed.push(...error.response.body.errors);
          } else {
            failed.push({ error: error.message, batch: i / batchSize });
          }
        }

        // Rate limiting delay
        if (i + batchSize < messages.length) {
          await this.sleep(100);
        }
      }

      return { messageIds, failed };
    });
  }

  /**
   * Send template-based email
   */
  async sendTemplateEmail(
    templateKey: keyof typeof config.sendgrid.templates,
    to: EmailRecipient | EmailRecipient[],
    templateData: Record<string, any> = {},
    options: EmailOptions = {}
  ): Promise<ServiceResponse<{ messageId: string }>> {
    const templateId = config.sendgrid.templates[templateKey];
    
    if (!templateId) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    return this.sendEmail(
      to,
      {
        subject: '', // Subject comes from template
        templateId,
        templateData
      },
      options
    );
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    user: { email: string; name: string },
    additionalData: Record<string, any> = {}
  ): Promise<ServiceResponse<{ messageId: string }>> {
    return this.sendTemplateEmail(
      'welcome',
      { email: user.email, name: user.name },
      {
        firstName: user.name.split(' ')[0],
        fullName: user.name,
        ...additionalData
      }
    );
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(
    user: { email: string; name: string },
    verificationToken: string,
    baseUrl: string
  ): Promise<ServiceResponse<{ messageId: string }>> {
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`;
    
    return this.sendTemplateEmail(
      'emailVerification',
      { email: user.email, name: user.name },
      {
        firstName: user.name.split(' ')[0],
        verificationUrl,
        verificationToken
      }
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    user: { email: string; name: string },
    resetToken: string,
    baseUrl: string
  ): Promise<ServiceResponse<{ messageId: string }>> {
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
    
    return this.sendTemplateEmail(
      'passwordReset',
      { email: user.email, name: user.name },
      {
        firstName: user.name.split(' ')[0],
        resetUrl,
        resetToken
      }
    );
  }

  /**
   * Send competition notification
   */
  async sendCompetitionNotification(
    recipients: EmailRecipient[],
    competition: {
      name: string;
      description: string;
      submissionDeadline: string;
      eventDate: string;
    },
    type: 'opening' | 'deadline_reminder' | 'results'
  ): Promise<ServiceResponse<{ messageIds: string[] }>> {
    const result = await this.sendBulkEmails([{
      to: recipients,
      content: {
        templateId: config.sendgrid.templates.competitionNotification,
        templateData: {
          competitionName: competition.name,
          competitionDescription: competition.description,
          submissionDeadline: competition.submissionDeadline,
          eventDate: competition.eventDate,
          notificationType: type
        },
        subject: `NestFest: ${competition.name} - ${type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`
      },
      options: {
        categories: ['competition', type]
      }
    }]);

    return {
      success: result.success,
      data: result.success ? { messageIds: result.data!.messageIds } : undefined,
      error: result.error,
      metadata: result.metadata
    };
  }

  /**
   * Process webhook events
   */
  processWebhookEvents(events: EmailWebhookEvent[]): EmailWebhookEvent[] {
    return events.map(event => ({
      ...event,
      timestamp: event.timestamp * 1000 // Convert to milliseconds
    }));
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    timestamp: string
  ): boolean {
    try {
      const timestampSignature = `${timestamp}${payload}`;
      const expectedSignature = crypto
        .createHmac('sha256', config.sendgrid.webhookSecret)
        .update(timestampSignature, 'utf8')
        .digest('base64');

      return signature === expectedSignature;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStatistics(
    startDate: string,
    endDate?: string
  ): Promise<ServiceResponse<any>> {
    return this.executeWithRetry(async () => {
      // This would typically call SendGrid's Stats API
      // For now, return mock data
      return {
        delivered: 0,
        opens: 0,
        clicks: 0,
        bounces: 0,
        blocks: 0,
        spam_reports: 0,
        unsubscribes: 0
      };
    });
  }

  /**
   * Load email templates from SendGrid
   */
  private async loadEmailTemplates(): Promise<void> {
    try {
      // This would fetch templates from SendGrid API
      // For now, we'll use the configured template IDs
      const templateConfigs = config.sendgrid.templates;
      
      for (const [key, templateId] of Object.entries(templateConfigs)) {
        this.templates.set(key, {
          id: templateId,
          name: key,
          subject: `Template ${key}`,
          versions: {
            active: templateId,
            html: '',
            plain: ''
          }
        });
      }
    } catch (error) {
      console.error('Failed to load email templates:', error);
    }
  }

  /**
   * Create unsubscribe link
   */
  createUnsubscribeLink(userId: string, email: string): string {
    const token = crypto
      .createHmac('sha256', config.webhooks.secret)
      .update(`${userId}:${email}`)
      .digest('hex');

    return `${config.webhooks.baseUrl}/unsubscribe?token=${token}&email=${encodeURIComponent(email)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const emailService = new EmailService();
export default emailService;