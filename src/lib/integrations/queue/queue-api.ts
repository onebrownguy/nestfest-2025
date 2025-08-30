/**
 * Queue API Integration
 * API routes for queue management and job scheduling
 */

import { NextRequest, NextResponse } from 'next/server';
import { queueService, EmailJobData, FileProcessingJobData, NotificationJobData, AnalyticsJobData } from './queue-service';
import { z } from 'zod';

// Validation schemas
const emailJobSchema = z.object({
  type: z.enum(['single', 'bulk', 'template', 'welcome', 'verification', 'password_reset', 'competition_notification']),
  to: z.any(),
  content: z.any().optional(),
  templateKey: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  options: z.any().optional(),
  user: z.any().optional(),
  verificationToken: z.string().optional(),
  resetToken: z.string().optional(),
  baseUrl: z.string().optional(),
  recipients: z.array(z.any()).optional(),
  competition: z.any().optional(),
  notificationType: z.string().optional(),
  requests: z.array(z.any()).optional()
});

const fileProcessingJobSchema = z.object({
  type: z.enum(['image_processing', 'video_processing', 'thumbnail_generation', 'file_validation']),
  filePath: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  userId: z.string().optional(),
  options: z.any().optional()
});

const notificationJobSchema = z.object({
  type: z.enum(['push', 'sms', 'in_app', 'webhook']),
  recipients: z.array(z.string()),
  message: z.string(),
  title: z.string().optional(),
  data: z.any().optional(),
  options: z.any().optional()
});

const analyticsJobSchema = z.object({
  type: z.enum(['user_event', 'competition_event', 'system_event']),
  eventName: z.string(),
  eventData: z.any(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  timestamp: z.string().optional()
});

const jobOptionsSchema = z.object({
  priority: z.number().min(1).max(20).optional(),
  delay: z.number().min(0).optional(),
  attempts: z.number().min(1).max(10).optional(),
  removeOnComplete: z.number().optional(),
  removeOnFail: z.number().optional()
});

/**
 * Add email job to queue
 * POST /api/queue/email
 */
export async function handleAddEmailJob(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobData, options } = body;
    
    const validatedJobData = emailJobSchema.parse(jobData);
    const validatedOptions = options ? jobOptionsSchema.parse(options) : {};

    // Check permissions
    const userRole = request.headers.get('x-user-role');
    if (!userRole) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Restrict bulk operations to admin users
    if (validatedJobData.type === 'bulk' && !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions for bulk operations' },
        { status: 403 }
      );
    }

    const result = await queueService.addEmailJob(validatedJobData, validatedOptions);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Add email job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Add file processing job to queue
 * POST /api/queue/file-processing
 */
export async function handleAddFileProcessingJob(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobData, options } = body;
    
    const validatedJobData = fileProcessingJobSchema.parse(jobData);
    const validatedOptions = options ? jobOptionsSchema.parse(options) : {};

    // Check permissions - users should only process their own files
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Admin can process any file, users can only process their own
    if (!['admin', 'super_admin'].includes(userRole || '')) {
      if (validatedJobData.userId && validatedJobData.userId !== userId) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    const result = await queueService.addFileProcessingJob(validatedJobData, validatedOptions);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Add file processing job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Add notification job to queue
 * POST /api/queue/notifications
 */
export async function handleAddNotificationJob(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobData, options } = body;
    
    const validatedJobData = notificationJobSchema.parse(jobData);
    const validatedOptions = options ? jobOptionsSchema.parse(options) : {};

    // Check permissions - restrict based on notification type
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only admin users can send bulk notifications
    if (validatedJobData.recipients.length > 10 && !['admin', 'super_admin'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions for bulk notifications' },
        { status: 403 }
      );
    }

    const result = await queueService.addNotificationJob(validatedJobData, validatedOptions);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Add notification job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Add analytics job to queue
 * POST /api/queue/analytics
 */
export async function handleAddAnalyticsJob(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobData, options } = body;
    
    const validatedJobData = analyticsJobSchema.parse(jobData);
    const validatedOptions = options ? jobOptionsSchema.parse(options) : {};

    // Analytics jobs are generally allowed for all authenticated users
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Set userId if not provided
    if (!validatedJobData.userId) {
      validatedJobData.userId = userId;
    }

    const result = await queueService.addAnalyticsJob(validatedJobData, validatedOptions);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Add analytics job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get queue statistics
 * GET /api/queue/stats
 */
export async function handleGetQueueStats(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queueName = searchParams.get('queue');

    // Check permissions - only admin users can view queue stats
    const userRole = request.headers.get('x-user-role');
    if (!['admin', 'super_admin'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const result = await queueService.getQueueStats(queueName || undefined);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Get queue stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Cleanup old jobs
 * POST /api/queue/cleanup
 */
export async function handleCleanupJobs(request: NextRequest) {
  try {
    // Check permissions - only admin users can cleanup jobs
    const userRole = request.headers.get('x-user-role');
    if (!['admin', 'super_admin'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const result = await queueService.cleanupJobs();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Cleanup jobs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get queue service health
 * GET /api/queue/health
 */
export async function handleQueueHealth(request: NextRequest) {
  try {
    const health = queueService.getHealthStatus();
    const validation = queueService.validateConfiguration();

    return NextResponse.json({
      success: true,
      data: {
        health,
        configuration: validation
      }
    });

  } catch (error) {
    console.error('Queue health check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}