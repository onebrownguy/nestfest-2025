import React from 'react'
import Link from 'next/link'
import { 
  TrophyIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'

export const metadata = {
  title: 'Competition Rules',
  description: 'NestFest 2025 competition rules, guidelines, and eligibility requirements for all participants.'
}

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <TrophyIcon className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">NestFest</span>
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/about" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">About</Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">Contact</Link>
              <Link href="/showcase" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">Showcase</Link>
              <Link href="/login">
                <Button variant="primary" size="sm">Login</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <DocumentTextIcon className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            NestFest 2025 Competition Rules
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Please read these rules carefully before participating in any NestFest competition. 
            By registering, you agree to abide by all rules and guidelines.
          </p>
        </div>

        {/* Last Updated */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
              Last updated: January 15, 2025
            </span>
          </div>
        </div>

        <div className="space-y-12">
          {/* Eligibility */}
          <section>
            <div className="flex items-center mb-6">
              <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Eligibility Requirements</h2>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Who Can Participate</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span>Current students enrolled in any accredited educational institution</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span>Recent graduates (within 12 months of graduation)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span>Participants must be 18 years or older, or have parental consent</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span>Teams can have 1-5 members, all members must meet eligibility criteria</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span>International students are welcome to participate</span>
                </li>
              </ul>
              
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Restrictions</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 mt-1">•</span>
                  <span>NestFest organizers, judges, and their immediate family members are not eligible</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 mt-1">•</span>
                  <span>Previous grand prize winners are not eligible for the same competition category</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 mt-1">•</span>
                  <span>Participants can only be part of one team per competition</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Competition Guidelines */}
          <section>
            <div className="flex items-center mb-6">
              <TrophyIcon className="h-8 w-8 text-yellow-500 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Competition Guidelines</h2>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Submission Requirements</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300 mb-8">
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2 mt-1">•</span>
                  <span>All submissions must be original work created during the competition period</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2 mt-1">•</span>
                  <span>Projects must address the specified competition theme or challenge</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2 mt-1">•</span>
                  <span>Teams must provide a working prototype or detailed proof of concept</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2 mt-1">•</span>
                  <span>Written documentation (business plan, technical documentation, or proposal)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2 mt-1">•</span>
                  <span>Presentation materials (slides, demo video, or live presentation)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2 mt-1">•</span>
                  <span>All submissions must be in English or include English translations</span>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Deadlines & Timeline</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">•</span>
                  <span>Registration deadline: March 1, 2025</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">•</span>
                  <span>Submission deadline: March 15, 2025, 11:59 PM CT</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">•</span>
                  <span>Judging period: March 16-25, 2025</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">•</span>
                  <span>Final presentations: March 28-29, 2025</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">•</span>
                  <span>Winners announced: March 30, 2025</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Contact & Questions */}
          <section>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Questions About the Rules?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                If you have any questions about these rules or need clarification on any requirements, 
                please don't hesitate to contact our support team.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/contact">
                  <Button variant="primary">Contact Support</Button>
                </Link>
                <Link href="/showcase">
                  <Button variant="outline">Browse Projects</Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}