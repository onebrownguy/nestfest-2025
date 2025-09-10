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
    description: 'A competition focused on innovative solutions for real-world problems',
    status: 'open' as const,
    submission_deadline: '2024-12-31T23:59:59Z',
    event_date: '2025-01-15T18:00:00Z',
    participants: 156,
    submissions: 43,
    category: 'Technology'
  },
  {
    id: 'comp-2', 
    name: 'Shark Tank Style Pitch',
    description: 'Present your startup idea to a panel of judges and investors',
    status: 'live' as const,
    submission_deadline: '2024-11-30T23:59:59Z',
    event_date: '2024-12-10T19:00:00Z',
    participants: 89,
    submissions: 67,
    category: 'Business'
  },
  {
    id: 'comp-3',
    name: 'Sustainability Hackathon',
    description: 'Build solutions for environmental challenges in 48 hours',
    status: 'completed' as const,
    submission_deadline: '2024-10-15T23:59:59Z',
    event_date: '2024-10-20T12:00:00Z',
    participants: 234,
    submissions: 89,
    category: 'Environment'
  }
]

const mockSubmissions = [
  { id: 'sub-1', title: 'AI-Powered Study Assistant', votes: 45 },
  { id: 'sub-2', title: 'Smart Campus Navigation', votes: 32 },
  { id: 'sub-3', title: 'Sustainable Food Tracker', votes: 28 },
  { id: 'sub-4', title: 'Mental Health Companion', votes: 19 },
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
              budget={100}
              onVote={(votes) => {
                console.log('Demo vote cast:', votes)
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