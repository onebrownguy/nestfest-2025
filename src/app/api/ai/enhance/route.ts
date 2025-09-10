/**
 * AI Text Enhancement API Endpoint
 * 
 * POST /api/ai/enhance - Enhance text using Claude AI
 */

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ApiResponseBuilder, getClientIP, logAuditEvent } from '@/lib/api/utils'
import { authenticate, rateLimit, cors, errorHandler, securityHeaders, validateInput } from '@/lib/api/middleware'
import { AISchemas } from '@/lib/api/validation'
import type { AuthenticatedRequest } from '@/lib/api/middleware'
import type { AIEnhancementRequest, AIEnhancementResponse } from '@/types'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Generate enhancement prompt based on request parameters
 */
function generateEnhancementPrompt(request: AIEnhancementRequest): string {
  const { text, context, target_length, tone, focus_areas } = request

  const contextInstructions = {
    project_description: 'This is a project description for a startup competition. Focus on making it compelling for judges and investors.',
    competition_pitch: 'This is a competition pitch. Make it persuasive and highlight the unique value proposition.',
    executive_summary: 'This is an executive summary. Make it professional and comprehensive while maintaining clarity.',
    general: 'This is general text that needs improvement in clarity and impact.'
  }

  const lengthInstructions = {
    maintain: 'Keep the length roughly the same as the original.',
    expand: 'Expand on the ideas and add more detail while maintaining clarity.',
    condense: 'Make it more concise while preserving all key information.'
  }

  const toneInstructions = {
    professional: 'Use a professional, business-appropriate tone.',
    enthusiastic: 'Use an enthusiastic and energetic tone that conveys passion.',
    technical: 'Use precise technical language appropriate for industry experts.',
    conversational: 'Use a friendly, conversational tone that is easy to understand.'
  }

  const focusInstructions = focus_areas.map(area => {
    const areaMap = {
      clarity: 'Improve clarity and readability',
      impact: 'Increase emotional and business impact',
      technical_detail: 'Enhance technical accuracy and specificity',
      market_appeal: 'Strengthen market positioning and appeal',
      innovation: 'Highlight innovative aspects and uniqueness'
    }
    return areaMap[area]
  }).join(', ')

  return `You are an expert writing assistant helping improve text for startup competitions. Please enhance the following text with these requirements:

Context: ${contextInstructions[context]}
Length: ${lengthInstructions[target_length]}
Tone: ${toneInstructions[tone]}
Focus on: ${focusInstructions}

Original text:
"${text}"

Please provide:
1. An enhanced version of the text
2. A list of specific improvements made, categorized by type

Format your response as JSON with this structure:
{
  "enhanced_text": "your enhanced version",
  "improvements": [
    {
      "category": "clarity|impact|technical_detail|market_appeal|innovation|structure|language",
      "description": "what you improved",
      "before": "original phrase if applicable",
      "after": "improved phrase if applicable"
    }
  ]
}

Keep the enhanced text natural and compelling while following the specified requirements.`
}

/**
 * Analyze enhancement strength based on changes
 */
function analyzeEnhancementStrength(originalText: string, enhancedText: string): 'minor' | 'moderate' | 'significant' {
  const originalWords = originalText.trim().split(/\s+/).length
  const enhancedWords = enhancedText.trim().split(/\s+/).length
  
  const wordChange = Math.abs(enhancedWords - originalWords) / originalWords
  const textSimilarity = calculateTextSimilarity(originalText, enhancedText)
  
  if (wordChange > 0.5 || textSimilarity < 0.6) {
    return 'significant'
  } else if (wordChange > 0.2 || textSimilarity < 0.8) {
    return 'moderate'
  } else {
    return 'minor'
  }
}

/**
 * Simple text similarity calculation
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/))
  const words2 = new Set(text2.toLowerCase().split(/\s+/))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

/**
 * POST /api/ai/enhance
 * Enhance text using Claude AI
 */
export async function POST(request: NextRequest) {
  return cors(request, async (req) => {
    return rateLimit(req, async (req) => {
      return securityHeaders(req, async (req) => {
        return errorHandler(req, async (req) => {
          return authenticate(req, async (authReq: AuthenticatedRequest) => {
            return validateInput(AISchemas.enhance)(authReq, async (authReq, validatedData: AIEnhancementRequest) => {
              const startTime = Date.now()
              
              try {
                const user = (authReq as AuthenticatedRequest).user!
                
                // Check API key configuration
                if (!process.env.ANTHROPIC_API_KEY) {
                  return ApiResponseBuilder.serverError('AI service not configured')
                }

                const { text, context, target_length, tone, focus_areas } = validatedData

                // Generate the enhancement prompt
                const prompt = generateEnhancementPrompt(validatedData)

                // Call Claude API
                const response = await anthropic.messages.create({
                  model: 'claude-3-haiku-20240307',
                  max_tokens: 1500,
                  temperature: 0.3, // Lower temperature for more consistent results
                  messages: [
                    {
                      role: 'user',
                      content: prompt
                    }
                  ]
                })

                // Extract the response text
                const responseText = response.content[0].type === 'text' 
                  ? response.content[0].text 
                  : ''

                if (!responseText) {
                  return ApiResponseBuilder.serverError('Failed to generate enhancement')
                }

                // Parse the JSON response from Claude
                let aiResponse: { enhanced_text: string; improvements: any[] }
                try {
                  aiResponse = JSON.parse(responseText)
                } catch (parseError) {
                  // Fallback: extract enhanced text if JSON parsing fails
                  return ApiResponseBuilder.serverError('Failed to parse AI response')
                }

                const enhancedText = aiResponse.enhanced_text || text
                const improvements = aiResponse.improvements || []

                // Calculate metrics
                const originalCharCount = text.length
                const enhancedCharCount = enhancedText.length
                const originalWordCount = text.trim().split(/\s+/).length
                const enhancedWordCount = enhancedText.trim().split(/\s+/).length

                const processingTime = Date.now() - startTime

                // Build response
                const enhancementResponse: AIEnhancementResponse = {
                  originalText: text,
                  enhancedText: enhancedText,
                  improvements: improvements.map((imp: any) => ({
                    category: imp.category || 'general',
                    description: imp.description || 'Text improvement',
                    before: imp.before,
                    after: imp.after
                  })),
                  characterCount: {
                    original: originalCharCount,
                    enhanced: enhancedCharCount,
                    change: enhancedCharCount - originalCharCount
                  },
                  wordCount: {
                    original: originalWordCount,
                    enhanced: enhancedWordCount,
                    change: enhancedWordCount - originalWordCount
                  },
                  enhancementStrength: analyzeEnhancementStrength(text, enhancedText),
                  processingTime,
                  model: 'claude-3-haiku-20240307'
                }

                // Log audit event
                logAuditEvent({
                  userId: user.id,
                  action: 'ai_text_enhanced',
                  resource: 'ai_enhancement',
                  metadata: {
                    context,
                    target_length,
                    tone,
                    focus_areas,
                    original_char_count: originalCharCount,
                    enhanced_char_count: enhancedCharCount,
                    processing_time_ms: processingTime,
                    enhancement_strength: enhancementResponse.enhancementStrength
                  },
                  ipAddress: getClientIP(authReq),
                  userAgent: authReq.headers.get('user-agent') || 'unknown'
                })

                return ApiResponseBuilder.success(
                  enhancementResponse,
                  'Text enhanced successfully'
                )

              } catch (error: any) {
                console.error('AI enhancement error:', error)
                
                // Handle specific Anthropic errors
                if (error?.status === 429) {
                  return ApiResponseBuilder.error(
                    'AI service rate limit exceeded. Please try again later.',
                    429,
                    'AI_RATE_LIMIT'
                  )
                } else if (error?.status === 401) {
                  return ApiResponseBuilder.serverError('AI service authentication failed')
                } else if (error?.status >= 400 && error?.status < 500) {
                  return ApiResponseBuilder.error(
                    'Invalid request to AI service',
                    400,
                    'AI_BAD_REQUEST'
                  )
                }
                
                return ApiResponseBuilder.serverError('Failed to enhance text')
              }
            })
          })
        })
      })
    })
  })
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return cors(request, async () => {
    return new Response(null, { status: 200 })
  })
}