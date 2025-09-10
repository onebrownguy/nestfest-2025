import { handleUpdateWebhookSubscription, handleDeleteWebhookSubscription } from '../../../../../lib/integrations/webhooks/webhook-api';
import { NextRequest } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleUpdateWebhookSubscription(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleDeleteWebhookSubscription(request, { params });
}