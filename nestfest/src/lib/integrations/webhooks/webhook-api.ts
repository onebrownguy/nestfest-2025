/**
 * Webhook API Integration
 * API routes for webhook management and processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { webhookService } from './webhook-service';
import { z } from 'zod';

// Validation schemas
const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string().min(1)),
  headers: z.record(z.string()).optional()
});

const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string().min(1)).optional(),
  active: z.boolean().optional(),
  headers: z.record(z.string()).optional()
});

const broadcastEventSchema = z.object({
  eventType: z.string().min(1),
  data: z.any()
});

const sendWebhookSchema = z.object({
  url: z.string().url(),
  event: z.string().min(1),
  data: z.any(),
  headers: z.record(z.string()).optional(),
  maxRetries: z.number().min(1).max(10).optional(),
  timeout: z.number().min(1000).max(60000).optional(),
  secret: z.string().optional()
});

/**
 * Create webhook subscription
 * POST /api/webhooks/subscriptions
 */
export async function handleCreateWebhookSubscription(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createWebhookSchema.parse(body);

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const result = await webhookService.createWebhookSubscription(
      validatedData.url,
      validatedData.events,
      userId,
      validatedData.headers
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

    console.error('Create webhook subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update webhook subscription
 * PUT /api/webhooks/subscriptions/[id]
 */
export async function handleUpdateWebhookSubscription(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateWebhookSchema.parse(body);

    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check ownership or admin privileges
    const subscriptions = await webhookService.getWebhookSubscriptions(userId);
    const userSubscription = subscriptions.data?.find(sub => sub.id === params.id);
    
    if (!userSubscription && !['admin', 'super_admin'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Webhook subscription not found or insufficient permissions' },
        { status: 404 }
      );
    }

    const result = await webhookService.updateWebhookSubscription(params.id, validatedData);

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

    console.error('Update webhook subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete webhook subscription
 * DELETE /api/webhooks/subscriptions/[id]
 */
export async function handleDeleteWebhookSubscription(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check ownership or admin privileges
    const subscriptions = await webhookService.getWebhookSubscriptions(userId);
    const userSubscription = subscriptions.data?.find(sub => sub.id === params.id);
    
    if (!userSubscription && !['admin', 'super_admin'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Webhook subscription not found or insufficient permissions' },
        { status: 404 }
      );
    }

    const result = await webhookService.deleteWebhookSubscription(params.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook subscription deleted successfully',
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Delete webhook subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get webhook subscriptions
 * GET /api/webhooks/subscriptions
 */
export async function handleGetWebhookSubscriptions(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Admin users can see all subscriptions, regular users only their own
    const userIdFilter = ['admin', 'super_admin'].includes(userRole || '') ? undefined : userId;
    
    const result = await webhookService.getWebhookSubscriptions(userIdFilter);

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
    console.error('Get webhook subscriptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get webhook deliveries
 * GET /api/webhooks/deliveries
 */
export async function handleGetWebhookDeliveries(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get('webhookId');
    const limit = parseInt(searchParams.get('limit') || '100');

    const userRole = request.headers.get('x-user-role');
    
    // Only admin users can view webhook deliveries
    if (!['admin', 'super_admin'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const result = await webhookService.getWebhookDeliveries(
      webhookId || undefined,
      Math.min(limit, 1000)
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
    console.error('Get webhook deliveries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Send webhook manually
 * POST /api/webhooks/send
 */
export async function handleSendWebhook(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = sendWebhookSchema.parse(body);

    const userRole = request.headers.get('x-user-role');
    
    // Only admin users can send webhooks manually
    if (!['admin', 'super_admin'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const result = await webhookService.sendOutgoingWebhook(validatedData);

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

    console.error('Send webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Broadcast event to all subscriptions
 * POST /api/webhooks/broadcast
 */
export async function handleBroadcastEvent(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = broadcastEventSchema.parse(body);

    const userRole = request.headers.get('x-user-role');
    
    // Only admin users can broadcast events
    if (!['admin', 'super_admin'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const result = await webhookService.broadcastEvent(
      validatedData.eventType,
      validatedData.data
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

    console.error('Broadcast event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle incoming webhook from Twilio
 * POST /api/webhooks/twilio
 */
export async function handleTwilioWebhook(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-twilio-signature') || '';
    const headers = Object.fromEntries(request.headers.entries());

    const result = await webhookService.processIncomingWebhook(
      'twilio',
      body,
      signature,
      headers
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Twilio webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle incoming webhook from Stripe
 * POST /api/webhooks/stripe
 */
export async function handleStripeWebhook(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';
    const headers = Object.fromEntries(request.headers.entries());

    const result = await webhookService.processIncomingWebhook(
      'stripe',
      body,
      signature,
      headers
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get webhook service health
 * GET /api/webhooks/health
 */
export async function handleWebhookHealth(request: NextRequest) {
  try {
    const health = webhookService.getHealthStatus();
    const validation = webhookService.validateConfiguration();

    return NextResponse.json({
      success: true,
      data: {
        health,
        configuration: validation
      }
    });

  } catch (error) {
    console.error('Webhook health check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}