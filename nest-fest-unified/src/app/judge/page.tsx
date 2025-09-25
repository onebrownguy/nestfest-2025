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

export default async function JudgePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  if (user.role !== 'judge') {
    redirect('/dashboard')
  }

  const pendingSubmissions = [
    {
      id: '1',
      teamName: 'InnovateTech Solutions',
      competition: 'Tech Innovation Challenge',
      title: 'AI-Powered Healthcare Assistant',
      submittedAt: '2025-09-20T10:30:00Z',
      status: 'pending'
    },
    {
      id: '2',
      teamName: 'EcoVenture Dynamics',
      competition: 'Sustainable Business Model',
      title: 'Carbon Neutral Supply Chain Platform',
      submittedAt: '2025-09-19T14:45:00Z',
      status: 'pending'
    },
    {
      id: '3',
      teamName: 'Social Impact Collective',
      competition: 'Social Impact Startup',
      title: 'Education Access Network',
      submittedAt: '2025-09-18T09:15:00Z',
      status: 'pending'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">NEST FEST 2025</h1>
              <span className="ml-4 px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                Judge Panel
              </span>
            </div>
            <nav className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              {user.university && (
                <span className="text-xs text-gray-500">• {user.university}</span>
              )}
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
            Judge Dashboard
          </h2>
          <p className="text-gray-600">
            Review and score competition submissions
          </p>
        </div>

        {/* Judge Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{pendingSubmissions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Reviews</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">8.4</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Competitions</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/judge/submissions" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    📝 Review Submissions
                  </Button>
                </Link>
                <Link href="/judge/scoring" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    ⭐ Scoring Dashboard
                  </Button>
                </Link>
                <Link href="/judge/analytics" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    📈 View Analytics
                  </Button>
                </Link>
                <Link href="/judge/feedback" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    💬 Feedback Management
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Pending Submissions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submissions Awaiting Review</h3>
              <div className="space-y-4">
                {pendingSubmissions.map((submission) => (
                  <div key={submission.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{submission.teamName}</h4>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {submission.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{submission.competition}</p>
                    <p className="text-sm text-gray-800 font-medium mb-2">{submission.title}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Start Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}