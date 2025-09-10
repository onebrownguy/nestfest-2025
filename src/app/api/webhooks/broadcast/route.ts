import { handleBroadcastEvent } from '../../../../lib/integrations/webhooks/webhook-api';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  return handleBroadcastEvent(request);
}