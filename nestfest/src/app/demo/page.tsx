'use client'

/**
 * NestFest Platform Demo Page
 * Shows the platform's UI capabilities without external dependencies
 */

import React from 'react'
import { Button } from '@/components/ui/Button'
import { CompetitionCard } from '@/components/features/CompetitionCard'
import { QuadraticVoting } from '@/components/features/QuadraticVoting'
import { VotingResultsChart } from '@/components/charts/VotingCharts'

// Mock data for demonstration
const mockCompetitions = [
  {
    id: 'comp-1',
    name: 'Innovation Challenge 2024',
    slug: 'innovation-challenge-2024',
    description: 'A competition focused on innovative solutions for real-world problems',
    status: 'open' as const,
    submission_deadline: '2024-12-31T23:59:59Z',
    event_date: '2025-01-15T18:00:00Z',
    start_date: '2024-12-01T00:00:00Z',
    judging_start_date: '2025-01-01T00:00:00Z',
    judging_end_date: '2025-01-14T23:59:59Z',
    max_submissions_per_user: 1,
    allow_team_submissions: true,
    team_size_min: 2,
    team_size_max: 5,
    voting_enabled: true,
    public_voting_enabled: true,
    config: {
      voting_rules: {
        type: 'quadratic' as const,
        budget: 100,
        allow_ties: false,
        weight_multiplier: 1
      },
      advancement_rules: {
        type: 'top_n' as const,
        value: 10,
        tie_breaking_method: 'timestamp' as const
      },
      file_restrictions: {
        max_file_size: 10485760,
        allowed_types: ['pdf', 'jpg', 'png', 'mp4'],
        max_files_per_submission: 5,
        require_virus_scan: true
      },
      notification_settings: {
        email_enabled: true,
        sms_enabled: false,
        in_app_enabled: true,
        digest_frequency: 'daily' as const
      }
    },
    rounds: [
      {
        id: 'round-1',
        competition_id: 'comp-1',
        round_number: 1,
        name: 'Initial Submission',
        start_date: '2024-12-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        advancement_quota: 10,
        advancement_type: 'automatic' as const,
        scoring_criteria: [],
        is_public_voting_round: false
      }
    ],
    created_at: '2024-11-01T00:00:00Z'
  },
  {
    id: 'comp-2', 
    name: 'Shark Tank Style Pitch',
    slug: 'shark-tank-pitch',
    description: 'Present your startup idea to a panel of judges and investors',
    status: 'live' as const,
    submission_deadline: '2024-11-30T23:59:59Z',
    event_date: '2024-12-10T19:00:00Z',
    start_date: '2024-11-01T00:00:00Z',
    judging_start_date: '2024-12-01T00:00:00Z',
    judging_end_date: '2024-12-09T23:59:59Z',
    max_submissions_per_user: 1,
    allow_team_submissions: false,
    voting_enabled: true,
    public_voting_enabled: true,
    config: {
      voting_rules: {
        type: 'simple' as const,
        allow_ties: true,
        weight_multiplier: 1
      },
      advancement_rules: {
        type: 'top_percentage' as const,
        value: 20,
        tie_breaking_method: 'judge_preference' as const
      },
      file_restrictions: {
        max_file_size: 52428800,
        allowed_types: ['pdf', 'pptx', 'mp4'],
        max_files_per_submission: 3,
        require_virus_scan: true
      },
      notification_settings: {
        email_enabled: true,
        sms_enabled: true,
        in_app_enabled: true,
        digest_frequency: 'immediate' as const
      }
    },
    rounds: [
      {
        id: 'round-2',
        competition_id: 'comp-2',
        round_number: 1,
        name: 'Pitch Round',
        start_date: '2024-11-01T00:00:00Z',
        end_date: '2024-11-30T23:59:59Z',
        advancement_quota: 5,
        advancement_type: 'manual' as const,
        scoring_criteria: [],
        is_public_voting_round: true
      }
    ],
    created_at: '2024-10-15T00:00:00Z'
  },
  {
    id: 'comp-3',
    name: 'Sustainability Hackathon',
    slug: 'sustainability-hackathon',
    description: 'Build solutions for environmental challenges in 48 hours',
    status: 'completed' as const,
    submission_deadline: '2024-10-15T23:59:59Z',
    event_date: '2024-10-20T12:00:00Z',
    start_date: '2024-10-01T00:00:00Z',
    judging_start_date: '2024-10-16T00:00:00Z',
    judging_end_date: '2024-10-19T23:59:59Z',
    max_submissions_per_user: 1,
    allow_team_submissions: true,
    team_size_min: 3,
    team_size_max: 4,
    voting_enabled: true,
    public_voting_enabled: false,
    config: {
      voting_rules: {
        type: 'ranked' as const,
        allow_ties: false,
        weight_multiplier: 1
      },
      advancement_rules: {
        type: 'score_threshold' as const,
        value: 85,
        tie_breaking_method: 'random' as const
      },
      file_restrictions: {
        max_file_size: 20971520,
        allowed_types: ['pdf', 'jpg', 'png', 'mp4', 'zip'],
        max_files_per_submission: 8,
        require_virus_scan: true
      },
      notification_settings: {
        email_enabled: true,
        sms_enabled: false,
        in_app_enabled: true,
        digest_frequency: 'weekly' as const
      }
    },
    rounds: [
      {
        id: 'round-3',
        competition_id: 'comp-3',
        round_number: 1,
        name: 'Hackathon Submission',
        start_date: '2024-10-01T00:00:00Z',
        end_date: '2024-10-15T23:59:59Z',
        advancement_quota: 15,
        advancement_type: 'hybrid' as const,
        scoring_criteria: [],
        is_public_voting_round: false
      }
    ],
    created_at: '2024-09-15T00:00:00Z'
  }
]

const mockSubmissions = [
  { 
    id: 'sub-1', 
    competition_id: 'comp-1',
    round_id: 'round-1',
    user_id: 'user-1',
    title: 'AI-Powered Study Assistant',
    description: 'An intelligent study companion that helps students learn more effectively',
    category_id: 'tech-innovation',
    status: 'submitted' as const,
    submission_number: 'NF-2024-001',
    submitted_at: '2024-12-15T10:30:00Z',
    last_modified_at: '2024-12-15T10:30:00Z',
    metadata: {
      category: 'AI/Technology',
      tags: ['AI', 'Education', 'Study Assistant'],
      technical_requirements: ['React Native', 'Node.js', 'OpenAI API']
    },
    version: 1,
    files: [],
    reviews: [],
    votes: []
  },
  { 
    id: 'sub-2', 
    competition_id: 'comp-1',
    round_id: 'round-1',
    user_id: 'user-2',
    title: 'Smart Campus Navigation',
    description: 'Navigate your campus with ease using AR and real-time location data',
    category_id: 'mobile-apps',
    status: 'submitted' as const,
    submission_number: 'NF-2024-002',
    submitted_at: '2024-12-16T14:20:00Z',
    last_modified_at: '2024-12-16T14:20:00Z',
    metadata: {
      category: 'Mobile/AR',
      tags: ['AR', 'Navigation', 'Campus'],
      technical_requirements: ['Unity', 'ARCore', 'Google Maps API']
    },
    version: 1,
    files: [],
    reviews: [],
    votes: []
  },
  { 
    id: 'sub-3', 
    competition_id: 'comp-1',
    round_id: 'round-1',
    user_id: 'user-3',
    title: 'Sustainable Food Tracker',
    description: 'Track your environmental impact through food choices and get sustainable alternatives',
    category_id: 'sustainability',
    status: 'submitted' as const,
    submission_number: 'NF-2024-003',
    submitted_at: '2024-12-17T09:15:00Z',
    last_modified_at: '2024-12-17T09:15:00Z',
    metadata: {
      category: 'Environment/Health',
      tags: ['Sustainability', 'Food', 'Health', 'Environment'],
      technical_requirements: ['Vue.js', 'Firebase', 'Carbon API']
    },
    version: 1,
    files: [],
    reviews: [],
    votes: []
  },
  { 
    id: 'sub-4', 
    competition_id: 'comp-1',
    round_id: 'round-1',
    user_id: 'user-4',
    title: 'Mental Health Companion',
    description: 'A supportive AI companion for mental health and wellness tracking',
    category_id: 'health-wellness',
    status: 'submitted' as const,
    submission_number: 'NF-2024-004',
    submitted_at: '2024-12-18T16:45:00Z',
    last_modified_at: '2024-12-18T16:45:00Z',
    metadata: {
      category: 'Health/AI',
      tags: ['Mental Health', 'AI', 'Wellness', 'Support'],
      technical_requirements: ['React', 'TensorFlow.js', 'Sentiment Analysis API']
    },
    version: 1,
    files: [],
    reviews: [],
    votes: []
  }
]

const mockVotingData = [
  { name: 'AI Study Assistant', simple: 45, quadratic: 128, ranked: 89 },
  { name: 'Campus Navigation', simple: 32, quadratic: 87, ranked: 76 },
  { name: 'Food Tracker', simple: 28, quadratic: 71, ranked: 65 },
  { name: 'Health Companion', simple: 19, quadratic: 43, ranked: 42 },
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                🏆 NestFest Demo
              </h1>
              <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Live Platform
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                Login
              </Button>
              <Button size="sm">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Welcome to NestFest Competition Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive online competition platform for student submissions, peer reviews, 
            and live shark-tank style voting events. Built to scale to 10,000+ concurrent users.
          </p>
          <div className="mt-8 flex justify-center space-x-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">25+</div>
              <div className="text-sm text-gray-600">API Endpoints</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">10K+</div>
              <div className="text-sm text-gray-600">Concurrent Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">4</div>
              <div className="text-sm text-gray-600">Voting Systems</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">5</div>
              <div className="text-sm text-gray-600">User Roles</div>
            </div>
          </div>
        </div>

        {/* Feature Showcase */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Competitions Section */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              📊 Active Competitions
            </h3>
            <div className="space-y-6">
              {mockCompetitions.map((competition) => (
                <CompetitionCard
                  key={competition.id}
                  competition={competition}
                  onJoin={() => alert('Competition join feature - requires authentication')}
                />
              ))}
            </div>
          </div>

          {/* Voting Analytics */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              📈 Live Voting Analytics
            </h3>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <VotingResultsChart data={mockVotingData.map(item => ({
                submission: item.name,
                votes: item.simple,
                credits: item.quadratic,
                percentage: (item.simple / mockVotingData.reduce((sum, v) => sum + v.simple, 0)) * 100
              }))} />
            </div>
          </div>
        </div>

        {/* Quadratic Voting Demo */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🗳️ Quadratic Voting System Demo
          </h3>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <QuadraticVoting
              submissions={mockSubmissions}
              budget={{
                user_id: 'demo-user',
                competition_id: 'comp-1',
                total_credits: 100,
                spent_credits: 0,
                bonus_credits: 0,
                credit_source: 'granted' as const
              }}
              onVoteChange={(votes) => {
                console.log('Demo vote changed:', votes)
              }}
              onSubmit={async (votes) => {
                console.log('Demo vote submitted:', votes)
                alert(`Vote demo: ${JSON.stringify(votes, null, 2)}`)
              }}
            />
          </div>
        </div>

        {/* Platform Features */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            🚀 Platform Capabilities
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🔐</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Enterprise Auth</h4>
              <p className="text-sm text-gray-600">JWT tokens, MFA, OAuth integration</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Real-time</h4>
              <p className="text-sm text-gray-600">WebSocket connections, live updates</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">AI-Powered</h4>
              <p className="text-sm text-gray-600">Fraud detection, content analysis</p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Analytics</h4>
              <p className="text-sm text-gray-600">Live dashboards, insights</p>
            </div>
          </div>
        </div>

        {/* Technical Stack */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">
            🛠️ Modern Technology Stack
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold mb-3">Frontend</h4>
              <ul className="space-y-1 text-sm opacity-90">
                <li>• Next.js 14 with App Router</li>
                <li>• React 18 with TypeScript</li>
                <li>• Tailwind CSS + Responsive</li>
                <li>• React Query + Zustand</li>
                <li>• Socket.io Client</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Backend</h4>
              <ul className="space-y-1 text-sm opacity-90">
                <li>• Next.js API Routes</li>
                <li>• Supabase (PostgreSQL)</li>
                <li>• Redis + BullMQ</li>
                <li>• JWT Authentication</li>
                <li>• WebSocket Server</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Services</h4>
              <ul className="space-y-1 text-sm opacity-90">
                <li>• SendGrid (Email)</li>
                <li>• Supabase Storage</li>
                <li>• OpenAI (AI Features)</li>
                <li>• Twilio (SMS)</li>
                <li>• Vercel Deployment</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Experience the Full Platform?
          </h3>
          <p className="text-gray-600 mb-8">
            Set up your environment variables to unlock all features including database, 
            authentication, real-time voting, and external integrations.
          </p>
          <div className="space-x-4">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              View Documentation
            </Button>
            <Button variant="outline" size="lg">
              GitHub Repository
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            Built with ❤️ for fostering innovation and competition in educational environments
          </p>
          <p className="text-sm text-gray-500 mt-2">
            NestFest Platform • Production Ready • Scalable to 10,000+ Users
          </p>
        </div>
      </footer>
    </div>
  )
}