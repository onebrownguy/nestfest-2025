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
    const firstName = user.name.split(' ')[0];
    const loginUrl = additionalData.loginUrl || 'https://nestfest.app/login';
    
    return this.sendEmail(
      { email: user.email, name: user.name },
      {
        subject: 'Welcome to NestFest! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 300;">🎉 Welcome to NestFest!</h1>
              <p style="margin: 10px 0 0; opacity: 0.9; font-size: 18px;">Your Innovation Journey Begins</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #2c3e50; margin-top: 0;">Hello ${firstName}! 👋</h2>
              
              <p style="color: #34495e; line-height: 1.6; font-size: 16px;">
                Congratulations! Your NestFest account has been successfully created. You're now part of an exciting 
                community of innovators, developers, and creative minds ready to showcase their talents.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #3498db; margin-top: 0; font-size: 18px;">🚀 What's Next?</h3>
                <ul style="color: #34495e; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li><strong>Explore Competitions:</strong> Browse exciting challenges and events</li>
                  <li><strong>Submit Projects:</strong> Share your innovative solutions</li>
                  <li><strong>Connect & Collaborate:</strong> Network with fellow participants</li>
                  <li><strong>Learn & Grow:</strong> Participate in workshops and mentoring sessions</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" 
                   style="display: inline-block; background-color: #3498db; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 5px; font-weight: 500; font-size: 16px; margin: 0 10px 10px 0;">
                  Login to Your Account
                </a>
                <a href="${additionalData.dashboardUrl || 'https://nestfest.app/student'}" 
                   style="display: inline-block; background-color: #27ae60; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 5px; font-weight: 500; font-size: 16px; margin: 0 10px 10px 0;">
                  View Dashboard
                </a>
              </div>
              
              <div style="background: linear-gradient(135deg, #e8f4f8 0%, #f0f8e8 100%); padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #2c3e50; margin-top: 0; font-size: 16px;">💡 Getting Started Tips</h3>
                <p style="color: #34495e; margin: 0; line-height: 1.6;">
                  <strong>Complete your profile</strong> to make the most of NestFest. Add your skills, interests, 
                  and a brief bio to connect with like-minded participants and potential collaborators.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <div style="text-align: center;">
                <h3 style="color: #2c3e50; font-size: 18px;">Need Help?</h3>
                <p style="color: #7f8c8d; line-height: 1.6; margin: 10px 0;">
                  Our support team is here to help you succeed.<br>
                  Email us at <a href="mailto:support@edge-team.org" style="color: #3498db;">support@edge-team.org</a>
                </p>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 25px 0; text-align: center;">
                <p style="color: #7f8c8d; margin: 0; font-size: 12px;">
                  This email was sent to ${user.email}<br>
                  Welcome aboard the NestFest Platform!
                </p>
              </div>
            </div>
          </div>
        `,
        text: `Welcome to NestFest, ${firstName}!\n\nCongratulations! Your account has been successfully created. You're now part of an exciting community of innovators and developers.\n\nWhat's next?\n- Explore competitions and challenges\n- Submit your innovative projects\n- Connect with fellow participants\n- Participate in workshops and events\n\nLogin to your account: ${loginUrl}\n\nNeed help? Contact us at support@edge-team.org\n\n-- The NestFest Team`
      },
      {
        categories: ['welcome', 'onboarding']
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
    const firstName = user.name.split(' ')[0];
    
    return this.sendEmail(
      { email: user.email, name: user.name },
      {
        subject: 'Verify Your NestFest Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #27ae60 0%, #2c3e50 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 300;">🎯 NestFest</h1>
              <p style="margin: 10px 0 0; opacity: 0.9; font-size: 18px;">Email Verification Required</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #2c3e50; margin-top: 0;">Hello ${firstName}! 👋</h2>
              
              <p style="color: #34495e; line-height: 1.6; font-size: 16px;">
                Thanks for signing up for NestFest! We're excited to have you join our community of innovators and creators.
              </p>
              
              <p style="color: #34495e; line-height: 1.6;">
                To complete your registration and activate your account, please verify your email address by clicking the button below:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="display: inline-block; background-color: #27ae60; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 5px; font-weight: 500; font-size: 16px;">
                  ✅ Verify My Account
                </a>
              </div>
              
              <p style="color: #7f8c8d; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, you can copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #27ae60; word-break: break-all;">${verificationUrl}</a>
              </p>
              
              <div style="background-color: #e8f8f5; padding: 20px; border-radius: 5px; margin: 30px 0; border-left: 4px solid #27ae60;">
                <h3 style="color: #27ae60; margin-top: 0; font-size: 16px;">🚀 After Verification</h3>
                <ul style="color: #34495e; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Access your personalized dashboard</li>
                  <li>Browse and participate in competitions</li>
                  <li>Submit your innovative projects</li>
                  <li>Connect with the NestFest community</li>
                </ul>
              </div>
              
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f39c12;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>⏰ Time Sensitive:</strong> This verification link will expire in 24 hours for security purposes.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <div style="text-align: center;">
                <p style="color: #7f8c8d; line-height: 1.6; margin: 10px 0;">
                  Didn't sign up for NestFest? You can safely ignore this email.<br>
                  Need help? Contact us at <a href="mailto:support@edge-team.org" style="color: #3498db;">support@edge-team.org</a>
                </p>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 25px 0; text-align: center;">
                <p style="color: #7f8c8d; margin: 0; font-size: 12px;">
                  This verification email was sent to ${user.email}<br>
                  NestFest Platform - Where Innovation Meets Opportunity
                </p>
              </div>
            </div>
          </div>
        `,
        text: `Hello ${firstName}!\n\nThanks for signing up for NestFest! To complete your registration, please verify your email address by clicking this link:\n\n${verificationUrl}\n\nThis link will expire in 24 hours for security.\n\nAfter verification, you'll be able to:\n- Access your dashboard\n- Participate in competitions\n- Submit projects\n- Connect with the community\n\nNeed help? Contact support@edge-team.org\n\n-- The NestFest Team`
      },
      {
        categories: ['email-verification', 'authentication']
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
    const firstName = user.name.split(' ')[0];
    
    return this.sendEmail(
      { email: user.email, name: user.name },
      {
        subject: 'Reset Your NestFest Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 300;">NestFest</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Password Reset Request</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #2c3e50; margin-top: 0;">Hello ${firstName}!</h2>
              
              <p style="color: #34495e; line-height: 1.6;">
                We received a request to reset the password for your NestFest account. If you made this request, 
                click the button below to reset your password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; background-color: #3498db; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; font-weight: 500; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #7f8c8d; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, you can copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #3498db; word-break: break-all;">${resetUrl}</a>
              </p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 30px 0;">
                <h3 style="color: #e74c3c; margin-top: 0; font-size: 16px;">⚠️ Security Notice</h3>
                <ul style="color: #34495e; margin: 0; padding-left: 20px;">
                  <li>This link will expire in 1 hour for security</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Your password won't be changed unless you click the link above</li>
                </ul>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
                This email was sent by NestFest Platform<br>
                If you have questions, contact support at support@edge-team.org
              </p>
            </div>
          </div>
        `,
        text: `Hello ${firstName}!\n\nWe received a request to reset your NestFest password. Click the link below to reset it:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, please ignore this email.\n\n-- NestFest Team`
      },
      {
        categories: ['password-reset', 'authentication']
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