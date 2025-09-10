'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { 
  Form, 
  FormInput, 
  FormSelect, 
  FormCheckbox,
  FormSubmit, 
  AIEnhancedFormTextarea,
  Button, 
  showToast 
} from '@/components/ui'
import { 
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  university: string
  projectDescription: string
  program: string
  graduationYear: number
  agreeTerms: boolean
  subscribeUpdates: boolean
}

const currentYear = new Date().getFullYear()
const graduationYears = Array.from(
  { length: 10 }, 
  (_, i) => ({
    value: currentYear + i,
    label: (currentYear + i).toString()
  })
)

const programs = [
  { value: '', label: 'Select your program' },
  { value: 'computer-science', label: 'Computer Science' },
  { value: 'software-engineering', label: 'Software Engineering' },
  { value: 'data-science', label: 'Data Science' },
  { value: 'information-technology', label: 'Information Technology' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'game-development', label: 'Game Development' },
  { value: 'web-development', label: 'Web Development' },
  { value: 'mobile-development', label: 'Mobile Development' },
  { value: 'ai-machine-learning', label: 'AI/Machine Learning' },
  { value: 'other', label: 'Other' }
]

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RegisterFormData>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      university: '',
      projectDescription: '',
      program: '',
      graduationYear: currentYear + 1,
      agreeTerms: false,
      subscribeUpdates: true
    }
  })

  const { watch } = form
  const password = watch('password')

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      showToast.error('Passwords do not match')
      return
    }

    if (!data.agreeTerms) {
      showToast.error('Please accept the Terms of Service')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          university: data.university,
          project_description: data.projectDescription,
          program: data.program,
          graduation_year: data.graduationYear,
          subscribe_updates: data.subscribeUpdates
        }),
      })

      const result = await response.json()

      if (response.ok) {
        showToast.success('Registration successful! Please check your email to verify your account.')
        router.push('/login?registered=true')
      } else {
        throw new Error(result.message || 'Registration failed')
      }
    } catch (error) {
      showToast.error(
        error instanceof Error ? error.message : 'Registration failed. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement Google OAuth signup
      window.location.href = '/api/auth/google?signup=true'
    } catch (error) {
      showToast.error('Google signup failed. Please try again.')
      setIsLoading(false)
    }
  }

  const handleGitHubSignup = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement GitHub OAuth signup
      window.location.href = '/api/auth/github?signup=true'
    } catch (error) {
      showToast.error('GitHub signup failed. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo/Brand */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">NF</span>
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Join NestFest
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Create your account to participate in competitions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 sm:px-10">
          {/* Social Signup */}
          <div className="space-y-3 mb-6">
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={handleGoogleSignup}
              disabled={isLoading}
              leftIcon={
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              }
            >
              Sign up with Google
            </Button>

            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={handleGitHubSignup}
              disabled={isLoading}
              leftIcon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              }
            >
              Sign up with GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Or create account with email
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <Form form={form} onSubmit={onSubmit} className="mt-6 space-y-6">
            <FormInput
              name="name"
              label="Full Name"
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />

            <FormInput
              name="email"
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              autoComplete="email"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                name="password"
                type="password"
                label="Password"
                placeholder="Create password"
                helperText="At least 8 characters"
                autoComplete="new-password"
                required
              />

              <FormInput
                name="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="Confirm password"
                autoComplete="new-password"
                required
              />
            </div>

            <FormInput
              name="university"
              label="University"
              placeholder="Enter your university"
              helperText="Optional: Helps us provide relevant opportunities"
            />

            <AIEnhancedFormTextarea
              name="projectDescription"
              label="Tell us about your coding projects or interests"
              placeholder="Describe your programming projects, hackathon experiences, favorite technologies, or what excites you about coding competitions..."
              helperText="Share your experience to help us create better competitions. AI enhancement becomes available at 150 characters."
              aiThreshold={150}
              maxLength={450}
              rows={4}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                name="program"
                label="Program of Study"
                options={programs}
              />

              <FormSelect
                name="graduationYear"
                label="Graduation Year"
                options={[
                  { value: '', label: 'Select year' },
                  ...graduationYears
                ]}
              />
            </div>

            <div className="space-y-3">
              <FormCheckbox
                name="agreeTerms"
                label="I agree to the Terms of Service and Privacy Policy"
                description="By checking this, you agree to our Terms of Service and Privacy Policy"
              />

              <FormCheckbox
                name="subscribeUpdates"
                label="Send me updates about competitions and events"
                description="Get notified about new competitions, deadlines, and platform updates"
              />
            </div>

            <FormSubmit
              loading={isLoading}
              className="w-full"
            >
              Create Account
            </FormSubmit>
          </Form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Sign in
              </Link>
            </span>
          </div>

          {/* Student Benefits */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Student Benefits
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Participate in coding competitions and hackathons</li>
              <li>• Connect with industry professionals and peers</li>
              <li>• Win prizes and gain recognition for your skills</li>
              <li>• Access to exclusive workshops and learning resources</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          Need help? Contact us at{' '}
          <a href="mailto:support@nestfest.com" className="underline hover:text-gray-700 dark:hover:text-gray-300">
            support@nestfest.com
          </a>
        </p>
      </div>
    </div>
  )
}