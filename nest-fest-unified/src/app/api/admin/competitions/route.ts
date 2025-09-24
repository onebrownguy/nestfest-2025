import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Mock database - in production, this would use a real database
let competitions = [
  {
    id: '1',
    title: 'Tech Innovation Challenge 2025',
    category: 'Technology',
    status: 'active',
    startDate: '2025-08-01T00:00:00Z',
    endDate: '2025-10-15T23:59:59Z',
    registrationDeadline: '2025-09-15T23:59:59Z',
    minTeamSize: 2,
    maxTeamSize: 5,
    prizePool: 50000,
    participants: 156,
    submissions: 89,
    judges: 8,
    description: 'Develop innovative technology solutions that address real-world problems in healthcare, education, or sustainability.',
    criteria: ['Innovation (30%)', 'Technical Implementation (25%)', 'Market Potential (20%)', 'Presentation (15%)', 'Team Collaboration (10%)'],
    sponsors: ['Tech Corp', 'Innovation Labs', 'Future Fund'],
    createdAt: '2025-07-15T10:00:00Z',
    createdBy: 'admin@nestfest.com'
  },
  {
    id: '2',
    title: 'Sustainable Business Model Challenge',
    category: 'Sustainability',
    status: 'active',
    startDate: '2025-08-15T00:00:00Z',
    endDate: '2025-11-20T23:59:59Z',
    registrationDeadline: '2025-10-20T23:59:59Z',
    minTeamSize: 1,
    maxTeamSize: 4,
    prizePool: 25000,
    participants: 89,
    submissions: 34,
    judges: 6,
    description: 'Create a business model that prioritizes environmental sustainability while maintaining profitability.',
    criteria: ['Sustainability Impact (35%)', 'Business Viability (30%)', 'Innovation (20%)', 'Scalability (15%)'],
    sponsors: ['Green Ventures', 'Eco Foundation'],
    createdAt: '2025-07-20T14:30:00Z',
    createdBy: 'admin@nestfest.com'
  }
]

async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('nest-fest-session')

    if (!sessionCookie) {
      return null
    }

    const sessionData = JSON.parse(atob(sessionCookie.value))

    // Check if session is expired
    const sessionAge = Date.now() - sessionData.createdAt
    if (sessionAge > 24 * 60 * 60 * 1000) {
      return null
    }

    // Mock user lookup
    const mockUsers = [
      { id: '1', email: 'admin@nestfest.com', name: 'NEST FEST Admin', role: 'admin' },
      { id: '2', email: 'judge@nestfest.com', name: 'Sample Judge', role: 'judge', university: 'Stanford University' },
      { id: '3', email: 'student@university.edu', name: 'Sample Student', role: 'student', university: 'MIT' }
    ]

    return mockUsers.find(u => u.id === sessionData.userId) || null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ competitions })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    // Validate required fields
    const requiredFields = ['title', 'category', 'description', 'startDate', 'endDate', 'registrationDeadline', 'minTeamSize', 'maxTeamSize', 'prizePool']
    const missingFields = requiredFields.filter(field => !data[field] && data[field] !== 0)

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 })
    }

    // Validate dates
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    const registrationDeadline = new Date(data.registrationDeadline)
    const now = new Date()

    if (startDate >= endDate) {
      return NextResponse.json({
        error: 'Start date must be before end date'
      }, { status: 400 })
    }

    if (registrationDeadline >= endDate) {
      return NextResponse.json({
        error: 'Registration deadline must be before end date'
      }, { status: 400 })
    }

    if (data.minTeamSize > data.maxTeamSize) {
      return NextResponse.json({
        error: 'Minimum team size cannot be greater than maximum team size'
      }, { status: 400 })
    }

    if (data.minTeamSize < 1 || data.maxTeamSize < 1) {
      return NextResponse.json({
        error: 'Team sizes must be at least 1'
      }, { status: 400 })
    }

    if (data.prizePool < 0) {
      return NextResponse.json({
        error: 'Prize pool cannot be negative'
      }, { status: 400 })
    }

    // Create new competition
    const newCompetition = {
      id: String(Date.now()), // In production, use proper ID generation
      title: data.title,
      category: data.category,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      registrationDeadline: data.registrationDeadline,
      minTeamSize: data.minTeamSize,
      maxTeamSize: data.maxTeamSize,
      prizePool: data.prizePool,
      criteria: data.criteria || [],
      sponsors: data.sponsors || [],
      status: data.status || 'draft',
      participants: 0,
      submissions: 0,
      judges: 0,
      createdAt: new Date().toISOString(),
      createdBy: user.email
    }

    // Add to mock database
    competitions.push(newCompetition)

    return NextResponse.json({
      success: true,
      competition: newCompetition
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating competition:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json({
        error: 'Competition ID is required'
      }, { status: 400 })
    }

    const competitionIndex = competitions.findIndex(c => c.id === id)

    if (competitionIndex === -1) {
      return NextResponse.json({
        error: 'Competition not found'
      }, { status: 404 })
    }

    // Update competition
    competitions[competitionIndex] = {
      ...competitions[competitionIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: user.email
    }

    return NextResponse.json({
      success: true,
      competition: competitions[competitionIndex]
    })

  } catch (error) {
    console.error('Error updating competition:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        error: 'Competition ID is required'
      }, { status: 400 })
    }

    const competitionIndex = competitions.findIndex(c => c.id === id)

    if (competitionIndex === -1) {
      return NextResponse.json({
        error: 'Competition not found'
      }, { status: 404 })
    }

    // Remove competition
    competitions.splice(competitionIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Competition deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting competition:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}