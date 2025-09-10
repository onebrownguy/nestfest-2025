'use client'

/**
 * Live Event Page - Static Version
 * Simplified for static generation without external dependencies
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ViewMode = 'dashboard' | 'voting' | 'event' | 'info'

export default function LivePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [isEventLive, setIsEventLive] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  NestFest Live Event
                </h1>
              </div>
              <div className="hidden sm:block">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isEventLive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {isEventLive ? 'LIVE' : 'Preview Mode'}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsEventLive(!isEventLive)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              {isEventLive ? 'End Live Event' : 'Start Live Event'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex space-x-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-1 rounded-lg">
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'voting', label: 'Live Voting' },
            { key: 'event', label: 'Event Control' },
            { key: 'info', label: 'Information' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key as ViewMode)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === tab.key
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {viewMode === 'dashboard' && <DashboardView isLive={isEventLive} />}
            {viewMode === 'voting' && <VotingView isLive={isEventLive} />}
            {viewMode === 'event' && <EventView isLive={isEventLive} />}
            {viewMode === 'info' && <InfoView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function DashboardView({ isLive }: { isLive: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Event Status */}
      <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Event Status
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-blue-900 dark:text-blue-100">Competition Status</span>
            <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
              {isLive ? 'Live Event Active' : 'Preparation Mode'}
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <span className="text-green-900 dark:text-green-100">Submissions</span>
            <span className="text-green-600 dark:text-green-400 font-semibold">24 Active</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <span className="text-purple-900 dark:text-purple-100">Judges Online</span>
            <span className="text-purple-600 dark:text-purple-400 font-semibold">8 Connected</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Live Stats
        </h2>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">2,847</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Votes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">156</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Viewers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">12</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Live Judges</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function VotingView({ isLive }: { isLive: boolean }) {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Live Voting Interface
      </h2>
      
      {isLive ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🗳️</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Voting System Active
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Real-time voting is now available for all participants
          </p>
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">VOTING LIVE</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⏳</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Voting Preparation Mode
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Voting interface will be activated when the live event begins
          </p>
        </div>
      )}
    </div>
  )
}

function EventView({ isLive }: { isLive: boolean }) {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Event Management
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Event Controls
          </h3>
          <div className="space-y-2">
            <button className="w-full p-3 text-left bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
              Start Next Presentation
            </button>
            <button className="w-full p-3 text-left bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors">
              Pause for Q&A
            </button>
            <button className="w-full p-3 text-left bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
              Begin Voting Round
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Current Status
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Current Phase</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {isLive ? 'Live Presentations' : 'Setup & Preparation'}
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Next Up</div>
              <div className="font-medium text-gray-900 dark:text-white">
                Team Alpha - AI Healthcare Solution
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoView() {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Live Event Information
      </h2>
      
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Welcome to the NestFest Live Event page. This is the central hub for real-time event management,
          live voting, and interactive features during the competition.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              🎯 Features
            </h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>• Real-time voting system</li>
              <li>• Live event dashboard</li>
              <li>• Judge management interface</li>
              <li>• Audience engagement tools</li>
              <li>• Performance monitoring</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              ⚡ Status
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Static Mode Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Ready for Live Event</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Modern Tech Stack</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}