'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function StudentTeamContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)
  const [user] = useState({
    id: '3',
    email: 'student@university.edu',
    name: 'Sample Student',
    role: 'student',
    university: 'MIT'
  }) // Mock user for demo

  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      setShowSuccess(true)
      // Remove the parameter from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('created')
      router.replace(newUrl.pathname, { scroll: false })

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [searchParams, router])

  const myTeams = [
    {
      id: '1',
      name: 'AI Health Innovators',
      competition: 'Tech Innovation Challenge 2025',
      competitionId: '1',
      project: 'AI-Powered Healthcare Assistant',
      status: 'active',
      role: 'Team Lead',
      createdAt: '2025-08-15T09:00:00Z',
      members: [
        {
          id: '1',
          name: 'Sample Student',
          email: 'student@university.edu',
          university: 'MIT',
          role: 'Team Lead',
          avatar: null,
          status: 'active',
          joinedAt: '2025-08-15T09:00:00Z',
          skills: ['Product Strategy', 'Leadership', 'AI/ML']
        },
        {
          id: '2',
          name: 'Alex Chen',
          email: 'alex@mit.edu',
          university: 'MIT',
          role: 'Lead Developer',
          avatar: null,
          status: 'active',
          joinedAt: '2025-08-16T14:30:00Z',
          skills: ['React', 'Node.js', 'Python', 'AI/ML']
        },
        {
          id: '3',
          name: 'Sarah Kim',
          email: 'sarah@mit.edu',
          university: 'MIT',
          role: 'Product Manager',
          avatar: null,
          status: 'active',
          joinedAt: '2025-08-17T10:15:00Z',
          skills: ['Product Management', 'User Research', 'Analytics']
        },
        {
          id: '4',
          name: 'Mike Johnson',
          email: 'mike@stanford.edu',
          university: 'Stanford',
          role: 'Designer',
          avatar: null,
          status: 'active',
          joinedAt: '2025-08-18T16:45:00Z',
          skills: ['UI/UX Design', 'Prototyping', 'User Testing']
        }
      ],
      recentActivity: [
        {
          id: '1',
          type: 'document_upload',
          user: 'Alex Chen',
          action: 'uploaded Business Plan v2.0',
          timestamp: '2025-09-22T14:30:00Z'
        },
        {
          id: '2',
          type: 'submission',
          user: 'Sample Student',
          action: 'submitted final project for review',
          timestamp: '2025-09-20T10:30:00Z'
        },
        {
          id: '3',
          type: 'meeting',
          user: 'Sarah Kim',
          action: 'scheduled team meeting for tomorrow 3 PM',
          timestamp: '2025-09-19T18:15:00Z'
        }
      ],
      upcomingTasks: [
        {
          id: '1',
          title: 'Finalize pitch deck',
          assignee: 'Mike Johnson',
          dueDate: '2025-09-25T17:00:00Z',
          priority: 'high',
          status: 'in_progress'
        },
        {
          id: '2',
          title: 'Complete user testing report',
          assignee: 'Sarah Kim',
          dueDate: '2025-09-27T12:00:00Z',
          priority: 'medium',
          status: 'pending'
        },
        {
          id: '3',
          title: 'Deploy demo application',
          assignee: 'Alex Chen',
          dueDate: '2025-09-26T15:00:00Z',
          priority: 'high',
          status: 'pending'
        }
      ]
    },
    {
      id: '2',
      name: 'EcoSolutions',
      competition: 'Sustainable Business Model Challenge',
      competitionId: '2',
      project: 'Carbon Neutral Supply Chain Platform',
      status: 'forming',
      role: 'Co-Founder',
      createdAt: '2025-09-01T12:00:00Z',
      members: [
        {
          id: '1',
          name: 'Sample Student',
          email: 'student@university.edu',
          university: 'MIT',
          role: 'Co-Founder',
          avatar: null,
          status: 'active',
          joinedAt: '2025-09-01T12:00:00Z',
          skills: ['Strategy', 'Sustainability', 'Business Development']
        },
        {
          id: '5',
          name: 'Emily Davis',
          email: 'emily@stanford.edu',
          university: 'Stanford',
          role: 'CEO',
          avatar: null,
          status: 'active',
          joinedAt: '2025-09-01T12:00:00Z',
          skills: ['Leadership', 'Finance', 'Operations']
        }
      ],
      recentActivity: [
        {
          id: '1',
          type: 'member_join',
          user: 'System',
          action: 'Emily Davis joined the team',
          timestamp: '2025-09-01T12:00:00Z'
        }
      ],
      upcomingTasks: [
        {
          id: '1',
          title: 'Recruit 2-3 additional team members',
          assignee: 'Emily Davis',
          dueDate: '2025-09-28T23:59:59Z',
          priority: 'high',
          status: 'in_progress'
        },
        {
          id: '2',
          title: 'Complete initial market research',
          assignee: 'Sample Student',
          dueDate: '2025-10-05T17:00:00Z',
          priority: 'medium',
          status: 'pending'
        }
      ]
    }
  ]

  const teamInvitations = [
    {
      id: '1',
      teamName: 'Social Impact Collective',
      competition: 'Social Impact Startup Competition',
      inviterName: 'Lisa Park',
      inviterEmail: 'lisa@berkeley.edu',
      inviterUniversity: 'UC Berkeley',
      message: 'Hi! We\'re looking for someone with your background in sustainability and business development. Would you like to join our team?',
      invitedAt: '2025-09-21T16:30:00Z',
      role: 'Marketing Lead'
    },
    {
      id: '2',
      teamName: 'FinTech Innovators',
      competition: 'FinTech Innovation Sprint',
      inviterName: 'David Rodriguez',
      inviterEmail: 'david@ucla.edu',
      inviterUniversity: 'UCLA',
      message: 'We need someone with product strategy experience for our mobile banking app. Interested?',
      invitedAt: '2025-09-20T11:15:00Z',
      role: 'Product Strategist'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'forming': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document_upload':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'submission':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'meeting':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'member_join':
        return (
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
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
          <span className="text-gray-900 font-medium">Team Collaboration</span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Team Collaboration
              </h1>
              <p className="text-gray-600">
                Manage your teams, collaborate on projects, and track progress.
              </p>
            </div>
            <Link href="/student/team/create">
              <Button className="bg-blue-600 hover:bg-blue-700">
                + Create New Team
              </Button>
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="text-green-800 font-medium">Team Created Successfully!</h3>
                <p className="text-green-700 text-sm mt-1">
                  Your team has been created and invitations have been sent to team members.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Team Invitations */}
        {teamInvitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Invitations</h2>
            <div className="space-y-4">
              {teamInvitations.map((invitation) => (
                <div key={invitation.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-400">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{invitation.teamName}</h3>
                        <span className="ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {invitation.role}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{invitation.competition}</p>
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <span>From: {invitation.inviterName}</span>
                        <span className="mx-2">•</span>
                        <span>{invitation.inviterUniversity}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(invitation.invitedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        &ldquo;{invitation.message}&rdquo;
                      </p>
                    </div>
                    <div className="flex space-x-3 ml-4">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Accept
                      </Button>
                      <Button variant="outline" size="sm">
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Teams */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Teams ({myTeams.length})</h2>
          <div className="space-y-6">
            {myTeams.map((team) => (
              <div key={team.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  {/* Team Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                        <span className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(team.status)}`}>
                          {team.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-1">{team.competition}</p>
                      <p className="text-lg font-medium text-gray-900 mb-2">{team.project}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>Your Role: {team.role}</span>
                        <span className="mx-2">•</span>
                        <span>{team.members.length} members</span>
                        <span className="mx-2">•</span>
                        <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Team Members */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Team Members</h4>
                      <div className="space-y-2">
                        {team.members.map((member) => (
                          <div key={member.id} className="flex items-center p-2 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {member.name.charAt(0)}
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.role} • {member.university}</p>
                            </div>
                            {member.name === user.name && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">You</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <Button variant="outline" size="sm" className="w-full">
                          Manage Members
                        </Button>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
                      <div className="space-y-3">
                        {team.recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-start">
                            <div className="flex-shrink-0 mt-0.5">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">{activity.user}</span> {activity.action}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(activity.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <Button variant="outline" size="sm" className="w-full">
                          View All Activity
                        </Button>
                      </div>
                    </div>

                    {/* Upcoming Tasks */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Upcoming Tasks</h4>
                      <div className="space-y-3">
                        {team.upcomingTasks.map((task) => (
                          <div key={task.id} className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-start justify-between mb-1">
                              <p className="text-sm font-medium text-gray-900 flex-1">{task.title}</p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">Assigned to: {task.assignee}</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <Button variant="outline" size="sm" className="w-full">
                          View All Tasks
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Team Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Link href={`/student/team/${team.id}/workspace`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Open Team Workspace
                        </Button>
                      </Link>
                      <Link href={`/student/team/${team.id}/chat`}>
                        <Button variant="outline" size="sm">
                          Team Chat
                        </Button>
                      </Link>
                      <Link href={`/student/submissions?team=${team.id}`}>
                        <Button variant="outline" size="sm">
                          View Submission
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Discovery */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Looking for a Team?</h3>
            <p className="text-gray-600 mb-4">
              Browse available teams looking for members or create your own team for upcoming competitions.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/student/team/discover">
                <Button className="bg-green-600 hover:bg-green-700">
                  Find Teams to Join
                </Button>
              </Link>
              <Link href="/student/team/discover?tab=post-profile">
                <Button variant="outline">
                  Post Looking for Team
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function StudentTeamPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading team collaboration...</p>
      </div>
    </div>}>
      <StudentTeamContent />
    </Suspense>
  )
}