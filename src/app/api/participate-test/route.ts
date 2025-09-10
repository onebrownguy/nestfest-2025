import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== PARTICIPATE API TEST DEBUG ===')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    // Handle both 'name' and 'fullName' field names for compatibility
    const name = body.fullName || body.name
    const { email, involvementType, questions, timestamp } = body
    console.log('Parsed data:', { name, email, involvementType })

    // Basic validation
    if (!name || !email || !involvementType) {
      console.log('Validation failed:', { name: !!name, email: !!email, involvementType: !!involvementType })
      return NextResponse.json({ error: 'Name, email, and involvement type are required' }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('Email validation failed:', email)
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate involvement type
    const validTypes = ['Mentor', 'Volunteer', 'Judge/Investor', 'Sponsor', 'Audience Member', 'Entrepreneur']
    if (!validTypes.includes(involvementType)) {
      console.log('Involvement type validation failed:', involvementType)
      return NextResponse.json({ error: 'Invalid involvement type' }, { status: 400 })
    }

    // Check environment variables
    console.log('Environment check:')
    console.log('- SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY)
    console.log('- SENDGRID_SENDER_EMAIL:', process.env.SENDGRID_SENDER_EMAIL)
    console.log('- NODE_ENV:', process.env.NODE_ENV)

    // For now, skip email sending and just return success
    console.log('Skipping email sending for test')
    
    return NextResponse.json({ 
      success: true, 
      message: `TEST: Thank you for your interest in participating as a ${involvementType}! Keep an eye on your email for updates about NEST FEST.`,
      debug: {
        name,
        email,
        involvementType,
        hasEnvVars: {
          sendgrid: !!process.env.SENDGRID_API_KEY,
          sender: !!process.env.SENDGRID_SENDER_EMAIL
        }
      }
    })
  } catch (error) {
    console.error('Participation form error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to submit participation form. Please try again.',
        debug: error.message 
      },
      { status: 500 }
    )
  }
}