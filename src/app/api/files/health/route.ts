import { handleStorageHealth } from '../../../../lib/integrations/storage/storage-api';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return handleStorageHealth(request);
}