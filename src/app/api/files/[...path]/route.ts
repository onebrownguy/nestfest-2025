import { handleGetFile, handleDeleteFile } from '../../../../lib/integrations/storage/storage-api';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleGetFile(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleDeleteFile(request, { params });
}