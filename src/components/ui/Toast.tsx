'use client'

import React from 'react'
import { toast, Toaster } from 'sonner'
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline'

// Toast notification functions with consistent styling
export const showToast = {
  success: (message: string, options?: any) => {
    toast.success(message, {
      duration: 4000,
      ...options
    })
  },

  error: (message: string, options?: any) => {
    toast.error(message, {
      duration: 6000,
      ...options
    })
  },

  warning: (message: string, options?: any) => {
    toast.warning(message, {
      duration: 5000,
      ...options
    })
  },

  info: (message: string, options?: any) => {
    toast.info(message, {
      duration: 4000,
      ...options
    })
  },

  loading: (message: string, options?: any) => {
    return toast.loading(message, {
      ...options
    })
  },

  promise: async <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((err: any) => string)
    },
    options?: any
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error
    }, {
      ...options
    })
  }
}

// Custom Toast Container Component
export const ToastContainer: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      expand={true}
      richColors={true}
      closeButton={true}
    />
  )
}

// Action Toast Component (with buttons)
interface ActionToastProps {
  message: string
  actionLabel: string
  onAction: () => void
  onDismiss?: () => void
  variant?: 'info' | 'success' | 'warning' | 'error'
}

export const showActionToast = ({
  message,
  actionLabel,
  onAction,
  onDismiss,
  variant = 'info'
}: ActionToastProps) => {
  const variantStyles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200'
  }

  const buttonStyles = {
    info: 'text-blue-600 hover:text-blue-700',
    success: 'text-green-600 hover:text-green-700',
    warning: 'text-yellow-600 hover:text-yellow-700',
    error: 'text-red-600 hover:text-red-700'
  }

  toast.custom((t) => (
    <div
      className={`
        p-4 rounded-lg shadow-lg border max-w-md w-full
        ${variantStyles[variant]}
        ${t.visible ? 'animate-enter' : 'animate-leave'}
      `}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex-1 mr-4">
          {message}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onAction()
              toast.dismiss(t.id)
            }}
            className={`text-sm font-medium ${buttonStyles[variant]}`}
          >
            {actionLabel}
          </button>
          <button
            onClick={() => {
              onDismiss?.()
              toast.dismiss(t.id)
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  ), {
    duration: 8000
  })
}

// Progress Toast Component
interface ProgressToastProps {
  message: string
  progress: number // 0-100
  variant?: 'info' | 'success'
}

export const showProgressToast = (toastId: string, { 
  message, 
  progress,
  variant = 'info'
}: ProgressToastProps) => {
  const progressColor = variant === 'success' ? 'bg-green-500' : 'bg-blue-500'
  
  toast.custom((t) => (
    <div
      className={`
        p-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-md w-full
        ${t.visible ? 'animate-enter' : 'animate-leave'}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-900">
          {message}
        </p>
        <span className="text-xs text-gray-500">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${progressColor} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
    </div>
  ), {
    id: toastId,
    duration: Infinity
  })
}

// Batch operations toast
export const showBatchToast = {
  start: (operation: string, total: number) => {
    return toast.loading(`${operation} 0 of ${total} items...`, {
      id: `batch-${Date.now()}`,
      duration: Infinity
    })
  },

  update: (toastId: string, operation: string, completed: number, total: number) => {
    toast.loading(`${operation} ${completed} of ${total} items...`, {
      id: toastId
    })
  },

  complete: (toastId: string, operation: string, total: number, errors: number = 0) => {
    toast.dismiss(toastId)
    
    if (errors === 0) {
      showToast.success(`Successfully ${operation.toLowerCase()} ${total} items`)
    } else if (errors < total) {
      showToast.warning(`${operation} completed with ${errors} errors. ${total - errors} items processed successfully.`)
    } else {
      showToast.error(`${operation} failed for all items`)
    }
  }
}

// Export the main toast functions
export { toast }
export default showToast