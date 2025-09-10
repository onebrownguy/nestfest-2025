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
              <Link href="/competitions" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">Competitions</Link>
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
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
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
              
              <h3 className="text-xl font-semibold mb-4 mt-8 text-gray-900 dark:text-white">Restrictions</h3>
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

          {/* Judging Criteria */}
          <section>
            <div className="flex items-center mb-6">
              <ShieldCheckIcon className="h-8 w-8 text-blue-500 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Judging Criteria</h2>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Innovation & Creativity (25%)</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Originality of the idea, creative problem-solving approach, and unique features that differentiate the solution.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Technical Excellence (25%)</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Quality of implementation, technical complexity, code quality, and proper use of technologies.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Impact & Feasibility (25%)</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Potential for real-world impact, market viability, scalability, and practical implementation.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Presentation & Communication (25%)</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Clarity of presentation, effective communication of the concept, and quality of documentation.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Conduct & Ethics */}
          <section>
            <div className="flex items-center mb-6">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Code of Conduct</h2>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Expected Behavior</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span>Respect for all participants, judges, and organizers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span>Collaborative and supportive attitude toward other competitors</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span>Honest and ethical conduct in all aspects of competition</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span>Adherence to all platform terms of service and community guidelines</span>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Prohibited Actions</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 mt-1">•</span>
                  <span>Plagiarism or submission of non-original work</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 mt-1">•</span>
                  <span>Harassment, discrimination, or offensive behavior</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 mt-1">•</span>
                  <span>Attempts to manipulate voting or judging processes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 mt-1">•</span>
                  <span>Sharing of confidential information or insider knowledge</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2 mt-1">•</span>
                  <span>Violation of intellectual property rights</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Prizes & Awards */}
          <section>
            <div className="flex items-center mb-6">
              <TrophyIcon className="h-8 w-8 text-yellow-500 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Prizes & Recognition</h2>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-500 mb-2">🥇</div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Grand Prize</h3>
                  <p className="text-2xl font-bold text-indigo-600 mb-2">$25,000</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Plus mentorship and incubator opportunity</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-400 mb-2">🥈</div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Second Place</h3>
                  <p className="text-2xl font-bold text-indigo-600 mb-2">$15,000</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Plus industry networking opportunities</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500 mb-2">🥉</div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Third Place</h3>
                  <p className="text-2xl font-bold text-indigo-600 mb-2">$10,000</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Plus professional development resources</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Additional Awards</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">People's Choice Award: $5,000</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Voted by public audience</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Best Technical Innovation: $5,000</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Most impressive technical achievement</p>
                  </div>
                </div>
              </div>
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
                <Link href="/competitions">
                  <Button variant="outline">Browse Competitions</Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}