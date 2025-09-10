'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { 
  TrophyIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  BoltIcon,
  VideoCameraIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRole = session.user.role || 'student'
      
      const dashboardRoutes = {
        admin: '/admin',
        super_admin: '/admin',
        judge: '/judge',
        reviewer: '/reviewer',
        student: '/student'
      }
      
      const redirectPath = dashboardRoutes[userRole as keyof typeof dashboardRoutes] || '/student'
      router.push(redirectPath)
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              NestFest
            </h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/live">
              <Button variant="outline" size="sm">
                <BoltIcon className="h-4 w-4 mr-2" />
                Live Event
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="primary" size="sm">Login</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to NestFest 2025
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          The premier innovation showcase event where groundbreaking ideas meet real-world impact. 
          Vote for your favorite projects and witness the future of technology.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/live">
            <Button variant="primary" size="lg">
              <VideoCameraIcon className="h-5 w-5 mr-2" />
              Join Live Event
            </Button>
          </Link>
          <Link href="/showcase">
            <Button variant="outline" size="lg">
              View Projects
            </Button>
          </Link>
          <Link href="/demo">
            <Button variant="ghost" size="lg">
              Try Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Real-time Voting */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Real-time Voting
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Cast your votes instantly and watch results update live. Support innovation with quadratic voting mechanics.
            </p>
          </div>

          {/* Interactive Presentations */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                <VideoCameraIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Interactive Presentations
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Experience Shark Tank mode, live Q&A sessions, and real-time audience engagement features.
            </p>
          </div>

          {/* Team Collaboration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Team Collaboration
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Form teams, submit projects together, and track your collective impact on the innovation ecosystem.
            </p>
          </div>
        </div>
      </section>

      {/* Event Stats */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-8 text-center">Event Highlights</h3>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold">50+</div>
              <div className="text-indigo-100">Projects</div>
            </div>
            <div>
              <div className="text-4xl font-bold">200+</div>
              <div className="text-indigo-100">Participants</div>
            </div>
            <div>
              <div className="text-4xl font-bold">10</div>
              <div className="text-indigo-100">Categories</div>
            </div>
            <div>
              <div className="text-4xl font-bold">$50K</div>
              <div className="text-indigo-100">In Prizes</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-xl">
          <ClockIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Event Starts Soon
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto">
            Don't miss out on the opportunity to witness groundbreaking innovations and cast your vote for the future.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button variant="primary" size="lg">
                Register Now
              </Button>
            </Link>
            <Link href="/live">
              <Button variant="outline" size="lg">
                <BoltIcon className="h-5 w-5 mr-2" />
                Watch Live
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-gray-900/80 dark:border-gray-800 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrophyIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold text-gray-900 dark:text-white">NestFest 2025</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                About
              </Link>
              <Link href="/rules" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Rules
              </Link>
              <Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Contact
              </Link>
              <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}