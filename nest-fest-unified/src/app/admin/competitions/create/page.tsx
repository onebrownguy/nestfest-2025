'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface CompetitionFormData {
  title: string
  category: string
  description: string
  startDate: string
  endDate: string
  registrationDeadline: string
  minTeamSize: number
  maxTeamSize: number
  prizePool: number
  criteria: string[]
  sponsors: string[]
  status: 'draft' | 'active'
}

const categories = [
  'Technology',
  'Sustainability',
  'Social Impact',
  'Finance',
  'Healthcare',
  'Education',
  'Agriculture',
  'Energy',
  'Transportation',
  'Entertainment'
]

export default function CreateCompetitionPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CompetitionFormData>({
    title: '',
    category: '',
    description: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    minTeamSize: 1,
    maxTeamSize: 5,
    prizePool: 0,
    criteria: [''],
    sponsors: [''],
    status: 'draft'
  })

  const handleInputChange = (field: keyof CompetitionFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayChange = (field: 'criteria' | 'sponsors', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field: 'criteria' | 'sponsors') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field: 'criteria' | 'sponsors', index: number) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Filter out empty criteria and sponsors
      const cleanedData = {
        ...formData,
        criteria: formData.criteria.filter(c => c.trim() !== ''),
        sponsors: formData.sponsors.filter(s => s.trim() !== '')
      }

      const response = await fetch('/api/admin/competitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData)
      })

      if (response.ok) {
        router.push('/admin/competitions?success=created')
      } else {
        throw new Error('Failed to create competition')
      }
    } catch (error) {
      console.error('Error creating competition:', error)
      alert('Failed to create competition. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                NEST FEST 2025
              </Link>
              <span className="ml-4 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                Admin Panel
              </span>
            </div>
            <nav className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Creating Competition</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Navigation Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center text-sm text-gray-500">
          <Link href="/admin" className="hover:text-gray-700">Admin Dashboard</Link>
          <span className="mx-2">›</span>
          <Link href="/admin/competitions" className="hover:text-gray-700">Competition Management</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900 font-medium">Create Competition</span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Competition
          </h1>
          <p className="text-gray-600">
            Configure all aspects of your competition before publishing to participants.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competition Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter competition title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'active')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">Draft (not visible to participants)</option>
                  <option value="active">Active (participants can register)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the competition goals, requirements, and expectations"
                />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Timeline</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competition Start Date *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Deadline *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.registrationDeadline}
                  onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competition End Date *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Team Configuration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Configuration</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Team Size *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.minTeamSize}
                  onChange={(e) => handleInputChange('minTeamSize', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Team Size *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.maxTeamSize}
                  onChange={(e) => handleInputChange('maxTeamSize', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prize Pool ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.prizePool}
                  onChange={(e) => handleInputChange('prizePool', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Evaluation Criteria */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Evaluation Criteria</h2>

            <div className="space-y-3">
              {formData.criteria.map((criterion, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={criterion}
                    onChange={(e) => handleArrayChange('criteria', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Innovation (30%)"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('criteria', index)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    disabled={formData.criteria.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('criteria')}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                + Add Criterion
              </Button>
            </div>
          </div>

          {/* Sponsors */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Sponsors</h2>

            <div className="space-y-3">
              {formData.sponsors.map((sponsor, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={sponsor}
                    onChange={(e) => handleArrayChange('sponsors', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Sponsor name"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('sponsors', index)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    disabled={formData.sponsors.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('sponsors')}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                + Add Sponsor
              </Button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Link href="/admin/competitions">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleInputChange('status', 'draft')}
                disabled={isSubmitting}
              >
                Save as Draft
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : formData.status === 'active' ? 'Create & Publish' : 'Create Competition'}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}