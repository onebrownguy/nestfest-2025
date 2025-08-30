'use client'

import React from 'react'
import { Table } from '@/components/ui'
import { ClockIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

interface PendingInvitation {
  id: string
  email: string
  name: string
  role: string
  status: string
  createdAt: string
  university: string | null
}

interface PendingInvitationsTableProps {
  invitations: PendingInvitation[]
  loading: boolean
}

export default function PendingInvitationsTable({ invitations, loading }: PendingInvitationsTableProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'judge':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'reviewer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'student':
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    }
  }

  const columns = [
    {
      key: 'email',
      label: 'Email',
      render: (invitation: PendingInvitation) => (
        <div className="flex items-center gap-2">
          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {invitation.email}
            </p>
            {invitation.name && invitation.name !== invitation.email.split('@')[0] && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {invitation.name}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (invitation: PendingInvitation) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(invitation.role)}`}>
          {invitation.role}
        </span>
      )
    },
    {
      key: 'university',
      label: 'University',
      render: (invitation: PendingInvitation) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {invitation.university || '-'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (invitation: PendingInvitation) => (
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-yellow-500" />
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pending
          </span>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Invited',
      render: (invitation: PendingInvitation) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(invitation.createdAt)}
        </span>
      )
    }
  ]

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (invitations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Pending Invitations
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            All user invitations have been accepted or there are no active invitations.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <Table
        columns={columns}
        data={invitations}
        keyField="id"
      />
    </div>
  )
}