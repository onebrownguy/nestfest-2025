import React from 'react'
import Link from 'next/link'
import { 
  TrophyIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  LightBulbIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'

export const metadata = {
  title: 'About NestFest',
  description: 'Learn about NestFest 2025 - the premier innovation showcase event for students and entrepreneurs.'
}

export default function AboutPage() {
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
              <Link href="/showcase" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">Showcase</Link>
              <Link href="/live" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">Live</Link>
              <Link href="/login">
                <Button variant="primary" size="sm">Login</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            About NestFest 2025
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            The premier innovation showcase event where groundbreaking ideas meet real-world impact. 
            NestFest brings together students, entrepreneurs, and industry leaders to celebrate innovation and creativity.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-12 text-white text-center">
            <RocketLaunchIcon className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg max-w-3xl mx-auto">
              To create a platform where innovative ideas can flourish, connect talented individuals, 
              and provide opportunities for students and entrepreneurs to showcase their solutions to real-world challenges.
            </p>
          </div>
        </div>

        {/* What Makes Us Different */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            What Makes NestFest Special
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
              <LightBulbIcon className="h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Innovation Focus</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We prioritize groundbreaking ideas that have the potential to create meaningful impact 
                in technology, sustainability, healthcare, and social innovation.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
              <UserGroupIcon className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Community Driven</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Built by students, for students. Our platform fosters collaboration, mentorship, 
                and peer-to-peer learning in a supportive environment.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
              <ChartBarIcon className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Real Impact</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Beyond competitions, we connect participants with industry mentors, funding opportunities, 
                and resources to turn ideas into reality.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            NestFest by the Numbers
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">500+</div>
              <div className="text-gray-600 dark:text-gray-400">Participants</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">50+</div>
              <div className="text-gray-600 dark:text-gray-400">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">$75K</div>
              <div className="text-gray-600 dark:text-gray-400">Prize Pool</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">15</div>
              <div className="text-gray-600 dark:text-gray-400">Universities</div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Organized by Austin Community College
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <AcademicCapIcon className="h-16 w-16 text-indigo-600 mx-auto mb-6" />
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              NestFest is proudly organized by Austin Community College in partnership with local tech companies, 
              startups, and community organizations. Our goal is to provide students with real-world experience 
              and connections that will help launch their careers and ventures.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Join NestFest 2025?
          </h2>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button variant="primary" size="lg">
                Register Now
              </Button>
            </Link>
            <Link href="/showcase">
              <Button variant="outline" size="lg">
                Browse Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}