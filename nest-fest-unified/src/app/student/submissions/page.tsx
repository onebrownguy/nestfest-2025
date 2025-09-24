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

export default async function StudentSubmissionsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  if (user.role !== 'student') {
    redirect('/dashboard')
  }

  const mySubmissions = [
    {
      id: '1',
      competitionId: '1',
      competitionTitle: 'Tech Innovation Challenge 2025',
      projectTitle: 'AI-Powered Healthcare Assistant',
      teamName: 'AI Health Innovators',
      status: 'submitted',
      submittedAt: '2025-09-20T10:30:00Z',
      lastModified: '2025-09-20T10:30:00Z',
      judgeScore: null,
      feedback: null,
      documents: [
        { name: 'Business Plan.pdf', size: '2.4 MB', uploadedAt: '2025-09-20T09:15:00Z' },
        { name: 'Prototype Demo.mp4', size: '15.2 MB', uploadedAt: '2025-09-20T09:45:00Z' },
        { name: 'Pitch Deck.pptx', size: '8.7 MB', uploadedAt: '2025-09-20T10:00:00Z' }
      ],
      teamMembers: [
        { name: 'Alex Chen', role: 'Lead Developer', email: 'alex@mit.edu' },
        { name: 'Sarah Kim', role: 'Product Manager', email: 'sarah@mit.edu' },
        { name: 'Mike Johnson', role: 'Designer', email: 'mike@mit.edu' }
      ],
      category: 'Technology',
      prize: '$50,000',
      deadline: '2025-10-15T23:59:59Z'
    },
    {
      id: '2',
      competitionId: '2',
      competitionTitle: 'Sustainable Business Model Challenge',
      projectTitle: 'Carbon Neutral Supply Chain Platform',
      teamName: 'EcoSolutions',
      status: 'draft',
      submittedAt: null,
      lastModified: '2025-09-22T14:15:00Z',
      judgeScore: null,
      feedback: null,
      documents: [
        { name: 'Initial Proposal.docx', size: '1.8 MB', uploadedAt: '2025-09-18T16:30:00Z' },
        { name: 'Market Research.xlsx', size: '3.2 MB', uploadedAt: '2025-09-22T14:00:00Z' }
      ],
      teamMembers: [
        { name: 'Emily Davis', role: 'CEO', email: 'emily@stanford.edu' },
        { name: 'James Wilson', role: 'CTO', email: 'james@stanford.edu' }
      ],
      category: 'Sustainability',
      prize: '$25,000',
      deadline: '2025-11-20T23:59:59Z'
    },
    {
      id: '3',
      competitionId: '1',
      competitionTitle: 'Tech Innovation Challenge 2025',
      projectTitle: 'Smart Education Platform',
      teamName: 'EduTech Pioneers',
      status: 'under_review',
      submittedAt: '2025-09-15T16:45:00Z',
      lastModified: '2025-09-15T16:45:00Z',
      judgeScore: 8.2,
      feedback: 'Strong technical implementation and clear market need. Consider expanding on monetization strategy.',
      documents: [
        { name: 'Technical Spec.pdf', size: '4.1 MB', uploadedAt: '2025-09-15T15:30:00Z' },
        { name: 'User Research.pdf', size: '2.8 MB', uploadedAt: '2025-09-15T16:00:00Z' },
        { name: 'Financial Model.xlsx', size: '1.5 MB', uploadedAt: '2025-09-15T16:15:00Z' },
        { name: 'Demo Video.mov', size: '25.3 MB', uploadedAt: '2025-09-15T16:45:00Z' }
      ],
      teamMembers: [
        { name: 'Lisa Park', role: 'Product Lead', email: 'lisa@berkeley.edu' },
        { name: 'Tom Rodriguez', role: 'Engineering', email: 'tom@berkeley.edu' },
        { name: 'Anna Schmidt', role: 'Research', email: 'anna@berkeley.edu' },
        { name: 'David Kim', role: 'Marketing', email: 'david@berkeley.edu' }
      ],
      category: 'Technology',
      prize: '$50,000',
      deadline: '2025-10-15T23:59:59Z'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'under_review': return 'bg-purple-100 text-purple-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'draft':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        )
      case 'under_review':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

  const formatFileSize = (bytes: string) => {
    return bytes
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
          <span className="text-gray-900 font-medium">My Submissions</span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Submissions
              </h1>
              <p className="text-gray-600">
                Track and manage your competition applications and submissions.
              </p>
            </div>
            <Link href="/student/competitions">
              <Button className="bg-blue-600 hover:bg-blue-700">
                + New Application
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{mySubmissions.length}</p>
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
                <p className="text-sm font-medium text-gray-600">Submitted</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mySubmissions.filter(s => s.status === 'submitted' || s.status === 'under_review').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mySubmissions.filter(s => s.status === 'draft').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">8.2</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="space-y-6">
          {mySubmissions.map((submission) => (
            <div key={submission.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {getStatusIcon(submission.status)}
                      <h3 className="text-xl font-bold text-gray-900 ml-2">{submission.projectTitle}</h3>
                    </div>
                    <p className="text-gray-600 mb-1">{submission.competitionTitle}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Team: {submission.teamName}</span>
                      <span>•</span>
                      <span>Prize: {submission.prize}</span>
                      <span>•</span>
                      <span>Category: {submission.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                      {submission.status.replace('_', ' ')}
                    </span>
                    {submission.judgeScore && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">{submission.judgeScore}/10</div>
                        <div className="text-xs text-gray-500">Judge Score</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deadline Warning */}
                <div className="mb-4">
                  <div className="flex items-center text-sm text-red-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Deadline: {new Date(submission.deadline).toLocaleDateString()}
                    {new Date(submission.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                      <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                        Due Soon!
                      </span>
                    )}
                  </div>
                </div>

                {/* Judge Feedback */}
                {submission.feedback && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-800">Judge Feedback</h4>
                        <p className="mt-1 text-sm text-blue-700">{submission.feedback}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Team Members */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Team Members ({submission.teamMembers.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {submission.teamMembers.map((member, idx) => (
                      <div key={idx} className="bg-gray-100 rounded-lg px-3 py-1 text-sm">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-gray-500 ml-1">({member.role})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Submitted Documents ({submission.documents.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {submission.documents.map((doc, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="ml-2 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <span>{formatFileSize(doc.size)}</span>
                              <span className="mx-1">•</span>
                              <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3">
                  <Link href={`/student/submissions/${submission.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                  {submission.status === 'draft' && (
                    <Link href={`/student/submissions/${submission.id}/edit`}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Continue Editing
                      </Button>
                    </Link>
                  )}
                  {submission.status !== 'draft' && (
                    <Button variant="outline" size="sm">
                      Download Submission
                    </Button>
                  )}
                  <div className="flex-1"></div>
                  <div className="text-xs text-gray-500">
                    {submission.status === 'draft'
                      ? `Last modified: ${new Date(submission.lastModified).toLocaleDateString()}`
                      : `Submitted: ${new Date(submission.submittedAt!).toLocaleDateString()}`
                    }
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {mySubmissions.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by applying to a competition.</p>
            <div className="mt-6">
              <Link href="/student/competitions">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Browse Competitions
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}