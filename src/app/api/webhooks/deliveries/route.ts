import { handleGetWebhookDeliveries } from '../../../../lib/integrations/webhooks/webhook-api';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return handleGetWebhookDeliveries(request);
}