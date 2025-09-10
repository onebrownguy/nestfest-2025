'use client';

import Link from 'next/link'
import { TrophyIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'

export default function TermsAndConditions() {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Terms and Conditions</h1>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">1. Agreement to Terms</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  By accessing or using the NestFest platform ("Platform"), you agree to be bound by these Terms and Conditions ("Terms"). 
                  If you disagree with any part of these terms, you do not have permission to access the Platform.
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  These Terms apply to all visitors, users, and others who access or use the Platform, including but not limited to 
                  students, judges, reviewers, administrators, and educational institutions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">2. User Accounts</h2>
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Account Creation</h3>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                  <li>You must provide accurate, complete, and current information during registration</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You must be at least 13 years old to create an account</li>
                  <li>Users under 18 require parental or guardian consent</li>
                  <li>One person may not create multiple accounts without authorization</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">Account Responsibilities</h3>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                  <li>You are responsible for all activities under your account</li>
                  <li>You must notify us immediately of any unauthorized use</li>
                  <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
                  <li>You may not transfer your account to another person</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">3. Competition Rules</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  All participants must comply with specific competition rules and guidelines. By participating, you agree to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                  <li>Submit only original work or properly attributed content</li>
                  <li>Meet all eligibility requirements for specific competitions</li>
                  <li>Comply with submission deadlines and requirements</li>
                  <li>Accept judging decisions as final and binding</li>
                  <li>Grant NestFest non-exclusive rights to display submissions</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">4. Intellectual Property</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  You retain ownership of your original submissions while granting NestFest necessary rights to operate the platform. 
                  The platform itself and its original content are protected by intellectual property laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">5. Prohibited Uses</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">You may not use the Platform to:</p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                  <li>Violate any laws or regulations</li>
                  <li>Submit false or misleading information</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Interfere with Platform operations</li>
                  <li>Attempt unauthorized access</li>
                  <li>Engage in plagiarism or academic dishonesty</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">6. Disclaimers and Limitations</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The Platform is provided "as is" without warranties. We do not guarantee uninterrupted or error-free operation. 
                  Our liability is limited to the fullest extent permitted by law.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">7. Changes to Terms</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  We reserve the right to modify these Terms at any time. Material changes will be communicated to users. 
                  Continued use constitutes acceptance of modified Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">8. Contact Information</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  For questions about these Terms, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded">
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>NestFest Legal Team</strong><br />
                    Email: support@edge-team.org<br />
                    Address: Austin Community College<br />
                    Phone: (512) 223-4000
                  </p>
                </div>
              </section>

              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  © {new Date().getFullYear()} NestFest. All rights reserved. | 
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 mx-2">Privacy Policy</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}