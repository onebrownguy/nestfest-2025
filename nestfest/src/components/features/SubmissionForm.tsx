'use client'

import React, { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { Submission, SubmissionFile } from '@/types'
import { 
  Form, 
  FormInput, 
  FormTextarea, 
  FormSelect, 
  FormSubmit, 
  Button,
  ProgressBar
} from '@/components/ui'
import { 
  CloudArrowUpIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  PresentationChartBarIcon,
  CodeBracketIcon,
  PaperClipIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface SubmissionFormData {
  title: string
  description: string
  category_id: string
  tags: string
  external_links?: string
}

interface SubmissionFormProps {
  submission?: Partial<Submission>
  competitionId: string
  roundId: string
  categories: Array<{ value: string; label: string }>
  maxFiles?: number
  maxFileSize?: number // in bytes
  allowedFileTypes?: string[]
  onSubmit: (data: SubmissionFormData, files: File[]) => Promise<void>
  onSaveDraft?: (data: SubmissionFormData, files: File[]) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  className?: string
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) {
    return <PhotoIcon className="h-5 w-5" />
  }
  if (fileType.startsWith('video/')) {
    return <VideoCameraIcon className="h-5 w-5" />
  }
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
    return <PresentationChartBarIcon className="h-5 w-5" />
  }
  if (fileType.includes('text') || fileType.includes('document')) {
    return <DocumentTextIcon className="h-5 w-5" />
  }
  if (fileType.includes('javascript') || fileType.includes('python') || fileType.includes('code')) {
    return <CodeBracketIcon className="h-5 w-5" />
  }
  return <PaperClipIcon className="h-5 w-5" />
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({
  submission,
  competitionId,
  roundId,
  categories,
  maxFiles = 10,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  allowedFileTypes = [],
  onSubmit,
  onSaveDraft,
  onCancel,
  loading = false,
  className
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({})

  const form = useForm<SubmissionFormData>({
    defaultValues: {
      title: submission?.title || '',
      description: submission?.description || '',
      category_id: submission?.category_id || '',
      tags: submission?.metadata?.tags?.join(', ') || '',
      external_links: submission?.metadata?.external_links?.join('\n') || ''
    }
  })

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    const errors: Record<string, string> = {}
    rejectedFiles.forEach(({ file, errors: fileErrors }) => {
      errors[file.name] = fileErrors.map((e: any) => e.message).join(', ')
    })
    
    // Validate file count
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      errors['count'] = `Maximum ${maxFiles} files allowed`
      setFileErrors(errors)
      return
    }

    // Validate file sizes
    acceptedFiles.forEach(file => {
      if (file.size > maxFileSize) {
        errors[file.name] = `File too large. Maximum size: ${formatFileSize(maxFileSize)}`
      }
    })

    // Validate file types if specified
    if (allowedFileTypes.length > 0) {
      acceptedFiles.forEach(file => {
        const isAllowed = allowedFileTypes.some(type => 
          file.type.includes(type) || file.name.toLowerCase().endsWith(type)
        )
        if (!isAllowed) {
          errors[file.name] = `File type not allowed. Allowed types: ${allowedFileTypes.join(', ')}`
        }
      })
    }

    if (Object.keys(errors).length > 0) {
      setFileErrors(errors)
      return
    }

    // Clear errors and add files
    setFileErrors({})
    setUploadedFiles(prev => [...prev, ...acceptedFiles])

    // Simulate upload progress
    acceptedFiles.forEach(file => {
      const fileKey = file.name + file.size
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
        }
        setUploadProgress(prev => ({ ...prev, [fileKey]: progress }))
      }, 200)
    })
  }, [uploadedFiles.length, maxFiles, maxFileSize, allowedFileTypes])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    disabled: loading
  })

  const removeFile = (index: number) => {
    const file = uploadedFiles[index]
    const fileKey = file.name + file.size
    
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    setUploadProgress(prev => {
      const { [fileKey]: removed, ...rest } = prev
      return rest
    })
    setFileErrors(prev => {
      const { [file.name]: removed, ...rest } = prev
      return rest
    })
  }

  const handleSubmit = async (data: SubmissionFormData) => {
    try {
      // Process tags
      const processedData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        external_links: data.external_links ? 
          data.external_links.split('\n').map(link => link.trim()).filter(Boolean) : []
      }
      
      await onSubmit(processedData, uploadedFiles)
    } catch (error) {
      console.error('Submission failed:', error)
    }
  }

  const handleSaveDraft = async (data: SubmissionFormData) => {
    if (!onSaveDraft) return
    
    try {
      const processedData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        external_links: data.external_links ? 
          data.external_links.split('\n').map(link => link.trim()).filter(Boolean) : []
      }
      
      await onSaveDraft(processedData, uploadedFiles)
    } catch (error) {
      console.error('Save draft failed:', error)
    }
  }

  return (
    <div className={`max-w-4xl mx-auto ${className || ''}`}>
      <Form form={form} onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h3>
          
          <div className="space-y-4">
            <FormInput
              name="title"
              label="Submission Title"
              placeholder="Enter a descriptive title for your submission"
              required
            />

            <FormTextarea
              name="description"
              label="Description"
              placeholder="Describe your submission, methodology, key features, or findings..."
              rows={4}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                name="category_id"
                label="Category"
                options={[
                  { value: '', label: 'Select a category' },
                  ...categories
                ]}
                required
              />

              <FormInput
                name="tags"
                label="Tags (comma-separated)"
                placeholder="e.g., machine learning, web development, mobile app"
                helperText="Use tags to help categorize and discover your submission"
              />
            </div>

            <FormTextarea
              name="external_links"
              label="External Links (optional)"
              placeholder="https://github.com/username/project&#10;https://demo.example.com&#10;https://video.example.com"
              rows={3}
              helperText="Add relevant links such as GitHub repository, live demo, or video presentation (one per line)"
            />
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Files & Documents
          </h3>

          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isDragActive ? 'Drop files here' : 'Upload your files'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Maximum {maxFiles} files, {formatFileSize(maxFileSize)} per file
              {allowedFileTypes.length > 0 && (
                <><br />Allowed types: {allowedFileTypes.join(', ')}</>
              )}
            </p>
          </div>

          {/* File Errors */}
          {Object.keys(fileErrors).length > 0 && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              {Object.entries(fileErrors).map(([file, error]) => (
                <div key={file} className="flex items-center text-sm text-red-700 dark:text-red-300">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  <span className="font-medium">{file}:</span>
                  <span className="ml-1">{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Uploaded Files ({uploadedFiles.length}/{maxFiles})
              </h4>
              
              {uploadedFiles.map((file, index) => {
                const fileKey = file.name + file.size
                const progress = uploadProgress[fileKey] || 0
                const isComplete = progress >= 100
                
                return (
                  <div 
                    key={fileKey}
                    className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center flex-1">
                      <div className="text-gray-500 dark:text-gray-400 mr-3">
                        {getFileIcon(file.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                        
                        {!isComplete && (
                          <div className="mt-1">
                            <ProgressBar 
                              progress={progress} 
                              size="sm" 
                              color="blue"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-3 flex items-center gap-2">
                      {isComplete && (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      )}
                      
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        disabled={loading}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <div>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {onSaveDraft && (
              <Button
                type="button"
                variant="outline"
                onClick={() => form.handleSubmit(handleSaveDraft)()}
                disabled={loading}
              >
                Save as Draft
              </Button>
            )}
            
            <FormSubmit
              loading={loading}
              disabled={uploadedFiles.length === 0}
            >
              Submit Entry
            </FormSubmit>
          </div>
        </div>
      </Form>
    </div>
  )
}