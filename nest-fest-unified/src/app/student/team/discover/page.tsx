'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface TeamListing {
  id: string
  teamName: string
  competition: string
  competitionId: string
  projectTitle: string
  description: string
  lookingFor: string
  requiredSkills: string[]
  currentSize: number
  targetSize: number
  teamLead: {
    name: string
    university: string
    email: string
  }
  postedAt: string
  urgency: 'low' | 'medium' | 'high'
  isPublic: boolean
}

interface StudentListing {
  id: string
  name: string
  email: string
  university: string
  skills: string[]
  lookingFor: string
  availableFor: string[]
  bio: string
  postedAt: string
}

export default function TeamDiscoverPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'find-teams' | 'find-members' | 'post-profile'>('find-teams')

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['find-teams', 'find-members', 'post-profile'].includes(tabParam)) {
      setActiveTab(tabParam as any)
    }
  }, [searchParams])
  const [filters, setFilters] = useState({
    competition: '',
    skills: [] as string[],
    teamSize: '',
    urgency: ''
  })

  const availableTeams: TeamListing[] = [
    {
      id: '1',
      teamName: 'GreenTech Innovators',
      competition: 'Sustainable Business Model Challenge',
      competitionId: '2',
      projectTitle: 'Smart Energy Management System',
      description: 'We\'re building an AI-powered energy management system for residential buildings to reduce carbon footprint and energy costs.',
      lookingFor: 'We need a backend developer with experience in IoT and data analytics. Someone passionate about sustainability and willing to commit 15-20 hours per week.',
      requiredSkills: ['Backend Development', 'IoT', 'Data Analytics', 'Python'],
      currentSize: 2,
      targetSize: 4,
      teamLead: {
        name: 'Emma Johnson',
        university: 'Stanford University',
        email: 'emma@stanford.edu'
      },
      postedAt: '2025-09-22T10:30:00Z',
      urgency: 'high',
      isPublic: true
    },
    {
      id: '2',
      teamName: 'HealthCare Heroes',
      competition: 'Tech Innovation Challenge 2025',
      competitionId: '1',
      projectTitle: 'Mental Health Support Platform',
      description: 'Creating a platform that connects college students with mental health resources and peer support groups.',
      lookingFor: 'Looking for a UI/UX designer who understands mental health challenges and can create empathetic user experiences.',
      requiredSkills: ['UI/UX Design', 'User Research', 'Figma', 'Psychology Background'],
      currentSize: 3,
      targetSize: 5,
      teamLead: {
        name: 'Michael Chen',
        university: 'UC Berkeley',
        email: 'michael@berkeley.edu'
      },
      postedAt: '2025-09-21T16:45:00Z',
      urgency: 'medium',
      isPublic: true
    },
    {
      id: '3',
      teamName: 'EduFinance Solutions',
      competition: 'FinTech Innovation Sprint',
      competitionId: '4',
      projectTitle: 'Student Loan Management App',
      description: 'Building a fintech app that helps students manage and optimize their loan payments with AI-powered recommendations.',
      lookingFor: 'Need a finance expert or someone with experience in lending/banking to help with compliance and business model validation.',
      requiredSkills: ['Finance', 'Banking', 'Compliance', 'Business Strategy'],
      currentSize: 2,
      targetSize: 3,
      teamLead: {
        name: 'Sarah Williams',
        university: 'MIT',
        email: 'sarah@mit.edu'
      },
      postedAt: '2025-09-20T14:20:00Z',
      urgency: 'high',
      isPublic: true
    }
  ]

  const availableStudents: StudentListing[] = [
    {
      id: '1',
      name: 'Alex Rodriguez',
      email: 'alex@harvard.edu',
      university: 'Harvard University',
      skills: ['React', 'Node.js', 'MongoDB', 'AWS', 'Machine Learning'],
      lookingFor: 'Looking to join a tech team working on AI/ML projects. Interested in healthcare or education applications.',
      availableFor: ['Tech Innovation Challenge 2025', 'Social Impact Startup Competition'],
      bio: 'Computer Science major with 3+ years of full-stack development experience. Built 2 successful web applications and worked at a health-tech startup last summer.',
      postedAt: '2025-09-23T09:15:00Z'
    },
    {
      id: '2',
      name: 'Jessica Park',
      email: 'jessica@stanford.edu',
      university: 'Stanford University',
      skills: ['Product Management', 'Market Research', 'Business Strategy', 'Figma', 'Analytics'],
      lookingFor: 'Seeking a product manager role in a team focused on sustainability or social impact. Strong in user research and go-to-market strategy.',
      availableFor: ['Sustainable Business Model Challenge', 'Social Impact Startup Competition'],
      bio: 'Business major with product management internship at a clean-tech startup. Led the launch of a mobile app with 10K+ users.',
      postedAt: '2025-09-22T13:30:00Z'
    },
    {
      id: '3',
      name: 'David Kim',
      email: 'david@ucla.edu',
      university: 'UCLA',
      skills: ['Finance', 'Data Analytics', 'Excel', 'Python', 'Financial Modeling'],
      lookingFor: 'Looking for a fintech team where I can apply my finance knowledge. Open to CFO or business analyst roles.',
      availableFor: ['FinTech Innovation Sprint'],
      bio: 'Finance major with investment banking internship experience. Strong in financial modeling and market analysis.',
      postedAt: '2025-09-21T11:45:00Z'
    }
  ]

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredTeams = availableTeams.filter(team => {
    if (filters.competition && team.competitionId !== filters.competition) return false
    if (filters.urgency && team.urgency !== filters.urgency) return false
    if (filters.skills.length > 0) {
      const hasSkill = filters.skills.some(skill => team.requiredSkills.includes(skill))
      if (!hasSkill) return false
    }
    return true
  })

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
              <Link href="/student/team">
                <Button variant="outline" size="sm">
                  ← Back to My Teams
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Navigation Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
          <span className="mx-2">›</span>
          <Link href="/student/team" className="hover:text-gray-700">Team Collaboration</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900 font-medium">Discover Teams</span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Team Discovery
          </h1>
          <p className="text-gray-600">
            Find teams looking for members or discover talented individuals to join your team.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'find-teams', label: 'Find Teams', count: availableTeams.length },
                { id: 'find-members', label: 'Find Members', count: availableStudents.length },
                { id: 'post-profile', label: 'Post Your Profile', count: null }
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
                  {tab.count !== null && (
                    <span className={`ml-2 py-1 px-2 rounded-full text-xs ${
                      activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Find Teams Tab */}
        {activeTab === 'find-teams' && (
          <div>
            {/* Filters */}
            <div className="mb-6 bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Filter Teams</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Competition</label>
                  <select
                    value={filters.competition}
                    onChange={(e) => setFilters(prev => ({...prev, competition: e.target.value}))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Competitions</option>
                    <option value="1">Tech Innovation Challenge</option>
                    <option value="2">Sustainable Business Model</option>
                    <option value="3">Social Impact Startup</option>
                    <option value="4">FinTech Innovation Sprint</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                  <select
                    value={filters.urgency}
                    onChange={(e) => setFilters(prev => ({...prev, urgency: e.target.value}))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Urgency Levels</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Skills</label>
                  <input
                    type="text"
                    placeholder="e.g. React, Design, Marketing"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Teams List */}
            <div className="space-y-6">
              {filteredTeams.map((team) => (
                <div key={team.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{team.teamName}</h3>
                          <span className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(team.urgency)}`}>
                            {team.urgency} priority
                          </span>
                        </div>
                        <p className="text-gray-600 mb-1">{team.competition}</p>
                        <p className="text-lg font-medium text-gray-900 mb-2">{team.projectTitle}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Team Size</div>
                        <div className="text-lg font-bold text-blue-600">
                          {team.currentSize}/{team.targetSize}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 mb-4">{team.description}</p>

                    {/* Looking For */}
                    <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                      <h4 className="font-medium text-blue-900 mb-1">Looking For:</h4>
                      <p className="text-blue-800 text-sm">{team.lookingFor}</p>
                    </div>

                    {/* Skills */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Required Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {team.requiredSkills.map((skill) => (
                          <span key={skill} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Team Lead & Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {team.teamLead.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{team.teamLead.name}</p>
                          <p className="text-xs text-gray-600">{team.teamLead.university}</p>
                        </div>
                        <div className="ml-6 text-xs text-gray-500">
                          Posted {new Date(team.postedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Apply to Join
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Find Members Tab */}
        {activeTab === 'find-members' && (
          <div className="space-y-6">
            {availableStudents.map((student) => (
              <div key={student.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-lg font-medium">
                        {student.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                        <p className="text-gray-600">{student.university}</p>
                        <p className="text-sm text-gray-500">
                          Posted {new Date(student.postedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{student.bio}</p>

                  <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                    <h4 className="font-medium text-green-900 mb-1">Looking For:</h4>
                    <p className="text-green-800 text-sm">{student.lookingFor}</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {student.skills.map((skill) => (
                        <span key={skill} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Available For:</h4>
                    <div className="flex flex-wrap gap-2">
                      {student.availableFor.map((comp) => (
                        <span key={comp} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                      Invite to Team
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Post Profile Tab */}
        {activeTab === 'post-profile' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Your Profile</h2>
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Post Your Profile</h3>
              <p className="mt-2 text-sm text-gray-600 max-w-sm mx-auto">
                Create a profile to let teams know about your skills and what you're looking for.
              </p>
              <Button className="mt-6 bg-green-600 hover:bg-green-700">
                Create Profile
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}