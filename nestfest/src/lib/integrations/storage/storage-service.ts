/**
 * File Storage Service
 * Handles file upload, processing, and CDN delivery using Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { BaseService, ServiceResponse } from '../base-service';
import { config } from '../config';

export interface FileUploadOptions {
  folder?: string;
  filename?: string;
  generateThumbnail?: boolean;
  allowedMimeTypes?: string[];
  maxSize?: number;
  quality?: number;
  resizeOptions?: {
    width?: number;
    height?: number;
    fit?: keyof sharp.FitEnum;
  };
}

export interface FileMetadata {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  folder: string;
  url: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface ProcessingResult {
  original: FileMetadata;
  processed?: FileMetadata;
  thumbnail?: FileMetadata;
  optimized?: FileMetadata[];
}

class StorageService extends BaseService {
  private supabaseClient: ReturnType<typeof createClient>;
  private bucket: string;

  constructor() {
    super('storage', config.supabaseStorage);
    
    this.supabaseClient = createClient(
      config.supabaseStorage.url,
      config.supabaseStorage.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    this.bucket = config.supabaseStorage.bucket;
  }

  private get storageClient() {
    return this.supabaseClient.storage;
  }

  async initialize(): Promise<void> {
    try {
      // Ensure bucket exists
      const { data: buckets } = await this.storageClient.listBuckets();
      const bucketExists = buckets?.some(b => b.name === this.bucket);
      
      if (!bucketExists) {
        await this.storageClient.createBucket(this.bucket, {
          public: true,
          fileSizeLimit: config.supabaseStorage.maxFileSize,
          allowedMimeTypes: config.supabaseStorage.allowedMimeTypes
        });
      }
    } catch (error) {
      throw new Error(`Failed to initialize storage service: ${error}`);
    }
  }

  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.supabaseStorage.url) {
      errors.push('Supabase URL is required');
    }
    
    if (!config.supabaseStorage.serviceRoleKey) {
      errors.push('Supabase service role key is required');
    }
    
    if (!config.supabaseStorage.bucket) {
      errors.push('Storage bucket name is required');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Upload file with automatic processing
   */
  async uploadFile(
    file: Buffer | File | Blob,
    options: FileUploadOptions = {}
  ): Promise<ServiceResponse<ProcessingResult>> {
    return this.executeWithRetry(async () => {
      const fileBuffer = await this.convertToBuffer(file);
      const originalFilename = this.getOriginalFilename(file, options.filename);
      const mimeType = await this.detectMimeType(fileBuffer, originalFilename);
      
      // Validate file
      this.validateFile(fileBuffer, mimeType, options);
      
      // Generate unique filename
      const filename = this.generateFilename(originalFilename, options.folder);
      const folder = options.folder || 'uploads';
      const fullPath = `${folder}/${filename}`;
      
      // Upload original file
      const { data: uploadData, error } = await this.storageClient
        .from(this.bucket)
        .upload(fullPath, fileBuffer, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.storageClient
        .from(this.bucket)
        .getPublicUrl(uploadData.path);

      const originalMetadata: FileMetadata = {
        id: uploadData.id || uploadData.path,
        filename,
        originalFilename,
        mimeType,
        size: fileBuffer.length,
        folder,
        url: urlData.publicUrl,
        cdnUrl: this.getCdnUrl(uploadData.path),
        uploadedAt: new Date().toISOString()
      };

      const result: ProcessingResult = {
        original: originalMetadata
      };

      // Process image if needed
      if (this.isImage(mimeType)) {
        const processedFiles = await this.processImage(
          fileBuffer,
          originalMetadata,
          options
        );
        Object.assign(result, processedFiles);
      }

      // Process video if needed
      if (this.isVideo(mimeType)) {
        const processedFiles = await this.processVideo(
          fileBuffer,
          originalMetadata,
          options
        );
        Object.assign(result, processedFiles);
      }

      return result;
    });
  }

  /**
   * Process images - resize, optimize, generate thumbnails
   */
  private async processImage(
    buffer: Buffer,
    metadata: FileMetadata,
    options: FileUploadOptions
  ): Promise<Partial<ProcessingResult>> {
    const result: Partial<ProcessingResult> = {};

    try {
      const image = sharp(buffer);
      const imageMetadata = await image.metadata();

      // Generate thumbnail
      if (options.generateThumbnail !== false) {
        const thumbnailBuffer = await image
          .clone()
          .resize(300, 300, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();

        const thumbnailPath = this.getThumbnailPath(metadata.filename, metadata.folder);
        const { data: thumbData } = await this.storageClient
          .from(this.bucket)
          .upload(thumbnailPath, thumbnailBuffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600'
          });

        if (thumbData) {
          const { data: thumbUrl } = this.storageClient
            .from(this.bucket)
            .getPublicUrl(thumbData.path);

          result.thumbnail = {
            id: thumbData.id || thumbData.path,
            filename: this.getFilenameFromPath(thumbnailPath),
            originalFilename: metadata.originalFilename,
            mimeType: 'image/jpeg',
            size: thumbnailBuffer.length,
            folder: metadata.folder,
            url: thumbUrl.publicUrl,
            cdnUrl: this.getCdnUrl(thumbData.path),
            uploadedAt: new Date().toISOString()
          };
        }
      }

      // Resize if needed
      if (options.resizeOptions && (imageMetadata.width || imageMetadata.height)) {
        const resizedBuffer = await image
          .clone()
          .resize(
            options.resizeOptions.width,
            options.resizeOptions.height,
            { fit: options.resizeOptions.fit || 'inside' }
          )
          .jpeg({ quality: options.quality || 90 })
          .toBuffer();

        const processedPath = this.getProcessedPath(metadata.filename, metadata.folder);
        const { data: processedData } = await this.storageClient
          .from(this.bucket)
          .upload(processedPath, resizedBuffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600'
          });

        if (processedData) {
          const { data: processedUrl } = this.storageClient
            .from(this.bucket)
            .getPublicUrl(processedData.path);

          result.processed = {
            id: processedData.id || processedData.path,
            filename: this.getFilenameFromPath(processedPath),
            originalFilename: metadata.originalFilename,
            mimeType: 'image/jpeg',
            size: resizedBuffer.length,
            folder: metadata.folder,
            url: processedUrl.publicUrl,
            cdnUrl: this.getCdnUrl(processedData.path),
            uploadedAt: new Date().toISOString()
          };
        }
      }

      // Generate different sizes for responsive images
      const optimizedSizes = [
        { width: 480, suffix: 'sm' },
        { width: 768, suffix: 'md' },
        { width: 1024, suffix: 'lg' },
        { width: 1920, suffix: 'xl' }
      ];

      result.optimized = [];

      for (const size of optimizedSizes) {
        if (!imageMetadata.width || imageMetadata.width <= size.width) continue;

        const optimizedBuffer = await image
          .clone()
          .resize(size.width, undefined, { fit: 'inside' })
          .webp({ quality: 85 })
          .toBuffer();

        const optimizedPath = this.getOptimizedPath(metadata.filename, metadata.folder, size.suffix);
        const { data: optData } = await this.storageClient
          .from(this.bucket)
          .upload(optimizedPath, optimizedBuffer, {
            contentType: 'image/webp',
            cacheControl: '3600'
          });

        if (optData) {
          const { data: optUrl } = this.storageClient
            .from(this.bucket)
            .getPublicUrl(optData.path);

          result.optimized.push({
            id: optData.id || optData.path,
            filename: this.getFilenameFromPath(optimizedPath),
            originalFilename: metadata.originalFilename,
            mimeType: 'image/webp',
            size: optimizedBuffer.length,
            folder: metadata.folder,
            url: optUrl.publicUrl,
            cdnUrl: this.getCdnUrl(optData.path),
            uploadedAt: new Date().toISOString(),
            metadata: { width: size.width, suffix: size.suffix }
          });
        }
      }
    } catch (error) {
      console.error('Image processing error:', error);
      // Don't fail the entire upload if processing fails
    }

    return result;
  }

  /**
   * Process videos - generate thumbnails and convert formats
   */
  private async processVideo(
    buffer: Buffer,
    metadata: FileMetadata,
    options: FileUploadOptions
  ): Promise<Partial<ProcessingResult>> {
    const result: Partial<ProcessingResult> = {};

    try {
      // For video processing, you would typically use FFmpeg
      // This is a placeholder for video processing logic
      console.log('Video processing not yet implemented');
      
      // Generate video thumbnail would go here
      // const thumbnail = await this.generateVideoThumbnail(buffer, metadata);
      // result.thumbnail = thumbnail;
    } catch (error) {
      console.error('Video processing error:', error);
    }

    return result;
  }

  /**
   * Delete file and all its variants
   */
  async deleteFile(filePath: string): Promise<ServiceResponse<boolean>> {
    return this.executeWithRetry(async () => {
      const { error } = await this.storageClient
        .from(this.bucket)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      // Also delete variants (thumbnails, optimized versions)
      await this.deleteFileVariants(filePath);

      return true;
    });
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath: string): Promise<ServiceResponse<FileMetadata>> {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.storageClient
        .from(this.bucket)
        .list(this.getDirectoryFromPath(filePath), {
          search: this.getFilenameFromPath(filePath)
        });

      if (error) {
        throw new Error(`Failed to get file metadata: ${error.message}`);
      }

      const file = data?.[0];
      if (!file) {
        throw new Error('File not found');
      }

      const { data: urlData } = this.storageClient
        .from(this.bucket)
        .getPublicUrl(filePath);

      return {
        id: file.id || filePath,
        filename: file.name,
        originalFilename: file.name,
        mimeType: file.metadata?.mimetype || 'application/octet-stream',
        size: file.metadata?.size || 0,
        folder: this.getDirectoryFromPath(filePath),
        url: urlData.publicUrl,
        cdnUrl: this.getCdnUrl(filePath),
        uploadedAt: file.created_at || new Date().toISOString()
      };
    });
  }

  /**
   * List files in folder
   */
  async listFiles(folder: string = '', limit: number = 100): Promise<ServiceResponse<FileMetadata[]>> {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.storageClient
        .from(this.bucket)
        .list(folder, { limit });

      if (error) {
        throw new Error(`Failed to list files: ${error.message}`);
      }

      const files: FileMetadata[] = (data || []).map(file => {
        const fullPath = folder ? `${folder}/${file.name}` : file.name;
        const { data: urlData } = this.storageClient
          .from(this.bucket)
          .getPublicUrl(fullPath);

        return {
          id: file.id || fullPath,
          filename: file.name,
          originalFilename: file.name,
          mimeType: file.metadata?.mimetype || 'application/octet-stream',
          size: file.metadata?.size || 0,
          folder,
          url: urlData.publicUrl,
          cdnUrl: this.getCdnUrl(fullPath),
          uploadedAt: file.created_at || new Date().toISOString()
        };
      });

      return files;
    });
  }

  // Utility Methods

  private async convertToBuffer(file: Buffer | File | Blob): Promise<Buffer> {
    if (Buffer.isBuffer(file)) {
      return file;
    }
    
    if (file instanceof File || file instanceof Blob) {
      const arrayBuffer = await file.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    
    throw new Error('Unsupported file type');
  }

  private getOriginalFilename(file: Buffer | File | Blob, providedName?: string): string {
    if (providedName) return providedName;
    if (file instanceof File) return file.name;
    return `file_${Date.now()}`;
  }

  private async detectMimeType(buffer: Buffer, filename: string): Promise<string> {
    // Simple mime type detection based on file extension
    const ext = filename.split('.').pop()?.toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      csv: 'text/csv'
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  private validateFile(buffer: Buffer, mimeType: string, options: FileUploadOptions): void {
    const allowedTypes = options.allowedMimeTypes || config.supabaseStorage.allowedMimeTypes;
    const maxSize = options.maxSize || config.supabaseStorage.maxFileSize;

    if (!allowedTypes.includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed`);
    }

    if (buffer.length > maxSize) {
      throw new Error(`File size ${buffer.length} exceeds maximum ${maxSize}`);
    }
  }

  private generateFilename(originalFilename: string, folder?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = originalFilename.split('.').pop();
    const baseName = originalFilename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${baseName}_${timestamp}_${random}.${ext}`;
  }

  private getCdnUrl(path: string): string | undefined {
    return config.supabaseStorage.cdnUrl 
      ? `${config.supabaseStorage.cdnUrl}/${this.bucket}/${path}`
      : undefined;
  }

  private getThumbnailPath(filename: string, folder: string): string {
    const baseName = filename.replace(/\.[^/.]+$/, '');
    return `${folder}/thumbnails/${baseName}_thumb.jpg`;
  }

  private getProcessedPath(filename: string, folder: string): string {
    const baseName = filename.replace(/\.[^/.]+$/, '');
    return `${folder}/processed/${baseName}_processed.jpg`;
  }

  private getOptimizedPath(filename: string, folder: string, suffix: string): string {
    const baseName = filename.replace(/\.[^/.]+$/, '');
    return `${folder}/optimized/${baseName}_${suffix}.webp`;
  }

  private getDirectoryFromPath(path: string): string {
    return path.substring(0, path.lastIndexOf('/'));
  }

  private getFilenameFromPath(path: string): string {
    return path.substring(path.lastIndexOf('/') + 1);
  }

  private async deleteFileVariants(originalPath: string): Promise<void> {
    const filename = this.getFilenameFromPath(originalPath);
    const folder = this.getDirectoryFromPath(originalPath);
    const baseName = filename.replace(/\.[^/.]+$/, '');
    
    const variantPaths = [
      `${folder}/thumbnails/${baseName}_thumb.jpg`,
      `${folder}/processed/${baseName}_processed.jpg`,
      `${folder}/optimized/${baseName}_sm.webp`,
      `${folder}/optimized/${baseName}_md.webp`,
      `${folder}/optimized/${baseName}_lg.webp`,
      `${folder}/optimized/${baseName}_xl.webp`
    ];

    try {
      await this.storageClient.from(this.bucket).remove(variantPaths);
    } catch (error) {
      console.error('Error deleting file variants:', error);
    }
  }

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }
}

export const storageService = new StorageService();
export default storageService;