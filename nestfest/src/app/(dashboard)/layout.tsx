'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ErrorBoundary, 
  ToastContainer,
  Button
} from '@/components/ui'
import { 
  HomeIcon,
  TrophyIcon,
  DocumentTextIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

interface DashboardLayoutProps {
  children: React.ReactNode
}

// Mock user data - replace with actual auth context
const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'student' as const,
  avatar_url: null
}

const navigationItems = {
  student: [
    { name: 'Dashboard', href: '/student', icon: HomeIcon },
    { name: 'Competitions', href: '/competitions', icon: TrophyIcon },
    { name: 'My Submissions', href: '/student/submissions', icon: DocumentTextIcon },
    { name: 'Teams', href: '/teams', icon: UsersIcon },
    { name: 'Live Events', href: '/live', icon: ChartBarIcon }
  ],
  judge: [
    { name: 'Dashboard', href: '/judge', icon: HomeIcon },
    { name: 'Assigned Reviews', href: '/judge/submissions', icon: DocumentTextIcon },
    { name: 'Competitions', href: '/judge/competitions', icon: TrophyIcon },
    { name: 'Analytics', href: '/judge/analytics', icon: ChartBarIcon },
    { name: 'Guidelines', href: '/judge/guidelines', icon: CogIcon }
  ],
  reviewer: [
    { name: 'Dashboard', href: '/reviewer', icon: HomeIcon },
    { name: 'Review Queue', href: '/reviewer/queue', icon: DocumentTextIcon },
    { name: 'Completed Reviews', href: '/reviewer/completed', icon: ChartBarIcon },
    { name: 'Competitions', href: '/competitions', icon: TrophyIcon }
  ],
  admin: [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Competitions', href: '/admin/competitions', icon: TrophyIcon },
    { name: 'Users', href: '/admin/users', icon: UsersIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/admin/settings', icon: CogIcon }
  ],
  super_admin: [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Competitions', href: '/admin/competitions', icon: TrophyIcon },
    { name: 'Users', href: '/admin/users', icon: UsersIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'System', href: '/admin/system', icon: CogIcon }
  ]
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const pathname = usePathname()

  const currentNavigation = navigationItems[mockUser.role] || navigationItems.student

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    // TODO: Implement actual dark mode toggle
    document.documentElement.classList.toggle('dark')
  }

  const handleLogout = () => {
    // TODO: Implement logout
    window.location.href = '/login'
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${darkMode ? 'dark' : ''}`}>
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">NF</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                NestFest
              </span>
            </Link>
            
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {currentNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                {mockUser.avatar_url ? (
                  <img 
                    src={mockUser.avatar_url} 
                    alt={mockUser.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {mockUser.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {mockUser.role}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:ml-64">
          {/* Top bar */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>

              {/* Search */}
              <div className="flex-1 max-w-lg mx-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search competitions, submissions..."
                    className="
                      w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 
                      rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400
                    "
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Dark mode toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
                >
                  {darkMode ? (
                    <SunIcon className="h-5 w-5" />
                  ) : (
                    <MoonIcon className="h-5 w-5" />
                  )}
                </button>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg relative"
                  >
                    <BellIcon className="h-5 w-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>
                  
                  {/* Notifications dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Notifications
                        </h3>
                      </div>
                      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900 dark:text-white">
                            New competition available
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            Spring Hackathon 2024 is now open for submissions
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            2 minutes ago
                          </p>
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-900 dark:text-white">
                            Submission deadline approaching
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            AI Challenge submissions due in 2 days
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            1 hour ago
                          </p>
                        </div>
                      </div>
                      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="ghost" size="sm" className="w-full">
                          View all notifications
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile */}
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  {mockUser.avatar_url ? (
                    <img 
                      src={mockUser.avatar_url} 
                      alt={mockUser.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
        
        <ToastContainer />
      </div>
    </ErrorBoundary>
  )
}