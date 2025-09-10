import { handleQueueHealth } from '../../../../lib/integrations/queue/queue-api';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return handleQueueHealth(request);
}