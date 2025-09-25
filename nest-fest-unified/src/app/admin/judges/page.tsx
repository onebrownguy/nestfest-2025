'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Judge {
  id: string
  name: string
  email: string
  university: string
  expertise: string[]
  status: 'active' | 'inactive' | 'pending'
  assignedCompetitions: string[]
  totalReviews: number
  averageScore: number
  joinedAt: string
  lastActive: string
}

const mockJudges: Judge[] = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@stanford.edu',
    university: 'Stanford University',
    expertise: ['Technology', 'AI/ML', 'Healthcare'],
    status: 'active',
    assignedCompetitions: ['Tech Innovation Challenge', 'FinTech Innovation Sprint'],
    totalReviews: 23,
    averageScore: 8.4,
    joinedAt: '2025-07-15T10:00:00Z',
    lastActive: '2025-09-23T14:30:00Z'
  },
  {
    id: '2',
    name: 'Prof. Michael Rodriguez',
    email: 'm.rodriguez@mit.edu',
    university: 'MIT',
    expertise: ['Finance', 'Business Strategy', 'Sustainability'],
    status: 'active',
    assignedCompetitions: ['Sustainable Business Model Challenge'],
    totalReviews: 18,
    averageScore: 7.9,
    joinedAt: '2025-07-20T09:15:00Z',
    lastActive: '2025-09-23T11:20:00Z'
  },
  {
    id: '3',
    name: 'Dr. Emily Watson',
    email: 'ewatson@berkeley.edu',
    university: 'UC Berkeley',
    expertise: ['Social Impact', 'Policy', 'Public Health'],
    status: 'active',
    assignedCompetitions: ['Social Impact Startup Competition'],
    totalReviews: 15,
    averageScore: 8.7,
    joinedAt: '2025-08-01T16:45:00Z',
    lastActive: '2025-09-22T19:15:00Z'
  },
  {
    id: '4',
    name: 'Prof. David Kumar',
    email: 'dkumar@harvard.edu',
    university: 'Harvard University',
    expertise: ['Finance', 'Technology', 'Entrepreneurship'],
    status: 'pending',
    assignedCompetitions: [],
    totalReviews: 0,
    averageScore: 0,
    joinedAt: '2025-09-20T10:00:00Z',
    lastActive: '2025-09-20T10:00:00Z'
  },
  {
    id: '5',
    name: 'Dr. Lisa Park',
    email: 'lpark@caltech.edu',
    university: 'Caltech',
    expertise: ['Technology', 'Engineering', 'Innovation'],
    status: 'inactive',
    assignedCompetitions: ['Tech Innovation Challenge'],
    totalReviews: 31,
    averageScore: 8.1,
    joinedAt: '2025-06-10T14:20:00Z',
    lastActive: '2025-08-15T12:30:00Z'
  }
]

export default function AdminJudgesPage() {
  const [judges] = useState<Judge[]>(mockJudges)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)

  const filteredJudges = judges.filter(judge => {
    const matchesStatus = filterStatus === 'all' || judge.status === filterStatus
    const matchesSearch = judge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         judge.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         judge.university.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'pending':
        return (
          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
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
              <Link href="/admin" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                NEST FEST 2025
              </Link>
              <span className="ml-4 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                Admin Panel
              </span>
            </div>
            <nav className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Judges Management</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Navigation Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center text-sm text-gray-500">
          <Link href="/admin" className="hover:text-gray-700">Admin Dashboard</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900 font-medium">Judges Management</span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Judges Management
              </h1>
              <p className="text-gray-600">
                Manage judges, assignments, and evaluation oversight.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowInviteModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                + Invite Judge
              </Button>
              <Button variant="outline">
                Bulk Actions
              </Button>
            </div>
          </div>
        </div>

        {/* Judge Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Judges</p>
                <p className="text-2xl font-bold text-gray-900">
                  {judges.filter(j => j.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Invitations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {judges.filter(j => j.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {judges.reduce((sum, j) => sum + j.totalReviews, 0)}
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
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(judges.reduce((sum, j) => sum + j.averageScore, 0) / judges.filter(j => j.averageScore > 0).length).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Judges</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search judges by name, email, or university"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Judges List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Judges ({filteredJudges.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredJudges.map((judge) => (
              <div key={judge.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {getStatusIcon(judge.status)}
                      <h4 className="text-lg font-medium text-gray-900 ml-2">{judge.name}</h4>
                      <span className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(judge.status)}`}>
                        {judge.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Email:</span> {judge.email}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">University:</span> {judge.university}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {judge.expertise.map((skill, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        {judge.status === 'active' && (
                          <>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Reviews:</span> {judge.totalReviews}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Average Score:</span> {judge.averageScore}/10
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">Assigned:</span> {judge.assignedCompetitions.length} competitions
                            </p>
                          </>
                        )}
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Joined:</span> {new Date(judge.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {judge.assignedCompetitions.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Assigned Competitions</h5>
                        <div className="flex flex-wrap gap-2">
                          {judge.assignedCompetitions.map((competition, idx) => (
                            <span key={idx} className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                              {competition}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    {judge.status === 'pending' && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                          Decline
                        </Button>
                      </>
                    )}
                    {judge.status === 'active' && (
                      <>
                        <Button size="sm" variant="outline">
                          Assign to Competition
                        </Button>
                        <Button size="sm" variant="outline">
                          View Reviews
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline">
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Judge Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invite New Judge</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Dr. Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="jane.smith@university.edu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Harvard University"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expertise Areas</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Technology, AI/ML, Healthcare (comma separated)"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Send Invitation
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}