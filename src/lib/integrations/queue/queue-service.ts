/**
 * Queue Service
 * Background job processing using BullMQ and Redis
 */

import { Queue, Worker, Job, JobsOptions, QueueOptions } from 'bullmq';
import Redis from 'ioredis';
import { BaseService, ServiceResponse } from '../base-service';
import { config } from '../config';
import { emailService } from '../email/email-service';
import { storageService } from '../storage/storage-service';

export interface QueueJobData {
  type: string;
  payload: any;
  userId?: string;
  priority?: number;
  attempts?: number;
  delay?: number;
  metadata?: Record<string, any>;
}

export interface EmailJobData {
  type: 'single' | 'bulk' | 'template' | 'welcome' | 'verification' | 'password_reset' | 'competition_notification';
  to: any;
  content?: any;
  templateKey?: string;
  templateData?: any;
  options?: any;
  user?: any;
  verificationToken?: string;
  resetToken?: string;
  baseUrl?: string;
  recipients?: any[];
  competition?: any;
  notificationType?: string;
}

export interface FileProcessingJobData {
  type: 'image_processing' | 'video_processing' | 'thumbnail_generation' | 'file_validation';
  filePath: string;
  originalFilename: string;
  mimeType: string;
  userId?: string;
  options?: any;
}

export interface NotificationJobData {
  type: 'push' | 'sms' | 'in_app' | 'webhook';
  recipients: string[];
  message: string;
  title?: string;
  data?: any;
  options?: any;
}

export interface AnalyticsJobData {
  type: 'user_event' | 'competition_event' | 'system_event';
  eventName: string;
  eventData: any;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
}

export enum QueuePriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 20
}

class QueueService extends BaseService {
  private connection: Redis;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  // Queue names
  private readonly QUEUE_NAMES = {
    EMAIL: 'email-processing',
    FILE_PROCESSING: 'file-processing',
    NOTIFICATIONS: 'notifications',
    ANALYTICS: 'analytics',
    WEBHOOKS: 'webhooks',
    CLEANUP: 'cleanup'
  };

  constructor() {
    super('queue', config.redis);
    
    this.connection = new Redis(config.redis.url, {
      password: config.redis.password,
      db: config.redis.db,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keyPrefix: config.redis.keyPrefix
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.connection.connect();
      
      // Initialize queues
      this.initializeQueues();
      
      // Initialize workers
      this.initializeWorkers();

      console.log('Queue service initialized successfully');
    } catch (error) {
      throw new Error(`Failed to initialize queue service: ${error}`);
    }
  }

  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.redis.url) {
      errors.push('Redis URL is required');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Initialize all queues
   */
  private initializeQueues(): void {
    const defaultQueueOptions: QueueOptions = {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    };

    for (const queueName of Object.values(this.QUEUE_NAMES)) {
      const queue = new Queue(queueName, defaultQueueOptions);
      this.queues.set(queueName, queue);
    }
  }

  /**
   * Initialize all workers
   */
  private initializeWorkers(): void {
    // Email processing worker
    const emailWorker = new Worker(
      this.QUEUE_NAMES.EMAIL,
      this.processEmailJob.bind(this),
      { connection: this.connection, concurrency: 10 }
    );
    this.workers.set(this.QUEUE_NAMES.EMAIL, emailWorker);

    // File processing worker
    const fileWorker = new Worker(
      this.QUEUE_NAMES.FILE_PROCESSING,
      this.processFileJob.bind(this),
      { connection: this.connection, concurrency: 5 }
    );
    this.workers.set(this.QUEUE_NAMES.FILE_PROCESSING, fileWorker);

    // Notifications worker
    const notificationWorker = new Worker(
      this.QUEUE_NAMES.NOTIFICATIONS,
      this.processNotificationJob.bind(this),
      { connection: this.connection, concurrency: 15 }
    );
    this.workers.set(this.QUEUE_NAMES.NOTIFICATIONS, notificationWorker);

    // Analytics worker
    const analyticsWorker = new Worker(
      this.QUEUE_NAMES.ANALYTICS,
      this.processAnalyticsJob.bind(this),
      { connection: this.connection, concurrency: 20 }
    );
    this.workers.set(this.QUEUE_NAMES.ANALYTICS, analyticsWorker);

    // Webhooks worker
    const webhookWorker = new Worker(
      this.QUEUE_NAMES.WEBHOOKS,
      this.processWebhookJob.bind(this),
      { connection: this.connection, concurrency: 10 }
    );
    this.workers.set(this.QUEUE_NAMES.WEBHOOKS, webhookWorker);

    // Cleanup worker
    const cleanupWorker = new Worker(
      this.QUEUE_NAMES.CLEANUP,
      this.processCleanupJob.bind(this),
      { connection: this.connection, concurrency: 1 }
    );
    this.workers.set(this.QUEUE_NAMES.CLEANUP, cleanupWorker);

    // Add error handlers
    this.workers.forEach((worker, queueName) => {
      worker.on('completed', (job) => {
        console.log(`Job ${job.id} in queue ${queueName} completed`);
      });

      worker.on('failed', (job, err) => {
        console.error(`Job ${job?.id} in queue ${queueName} failed:`, err);
      });

      worker.on('error', (err) => {
        console.error(`Worker error in queue ${queueName}:`, err);
      });
    });
  }

  /**
   * Add email job to queue
   */
  async addEmailJob(
    jobData: EmailJobData,
    options: JobsOptions = {}
  ): Promise<ServiceResponse<{ jobId: string }>> {
    return this.executeWithRetry(async () => {
      const queue = this.queues.get(this.QUEUE_NAMES.EMAIL);
      if (!queue) {
        throw new Error('Email queue not initialized');
      }

      const jobOptions: JobsOptions = {
        priority: QueuePriority.NORMAL,
        attempts: 3,
        ...options
      };

      const job = await queue.add('email-job', jobData, jobOptions);
      
      return { jobId: job.id || 'unknown' };
    });
  }

  /**
   * Add file processing job to queue
   */
  async addFileProcessingJob(
    jobData: FileProcessingJobData,
    options: JobsOptions = {}
  ): Promise<ServiceResponse<{ jobId: string }>> {
    return this.executeWithRetry(async () => {
      const queue = this.queues.get(this.QUEUE_NAMES.FILE_PROCESSING);
      if (!queue) {
        throw new Error('File processing queue not initialized');
      }

      const jobOptions: JobsOptions = {
        priority: QueuePriority.NORMAL,
        attempts: 2,
        ...options
      };

      const job = await queue.add('file-processing-job', jobData, jobOptions);
      
      return { jobId: job.id || 'unknown' };
    });
  }

  /**
   * Add notification job to queue
   */
  async addNotificationJob(
    jobData: NotificationJobData,
    options: JobsOptions = {}
  ): Promise<ServiceResponse<{ jobId: string }>> {
    return this.executeWithRetry(async () => {
      const queue = this.queues.get(this.QUEUE_NAMES.NOTIFICATIONS);
      if (!queue) {
        throw new Error('Notifications queue not initialized');
      }

      const jobOptions: JobsOptions = {
        priority: QueuePriority.HIGH,
        attempts: 2,
        ...options
      };

      const job = await queue.add('notification-job', jobData, jobOptions);
      
      return { jobId: job.id || 'unknown' };
    });
  }

  /**
   * Add analytics job to queue
   */
  async addAnalyticsJob(
    jobData: AnalyticsJobData,
    options: JobsOptions = {}
  ): Promise<ServiceResponse<{ jobId: string }>> {
    return this.executeWithRetry(async () => {
      const queue = this.queues.get(this.QUEUE_NAMES.ANALYTICS);
      if (!queue) {
        throw new Error('Analytics queue not initialized');
      }

      const jobOptions: JobsOptions = {
        priority: QueuePriority.LOW,
        attempts: 1,
        removeOnComplete: 1000,
        ...options
      };

      const job = await queue.add('analytics-job', jobData, jobOptions);
      
      return { jobId: job.id || 'unknown' };
    });
  }

  /**
   * Process email jobs
   */
  private async processEmailJob(job: Job<EmailJobData>): Promise<any> {
    const { type, ...data } = job.data;

    try {
      switch (type) {
        case 'single':
          return await emailService.sendEmail(data.to, data.content, data.options);
        
        case 'bulk':
          return await emailService.sendBulkEmails(data.requests || []);
        
        case 'template':
          return await emailService.sendTemplateEmail(data.templateKey, data.to, data.templateData, data.options);
        
        case 'welcome':
          return await emailService.sendWelcomeEmail(data.user, data.templateData);
        
        case 'verification':
          return await emailService.sendEmailVerification(data.user, data.verificationToken!, data.baseUrl!);
        
        case 'password_reset':
          return await emailService.sendPasswordResetEmail(data.user, data.resetToken!, data.baseUrl!);
        
        case 'competition_notification':
          return await emailService.sendCompetitionNotification(data.recipients!, data.competition!, data.notificationType!);
        
        default:
          throw new Error(`Unknown email job type: ${type}`);
      }
    } catch (error) {
      console.error(`Email job ${job.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Process file jobs
   */
  private async processFileJob(job: Job<FileProcessingJobData>): Promise<any> {
    const { type, filePath, options } = job.data;

    try {
      switch (type) {
        case 'image_processing':
          // Process image - resize, optimize, generate thumbnails
          return await this.processImage(filePath, options);
        
        case 'video_processing':
          // Process video - transcode, generate thumbnails
          return await this.processVideo(filePath, options);
        
        case 'thumbnail_generation':
          // Generate thumbnail for any file type
          return await this.generateThumbnail(filePath, options);
        
        case 'file_validation':
          // Validate file - virus scan, content analysis
          return await this.validateFile(filePath, options);
        
        default:
          throw new Error(`Unknown file processing job type: ${type}`);
      }
    } catch (error) {
      console.error(`File processing job ${job.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Process notification jobs
   */
  private async processNotificationJob(job: Job<NotificationJobData>): Promise<any> {
    const { type, recipients, message, title, data, options } = job.data;

    try {
      switch (type) {
        case 'push':
          return await this.sendPushNotifications(recipients, title || '', message, data);
        
        case 'sms':
          return await this.sendSMSNotifications(recipients, message, options);
        
        case 'in_app':
          return await this.sendInAppNotifications(recipients, title || '', message, data);
        
        case 'webhook':
          return await this.sendWebhookNotifications(recipients, message, data);
        
        default:
          throw new Error(`Unknown notification job type: ${type}`);
      }
    } catch (error) {
      console.error(`Notification job ${job.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Process analytics jobs
   */
  private async processAnalyticsJob(job: Job<AnalyticsJobData>): Promise<any> {
    const { type, eventName, eventData, userId, sessionId, timestamp } = job.data;

    try {
      // Here you would typically send data to your analytics service
      // For now, we'll just log it
      console.log(`Analytics event: ${eventName}`, {
        type,
        eventData,
        userId,
        sessionId,
        timestamp: timestamp || new Date().toISOString()
      });

      return { processed: true };
    } catch (error) {
      console.error(`Analytics job ${job.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Process webhook jobs
   */
  private async processWebhookJob(job: Job): Promise<any> {
    // Webhook processing logic would go here
    console.log(`Processing webhook job ${job.id}`);
    return { processed: true };
  }

  /**
   * Process cleanup jobs
   */
  private async processCleanupJob(job: Job): Promise<any> {
    // Cleanup logic - remove old files, expired data, etc.
    console.log(`Processing cleanup job ${job.id}`);
    return { processed: true };
  }

  /**
   * File processing methods
   */
  private async processImage(filePath: string, options: any): Promise<any> {
    // Image processing logic would integrate with storage service
    console.log(`Processing image: ${filePath}`);
    return { processed: true };
  }

  private async processVideo(filePath: string, options: any): Promise<any> {
    // Video processing logic
    console.log(`Processing video: ${filePath}`);
    return { processed: true };
  }

  private async generateThumbnail(filePath: string, options: any): Promise<any> {
    // Thumbnail generation logic
    console.log(`Generating thumbnail for: ${filePath}`);
    return { processed: true };
  }

  private async validateFile(filePath: string, options: any): Promise<any> {
    // File validation logic - virus scanning, content analysis
    console.log(`Validating file: ${filePath}`);
    return { valid: true };
  }

  /**
   * Notification methods
   */
  private async sendPushNotifications(recipients: string[], title: string, message: string, data?: any): Promise<any> {
    console.log(`Sending push notifications to ${recipients.length} recipients`);
    return { sent: recipients.length };
  }

  private async sendSMSNotifications(recipients: string[], message: string, options?: any): Promise<any> {
    console.log(`Sending SMS to ${recipients.length} recipients`);
    return { sent: recipients.length };
  }

  private async sendInAppNotifications(recipients: string[], title: string, message: string, data?: any): Promise<any> {
    console.log(`Sending in-app notifications to ${recipients.length} recipients`);
    return { sent: recipients.length };
  }

  private async sendWebhookNotifications(recipients: string[], message: string, data?: any): Promise<any> {
    console.log(`Sending webhook notifications to ${recipients.length} recipients`);
    return { sent: recipients.length };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName?: string): Promise<ServiceResponse<any>> {
    return this.executeWithRetry(async () => {
      const stats: any = {};
      
      const queuesToCheck = queueName ? [queueName] : Array.from(this.queues.keys());
      
      for (const name of queuesToCheck) {
        const queue = this.queues.get(name);
        if (queue) {
          const waiting = await queue.getWaiting();
          const active = await queue.getActive();
          const completed = await queue.getCompleted();
          const failed = await queue.getFailed();
          
          stats[name] = {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length
          };
        }
      }
      
      return stats;
    });
  }

  /**
   * Cleanup old jobs
   */
  async cleanupJobs(): Promise<ServiceResponse<{ cleaned: number }>> {
    return this.executeWithRetry(async () => {
      let totalCleaned = 0;
      
      for (const [name, queue] of this.queues) {
        const cleaned = await queue.clean(24 * 60 * 60 * 1000, 100); // Clean jobs older than 24 hours
        totalCleaned += cleaned.length;
      }
      
      return { cleaned: totalCleaned };
    });
  }

  /**
   * Shutdown gracefully
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down queue service...');
    
    // Close all workers
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    
    // Close all queues
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    
    // Close Redis connection
    await this.connection.quit();
    
    console.log('Queue service shutdown complete');
  }
}

export const queueService = new QueueService();
export default queueService;