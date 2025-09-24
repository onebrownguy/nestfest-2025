'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'students' | 'judges' | 'admins'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created' | 'lastActive'>('name')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all')

  // Mock user for demo
  const currentUser = {
    id: '1',
    email: 'admin@nestfest.com',
    name: 'NEST FEST Admin',
    role: 'admin'
  }

  const users = [
    {
      id: '1',
      name: 'NEST FEST Admin',
      email: 'admin@nestfest.com',
      role: 'admin',
      status: 'active',
      university: null,
      joinedAt: '2025-01-15T10:00:00Z',
      lastActiveAt: '2025-09-24T01:30:00Z',
      submissions: 0,
      teams: 0,
      competitions: 4,
      avatar: null,
      verified: true
    },
    {
      id: '2',
      name: 'Dr. Sarah Wilson',
      email: 'sarah.wilson@stanford.edu',
      role: 'judge',
      status: 'active',
      university: 'Stanford University',
      joinedAt: '2025-02-10T14:30:00Z',
      lastActiveAt: '2025-09-23T18:45:00Z',
      submissions: 0,
      teams: 0,
      competitions: 2,
      avatar: null,
      verified: true,
      expertise: ['Technology', 'AI/ML', 'Startups'],
      evaluations: 15
    },
    {
      id: '3',
      name: 'Sample Student',
      email: 'student@university.edu',
      role: 'student',
      status: 'active',
      university: 'MIT',
      joinedAt: '2025-03-05T09:15:00Z',
      lastActiveAt: '2025-09-24T02:00:00Z',
      submissions: 2,
      teams: 2,
      competitions: 2,
      avatar: null,
      verified: true,
      skills: ['React', 'Python', 'Product Strategy']
    },
    {
      id: '4',
      name: 'Alex Chen',
      email: 'alex@mit.edu',
      role: 'student',
      status: 'active',
      university: 'MIT',
      joinedAt: '2025-08-16T14:30:00Z',
      lastActiveAt: '2025-09-23T20:15:00Z',
      submissions: 1,
      teams: 1,
      competitions: 1,
      avatar: null,
      verified: true,
      skills: ['React', 'Node.js', 'Python', 'AI/ML']
    },
    {
      id: '5',
      name: 'Emily Davis',
      email: 'emily@stanford.edu',
      role: 'student',
      status: 'active',
      university: 'Stanford',
      joinedAt: '2025-09-01T12:00:00Z',
      lastActiveAt: '2025-09-23T16:30:00Z',
      submissions: 0,
      teams: 1,
      competitions: 1,
      avatar: null,
      verified: true,
      skills: ['Leadership', 'Finance', 'Operations']
    },
    {
      id: '6',
      name: 'Prof. Michael Rodriguez',
      email: 'mrodriguez@berkeley.edu',
      role: 'judge',
      status: 'pending',
      university: 'UC Berkeley',
      joinedAt: '2025-09-20T11:15:00Z',
      lastActiveAt: '2025-09-20T11:15:00Z',
      submissions: 0,
      teams: 0,
      competitions: 0,
      avatar: null,
      verified: false,
      expertise: ['Social Impact', 'Business Strategy'],
      evaluations: 0
    },
    {
      id: '7',
      name: 'Jessica Park',
      email: 'jessica@stanford.edu',
      role: 'student',
      status: 'inactive',
      university: 'Stanford University',
      joinedAt: '2025-07-10T13:30:00Z',
      lastActiveAt: '2025-08-15T10:20:00Z',
      submissions: 0,
      teams: 0,
      competitions: 0,
      avatar: null,
      verified: true,
      skills: ['Product Management', 'Market Research', 'Business Strategy']
    }
  ]

  const filteredUsers = users.filter(user => {
    if (activeTab !== 'all' && user.role !== activeTab.slice(0, -1)) return false
    if (filterStatus !== 'all' && user.status !== filterStatus) return false
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.university?.toLowerCase().includes(searchLower)
      )
    }
    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name)
      case 'email': return a.email.localeCompare(b.email)
      case 'created': return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
      case 'lastActive': return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
      default: return 0
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'judge': return 'bg-purple-100 text-purple-800'
      case 'student': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleStats = () => {
    return {
      total: users.length,
      students: users.filter(u => u.role === 'student').length,
      judges: users.filter(u => u.role === 'judge').length,
      admins: users.filter(u => u.role === 'admin').length,
      active: users.filter(u => u.status === 'active').length,
      pending: users.filter(u => u.status === 'pending').length
    }
  }

  const stats = getRoleStats()

  const getLastActiveText = (lastActiveAt: string) => {
    const now = new Date()
    const lastActive = new Date(lastActiveAt)
    const diffInHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) return 'Active now'
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`
    return lastActive.toLocaleDateString()
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
              <span className="text-sm text-gray-600">Welcome, {currentUser.name}</span>
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
          <span className="text-gray-900 font-medium">User Management</span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                User Management
              </h1>
              <p className="text-gray-600">
                Manage all users, roles, and permissions across the platform.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                Export Users
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
                + Add User
              </Button>
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.students}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Judges</p>
                <p className="text-2xl font-bold text-gray-900">{stats.judges}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
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
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'all', label: 'All Users', count: stats.total },
                { id: 'students', label: 'Students', count: stats.students },
                { id: 'judges', label: 'Judges', count: stats.judges },
                { id: 'admins', label: 'Admins', count: stats.admins }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 py-1 px-2 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Users</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or university..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="created">Date Created</option>
                <option value="lastActive">Last Active</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                  setSortBy('name')
                }}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {user.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.university && (
                            <div className="text-xs text-gray-400">{user.university}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                        {user.verified && (
                          <svg className="ml-1 w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Joined: {new Date(user.joinedAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Last active: {getLastActiveText(user.lastActiveAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-600">
                        {user.role === 'student' && (
                          <>
                            <div>Submissions: {user.submissions}</div>
                            <div>Teams: {user.teams}</div>
                            <div>Competitions: {user.competitions}</div>
                          </>
                        )}
                        {user.role === 'judge' && (
                          <>
                            <div>Evaluations: {(user as any).evaluations || 0}</div>
                            <div>Competitions: {user.competitions}</div>
                          </>
                        )}
                        {user.role === 'admin' && (
                          <>
                            <div>Competitions: {user.competitions}</div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        {user.status === 'pending' && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Approve
                          </Button>
                        )}
                        {user.id !== currentUser.id && (
                          <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                            Suspend
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}