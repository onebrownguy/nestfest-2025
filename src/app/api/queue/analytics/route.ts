import { handleAddAnalyticsJob } from '../../../../lib/integrations/queue/queue-api';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  return handleAddAnalyticsJob(request);
}