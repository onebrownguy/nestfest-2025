/**
 * Storage API Integration
 * API routes for file upload and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { storageService, FileUploadOptions } from './storage-service';
import { validateRequest } from '../../api/validation';
import { z } from 'zod';

// Validation schemas
const uploadOptionsSchema = z.object({
  folder: z.string().optional(),
  filename: z.string().optional(),
  generateThumbnail: z.boolean().optional(),
  quality: z.number().min(1).max(100).optional(),
  resizeOptions: z.object({
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    fit: z.enum(['contain', 'cover', 'fill', 'inside', 'outside']).optional()
  }).optional()
});

const fileListSchema = z.object({
  folder: z.string().optional(),
  limit: z.number().min(1).max(1000).optional()
});

/**
 * Handle file upload
 * POST /api/files/upload
 */
export async function handleFileUpload(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Parse options from form data
    const optionsJson = formData.get('options') as string;
    let options: FileUploadOptions = {};
    
    if (optionsJson) {
      try {
        const parsedOptions = JSON.parse(optionsJson);
        const validatedOptions = uploadOptionsSchema.parse(parsedOptions);
        options = validatedOptions;
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid upload options' },
          { status: 400 }
        );
      }
    }

    // Set folder based on authenticated user context
    // You would get this from your auth middleware
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!options.folder) {
      options.folder = `uploads/${userRole || 'public'}`;
    }

    const result = await storageService.uploadFile(file, options);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle multiple file upload
 * POST /api/files/upload/batch
 */
export async function handleBatchFileUpload(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files: File[] = [];
    
    // Extract all files from form data
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file') && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const optionsJson = formData.get('options') as string;
    let options: FileUploadOptions = {};
    
    if (optionsJson) {
      try {
        const parsedOptions = JSON.parse(optionsJson);
        const validatedOptions = uploadOptionsSchema.parse(parsedOptions);
        options = validatedOptions;
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid upload options' },
          { status: 400 }
        );
      }
    }

    const userRole = request.headers.get('x-user-role');
    if (!options.folder) {
      options.folder = `uploads/${userRole || 'public'}`;
    }

    // Process files in parallel with concurrency limit
    const concurrencyLimit = 5;
    const results = [];
    
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      const batch = files.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(file => 
        storageService.uploadFile(file, options)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      data: {
        successful: successful.map(r => r.data),
        failed: failed.map(r => ({ error: r.error })),
        totalFiles: files.length,
        successCount: successful.length,
        failureCount: failed.length
      }
    });

  } catch (error) {
    console.error('Batch upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get file metadata
 * GET /api/files/[path]
 */
export async function handleGetFile(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    const result = await storageService.getFileMetadata(filePath);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('not found') ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Get file error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete file
 * DELETE /api/files/[path]
 */
export async function handleDeleteFile(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Check permissions - users should only delete their own files
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    // Admin can delete any file, users can only delete their own
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      if (!filePath.startsWith(`uploads/${userRole}/`)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    const result = await storageService.deleteFile(filePath);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * List files in folder
 * GET /api/files/list
 */
export async function handleListFiles(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      folder: searchParams.get('folder') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    };

    const validatedParams = fileListSchema.parse(queryParams);

    // Restrict folder access based on user role
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');
    
    let folder = validatedParams.folder;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      // Non-admin users can only list their own folders
      if (!folder) {
        folder = `uploads/${userRole}`;
      } else if (!folder.startsWith(`uploads/${userRole}/`)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    const result = await storageService.listFiles(
      folder,
      validatedParams.limit
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('List files error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get storage service health
 * GET /api/files/health
 */
export async function handleStorageHealth(request: NextRequest) {
  try {
    const health = storageService.getHealthStatus();
    const validation = storageService.validateConfiguration();

    return NextResponse.json({
      success: true,
      data: {
        health,
        configuration: validation
      }
    });

  } catch (error) {
    console.error('Storage health check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}