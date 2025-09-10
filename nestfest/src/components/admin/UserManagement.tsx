'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { UserPlusIcon, UsersIcon, ClockIcon } from '@heroicons/react/24/outline'
import UserInviteModal from './UserInviteModal'
import PendingInvitationsTable from './PendingInvitationsTable'

interface InviteData {
  email: string
  role: string
  firstName?: string
  lastName?: string
  university?: string
}

interface PendingInvitation {
  id: string
  email: string
  name: string
  role: string
  status: string
  createdAt: string
  university: string | null
}

interface UserManagementProps {
  onInviteSuccess?: () => void
}

export default function UserManagement({ onInviteSuccess }: UserManagementProps) {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [loadingInvitations, setLoadingInvitations] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchPendingInvitations = async () => {
    try {
      setLoadingInvitations(true)
      const response = await fetch('/api/admin/invite-user')
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending invitations')
      }

      const data = await response.json()
      if (data.success) {
        setPendingInvitations(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching pending invitations:', error)
      setError('Failed to load pending invitations')
    } finally {
      setLoadingInvitations(false)
    }
  }

  useEffect(() => {
    fetchPendingInvitations()
  }, [])

  const handleInviteUser = async (inviteData: InviteData) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      if (data.success) {
        setSuccess(`Invitation sent successfully to ${inviteData.email}`)
        await fetchPendingInvitations() // Refresh the list
        onInviteSuccess?.()
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000)
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      setError(error instanceof Error ? error.message : 'Failed to send invitation')
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            User Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Invite new users and manage pending invitations
          </p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          leftIcon={<UserPlusIcon className="h-4 w-4" />}
        >
          Invite User
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {success}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">2,847</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Invitations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loadingInvitations ? '-' : pendingInvitations.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">234</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Invitations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pending Invitations
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchPendingInvitations}
            disabled={loadingInvitations}
          >
            {loadingInvitations ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
        
        <PendingInvitationsTable
          invitations={pendingInvitations}
          loading={loadingInvitations}
        />
      </div>

      {/* Invite User Modal */}
      <UserInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteUser}
        loading={loading}
      />
    </div>
  )
}