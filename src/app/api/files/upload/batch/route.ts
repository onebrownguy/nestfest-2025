import { handleBatchFileUpload } from '../../../../../lib/integrations/storage/storage-api';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  return handleBatchFileUpload(request);
}