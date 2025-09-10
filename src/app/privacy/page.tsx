'use client';

import Link from 'next/link'
import { TrophyIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'

export default function PrivacyPolicy() {
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
              <Link href="/rules" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">Rules</Link>
              <Link href="/login">
                <Button variant="primary" size="sm">Login</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-8 sm:px-12 sm:py-12">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">1. Introduction</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Welcome to NestFest ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our competition platform.
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  By using NestFest, you agree to the collection and use of information in accordance with this policy. 
                  If you do not agree with our policies and practices, please do not use our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Personal Information</h3>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                  <li>Name and contact information (email, phone number)</li>
                  <li>Educational institution and student/faculty ID</li>
                  <li>Account credentials and authentication data</li>
                  <li>Profile information (biography, skills, interests)</li>
                  <li>Competition submissions and related content</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Usage Data</h3>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Pages visited and time spent on pages</li>
                  <li>Click patterns and interaction data</li>
                  <li>Competition participation history</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Technical Data</h3>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                  <li>Cookies and similar tracking technologies</li>
                  <li>Log files and error reports</li>
                  <li>Performance metrics and analytics</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">We use the information we collect to:</p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                  <li>Provide and maintain our platform services</li>
                  <li>Process competition entries and manage events</li>
                  <li>Facilitate judging and voting processes</li>
                  <li>Send notifications about competitions and results</li>
                  <li>Improve user experience and platform functionality</li>
                  <li>Ensure security and prevent fraud</li>
                  <li>Comply with legal obligations</li>
                  <li>Communicate updates and announcements</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">4. Information Sharing</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">We may share your information with:</p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                  <li><strong>Competition Organizers:</strong> To facilitate event management</li>
                  <li><strong>Judges and Reviewers:</strong> Limited access to evaluate submissions</li>
                  <li><strong>Educational Institutions:</strong> For verification and reporting purposes</li>
                  <li><strong>Service Providers:</strong> Third-party services that help operate our platform</li>
                  <li><strong>Legal Authorities:</strong> When required by law or to protect rights</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 mt-4">
                  We do not sell, trade, or rent your personal information to third parties for marketing purposes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">5. Your Rights</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">You have the right to:</p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate or incomplete data</li>
                  <li>Request deletion of your data (subject to legal requirements)</li>
                  <li>Opt-out of certain communications</li>
                  <li>Export your data in a portable format</li>
                  <li>Lodge a complaint with supervisory authorities</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">6. Contact Us</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded">
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>NestFest Support</strong><br />
                    Email: support@edge-team.org<br />
                    Address: Austin Community College<br />
                    Phone: (512) 223-4000
                  </p>
                </div>
              </section>

              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  © {new Date().getFullYear()} NestFest. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}