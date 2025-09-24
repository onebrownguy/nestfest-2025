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

export default async function StudentCompetitionsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  if (user.role !== 'student') {
    redirect('/dashboard')
  }

  const availableCompetitions = [
    {
      id: '1',
      title: 'Tech Innovation Challenge 2025',
      category: 'Technology',
      prize: '$50,000',
      deadline: '2025-10-15T23:59:59Z',
      description: 'Develop innovative technology solutions that address real-world problems in healthcare, education, or sustainability.',
      requirements: ['Team of 2-5 members', 'Working prototype', 'Business plan', 'Pitch deck'],
      status: 'open',
      difficulty: 'Advanced',
      duration: '6 months',
      participants: 156,
      tags: ['AI', 'Healthcare', 'EdTech', 'Sustainability']
    },
    {
      id: '2',
      title: 'Sustainable Business Model Challenge',
      category: 'Sustainability',
      prize: '$25,000',
      deadline: '2025-11-20T23:59:59Z',
      description: 'Create a business model that prioritizes environmental sustainability while maintaining profitability.',
      requirements: ['Individual or team entry', 'Sustainability impact analysis', 'Financial projections', '10-minute presentation'],
      status: 'open',
      difficulty: 'Intermediate',
      duration: '4 months',
      participants: 89,
      tags: ['Environment', 'Business Model', 'Impact', 'Green Tech']
    },
    {
      id: '3',
      title: 'Social Impact Startup Competition',
      category: 'Social Impact',
      prize: '$35,000',
      deadline: '2025-12-01T23:59:59Z',
      description: 'Launch a startup that addresses pressing social issues in your community or globally.',
      requirements: ['Team of 3-6 members', 'Community validation', 'MVP or pilot program', 'Impact measurement plan'],
      status: 'open',
      difficulty: 'Advanced',
      duration: '8 months',
      participants: 203,
      tags: ['Social Impact', 'Community', 'Non-profit', 'Education']
    },
    {
      id: '4',
      title: 'FinTech Innovation Sprint',
      category: 'Finance',
      prize: '$40,000',
      deadline: '2025-09-30T23:59:59Z',
      description: 'Develop financial technology solutions that improve accessibility and security for underserved populations.',
      requirements: ['Team of 2-4 members', 'Security audit', 'Regulatory compliance analysis', 'Beta testing results'],
      status: 'closing_soon',
      difficulty: 'Expert',
      duration: '3 months',
      participants: 67,
      tags: ['FinTech', 'Security', 'Accessibility', 'Banking']
    }
  ]

  const myApplications = [
    {
      id: '1',
      competitionId: '1',
      title: 'Tech Innovation Challenge 2025',
      status: 'submitted',
      submittedAt: '2025-09-20T10:30:00Z',
      teamName: 'AI Health Innovators'
    },
    {
      id: '2',
      competitionId: '2',
      title: 'Sustainable Business Model Challenge',
      status: 'draft',
      lastModified: '2025-09-22T14:15:00Z',
      teamName: 'EcoSolutions'
    }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Intermediate': return 'bg-green-100 text-green-800'
      case 'Advanced': return 'bg-orange-100 text-orange-800'
      case 'Expert': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'closing_soon': return 'bg-yellow-100 text-yellow-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'under_review': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                NEST FEST 2025
              </Link>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Student Portal
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

      {/* Navigation Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900 font-medium">Competitions</span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Competition Opportunities
          </h1>
          <p className="text-gray-600">
            Discover and apply to entrepreneurship competitions that match your interests and skills.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - My Applications */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Applications</h3>
              <div className="space-y-3">
                {myApplications.map((app) => (
                  <div key={app.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getApplicationStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">{app.title}</h4>
                    <p className="text-xs text-gray-600 mb-2">Team: {app.teamName}</p>
                    <p className="text-xs text-gray-500">
                      {app.status === 'submitted'
                        ? `Submitted: ${new Date(app.submittedAt!).toLocaleDateString()}`
                        : `Modified: ${new Date(app.lastModified!).toLocaleDateString()}`
                      }
                    </p>
                    <Link href={`/student/submissions/${app.id}`} className="block mt-2">
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        {app.status === 'draft' ? 'Continue Application' : 'View Application'}
                      </Button>
                    </Link>
                  </div>
                ))}
                <Link href="/student/submissions" className="block">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Applications
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Available</span>
                  <span className="font-bold text-blue-600">{availableCompetitions.filter(c => c.status === 'open').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Applied</span>
                  <span className="font-bold text-green-600">{myApplications.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Prize Pool</span>
                  <span className="font-bold text-purple-600">$150K+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Competitions Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableCompetitions.map((competition) => (
                <div key={competition.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{competition.title}</h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(competition.status)}`}>
                            {competition.status.replace('_', ' ')}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(competition.difficulty)}`}>
                            {competition.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{competition.prize}</div>
                        <div className="text-xs text-gray-500">{competition.participants} applicants</div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                      {competition.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {competition.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Competition Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-1 font-medium">{competition.duration}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <span className="ml-1 font-medium">{competition.category}</span>
                      </div>
                    </div>

                    {/* Deadline */}
                    <div className="mb-4">
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-600">Deadline:</span>
                        <span className="ml-1 font-medium text-red-600">
                          {new Date(competition.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Requirements Preview */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Key Requirements:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {competition.requirements.slice(0, 2).map((req, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-500 mr-1">•</span>
                            {req}
                          </li>
                        ))}
                        {competition.requirements.length > 2 && (
                          <li className="text-gray-500">+ {competition.requirements.length - 2} more...</li>
                        )}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
                      <Link href={`/student/competitions/${competition.id}`} className="flex-1">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/student/competitions/${competition.id}/apply`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          Apply Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            <div className="mt-8 text-center">
              <Button variant="outline" className="px-8">
                Load More Competitions
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}