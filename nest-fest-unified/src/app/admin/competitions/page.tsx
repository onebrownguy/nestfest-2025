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

export default async function AdminCompetitionsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  if (user.role !== 'admin') {
    redirect('/dashboard')
  }

  const competitions = [
    {
      id: '1',
      title: 'Tech Innovation Challenge 2025',
      category: 'Technology',
      status: 'active',
      startDate: '2025-08-01T00:00:00Z',
      endDate: '2025-10-15T23:59:59Z',
      registrationDeadline: '2025-09-15T23:59:59Z',
      minTeamSize: 2,
      maxTeamSize: 5,
      prizePool: 50000,
      participants: 156,
      submissions: 89,
      judges: 8,
      description: 'Develop innovative technology solutions that address real-world problems in healthcare, education, or sustainability.',
      criteria: ['Innovation (30%)', 'Technical Implementation (25%)', 'Market Potential (20%)', 'Presentation (15%)', 'Team Collaboration (10%)'],
      sponsors: ['Tech Corp', 'Innovation Labs', 'Future Fund'],
      createdAt: '2025-07-15T10:00:00Z',
      createdBy: 'admin@nestfest.com'
    },
    {
      id: '2',
      title: 'Sustainable Business Model Challenge',
      category: 'Sustainability',
      status: 'active',
      startDate: '2025-08-15T00:00:00Z',
      endDate: '2025-11-20T23:59:59Z',
      registrationDeadline: '2025-10-20T23:59:59Z',
      minTeamSize: 1,
      maxTeamSize: 4,
      prizePool: 25000,
      participants: 89,
      submissions: 34,
      judges: 6,
      description: 'Create a business model that prioritizes environmental sustainability while maintaining profitability.',
      criteria: ['Sustainability Impact (35%)', 'Business Viability (30%)', 'Innovation (20%)', 'Scalability (15%)'],
      sponsors: ['Green Ventures', 'Eco Foundation'],
      createdAt: '2025-07-20T14:30:00Z',
      createdBy: 'admin@nestfest.com'
    },
    {
      id: '3',
      title: 'Social Impact Startup Competition',
      category: 'Social Impact',
      status: 'draft',
      startDate: '2025-09-01T00:00:00Z',
      endDate: '2025-12-01T23:59:59Z',
      registrationDeadline: '2025-11-01T23:59:59Z',
      minTeamSize: 3,
      maxTeamSize: 6,
      prizePool: 35000,
      participants: 203,
      submissions: 0,
      judges: 5,
      description: 'Launch a startup that addresses pressing social issues in your community or globally.',
      criteria: ['Social Impact (40%)', 'Sustainability (25%)', 'Innovation (20%)', 'Execution (15%)'],
      sponsors: ['Social Ventures', 'Impact Fund', 'Community Foundation'],
      createdAt: '2025-08-01T09:15:00Z',
      createdBy: 'admin@nestfest.com'
    },
    {
      id: '4',
      title: 'FinTech Innovation Sprint',
      category: 'Finance',
      status: 'completed',
      startDate: '2025-06-01T00:00:00Z',
      endDate: '2025-09-30T23:59:59Z',
      registrationDeadline: '2025-08-30T23:59:59Z',
      minTeamSize: 2,
      maxTeamSize: 4,
      prizePool: 40000,
      participants: 67,
      submissions: 45,
      judges: 7,
      description: 'Develop financial technology solutions that improve accessibility and security for underserved populations.',
      criteria: ['Innovation (30%)', 'Security (25%)', 'User Experience (20%)', 'Market Impact (15%)', 'Technical Excellence (10%)'],
      sponsors: ['FinTech Partners', 'Banking Alliance'],
      createdAt: '2025-05-15T11:45:00Z',
      createdBy: 'admin@nestfest.com'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'draft':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        )
      case 'completed':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getDaysRemaining = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                NEST FEST 2025
              </Link>
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

      {/* Navigation Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center text-sm text-gray-500">
          <Link href="/admin" className="hover:text-gray-700">Admin Dashboard</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900 font-medium">Competition Management</span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Competition Management
              </h1>
              <p className="text-gray-600">
                Create, configure, and monitor all competitions on the platform.
              </p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              + Create New Competition
            </Button>
          </div>
        </div>

        {/* Competition Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Competitions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {competitions.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-gray-900">
                  {competitions.reduce((sum, c) => sum + c.participants, 0)}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {competitions.reduce((sum, c) => sum + c.submissions, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Prize Pool</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(competitions.reduce((sum, c) => sum + c.prizePool, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Competitions List */}
        <div className="space-y-6">
          {competitions.map((competition) => (
            <div key={competition.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {getStatusIcon(competition.status)}
                      <h3 className="text-xl font-bold text-gray-900 ml-2">{competition.title}</h3>
                      <span className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(competition.status)}`}>
                        {competition.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{competition.description}</p>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span>Category: {competition.category}</span>
                      <span>•</span>
                      <span>Team Size: {competition.minTeamSize}-{competition.maxTeamSize}</span>
                      <span>•</span>
                      <span>Prize: {formatCurrency(competition.prizePool)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {competition.status === 'active' && (
                      <div className="text-sm text-red-600 font-medium">
                        {getDaysRemaining(competition.endDate)} days remaining
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Created {new Date(competition.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{competition.participants}</div>
                    <div className="text-xs text-blue-600">Participants</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{competition.submissions}</div>
                    <div className="text-xs text-yellow-600">Submissions</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{competition.judges}</div>
                    <div className="text-xs text-purple-600">Judges</div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Timeline</h4>
                  <div className="flex items-center text-xs text-gray-600 space-x-4">
                    <div>
                      <span className="font-medium">Start:</span> {new Date(competition.startDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Registration Deadline:</span> {new Date(competition.registrationDeadline).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">End:</span> {new Date(competition.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Sponsors */}
                {competition.sponsors.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Sponsors</h4>
                    <div className="flex flex-wrap gap-2">
                      {competition.sponsors.map((sponsor, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          {sponsor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Edit Competition
                    </Button>
                    <Button variant="outline" size="sm">
                      View Submissions
                    </Button>
                    <Button variant="outline" size="sm">
                      Manage Judges
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    {competition.status === 'draft' && (
                      <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
                        Publish
                      </Button>
                    )}
                    {competition.status === 'active' && (
                      <Button size="sm" variant="outline" className="text-yellow-600 border-yellow-300 hover:bg-yellow-50">
                        Archive
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}