/**
 * Email API Integration
 * API routes for email sending and webhook handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { emailService, EmailContent, EmailOptions, EmailRecipient } from './email-service';
import { z } from 'zod';

// Validation schemas
const emailRecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional()
});

const emailContentSchema = z.object({
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  templateId: z.string().optional(),
  templateData: z.record(z.any()).optional()
});

const emailOptionsSchema = z.object({
  from: emailRecipientSchema.optional(),
  replyTo: z.string().email().optional(),
  categories: z.array(z.string()).optional(),
  customArgs: z.record(z.string()).optional(),
  sendAt: z.number().optional(),
  trackingSettings: z.object({
    clickTracking: z.boolean().optional(),
    openTracking: z.boolean().optional(),
    subscriptionTracking: z.boolean().optional()
  }).optional()
});

const sendEmailSchema = z.object({
  to: z.union([emailRecipientSchema, z.array(emailRecipientSchema)]),
  content: emailContentSchema,
  options: emailOptionsSchema.optional()
});

const sendBulkEmailSchema = z.object({
  requests: z.array(z.object({
    to: z.array(emailRecipientSchema),
    content: emailContentSchema,
    options: emailOptionsSchema.optional()
  }))
});

const sendTemplateEmailSchema = z.object({
  templateKey: z.enum(['welcome', 'emailVerification', 'passwordReset', 'competitionNotification', 'reviewAssignment', 'votingReminder', 'resultsAnnouncement']),
  to: z.union([emailRecipientSchema, z.array(emailRecipientSchema)]),
  templateData: z.record(z.any()).optional(),
  options: emailOptionsSchema.optional()
});

/**
 * Send single email
 * POST /api/email/send
 */
export async function handleSendEmail(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = sendEmailSchema.parse(body);

    // Check rate limits based on user
    const userId = request.headers.get('x-user-id');
    if (userId) {
      const canSend = await emailService.checkRateLimit(userId);
      if (!canSend) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );
      }
    }

    const result = await emailService.sendEmail(
      validatedData.to,
      validatedData.content,
      validatedData.options || {}
    );

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

    console.error('Send email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Send bulk emails
 * POST /api/email/send/bulk
 */
export async function handleSendBulkEmail(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = sendBulkEmailSchema.parse(body);

    // Check permissions - only admin users can send bulk emails
    const userRole = request.headers.get('x-user-role');
    if (!['admin', 'super_admin'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const result = await emailService.sendBulkEmails(validatedData.requests);

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

    console.error('Send bulk email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Send template email
 * POST /api/email/send/template
 */
export async function handleSendTemplateEmail(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = sendTemplateEmailSchema.parse(body);

    const result = await emailService.sendTemplateEmail(
      validatedData.templateKey,
      validatedData.to,
      validatedData.templateData || {},
      validatedData.options || {}
    );

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

    console.error('Send template email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Send welcome email
 * POST /api/email/welcome
 */
export async function handleSendWelcomeEmail(request: NextRequest) {
  try {
    const body = await request.json();
    const schema = z.object({
      user: z.object({
        email: z.string().email(),
        name: z.string()
      }),
      additionalData: z.record(z.any()).optional()
    });

    const validatedData = schema.parse(body);

    const result = await emailService.sendWelcomeEmail(
      validatedData.user,
      validatedData.additionalData || {}
    );

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

    console.error('Send welcome email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Send email verification
 * POST /api/email/verify
 */
export async function handleSendEmailVerification(request: NextRequest) {
  try {
    const body = await request.json();
    const schema = z.object({
      user: z.object({
        email: z.string().email(),
        name: z.string()
      }),
      verificationToken: z.string(),
      baseUrl: z.string().url().optional()
    });

    const validatedData = schema.parse(body);
    const baseUrl = validatedData.baseUrl || request.headers.get('origin') || 'http://localhost:3000';

    const result = await emailService.sendEmailVerification(
      validatedData.user,
      validatedData.verificationToken,
      baseUrl
    );

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

    console.error('Send verification email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Send password reset email
 * POST /api/email/password-reset
 */
export async function handleSendPasswordResetEmail(request: NextRequest) {
  try {
    const body = await request.json();
    const schema = z.object({
      user: z.object({
        email: z.string().email(),
        name: z.string()
      }),
      resetToken: z.string(),
      baseUrl: z.string().url().optional()
    });

    const validatedData = schema.parse(body);
    const baseUrl = validatedData.baseUrl || request.headers.get('origin') || 'http://localhost:3000';

    const result = await emailService.sendPasswordResetEmail(
      validatedData.user,
      validatedData.resetToken,
      baseUrl
    );

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

    console.error('Send password reset email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Send competition notification
 * POST /api/email/competition-notification
 */
export async function handleSendCompetitionNotification(request: NextRequest) {
  try {
    const body = await request.json();
    const schema = z.object({
      recipients: z.array(emailRecipientSchema),
      competition: z.object({
        name: z.string(),
        description: z.string(),
        submissionDeadline: z.string(),
        eventDate: z.string()
      }),
      type: z.enum(['opening', 'deadline_reminder', 'results'])
    });

    const validatedData = schema.parse(body);

    // Check permissions - only admin users can send competition notifications
    const userRole = request.headers.get('x-user-role');
    if (!['admin', 'super_admin'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const result = await emailService.sendCompetitionNotification(
      validatedData.recipients,
      validatedData.competition,
      validatedData.type
    );

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

    console.error('Send competition notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get email statistics
 * GET /api/email/stats
 */
export async function handleGetEmailStatistics(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      );
    }

    // Check permissions
    const userRole = request.headers.get('x-user-role');
    if (!['admin', 'super_admin'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const result = await emailService.getEmailStatistics(startDate, endDate || undefined);

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
    console.error('Get email statistics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle SendGrid webhook
 * POST /api/webhooks/sendgrid
 */
export async function handleSendGridWebhook(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-twilio-email-event-webhook-signature');
    const timestamp = request.headers.get('x-twilio-email-event-webhook-timestamp');

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: 'Missing webhook signature headers' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = emailService.verifyWebhookSignature(body, signature, timestamp);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const events = JSON.parse(body);
    const processedEvents = emailService.processWebhookEvents(events);

    // Here you would typically store these events in your database
    // or trigger other actions based on the event types
    
    console.log(`Processed ${processedEvents.length} email events`);

    return NextResponse.json({
      success: true,
      processedCount: processedEvents.length
    });

  } catch (error) {
    console.error('SendGrid webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get email service health
 * GET /api/email/health
 */
export async function handleEmailHealth(request: NextRequest) {
  try {
    const health = emailService.getHealthStatus();
    const validation = emailService.validateConfiguration();

    return NextResponse.json({
      success: true,
      data: {
        health,
        configuration: validation
      }
    });

  } catch (error) {
    console.error('Email health check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}