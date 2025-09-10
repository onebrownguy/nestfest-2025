import { handleCreateWebhookSubscription, handleGetWebhookSubscriptions } from '../../../../lib/integrations/webhooks/webhook-api';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  return handleCreateWebhookSubscription(request);
}

export async function GET(request: NextRequest) {
  return handleGetWebhookSubscriptions(request);
}