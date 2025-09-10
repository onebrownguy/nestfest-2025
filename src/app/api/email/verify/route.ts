import { handleSendEmailVerification } from '../../../../lib/integrations/email/email-api';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  return handleSendEmailVerification(request);
}