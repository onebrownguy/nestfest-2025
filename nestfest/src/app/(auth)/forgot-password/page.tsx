'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Form, FormInput, FormSubmit } from '@/components/ui/Form'

interface ForgotPasswordForm {
  email: string
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<ForgotPasswordForm>({
    defaultValues: {
      email: ''
    }
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    if (isLoading) return
    
    setError(null)
    setSuccessMessage(null)

    // Basic email validation
    if (!data.email || !data.email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reset email')
      }

      setIsEmailSent(true)
      setSuccessMessage('Password reset email sent! Please check your inbox.')
      form.reset()
      
      // Auto redirect to login after 5 seconds
      setTimeout(() => {
        router.push('/login')
      }, 5000)

    } catch (error) {
      console.error('Password reset error:', error)
      setError(error instanceof Error ? error.message : 'Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Email Sent!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We've sent password reset instructions to your email address. Please check your inbox and follow the link to reset your password.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Didn't receive the email?</strong> Check your spam folder or try again with a different email address.
              </p>
            </div>
            <div className="space-y-4">
              <Link
                href="/login"
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-full"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Sign In
              </Link>
              <button
                onClick={() => {
                  setIsEmailSent(false)
                  setSuccessMessage(null)
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Send another email
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-md p-4">
              <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
            </div>
          )}

          <Form form={form} onSubmit={onSubmit} className="space-y-6">
            <FormInput
              name="email"
              type="email"
              label="Email address"
              placeholder="Enter your email"
              autoComplete="email"
              autoFocus
            />

            <FormSubmit
              loading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send reset email'}
            </FormSubmit>
          </Form>

          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to sign in
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className="text-center">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Need help?</strong> If you're having trouble accessing your account, please contact support for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}