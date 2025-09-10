'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/provider'
import { Button } from '@/components/ui'
import { 
  UserGroupIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'

// Mock team data - will be replaced with real API calls
const mockTeams = [
  {
    id: 1,
    name: 'Innovation Squad',
    description: 'Building the future of sustainable technology',
    members: 4,
    maxMembers: 5,
    university: 'Austin Community College',
    project: 'EcoTracker - Carbon Footprint App',
    tags: ['Sustainability', 'Mobile App', 'React Native'],
    looking: ['Frontend Developer', 'UX Designer'],
    leader: 'Sarah Chen'
  },
  {
    id: 2,
    name: 'Code Crusaders',
    description: 'Solving real-world problems with AI and machine learning',
    members: 3,
    maxMembers: 4,
    university: 'University of Texas',
    project: 'MedAI - Healthcare Diagnosis Assistant',
    tags: ['AI/ML', 'Healthcare', 'Python'],
    looking: ['ML Engineer'],
    leader: 'Alex Rodriguez'
  },
  {
    id: 3,
    name: 'Digital Pioneers',
    description: 'Revolutionizing education through interactive technology',
    members: 5,
    maxMembers: 5,
    university: 'Texas State University',
    project: 'EduVerse - Virtual Learning Platform',
    tags: ['EdTech', 'VR/AR', 'Unity'],
    looking: [],
    leader: 'Maya Patel'
  }
]

export default function TeamsPage() {
  const { user, isAuthenticated } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')

  const filteredTeams = mockTeams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'recruiting' && team.looking.length > 0) ||
                         (selectedFilter === 'my-university' && team.university === user?.university)
    
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <TrophyIcon className="h-8 w-8 text-indigo-600" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">NestFest</span>
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/showcase" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Showcase
              </Link>
              <Link href="/live" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Live Event
              </Link>
              {isAuthenticated ? (
                <Link href="/student">
                  <Button variant="primary" size="sm">Dashboard</Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="primary" size="sm">Login</Button>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Team Formation Hub
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Join existing teams or create your own to compete in NestFest 2025
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams, projects, or skills..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="all">All Teams</option>
              <option value="recruiting">Currently Recruiting</option>
              <option value="my-university">My University</option>
            </select>
          </div>

          {/* Create Team Button */}
          {isAuthenticated && (
            <Button variant="primary" leftIcon={<PlusIcon className="h-4 w-4" />}>
              Create New Team
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Teams</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{mockTeams.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <PlusIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Open Positions</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {mockTeams.reduce((acc, team) => acc + team.looking.length, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Universities</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {new Set(mockTeams.map(team => team.university)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <div key={team.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                {/* Team Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      {team.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Led by {team.leader}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                    <UserGroupIcon className="h-4 w-4" />
                    <span>{team.members}/{team.maxMembers}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {team.description}
                </p>

                {/* Project */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Project: {team.project}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {team.university}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {team.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Looking For */}
                {team.looking.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Looking for:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {team.looking.map((role) => (
                        <span
                          key={role}
                          className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm">
                    View Details
                  </Button>
                  {team.looking.length > 0 && isAuthenticated && (
                    <Button variant="primary" size="sm">
                      Join Team
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTeams.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No teams found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your search criteria or create a new team.
            </p>
            {isAuthenticated && (
              <div className="mt-6">
                <Button variant="primary" leftIcon={<PlusIcon className="h-4 w-4" />}>
                  Create Your Team
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}