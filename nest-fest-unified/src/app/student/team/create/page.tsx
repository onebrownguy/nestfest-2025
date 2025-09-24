'use client'

import { useState } from 'react'
import { cookies } from 'next/headers'
import { redirect, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Competition {
  id: string
  title: string
  category: string
  deadline: string
  minTeamSize: number
  maxTeamSize: number
}

interface TeamMemberInvite {
  id: string
  email: string
  role: string
  skills: string[]
}

export default function CreateTeamPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    teamName: '',
    competitionId: '',
    projectTitle: '',
    description: '',
    lookingFor: '',
    requiredSkills: [] as string[],
    teamSize: 3,
    isPublic: true
  })
  const [memberInvites, setMemberInvites] = useState<TeamMemberInvite[]>([])
  const [newInvite, setNewInvite] = useState({ email: '', role: '', skills: '' })
  const [availableSkills] = useState([
    'Frontend Development', 'Backend Development', 'Mobile Development', 'UI/UX Design',
    'Product Management', 'Business Strategy', 'Marketing', 'Data Analytics',
    'Machine Learning', 'DevOps', 'Project Management', 'Sales',
    'Finance', 'Legal', 'Content Writing', 'Research', 'Quality Assurance'
  ])

  const availableCompetitions: Competition[] = [
    {
      id: '1',
      title: 'Tech Innovation Challenge 2025',
      category: 'Technology',
      deadline: '2025-10-15T23:59:59Z',
      minTeamSize: 2,
      maxTeamSize: 5
    },
    {
      id: '2',
      title: 'Sustainable Business Model Challenge',
      category: 'Sustainability',
      deadline: '2025-11-20T23:59:59Z',
      minTeamSize: 1,
      maxTeamSize: 4
    },
    {
      id: '3',
      title: 'Social Impact Startup Competition',
      category: 'Social Impact',
      deadline: '2025-12-01T23:59:59Z',
      minTeamSize: 3,
      maxTeamSize: 6
    },
    {
      id: '4',
      title: 'FinTech Innovation Sprint',
      category: 'Finance',
      deadline: '2025-09-30T23:59:59Z',
      minTeamSize: 2,
      maxTeamSize: 4
    }
  ]

  const selectedCompetition = availableCompetitions.find(c => c.id === formData.competitionId)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skill)
        ? prev.requiredSkills.filter(s => s !== skill)
        : [...prev.requiredSkills, skill]
    }))
  }

  const addMemberInvite = () => {
    if (newInvite.email && newInvite.role) {
      const skillsArray = newInvite.skills.split(',').map(s => s.trim()).filter(s => s)
      setMemberInvites(prev => [...prev, {
        id: Date.now().toString(),
        email: newInvite.email,
        role: newInvite.role,
        skills: skillsArray
      }])
      setNewInvite({ email: '', role: '', skills: '' })
    }
  }

  const removeMemberInvite = (id: string) => {
    setMemberInvites(prev => prev.filter(invite => invite.id !== id))
  }

  const handleCreateTeam = async () => {
    // In a real app, this would make API calls to create the team
    console.log('Creating team:', {
      ...formData,
      memberInvites
    })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Redirect to team page with success message
    router.push('/student/team?created=true')
  }

  const nextStep = () => {
    if (step < 3) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const canProceedStep1 = formData.teamName && formData.competitionId && formData.projectTitle
  const canProceedStep2 = formData.description && formData.requiredSkills.length > 0

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
                  ← Back to Teams
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Navigation Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
          <span className="mx-2">›</span>
          <Link href="/student/team" className="hover:text-gray-700">Team Collaboration</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900 font-medium">Create New Team</span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Team
          </h1>
          <p className="text-gray-600">
            Form a team for a competition and start collaborating with talented individuals.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                } font-medium`}>
                  {stepNum}
                </div>
                <div className={`ml-2 ${step >= stepNum ? 'text-blue-600' : 'text-gray-500'} font-medium`}>
                  {stepNum === 1 && 'Team Basics'}
                  {stepNum === 2 && 'Team Requirements'}
                  {stepNum === 3 && 'Invite Members'}
                </div>
                {stepNum < 3 && (
                  <div className={`mx-4 h-0.5 w-16 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          {/* Step 1: Team Basics */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Basics</h2>

              {/* Team Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={formData.teamName}
                  onChange={(e) => handleInputChange('teamName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your team name"
                />
              </div>

              {/* Competition Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competition *
                </label>
                <select
                  value={formData.competitionId}
                  onChange={(e) => handleInputChange('competitionId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a competition</option>
                  {availableCompetitions.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.title} - Due: {new Date(comp.deadline).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                {selectedCompetition && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>Team Size:</strong> {selectedCompetition.minTeamSize}-{selectedCompetition.maxTeamSize} members
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      <strong>Category:</strong> {selectedCompetition.category}
                    </div>
                  </div>
                )}
              </div>

              {/* Project Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={formData.projectTitle}
                  onChange={(e) => handleInputChange('projectTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What's your project called?"
                />
              </div>

              {/* Team Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Team Size
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min={selectedCompetition?.minTeamSize || 1}
                    max={selectedCompetition?.maxTeamSize || 6}
                    value={formData.teamSize}
                    onChange={(e) => handleInputChange('teamSize', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-lg font-medium text-gray-900 min-w-12 text-center">
                    {formData.teamSize}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Including yourself ({formData.teamSize - 1} additional members needed)
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Team Requirements */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Requirements</h2>

              {/* Project Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your project idea and what you're trying to achieve..."
                />
              </div>

              {/* Looking For */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What are you looking for in teammates?
                </label>
                <textarea
                  value={formData.lookingFor}
                  onChange={(e) => handleInputChange('lookingFor', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the type of people you want to work with, their experience level, commitment, etc."
                />
              </div>

              {/* Required Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Skills *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                  {availableSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-2 text-sm rounded-lg border ${
                        formData.requiredSkills.includes(skill)
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Select skills that would be valuable for your team ({formData.requiredSkills.length} selected)
                </p>
              </div>

              {/* Public Team */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Make this team publicly visible
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Public teams can be discovered by other students looking to join teams
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Invite Members */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Invite Team Members</h2>

              {/* Current Team Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Team Summary</h3>
                <div className="text-sm text-blue-800">
                  <div><strong>Team:</strong> {formData.teamName}</div>
                  <div><strong>Project:</strong> {formData.projectTitle}</div>
                  <div><strong>Competition:</strong> {availableCompetitions.find(c => c.id === formData.competitionId)?.title}</div>
                  <div><strong>Target Size:</strong> {formData.teamSize} members</div>
                </div>
              </div>

              {/* Add Member Form */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">Add Team Member</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={newInvite.email}
                      onChange={(e) => setNewInvite(prev => ({...prev, email: e.target.value}))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="teammate@university.edu"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                    <input
                      type="text"
                      value={newInvite.role}
                      onChange={(e) => setNewInvite(prev => ({...prev, role: e.target.value}))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g. Developer, Designer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Skills</label>
                    <input
                      type="text"
                      value={newInvite.skills}
                      onChange={(e) => setNewInvite(prev => ({...prev, skills: e.target.value}))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="React, Design, etc."
                    />
                  </div>
                </div>
                <Button
                  onClick={addMemberInvite}
                  disabled={!newInvite.email || !newInvite.role}
                  className="mt-3 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  Add Member
                </Button>
              </div>

              {/* Member Invites List */}
              {memberInvites.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Team Members to Invite</h4>
                  <div className="space-y-2">
                    {memberInvites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{invite.email}</div>
                          <div className="text-sm text-gray-600">{invite.role}</div>
                          {invite.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {invite.skills.map((skill, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => removeMemberInvite(invite.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500">
                You can invite {formData.teamSize - 1} members. You can also skip this step and invite members later.
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Button
              onClick={prevStep}
              variant="outline"
              disabled={step === 1}
            >
              Previous
            </Button>

            <div className="text-sm text-gray-500">
              Step {step} of 3
            </div>

            {step < 3 ? (
              <Button
                onClick={nextStep}
                disabled={
                  (step === 1 && !canProceedStep1) ||
                  (step === 2 && !canProceedStep2)
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleCreateTeam}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Team & Send Invites
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}