'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Submission {
  id: string
  teamName: string
  teamMembers: string[]
  competition: string
  title: string
  description: string
  submittedAt: string
  status: 'pending' | 'in_review' | 'completed'
  files: {
    name: string
    type: string
    url: string
  }[]
  currentScore?: {
    innovation: number
    technical: number
    market: number
    presentation: number
    collaboration: number
    total: number
    feedback: string
  }
}

interface Competition {
  id: string
  title: string
  criteria: string[]
}

const mockSubmissions: Submission[] = [
  {
    id: '1',
    teamName: 'InnovateTech Solutions',
    teamMembers: ['Alice Johnson', 'Bob Chen', 'Carol Martinez'],
    competition: 'Tech Innovation Challenge',
    title: 'AI-Powered Healthcare Assistant',
    description: 'A comprehensive AI assistant that helps healthcare professionals make better decisions by analyzing patient data, medical history, and current research to provide personalized treatment recommendations.',
    submittedAt: '2025-09-20T10:30:00Z',
    status: 'pending',
    files: [
      { name: 'presentation.pdf', type: 'application/pdf', url: '#' },
      { name: 'technical_spec.md', type: 'text/markdown', url: '#' },
      { name: 'demo_video.mp4', type: 'video/mp4', url: '#' },
      { name: 'source_code.zip', type: 'application/zip', url: '#' }
    ]
  },
  {
    id: '2',
    teamName: 'EcoVenture Dynamics',
    teamMembers: ['David Park', 'Emily Wilson'],
    competition: 'Sustainable Business Model',
    title: 'Carbon Neutral Supply Chain Platform',
    description: 'A platform that helps businesses track and optimize their supply chain to achieve carbon neutrality through AI-driven logistics optimization and renewable energy integration.',
    submittedAt: '2025-09-19T14:45:00Z',
    status: 'in_review',
    files: [
      { name: 'business_plan.pdf', type: 'application/pdf', url: '#' },
      { name: 'financial_model.xlsx', type: 'application/excel', url: '#' },
      { name: 'platform_demo.mp4', type: 'video/mp4', url: '#' }
    ],
    currentScore: {
      innovation: 8,
      technical: 7,
      market: 9,
      presentation: 8,
      collaboration: 8,
      total: 8.0,
      feedback: 'Strong business model with clear market need. Technical implementation is solid but could benefit from more advanced analytics features.'
    }
  },
  {
    id: '3',
    teamName: 'Social Impact Collective',
    teamMembers: ['Grace Thompson', 'Henry Liu', 'Isabella Rodriguez', 'James Kim'],
    competition: 'Social Impact Startup',
    title: 'Education Access Network',
    description: 'A network connecting underserved communities with educational resources, mentors, and funding opportunities through a mobile-first platform designed for low-bandwidth environments.',
    submittedAt: '2025-09-18T09:15:00Z',
    status: 'completed',
    files: [
      { name: 'impact_report.pdf', type: 'application/pdf', url: '#' },
      { name: 'user_research.pdf', type: 'application/pdf', url: '#' },
      { name: 'app_prototype.apk', type: 'application/android', url: '#' }
    ],
    currentScore: {
      innovation: 9,
      technical: 7,
      market: 8,
      presentation: 9,
      collaboration: 9,
      total: 8.4,
      feedback: 'Excellent social impact potential with thorough user research. The mobile-first approach is well-executed. Consider expanding technical features for scalability.'
    }
  }
]

const competitions: Competition[] = [
  {
    id: '1',
    title: 'Tech Innovation Challenge',
    criteria: ['Innovation (30%)', 'Technical Implementation (25%)', 'Market Potential (20%)', 'Presentation (15%)', 'Team Collaboration (10%)']
  }
]

export default function JudgeSubmissionsPage() {
  const [submissions] = useState<Submission[]>(mockSubmissions)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showScoringModal, setShowScoringModal] = useState(false)
  const [scores, setScores] = useState({
    innovation: 0,
    technical: 0,
    market: 0,
    presentation: 0,
    collaboration: 0,
    feedback: ''
  })
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_review' | 'completed'>('all')

  const filteredSubmissions = submissions.filter(sub =>
    filter === 'all' || sub.status === filter
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_review': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'in_review':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        )
      case 'completed':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      default:
        return null
    }
  }

  const handleStartReview = (submission: Submission) => {
    setSelectedSubmission(submission)
    if (submission.currentScore) {
      setScores({
        innovation: submission.currentScore.innovation,
        technical: submission.currentScore.technical,
        market: submission.currentScore.market,
        presentation: submission.currentScore.presentation,
        collaboration: submission.currentScore.collaboration,
        feedback: submission.currentScore.feedback
      })
    } else {
      setScores({
        innovation: 0,
        technical: 0,
        market: 0,
        presentation: 0,
        collaboration: 0,
        feedback: ''
      })
    }
    setShowScoringModal(true)
  }

  const calculateTotal = () => {
    return ((scores.innovation * 0.3 + scores.technical * 0.25 + scores.market * 0.2 + scores.presentation * 0.15 + scores.collaboration * 0.1)).toFixed(1)
  }

  const handleSubmitScore = () => {
    // In a real app, this would submit to an API
    console.log('Submitting score for:', selectedSubmission?.id, scores)
    setShowScoringModal(false)
    setSelectedSubmission(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/judge" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                NEST FEST 2025
              </Link>
              <span className="ml-4 px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                Judge Panel
              </span>
            </div>
            <nav className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Submission Reviews</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Navigation Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center text-sm text-gray-500">
          <Link href="/judge" className="hover:text-gray-700">Judge Dashboard</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900 font-medium">Submission Reviews</span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Submission Reviews
          </h1>
          <p className="text-gray-600">
            Evaluate and score competition submissions using our comprehensive rubric.
          </p>
        </div>

        {/* Review Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.status === 'in_review').length}
                </p>
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
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.status === 'completed').length}
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
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.currentScore).length > 0
                    ? (submissions.filter(s => s.currentScore).reduce((sum, s) => sum + s.currentScore!.total, 0) / submissions.filter(s => s.currentScore).length).toFixed(1)
                    : '0'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="block text-sm font-medium text-gray-700">Filter by Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Submissions</option>
                <option value="pending">Pending Review</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredSubmissions.length} of {submissions.length} submissions
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="space-y-6">
          {filteredSubmissions.map((submission) => (
            <div key={submission.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {getStatusIcon(submission.status)}
                      <h3 className="text-xl font-bold text-gray-900 ml-2">{submission.title}</h3>
                      <span className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{submission.description}</p>
                    <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
                      <span><span className="font-medium">Team:</span> {submission.teamName}</span>
                      <span>•</span>
                      <span><span className="font-medium">Competition:</span> {submission.competition}</span>
                      <span>•</span>
                      <span><span className="font-medium">Submitted:</span> {new Date(submission.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {submission.currentScore && (
                    <div className="ml-6 text-center">
                      <div className="text-2xl font-bold text-blue-600">{submission.currentScore.total}</div>
                      <div className="text-xs text-gray-500">Current Score</div>
                    </div>
                  )}
                </div>

                {/* Team Members */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Team Members</h4>
                  <div className="flex flex-wrap gap-2">
                    {submission.teamMembers.map((member, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {member}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Files */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Submission Files</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {submission.files.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.url}
                        className="flex items-center p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs text-gray-700 truncate">{file.name}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Current Score Display */}
                {submission.currentScore && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Current Evaluation</h4>
                    <div className="grid grid-cols-5 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{submission.currentScore.innovation}</div>
                        <div className="text-xs text-gray-500">Innovation</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{submission.currentScore.technical}</div>
                        <div className="text-xs text-gray-500">Technical</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{submission.currentScore.market}</div>
                        <div className="text-xs text-gray-500">Market</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{submission.currentScore.presentation}</div>
                        <div className="text-xs text-gray-500">Presentation</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{submission.currentScore.collaboration}</div>
                        <div className="text-xs text-gray-500">Collaboration</div>
                      </div>
                    </div>
                    {submission.currentScore.feedback && (
                      <div>
                        <div className="text-xs font-medium text-gray-900 mb-1">Feedback</div>
                        <div className="text-xs text-gray-600">{submission.currentScore.feedback}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    {submission.status === 'pending' && 'Ready for review'}
                    {submission.status === 'in_review' && 'Review in progress'}
                    {submission.status === 'completed' && 'Review completed'}
                  </div>
                  <Button
                    onClick={() => handleStartReview(submission)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submission.status === 'pending' ? 'Start Review' :
                     submission.status === 'completed' ? 'Edit Review' : 'Continue Review'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scoring Modal */}
        {showScoringModal && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Evaluate: {selectedSubmission.title}
                </h3>
                <p className="text-gray-600">Team: {selectedSubmission.teamName}</p>
              </div>

              <div className="space-y-6">
                {/* Scoring Criteria */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Scoring Criteria</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        Innovation (30%)
                        <span>{scores.innovation}/10</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={scores.innovation}
                        onChange={(e) => setScores({...scores, innovation: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        Technical Implementation (25%)
                        <span>{scores.technical}/10</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={scores.technical}
                        onChange={(e) => setScores({...scores, technical: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        Market Potential (20%)
                        <span>{scores.market}/10</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={scores.market}
                        onChange={(e) => setScores({...scores, market: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        Presentation (15%)
                        <span>{scores.presentation}/10</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={scores.presentation}
                        onChange={(e) => setScores({...scores, presentation: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        Team Collaboration (10%)
                        <span>{scores.collaboration}/10</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={scores.collaboration}
                        onChange={(e) => setScores({...scores, collaboration: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Total Score */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Total Weighted Score</span>
                    <span className="text-2xl font-bold text-blue-600">{calculateTotal()}/10</span>
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Feedback
                  </label>
                  <textarea
                    rows={4}
                    value={scores.feedback}
                    onChange={(e) => setScores({...scores, feedback: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Provide detailed feedback on the submission's strengths, areas for improvement, and specific recommendations..."
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setShowScoringModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitScore}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Submit Evaluation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}