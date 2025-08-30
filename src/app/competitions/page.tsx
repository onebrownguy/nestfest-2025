'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/provider'
import { Button } from '@/components/ui'
import { 
  TrophyIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  TagIcon,
  CalendarDaysIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'

// Mock competition data
const mockCompetitions = [
  {
    id: 1,
    title: 'Sustainability Innovation Challenge',
    description: 'Create solutions that address environmental challenges and promote sustainable living practices.',
    category: 'Sustainability',
    prize: '$15,000',
    participants: 47,
    maxParticipants: 100,
    deadline: '2025-03-15',
    startDate: '2025-01-15',
    endDate: '2025-03-20',
    status: 'registration_open',
    difficulty: 'Intermediate',
    tags: ['Environment', 'Green Tech', 'Impact'],
    sponsors: ['EcoTech Corp', 'Green Future Foundation'],
    judges: ['Dr. Sarah Johnson', 'Mark Chen (CTO, EcoSolutions)'],
    requirements: ['Team of 2-5 members', 'Working prototype required', 'Presentation under 10 minutes']
  },
  {
    id: 2,
    title: 'AI for Good Hackathon',
    description: 'Leverage artificial intelligence and machine learning to solve pressing social issues.',
    category: 'AI/ML',
    prize: '$20,000',
    participants: 63,
    maxParticipants: 80,
    deadline: '2025-02-28',
    startDate: '2025-01-10',
    endDate: '2025-03-05',
    status: 'registration_open',
    difficulty: 'Advanced',
    tags: ['AI', 'Machine Learning', 'Social Impact'],
    sponsors: ['TechForGood Inc', 'AI Research Lab'],
    judges: ['Prof. Maria Rodriguez', 'Alex Kim (AI Researcher)'],
    requirements: ['Technical expertise in AI/ML', 'Open source solution', 'Ethical AI principles']
  },
  {
    id: 3,
    title: 'Student Entrepreneur Pitch',
    description: 'Present your startup idea to industry leaders and compete for funding and mentorship.',
    category: 'Business',
    prize: '$10,000 + Mentorship',
    participants: 28,
    maxParticipants: 50,
    deadline: '2025-03-01',
    startDate: '2025-02-01',
    endDate: '2025-03-10',
    status: 'registration_open',
    difficulty: 'Beginner',
    tags: ['Entrepreneurship', 'Business Plan', 'Pitch'],
    sponsors: ['Venture Capital Partners', 'Austin Startup Hub'],
    judges: ['Jennifer Walsh (VC Partner)', 'David Park (Serial Entrepreneur)'],
    requirements: ['Business plan required', '5-minute pitch presentation', 'Market analysis']
  },
  {
    id: 4,
    title: 'Mobile App Innovation',
    description: 'Design and develop innovative mobile applications that enhance everyday life.',
    category: 'Mobile Development',
    prize: '$12,000',
    participants: 71,
    maxParticipants: 120,
    deadline: '2025-02-20',
    startDate: '2025-01-05',
    endDate: '2025-02-25',
    status: 'active',
    difficulty: 'Intermediate',
    tags: ['Mobile', 'iOS', 'Android', 'User Experience'],
    sponsors: ['Mobile Solutions Corp', 'App Development Agency'],
    judges: ['Lisa Chen (Mobile UX Designer)', 'Tom Anderson (Mobile Developer)'],
    requirements: ['Native or cross-platform app', 'Published on app store/demo', 'User testing results']
  }
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'registration_open':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'active':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'judging':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'completed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'registration_open':
      return 'Registration Open'
    case 'active':
      return 'Competition Active'
    case 'judging':
      return 'Under Review'
    case 'completed':
      return 'Completed'
    default:
      return 'Unknown'
  }
}

export default function CompetitionsPage() {
  const { user, isAuthenticated } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')

  const categories = ['all', ...new Set(mockCompetitions.map(comp => comp.category))]
  const difficulties = ['all', ...new Set(mockCompetitions.map(comp => comp.difficulty))]

  const filteredCompetitions = mockCompetitions.filter(comp => {
    const matchesCategory = selectedCategory === 'all' || comp.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'all' || comp.difficulty === selectedDifficulty
    return matchesCategory && matchesDifficulty
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const timeDiff = deadlineDate.getTime() - today.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    return daysDiff
  }

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
              <Link href="/teams" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Teams
              </Link>
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
            NestFest 2025 Competitions
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Compete in multiple categories and win amazing prizes while solving real-world challenges
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <TagIcon className="h-5 w-5 text-gray-400" />
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <AcademicCapIcon className="h-5 w-5 text-gray-400" />
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty === 'all' ? 'All Levels' : difficulty}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Competitions</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{mockCompetitions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Prize Pool</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">$57K+</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Participants</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {mockCompetitions.reduce((acc, comp) => acc + comp.participants, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Open for Registration</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {mockCompetitions.filter(comp => comp.status === 'registration_open').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Competitions Grid */}
        <div className="space-y-6">
          {filteredCompetitions.map((competition) => {
            const daysUntilDeadline = getDaysUntilDeadline(competition.deadline)
            
            return (
              <div key={competition.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <TrophyIcon className="h-6 w-6 text-yellow-500 mt-0.5" />
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {competition.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(competition.status)}`}>
                              {getStatusText(competition.status)}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {competition.category}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              • {competition.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {competition.description}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{competition.prize}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Prize Pool</div>
                      </div>
                      {daysUntilDeadline > 0 && (
                        <div className="text-right">
                          <div className="text-lg font-semibold text-orange-600">{daysUntilDeadline} days</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">until deadline</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {competition.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Timeline</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>Start: {formatDate(competition.startDate)}</div>
                        <div>End: {formatDate(competition.endDate)}</div>
                        <div className="font-medium text-red-600 dark:text-red-400">
                          Deadline: {formatDate(competition.deadline)}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <UserGroupIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Participation</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>{competition.participants}/{competition.maxParticipants} registered</div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: `${(competition.participants / competition.maxParticipants) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AcademicCapIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Judges</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {competition.judges.slice(0, 2).map((judge, index) => (
                          <div key={index}>{judge}</div>
                        ))}
                        {competition.judges.length > 2 && (
                          <div>+{competition.judges.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Requirements Preview */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Requirements:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {competition.requirements.slice(0, 2).map((req, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-indigo-500 mt-1">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                      {competition.requirements.length > 2 && (
                        <li className="text-indigo-600 dark:text-indigo-400 ml-4">
                          +{competition.requirements.length - 2} more requirements
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" className="flex-1">
                      View Full Details
                    </Button>
                    {competition.status === 'registration_open' && isAuthenticated && (
                      <Button variant="primary">
                        Register Now
                      </Button>
                    )}
                    {!isAuthenticated && (
                      <Link href="/login">
                        <Button variant="primary">
                          Login to Register
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredCompetitions.length === 0 && (
          <div className="text-center py-12">
            <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No competitions found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your filters to see more competitions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}