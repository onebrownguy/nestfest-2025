/**
 * Submission File Upload API Endpoint
 * 
 * POST /api/submissions/[id]/files - Upload files to submission
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ApiResponseBuilder, getClientIP, logAuditEvent, isValidUUID, sanitizeFilename, validateFileUpload, formatBytes } from '@/lib/api/utils'
import { authenticate, rateLimit, cors, errorHandler, securityHeaders, validateFileUpload as validateFileUploadMiddleware } from '@/lib/api/middleware'
import { permissionManager } from '@/lib/auth/permissions'
import type { AuthenticatedRequest } from '@/lib/api/middleware'

interface RouteParams {
  params: { id: string }
}

/**
 * POST /api/submissions/[id]/files
 * Upload files to a submission
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return validateFileUploadMiddleware({
          maxSize: 100 * 1024 * 1024, // 100MB
          allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/png',
            'image/gif',
            'video/mp4',
            'video/avi',
            'video/quicktime',
            'application/zip',
            'application/x-zip-compressed',
            'text/plain',
            'text/csv'
          ],
          maxFiles: 10
        })(req, async (req) => {
          return errorHandler(req, async (req) => {
            return authenticate(req, async (authReq: AuthenticatedRequest) => {
              try {
                const user = authReq.user!
                const submissionId = params.id

                if (!isValidUUID(submissionId)) {
                  return ApiResponseBuilder.error('Invalid submission ID', 400, 'INVALID_ID')
                }

                // Get submission details
                const { data: submission, error: submissionError } = await supabaseAdmin
                  .from('submissions')
                  .select(`
                    *,
                    competitions!inner(
                      status,
                      submission_deadline,
                      config
                    )
                  `)
                  .eq('id', submissionId)
                  .single()

                if (submissionError || !submission) {
                  return ApiResponseBuilder.notFound('Submission')
                }

                // Check if user can modify this submission
                const canModify = permissionManager.canModifySubmission(
                  user.role,
                  user.id,
                  {
                    user_id: submission.user_id,
                    team_id: submission.team_id,
                    status: submission.status,
                    competition_status: submission.competitions.status
                  }
                )

                if (!canModify && user.role !== 'admin' && user.role !== 'super_admin') {
                  return ApiResponseBuilder.forbidden('You cannot upload files to this submission')
                }

                // Check if submission is in editable state
                if (submission.status !== 'draft') {
                  return ApiResponseBuilder.error(
                    'Files can only be uploaded to draft submissions',
                    400,
                    'SUBMISSION_NOT_EDITABLE'
                  )
                }

                // Check submission deadline
                const now = new Date()
                const deadline = new Date(submission.competitions.submission_deadline)
                if (now > deadline) {
                  return ApiResponseBuilder.error(
                    'Submission deadline has passed',
                    400,
                    'DEADLINE_PASSED'
                  )
                }

                // Process form data
                const formData = await authReq.formData()
                const files: File[] = []
                const fileTypes: string[] = []
                const descriptions: string[] = []

                for (const [key, value] of formData.entries()) {
                  if (value instanceof File && value.size > 0) {
                    files.push(value)
                    fileTypes.push(formData.get(`${key}_type`)?.toString() || 'other')
                    descriptions.push(formData.get(`${key}_description`)?.toString() || '')
                  }
                }

                if (files.length === 0) {
                  return ApiResponseBuilder.error('No files provided', 400, 'NO_FILES')
                }

                // Check current file count
                const { data: existingFiles, count: existingCount } = await supabaseAdmin
                  .from('submission_files')
                  .select('*', { count: 'exact' })
                  .eq('submission_id', submissionId)

                const fileRestrictions = submission.competitions.config?.file_restrictions
                const maxFiles = fileRestrictions?.max_files_per_submission || 10
                const maxFileSize = fileRestrictions?.max_file_size || (100 * 1024 * 1024)
                const allowedTypes = fileRestrictions?.allowed_types || []

                if ((existingCount || 0) + files.length > maxFiles) {
                  return ApiResponseBuilder.error(
                    `Maximum ${maxFiles} files allowed per submission`,
                    400,
                    'TOO_MANY_FILES'
                  )
                }

                // Validate each file
                const uploadResults = []
                const errors = []

                for (let i = 0; i < files.length; i++) {
                  const file = files[i]
                  const fileType = fileTypes[i] || 'other'
                  const description = descriptions[i] || ''

                  // Validate file
                  const validation = validateFileUpload(file, {
                    maxSize: maxFileSize,
                    allowedTypes: allowedTypes.length > 0 ? allowedTypes : undefined
                  })

                  if (!validation.isValid) {
                    errors.push(`File ${file.name}: ${validation.error}`)
                    continue
                  }

                  try {
                    // Generate safe filename
                    const safeFilename = sanitizeFilename(file.name)
                    const storageKey = `submissions/${submissionId}/${Date.now()}_${safeFilename}`

                    // TODO: Upload to Supabase Storage
                    // const { data: uploadData, error: uploadError } = await supabase.storage
                    //   .from('submission-files')
                    //   .upload(storageKey, file)

                    // For now, simulate upload
                    const uploadData = { path: storageKey }
                    const uploadError = null

                    if (uploadError) {
                      errors.push(`File ${file.name}: Upload failed`)
                      continue
                    }

                    // Create file record
                    const { data: fileRecord, error: recordError } = await supabaseAdmin
                      .from('submission_files')
                      .insert({
                        submission_id: submissionId,
                        file_type: fileType as any,
                        original_filename: file.name,
                        storage_key: storageKey,
                        file_size: file.size,
                        mime_type: file.type,
                        upload_status: 'ready', // TODO: Set to 'processing' if virus scan needed
                        virus_scan_status: fileRestrictions?.require_virus_scan ? 'pending' : 'clean',
                        uploaded_at: new Date().toISOString()
                      })
                      .select()
                      .single()

                    if (recordError) {
                      console.error('File record creation error:', recordError)
                      errors.push(`File ${file.name}: Database record creation failed`)
                      continue
                    }

                    uploadResults.push({
                      id: fileRecord.id,
                      filename: file.name,
                      size: file.size,
                      type: fileType,
                      status: 'uploaded'
                    })

                  } catch (error: any) {
                    console.error(`File upload error for ${file.name}:`, error)
                    errors.push(`File ${file.name}: ${error.message}`)
                  }
                }

                // Update submission modification time
                await supabaseAdmin
                  .from('submissions')
                  .update({ 
                    last_modified_at: new Date().toISOString(),
                    version: submission.version + 1
                  })
                  .eq('id', submissionId)

                // Log audit event
                logAuditEvent({
                  userId: user.id,
                  action: 'submission_files_uploaded',
                  resource: 'submissions',
                  resourceId: submissionId,
                  metadata: {
                    files_uploaded: uploadResults.length,
                    files_failed: errors.length,
                    total_files: files.length,
                    file_names: uploadResults.map(r => r.filename)
                  },
                  ipAddress: getClientIP(authReq),
                  userAgent: authReq.headers.get('user-agent') || 'unknown'
                })

                const responseData = {
                  uploaded: uploadResults,
                  errors: errors,
                  summary: {
                    successful: uploadResults.length,
                    failed: errors.length,
                    total: files.length
                  }
                }

                if (errors.length > 0 && uploadResults.length === 0) {
                  return ApiResponseBuilder.error('All file uploads failed', 400, 'UPLOAD_FAILED', responseData)
                }

                const message = errors.length > 0 
                  ? `${uploadResults.length} files uploaded successfully, ${errors.length} failed`
                  : `${uploadResults.length} files uploaded successfully`

                return ApiResponseBuilder.success(responseData, message)

              } catch (error: any) {
                console.error('File upload error:', error)
                return ApiResponseBuilder.serverError('Failed to upload files')
              }
            })
          })
        })
      })
    })
  })
}

/**
 * GET /api/submissions/[id]/files
 * List files for a submission
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            try {
              const user = authReq.user!
              const submissionId = params.id

              if (!isValidUUID(submissionId)) {
                return ApiResponseBuilder.error('Invalid submission ID', 400, 'INVALID_ID')
              }

              // Get submission and check access
              const { data: submission, error: submissionError } = await supabaseAdmin
                .from('submissions')
                .select('user_id, team_id, status')
                .eq('id', submissionId)
                .single()

              if (submissionError || !submission) {
                return ApiResponseBuilder.notFound('Submission')
              }

              // Check access (similar to submission access check)
              // TODO: Implement proper access check
              
              // Get files
              const { data: files, error: filesError } = await supabaseAdmin
                .from('submission_files')
                .select(`
                  id,
                  file_type,
                  original_filename,
                  file_size,
                  mime_type,
                  upload_status,
                  thumbnail_url,
                  duration,
                  page_count,
                  virus_scan_status,
                  uploaded_at
                `)
                .eq('submission_id', submissionId)
                .order('uploaded_at', { ascending: true })

              if (filesError) {
                console.error('Files query error:', filesError)
                return ApiResponseBuilder.serverError('Failed to fetch files')
              }

              return ApiResponseBuilder.success(files || [])

            } catch (error: any) {
              console.error('Get files error:', error)
              return ApiResponseBuilder.serverError('Failed to fetch files')
            }
          })
        })
      })
    })
  })
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return cors(request, async () => {
    return new Response(null, { status: 200 })
  })
}