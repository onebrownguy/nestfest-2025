import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('nest-fest-session')

    if (!sessionCookie) {
      return null
    }

    const sessionData = JSON.parse(atob(sessionCookie.value))

    // Check if session is expired
    const sessionAge = Date.now() - sessionData.createdAt
    if (sessionAge > 24 * 60 * 60 * 1000) {
      return null
    }

    // Mock user lookup
    const mockUsers = [
      { id: '1', email: 'admin@nestfest.com', name: 'NEST FEST Admin', role: 'admin' },
      { id: '2', email: 'judge@nestfest.com', name: 'Sample Judge', role: 'judge', university: 'Stanford University' },
      { id: '3', email: 'student@university.edu', name: 'Sample Student', role: 'student', university: 'MIT' }
    ]

    return mockUsers.find(u => u.id === sessionData.userId) || null
  } catch {
    return null
  }
}

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  if (user.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">NEST FEST 2025</h1>
              <span className="ml-4 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                Admin Panel
              </span>
            </div>
            <nav className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <form action="/api/auth/logout" method="POST">
                <Button variant="outline" size="sm" type="submit">
                  Logout
                </Button>
              </form>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h2>
          <p className="text-gray-600">
            Manage competitions, users, and platform settings
          </p>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Competitions</p>
                <p className="text-2xl font-bold text-gray-900">4</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">892</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Judges</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Competition Management</h3>
            <div className="space-y-3">
              <Link href="/admin/competitions" className="block">
                <Button variant="outline" className="w-full justify-start">
                  🏆 Manage Competitions
                </Button>
              </Link>
              <Link href="/admin/submissions" className="block">
                <Button variant="outline" className="w-full justify-start">
                  📝 Review Submissions
                </Button>
              </Link>
              <Link href="/admin/judging" className="block">
                <Button variant="outline" className="w-full justify-start">
                  ⚖️ Judging Overview
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
            <div className="space-y-3">
              <Link href="/admin/users" className="block">
                <Button variant="outline" className="w-full justify-start">
                  👥 Manage Users
                </Button>
              </Link>
              <Link href="/admin/judges" className="block">
                <Button variant="outline" className="w-full justify-start">
                  ⚖️ Manage Judges
                </Button>
              </Link>
              <Link href="/admin/students" className="block">
                <Button variant="outline" className="w-full justify-start">
                  🎓 Manage Students
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports & Analytics</h3>
            <div className="space-y-3">
              <Link href="/admin/reports" className="block">
                <Button variant="outline" className="w-full justify-start">
                  📊 Generate Reports
                </Button>
              </Link>
              <Link href="/admin/analytics" className="block">
                <Button variant="outline" className="w-full justify-start">
                  📈 Platform Analytics
                </Button>
              </Link>
              <Link href="/admin/settings" className="block">
                <Button variant="outline" className="w-full justify-start">
                  ⚙️ Platform Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}