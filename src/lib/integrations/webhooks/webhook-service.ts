/**
 * Webhook Service
 * Handles incoming and outgoing webhooks with signature verification and retry logic
 */

import crypto from 'crypto';
import { BaseService, ServiceResponse } from '../base-service';
import { config } from '../config';

export interface WebhookEvent {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  data: any;
  signature?: string;
  headers?: Record<string, string>;
}

export interface OutgoingWebhook {
  id?: string;
  url: string;
  event: string;
  data: any;
  headers?: Record<string, string>;
  retryCount?: number;
  maxRetries?: number;
  timeout?: number;
  secret?: string;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  headers?: Record<string, string>;
  createdAt: string;
  userId?: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
  responseStatus?: number;
  responseBody?: string;
  error?: string;
  createdAt: string;
}

class WebhookService extends BaseService {
  private subscriptions: Map<string, WebhookSubscription> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();

  constructor() {
    super('webhook', {
      enabled: true,
      environment: (process.env.NODE_ENV as any) || 'development',
      retryAttempts: 3,
      timeout: 30000
    });
  }

  async initialize(): Promise<void> {
    console.log('Webhook service initialized');
  }

  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.webhooks.secret) {
      errors.push('Webhook secret is required');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Verify incoming webhook signature
   */
  verifyIncomingWebhook(
    payload: string,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha1' = 'sha256'
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac(algorithm, secret)
        .update(payload, 'utf8')
        .digest('hex');

      // Handle different signature formats
      const cleanSignature = signature.replace(/^(sha256=|sha1=)/, '');
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(cleanSignature, 'hex')
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process incoming webhook
   */
  async processIncomingWebhook(
    source: string,
    payload: string,
    signature: string,
    headers: Record<string, string> = {}
  ): Promise<ServiceResponse<WebhookEvent>> {
    return this.executeWithRetry(async () => {
      // Verify signature if secret is configured
      if (config.webhooks.secret) {
        const isValid = this.verifyIncomingWebhook(payload, signature, config.webhooks.secret);
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      // Parse payload
      let data: any;
      try {
        data = JSON.parse(payload);
      } catch (error) {
        throw new Error('Invalid JSON payload');
      }

      // Create webhook event
      const event: WebhookEvent = {
        id: crypto.randomUUID(),
        type: this.extractEventType(source, data, headers),
        source,
        timestamp: new Date().toISOString(),
        data,
        signature,
        headers
      };

      // Route event to appropriate handler
      await this.routeWebhookEvent(event);

      return event;
    });
  }

  /**
   * Send outgoing webhook
   */
  async sendOutgoingWebhook(webhook: OutgoingWebhook): Promise<ServiceResponse<WebhookDelivery>> {
    return this.executeWithRetry(async () => {
      const webhookId = webhook.id || crypto.randomUUID();
      const delivery: WebhookDelivery = {
        id: crypto.randomUUID(),
        webhookId,
        event: webhook.event,
        status: 'pending',
        attempts: 0,
        maxAttempts: webhook.maxRetries || 3,
        createdAt: new Date().toISOString()
      };

      this.deliveries.set(delivery.id, delivery);

      try {
        const result = await this.deliverWebhook(webhook, delivery);
        return result;
      } catch (error) {
        delivery.status = 'failed';
        delivery.error = error instanceof Error ? error.message : 'Unknown error';
        this.deliveries.set(delivery.id, delivery);
        throw error;
      }
    });
  }

  /**
   * Deliver webhook with retry logic
   */
  private async deliverWebhook(
    webhook: OutgoingWebhook,
    delivery: WebhookDelivery
  ): Promise<WebhookDelivery> {
    const maxAttempts = delivery.maxAttempts;
    
    while (delivery.attempts < maxAttempts) {
      delivery.attempts++;
      delivery.lastAttemptAt = new Date().toISOString();
      delivery.status = delivery.attempts === 1 ? 'pending' : 'retrying';

      try {
        const payload = JSON.stringify({
          id: delivery.id,
          event: webhook.event,
          data: webhook.data,
          timestamp: delivery.createdAt
        });

        // Generate signature if secret is provided
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'NestFest-Webhook/1.0',
          ...webhook.headers
        };

        if (webhook.secret) {
          const signature = crypto
            .createHmac('sha256', webhook.secret)
            .update(payload, 'utf8')
            .digest('hex');
          headers['X-NestFest-Signature'] = `sha256=${signature}`;
        }

        // Send webhook
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: payload,
          signal: AbortSignal.timeout(webhook.timeout || 30000)
        });

        delivery.responseStatus = response.status;
        
        if (response.ok) {
          delivery.status = 'delivered';
          delivery.responseBody = await response.text();
          this.deliveries.set(delivery.id, delivery);
          return delivery;
        } else {
          const errorBody = await response.text();
          delivery.responseBody = errorBody;
          
          // Don't retry for client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            delivery.status = 'failed';
            delivery.error = `Client error: ${response.status}`;
            break;
          }
          
          // Retry for server errors (5xx)
          if (delivery.attempts < maxAttempts) {
            const delay = this.calculateRetryDelay(delivery.attempts);
            delivery.nextAttemptAt = new Date(Date.now() + delay).toISOString();
            await this.sleep(delay);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        delivery.error = errorMessage;
        
        // Don't retry for certain errors
        if (errorMessage.includes('timeout') || errorMessage.includes('abort')) {
          if (delivery.attempts < maxAttempts) {
            const delay = this.calculateRetryDelay(delivery.attempts);
            delivery.nextAttemptAt = new Date(Date.now() + delay).toISOString();
            await this.sleep(delay);
          }
        } else {
          // Network errors, retry
          if (delivery.attempts < maxAttempts) {
            const delay = this.calculateRetryDelay(delivery.attempts);
            delivery.nextAttemptAt = new Date(Date.now() + delay).toISOString();
            await this.sleep(delay);
          }
        }
      }

      this.deliveries.set(delivery.id, delivery);
    }

    if (delivery.status !== 'delivered') {
      delivery.status = 'failed';
      this.deliveries.set(delivery.id, delivery);
      throw new Error(`Webhook delivery failed after ${maxAttempts} attempts`);
    }

    return delivery;
  }

  /**
   * Create webhook subscription
   */
  async createWebhookSubscription(
    url: string,
    events: string[],
    userId?: string,
    headers?: Record<string, string>
  ): Promise<ServiceResponse<WebhookSubscription>> {
    return this.executeWithRetry(async () => {
      // Validate URL
      try {
        new URL(url);
      } catch (error) {
        throw new Error('Invalid webhook URL');
      }

      const subscription: WebhookSubscription = {
        id: crypto.randomUUID(),
        url,
        events,
        active: true,
        secret: this.generateWebhookSecret(),
        headers,
        createdAt: new Date().toISOString(),
        userId
      };

      this.subscriptions.set(subscription.id, subscription);
      
      return subscription;
    });
  }

  /**
   * Update webhook subscription
   */
  async updateWebhookSubscription(
    subscriptionId: string,
    updates: Partial<Pick<WebhookSubscription, 'url' | 'events' | 'active' | 'headers'>>
  ): Promise<ServiceResponse<WebhookSubscription>> {
    return this.executeWithRetry(async () => {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error('Webhook subscription not found');
      }

      // Validate URL if provided
      if (updates.url) {
        try {
          new URL(updates.url);
        } catch (error) {
          throw new Error('Invalid webhook URL');
        }
      }

      const updatedSubscription = { ...subscription, ...updates };
      this.subscriptions.set(subscriptionId, updatedSubscription);
      
      return updatedSubscription;
    });
  }

  /**
   * Delete webhook subscription
   */
  async deleteWebhookSubscription(subscriptionId: string): Promise<ServiceResponse<boolean>> {
    return this.executeWithRetry(async () => {
      const existed = this.subscriptions.delete(subscriptionId);
      if (!existed) {
        throw new Error('Webhook subscription not found');
      }
      return true;
    });
  }

  /**
   * Get webhook subscriptions
   */
  async getWebhookSubscriptions(userId?: string): Promise<ServiceResponse<WebhookSubscription[]>> {
    return this.executeWithRetry(async () => {
      const subscriptions = Array.from(this.subscriptions.values());
      
      if (userId) {
        return subscriptions.filter(sub => sub.userId === userId);
      }
      
      return subscriptions;
    });
  }

  /**
   * Get webhook deliveries
   */
  async getWebhookDeliveries(
    webhookId?: string,
    limit: number = 100
  ): Promise<ServiceResponse<WebhookDelivery[]>> {
    return this.executeWithRetry(async () => {
      let deliveries = Array.from(this.deliveries.values());
      
      if (webhookId) {
        deliveries = deliveries.filter(delivery => delivery.webhookId === webhookId);
      }
      
      return deliveries
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    });
  }

  /**
   * Broadcast event to all matching subscriptions
   */
  async broadcastEvent(eventType: string, data: any): Promise<ServiceResponse<{ sent: number; failed: number }>> {
    return this.executeWithRetry(async () => {
      const matchingSubscriptions = Array.from(this.subscriptions.values())
        .filter(sub => sub.active && sub.events.includes(eventType));

      let sent = 0;
      let failed = 0;

      const promises = matchingSubscriptions.map(async (subscription) => {
        try {
          await this.sendOutgoingWebhook({
            url: subscription.url,
            event: eventType,
            data,
            headers: subscription.headers,
            secret: subscription.secret,
            maxRetries: 3
          });
          sent++;
        } catch (error) {
          console.error(`Failed to send webhook to ${subscription.url}:`, error);
          failed++;
        }
      });

      await Promise.allSettled(promises);

      return { sent, failed };
    });
  }

  /**
   * Route webhook event to appropriate handler
   */
  private async routeWebhookEvent(event: WebhookEvent): Promise<void> {
    switch (event.source) {
      case 'sendgrid':
        await this.handleSendGridWebhook(event);
        break;
      case 'twilio':
        await this.handleTwilioWebhook(event);
        break;
      case 'stripe':
        await this.handleStripeWebhook(event);
        break;
      default:
        console.log(`Unhandled webhook source: ${event.source}`);
    }
  }

  /**
   * Extract event type from webhook data
   */
  private extractEventType(source: string, data: any, headers: Record<string, string>): string {
    switch (source) {
      case 'sendgrid':
        return data.event || 'unknown';
      case 'twilio':
        return data.MessageStatus || headers['x-twilio-webhook-event'] || 'unknown';
      case 'stripe':
        return data.type || 'unknown';
      default:
        return 'unknown';
    }
  }

  /**
   * Webhook event handlers
   */
  private async handleSendGridWebhook(event: WebhookEvent): Promise<void> {
    console.log(`Processing SendGrid webhook: ${event.type}`, event.data);
    // Handle email events, update delivery status, etc.
  }

  private async handleTwilioWebhook(event: WebhookEvent): Promise<void> {
    console.log(`Processing Twilio webhook: ${event.type}`, event.data);
    // Handle SMS/call events, update delivery status, etc.
  }

  private async handleStripeWebhook(event: WebhookEvent): Promise<void> {
    console.log(`Processing Stripe webhook: ${event.type}`, event.data);
    // Handle payment events, update subscription status, etc.
  }

  /**
   * Utility methods
   */
  private generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private calculateRetryDelay(attemptNumber: number): number {
    // Exponential backoff: 2^attempt * 1000ms, max 30 seconds
    return Math.min(Math.pow(2, attemptNumber) * 1000, 30000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const webhookService = new WebhookService();
export default webhookService;