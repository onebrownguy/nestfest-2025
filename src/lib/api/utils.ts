/**
 * API Utility Functions for NestFest Backend
 * 
 * This module provides utility functions for API responses, error handling,
 * data transformation, and common operations across all endpoints.
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiResponse, PaginatedResponse, AppError } from '@/types'
import crypto from 'crypto'

/**
 * Standard API response structure
 */
export class ApiResponseBuilder {
  static success<T>(data: T, message?: string): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data,
      ...(message && { message })
    }
    return NextResponse.json(response)
  }

  static error(
    message: string,
    status = 400,
    code?: string,
    details?: Record<string, any>
  ): NextResponse {
    const error: AppError = {
      code: code || `ERROR_${status}`,
      message,
      details,
      timestamp: new Date().toISOString()
    }

    const response: ApiResponse<never> = {
      success: false,
      error: message
    }

    return NextResponse.json(response, { status })
  }

  static paginated<T>(
    items: T[],
    total: number,
    page: number,
    perPage: number
  ): NextResponse {
    const response: PaginatedResponse<T> = {
      items,
      total,
      page,
      per_page: perPage,
      has_more: (page * perPage) < total
    }
    return NextResponse.json(response)
  }

  static notFound(resource = 'Resource'): NextResponse {
    return this.error(`${resource} not found`, 404, 'NOT_FOUND')
  }

  static unauthorized(message = 'Unauthorized access'): NextResponse {
    return this.error(message, 401, 'UNAUTHORIZED')
  }

  static forbidden(message = 'Forbidden access'): NextResponse {
    return this.error(message, 403, 'FORBIDDEN')
  }

  static validation(errors: z.ZodError): NextResponse {
    return this.error(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      { validation_errors: errors.errors }
    )
  }

  static rateLimit(): NextResponse {
    return this.error(
      'Rate limit exceeded',
      429,
      'RATE_LIMIT_EXCEEDED'
    )
  }

  static serverError(message = 'Internal server error'): NextResponse {
    return this.error(message, 500, 'INTERNAL_SERVER_ERROR')
  }
}

/**
 * Extract pagination parameters from URL searchParams
 */
export function extractPaginationParams(url: string) {
  const { searchParams } = new URL(url)
  
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)))
  const offset = (page - 1) * perPage

  return { page, perPage, offset }
}

/**
 * Extract filter parameters from URL searchParams
 */
export function extractFilterParams(url: string, allowedFilters: string[]) {
  const { searchParams } = new URL(url)
  const filters: Record<string, any> = {}

  for (const filter of allowedFilters) {
    const value = searchParams.get(filter)
    if (value !== null) {
      filters[filter] = value
    }
  }

  return filters
}

/**
 * Extract sort parameters from URL searchParams
 */
export function extractSortParams(url: string, allowedSortFields: string[]) {
  const { searchParams } = new URL(url)
  const sortBy = searchParams.get('sort_by') || 'created_at'
  const sortOrder = searchParams.get('sort_order')?.toLowerCase() === 'desc' ? 'desc' : 'asc'

  // Validate sort field
  const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at'

  return { sortBy: validSortBy, sortOrder }
}

/**
 * Generate unique submission number
 */
export function generateSubmissionNumber(competitionId: string, sequenceNumber: number): string {
  const timestamp = Date.now().toString(36)
  const competitionPrefix = competitionId.substring(0, 8)
  const sequence = sequenceNumber.toString().padStart(4, '0')
  return `SUB-${competitionPrefix}-${sequence}-${timestamp}`.toUpperCase()
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Generate team join code
 */
export function generateTeamCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  const sanitized = filename.replace(/[\/\\:*?"<>|]/g, '_')
  // Limit length
  const maxLength = 100
  const extension = sanitized.split('.').pop()
  const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'))
  
  if (nameWithoutExt.length > maxLength - (extension?.length || 0) - 1) {
    return nameWithoutExt.substring(0, maxLength - (extension?.length || 0) - 1) + '.' + extension
  }
  
  return sanitized
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  const headers = request.headers
  return (
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    headers.get('x-client-ip') ||
    'unknown'
  )
}

/**
 * Generate browser fingerprint
 */
export function generateBrowserFingerprint(request: Request): string {
  const userAgent = request.headers.get('user-agent') || ''
  const acceptLanguage = request.headers.get('accept-language') || ''
  const acceptEncoding = request.headers.get('accept-encoding') || ''
  
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${userAgent}${acceptLanguage}${acceptEncoding}`)
    .digest('hex')
    .substring(0, 16)
  
  return fingerprint
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    allowedExtensions?: string[]
  }
): { isValid: boolean; error?: string } {
  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${formatBytes(options.maxSize)}`
    }
  }

  // Check MIME type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`
    }
  }

  // Check file extension
  if (options.allowedExtensions) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !options.allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `File extension .${extension} is not allowed. Allowed extensions: ${options.allowedExtensions.join(', ')}`
      }
    }
  }

  return { isValid: true }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Deep merge objects
 */
export function deepMerge(target: any, source: any): any {
  const result = { ...target }
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
  }
  
  return result
}

/**
 * Validate UUID format
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Slug generation from string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Check if string is valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Generate random password
 */
export function generateRandomPassword(length = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  
  return password
}

/**
 * Time-based utility functions
 */
export const TimeUtils = {
  now(): string {
    return new Date().toISOString()
  },

  addHours(date: Date, hours: number): Date {
    return new Date(date.getTime() + (hours * 60 * 60 * 1000))
  },

  addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + (days * 24 * 60 * 60 * 1000))
  },

  isExpired(dateString: string): boolean {
    return new Date(dateString) < new Date()
  },

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
  }
}

/**
 * Database query helpers
 */
export const QueryHelpers = {
  /**
   * Apply filters to Supabase query builder
   */
  applyFilters(query: any, filters: Record<string, any>) {
    let filteredQuery = query

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          filteredQuery = filteredQuery.in(key, value)
        } else if (typeof value === 'string' && value.includes('%')) {
          filteredQuery = filteredQuery.ilike(key, value)
        } else {
          filteredQuery = filteredQuery.eq(key, value)
        }
      }
    }

    return filteredQuery
  },

  /**
   * Apply sorting to Supabase query
   */
  applySorting(query: any, sortBy: string, sortOrder: 'asc' | 'desc') {
    return query.order(sortBy, { ascending: sortOrder === 'asc' })
  },

  /**
   * Apply pagination to Supabase query
   */
  applyPagination(query: any, offset: number, limit: number) {
    return query.range(offset, offset + limit - 1)
  }
}

/**
 * Audit logging helper
 */
export function logAuditEvent(event: {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}) {
  console.log('AUDIT:', {
    timestamp: new Date().toISOString(),
    ...event
  })
  
  // In production, this would write to a dedicated audit log table
  // For now, we'll just log to console
}