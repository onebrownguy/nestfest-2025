/**
 * Validation Schemas for NestFest API
 * 
 * This module contains Zod validation schemas for all API endpoints,
 * ensuring type safety and input validation across the backend.
 */

import { z } from 'zod'
import { UserRole, CompetitionStatus, SubmissionStatus, VoteType } from '@/types'

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  uuid: z.string().uuid(),
  email: z.string().email(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  url: z.string().url().optional(),
  dateString: z.string().datetime(),
  positiveInteger: z.number().int().positive(),
  nonNegativeInteger: z.number().int().min(0),
  
  // Pagination
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    per_page: z.number().int().min(1).max(100).default(20)
  }),

  // Sorting
  sorting: z.object({
    sort_by: z.string().default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('asc')
  })
}

/**
 * Authentication schemas
 */
export const AuthSchemas = {
  login: z.object({
    email: CommonSchemas.email,
    password: z.string().min(8, 'Password must be at least 8 characters'),
    remember_me: z.boolean().optional()
  }),

  register: z.object({
    email: CommonSchemas.email,
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    university: z.string().min(2).max(200).optional(),
    graduation_year: z.number().int().min(2020).max(2030).optional(),
    program: z.string().max(100).optional(),
    phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
    timezone: z.string().max(50).optional()
  }),

  changePassword: z.object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    confirm_password: z.string()
  }).refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"]
  }),

  resetPassword: z.object({
    email: CommonSchemas.email
  }),

  confirmReset: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  })
}

/**
 * User management schemas
 */
export const UserSchemas = {
  create: z.object({
    email: CommonSchemas.email,
    name: z.string().min(2).max(100),
    role: z.enum(['student', 'reviewer', 'judge', 'admin', 'super_admin'] as const),
    university: z.string().min(2).max(200).optional(),
    graduation_year: z.number().int().min(2020).max(2030).optional(),
    program: z.string().max(100).optional(),
    phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    timezone: z.string().max(50).optional()
  }),

  update: z.object({
    name: z.string().min(2).max(100).optional(),
    role: z.enum(['student', 'reviewer', 'judge', 'admin', 'super_admin'] as const).optional(),
    status: z.enum(['active', 'inactive', 'suspended'] as const).optional(),
    university: z.string().min(2).max(200).optional(),
    graduation_year: z.number().int().min(2020).max(2030).optional(),
    program: z.string().max(100).optional(),
    phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    timezone: z.string().max(50).optional()
  }),

  filters: z.object({
    role: z.enum(['student', 'reviewer', 'judge', 'admin', 'super_admin'] as const).optional(),
    status: z.enum(['active', 'inactive', 'suspended'] as const).optional(),
    university: z.string().optional(),
    graduation_year: z.number().int().optional(),
    search: z.string().optional()
  })
}

/**
 * Competition schemas
 */
export const CompetitionSchemas = {
  create: z.object({
    name: z.string().min(3, 'Competition name must be at least 3 characters').max(200),
    slug: CommonSchemas.slug,
    description: z.string().min(10, 'Description must be at least 10 characters'),
    rules_document_url: CommonSchemas.url,
    start_date: CommonSchemas.dateString,
    submission_deadline: CommonSchemas.dateString,
    judging_start_date: CommonSchemas.dateString,
    judging_end_date: CommonSchemas.dateString,
    event_date: CommonSchemas.dateString,
    max_submissions_per_user: CommonSchemas.positiveInteger.max(10),
    allow_team_submissions: z.boolean().default(false),
    team_size_min: CommonSchemas.positiveInteger.optional(),
    team_size_max: CommonSchemas.positiveInteger.optional(),
    voting_enabled: z.boolean().default(true),
    public_voting_enabled: z.boolean().default(false),
    config: z.object({
      voting_rules: z.object({
        type: z.enum(['simple', 'quadratic', 'ranked', 'approval'] as const),
        budget: z.number().optional(),
        max_selections: z.number().optional(),
        allow_ties: z.boolean().default(true),
        weight_multiplier: z.number().default(1)
      }),
      advancement_rules: z.object({
        type: z.enum(['top_n', 'top_percentage', 'score_threshold'] as const),
        value: z.number().positive(),
        tie_breaking_method: z.enum(['random', 'timestamp', 'judge_preference'] as const)
      }),
      file_restrictions: z.object({
        max_file_size: z.number().positive(),
        allowed_types: z.array(z.string()),
        max_files_per_submission: CommonSchemas.positiveInteger,
        require_virus_scan: z.boolean().default(true)
      }),
      notification_settings: z.object({
        email_enabled: z.boolean().default(true),
        sms_enabled: z.boolean().default(false),
        in_app_enabled: z.boolean().default(true),
        digest_frequency: z.enum(['immediate', 'daily', 'weekly'] as const).default('immediate')
      })
    })
  }).refine((data) => {
    const startDate = new Date(data.start_date)
    const submissionDeadline = new Date(data.submission_deadline)
    const judgingStart = new Date(data.judging_start_date)
    const judgingEnd = new Date(data.judging_end_date)
    const eventDate = new Date(data.event_date)

    return startDate < submissionDeadline &&
           submissionDeadline < judgingStart &&
           judgingStart < judgingEnd &&
           judgingEnd <= eventDate
  }, {
    message: "Dates must be in chronological order: start < submission deadline < judging start < judging end <= event date"
  }),

  update: z.object({
    name: z.string().min(3).max(200).optional(),
    description: z.string().min(10).optional(),
    rules_document_url: CommonSchemas.url,
    start_date: CommonSchemas.dateString.optional(),
    submission_deadline: CommonSchemas.dateString.optional(),
    judging_start_date: CommonSchemas.dateString.optional(),
    judging_end_date: CommonSchemas.dateString.optional(),
    event_date: CommonSchemas.dateString.optional(),
    status: z.enum(['draft', 'open', 'reviewing', 'judging', 'live', 'completed', 'archived'] as const).optional(),
    max_submissions_per_user: CommonSchemas.positiveInteger.max(10).optional(),
    allow_team_submissions: z.boolean().optional(),
    team_size_min: CommonSchemas.positiveInteger.optional(),
    team_size_max: CommonSchemas.positiveInteger.optional(),
    voting_enabled: z.boolean().optional(),
    public_voting_enabled: z.boolean().optional(),
    config: z.any().optional() // Allow partial updates
  }),

  filters: z.object({
    status: z.enum(['draft', 'open', 'reviewing', 'judging', 'live', 'completed', 'archived'] as const).optional(),
    voting_enabled: z.boolean().optional(),
    public_voting_enabled: z.boolean().optional(),
    search: z.string().optional()
  })
}

/**
 * Submission schemas
 */
export const SubmissionSchemas = {
  create: z.object({
    competition_id: CommonSchemas.uuid,
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    category_id: CommonSchemas.uuid,
    team_id: CommonSchemas.uuid.optional(),
    metadata: z.object({
      category: z.string(),
      tags: z.array(z.string()).default([]),
      technical_requirements: z.array(z.string()).optional(),
      external_links: z.array(z.string().url()).optional()
    }).passthrough() // Allow additional properties
  }),

  update: z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).optional(),
    category_id: CommonSchemas.uuid.optional(),
    status: z.enum(['draft', 'submitted', 'in_review', 'accepted', 'rejected', 'advanced', 'eliminated', 'winner'] as const).optional(),
    withdrawal_reason: z.string().max(500).optional(),
    metadata: z.any().optional()
  }),

  filters: z.object({
    competition_id: CommonSchemas.uuid.optional(),
    status: z.enum(['draft', 'submitted', 'in_review', 'accepted', 'rejected', 'advanced', 'eliminated', 'winner'] as const).optional(),
    category_id: CommonSchemas.uuid.optional(),
    user_id: CommonSchemas.uuid.optional(),
    team_id: CommonSchemas.uuid.optional(),
    search: z.string().optional()
  }),

  fileUpload: z.object({
    file_type: z.enum(['document', 'image', 'video', 'slide', 'code', 'other'] as const),
    description: z.string().max(500).optional()
  })
}

/**
 * Review schemas
 */
export const ReviewSchemas = {
  create: z.object({
    submission_id: CommonSchemas.uuid,
    round_id: CommonSchemas.uuid,
    scores: z.record(z.string(), z.number().min(0).max(100)),
    feedback_for_participant: z.string().max(2000).optional(),
    internal_notes: z.string().max(2000).optional(),
    confidence_level: z.enum(['low', 'medium', 'high'] as const)
  }),

  update: z.object({
    scores: z.record(z.string(), z.number().min(0).max(100)).optional(),
    feedback_for_participant: z.string().max(2000).optional(),
    internal_notes: z.string().max(2000).optional(),
    confidence_level: z.enum(['low', 'medium', 'high'] as const).optional(),
    status: z.enum(['assigned', 'in_progress', 'completed', 'recused'] as const).optional()
  }),

  assignment: z.object({
    judge_user_id: CommonSchemas.uuid,
    submission_ids: z.array(CommonSchemas.uuid).min(1),
    round_id: CommonSchemas.uuid,
    due_date: CommonSchemas.dateString,
    priority: z.number().int().min(1).max(5).default(3)
  }),

  filters: z.object({
    submission_id: CommonSchemas.uuid.optional(),
    reviewer_user_id: CommonSchemas.uuid.optional(),
    round_id: CommonSchemas.uuid.optional(),
    status: z.enum(['assigned', 'in_progress', 'completed', 'recused'] as const).optional()
  })
}

/**
 * Voting schemas
 */
export const VotingSchemas = {
  simple: z.object({
    competition_id: CommonSchemas.uuid,
    submission_id: CommonSchemas.uuid,
    vote_type: z.literal('simple'),
    vote_data: z.object({
      value: z.number().min(1).max(10)
    })
  }),

  quadratic: z.object({
    competition_id: CommonSchemas.uuid,
    submission_id: CommonSchemas.uuid,
    vote_type: z.literal('quadratic'),
    vote_data: z.object({
      vote_count: z.number().int().min(0).max(100),
      credits_spent: z.number().min(0)
    })
  }),

  ranked: z.object({
    competition_id: CommonSchemas.uuid,
    vote_type: z.literal('ranked'),
    vote_data: z.object({
      rankings: z.array(z.object({
        submission_id: CommonSchemas.uuid,
        rank: z.number().int().min(1)
      })).min(1)
    })
  }),

  approval: z.object({
    competition_id: CommonSchemas.uuid,
    vote_type: z.literal('approval'),
    vote_data: z.object({
      approved_submissions: z.array(CommonSchemas.uuid).min(1)
    })
  }),

  filters: z.object({
    competition_id: CommonSchemas.uuid.optional(),
    submission_id: CommonSchemas.uuid.optional(),
    voter_user_id: CommonSchemas.uuid.optional(),
    vote_type: z.enum(['simple', 'quadratic', 'ranked', 'approval'] as const).optional(),
    is_valid: z.boolean().optional()
  })
}

/**
 * Team schemas
 */
export const TeamSchemas = {
  create: z.object({
    name: z.string().min(2, 'Team name must be at least 2 characters').max(100),
    max_members: CommonSchemas.positiveInteger.max(10).default(4)
  }),

  update: z.object({
    name: z.string().min(2).max(100).optional(),
    max_members: CommonSchemas.positiveInteger.max(10).optional(),
    is_locked: z.boolean().optional()
  }),

  join: z.object({
    team_code: z.string().length(8, 'Team code must be exactly 8 characters')
  }),

  removeMember: z.object({
    user_id: CommonSchemas.uuid,
    reason: z.string().max(200).optional()
  })
}

/**
 * Live event schemas
 */
export const LiveEventSchemas = {
  createSession: z.object({
    competition_id: CommonSchemas.uuid,
    round_id: CommonSchemas.uuid,
    name: z.string().min(3).max(200),
    start_time: CommonSchemas.dateString,
    voting_start_time: CommonSchemas.dateString.optional(),
    voting_end_time: CommonSchemas.dateString.optional(),
    presentation_order: z.array(CommonSchemas.uuid),
    stream_url: CommonSchemas.url,
    is_rehearsal: z.boolean().default(false)
  }),

  updateSession: z.object({
    name: z.string().min(3).max(200).optional(),
    status: z.enum(['waiting', 'active', 'paused', 'completed'] as const).optional(),
    current_presentation_id: CommonSchemas.uuid.optional(),
    stream_url: CommonSchemas.url
  }),

  reaction: z.object({
    session_id: CommonSchemas.uuid,
    submission_id: CommonSchemas.uuid,
    reaction_type: z.enum(['emoji', 'clap', 'boost', 'question'] as const),
    intensity: z.number().int().min(1).max(10),
    coordinates: z.object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1)
    }).optional()
  })
}

/**
 * File upload schemas
 */
export const FileSchemas = {
  upload: z.object({
    submission_id: CommonSchemas.uuid,
    file_type: z.enum(['document', 'image', 'video', 'slide', 'code', 'other'] as const),
    description: z.string().max(500).optional()
  }),

  update: z.object({
    description: z.string().max(500).optional(),
    file_type: z.enum(['document', 'image', 'video', 'slide', 'code', 'other'] as const).optional()
  })
}

/**
 * Analytics schemas
 */
export const AnalyticsSchemas = {
  votingFilters: z.object({
    competition_id: CommonSchemas.uuid,
    round_id: CommonSchemas.uuid.optional(),
    start_date: CommonSchemas.dateString.optional(),
    end_date: CommonSchemas.dateString.optional(),
    include_invalid: z.boolean().default(false)
  }),

  submissionFilters: z.object({
    competition_id: CommonSchemas.uuid,
    status: z.enum(['draft', 'submitted', 'in_review', 'accepted', 'rejected', 'advanced', 'eliminated', 'winner'] as const).optional(),
    start_date: CommonSchemas.dateString.optional(),
    end_date: CommonSchemas.dateString.optional()
  })
}