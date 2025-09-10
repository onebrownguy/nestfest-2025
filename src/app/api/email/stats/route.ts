import { handleGetEmailStatistics } from '../../../../lib/integrations/email/email-api';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return handleGetEmailStatistics(request);
}