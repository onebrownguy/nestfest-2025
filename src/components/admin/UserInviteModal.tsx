'use client'

import React, { useState } from 'react'
import { Modal, Button, Input, Select } from '@/components/ui'
import { PlusIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

interface UserInviteModalProps {
  isOpen: boolean
  onClose: () => void
  onInvite: (data: InviteData) => Promise<void>
  loading: boolean
}

interface InviteData {
  email: string
  role: string
  firstName?: string
  lastName?: string
  university?: string
}

const roleOptions = [
  { value: 'student', label: 'Student' },
  { value: 'judge', label: 'Judge' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'admin', label: 'Admin' }
]

export default function UserInviteModal({ isOpen, onClose, onInvite, loading }: UserInviteModalProps) {
  const [formData, setFormData] = useState<InviteData>({
    email: '',
    role: 'student',
    firstName: '',
    lastName: '',
    university: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof InviteData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await onInvite(formData)
      setFormData({
        email: '',
        role: 'student',
        firstName: '',
        lastName: '',
        university: ''
      })
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Failed to send invitation:', error)
    }
  }

  const handleClose = () => {
    setFormData({
      email: '',
      role: 'student',
      firstName: '',
      lastName: '',
      university: ''
    })
    setErrors({})
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite New User"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="user@example.com"
              disabled={loading}
              className={errors.email ? 'border-red-500' : ''}
              leftIcon={<EnvelopeIcon className="h-4 w-4 text-gray-400" />}
            />
            {errors.email && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role *
            </label>
            <Select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              options={roleOptions}
              disabled={loading}
              className={errors.role ? 'border-red-500' : ''}
            />
            {errors.role && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.role}</p>
            )}
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <Input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Optional"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <Input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Optional"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              University
            </label>
            <Input
              type="text"
              value={formData.university}
              onChange={(e) => handleInputChange('university', e.target.value)}
              placeholder="Optional"
              disabled={loading}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            leftIcon={<PlusIcon className="h-4 w-4" />}
          >
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  )
}