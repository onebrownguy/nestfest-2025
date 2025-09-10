/**
 * Database Schema for NestFest Competition Platform
 * Built with Drizzle ORM for type-safety and performance
 */

import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  uuid, 
  integer, 
  decimal, 
  boolean, 
  jsonb,
  pgEnum,
  uniqueIndex
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums for better type safety
export const userRole = pgEnum('user_role', ['student', 'judge', 'reviewer', 'admin', 'super_admin'])
export const userStatus = pgEnum('user_status', ['active', 'inactive', 'suspended', 'pending'])
export const competitionStatus = pgEnum('competition_status', ['draft', 'open', 'judging', 'completed', 'archived'])
export const submissionStatus = pgEnum('submission_status', ['draft', 'submitted', 'under_review', 'judged', 'disqualified'])

// Users table - Core authentication and profile data
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  emailVerified: timestamp('email_verified'),
  name: varchar('name', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  image: text('image'),
  
  // Role and permissions
  role: userRole('role').default('student').notNull(),
  status: userStatus('status').default('active').notNull(),
  
  // Profile information
  university: varchar('university', { length: 255 }),
  graduationYear: integer('graduation_year'),
  program: varchar('program', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 20 }),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  
  // Metadata
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}))

// NextAuth.js required tables
export const accounts = pgTable('accounts', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  compoundKey: uniqueIndex('accounts_provider_account_id_idx').on(
    table.provider, table.providerAccountId
  ),
}))

export const sessions = pgTable('sessions', {
  sessionToken: varchar('session_token', { length: 255 }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  compoundKey: uniqueIndex('verification_tokens_identifier_token_idx').on(
    table.identifier, table.token
  ),
}))

// Competitions - Core event management
export const competitions = pgTable('competitions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 500 }),
  
  // Timing
  registrationStartAt: timestamp('registration_start_at').notNull(),
  registrationEndAt: timestamp('registration_end_at').notNull(),
  submissionStartAt: timestamp('submission_start_at').notNull(),
  submissionEndAt: timestamp('submission_end_at').notNull(),
  judgingStartAt: timestamp('judging_start_at').notNull(),
  judgingEndAt: timestamp('judging_end_at').notNull(),
  
  // Status and configuration
  status: competitionStatus('status').default('draft').notNull(),
  maxTeamSize: integer('max_team_size').default(1).notNull(),
  allowIndividual: boolean('allow_individual').default(true).notNull(),
  allowTeams: boolean('allow_teams').default(true).notNull(),
  
  // Requirements and rules
  eligibilityRequirements: jsonb('eligibility_requirements'),
  submissionRequirements: jsonb('submission_requirements'),
  judgingCriteria: jsonb('judging_criteria'),
  
  // Prizes and recognition
  prizes: jsonb('prizes'),
  
  // Metadata
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Teams - For team-based competitions
export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  competitionId: uuid('competition_id').notNull().references(() => competitions.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Team lead
  leaderId: uuid('leader_id').notNull().references(() => users.id),
  
  // Invitation and joining
  inviteCode: varchar('invite_code', { length: 50 }).unique(),
  maxMembers: integer('max_members').default(4),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Team memberships
export const teamMembers = pgTable('team_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).default('member').notNull(), // 'leader', 'member'
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  uniqueTeamUser: uniqueIndex('team_members_team_user_idx').on(table.teamId, table.userId),
}))

// Submissions - Student work and files
export const submissions = pgTable('submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  competitionId: uuid('competition_id').notNull().references(() => competitions.id, { onDelete: 'cascade' }),
  
  // Submitter (individual or team)
  userId: uuid('user_id').references(() => users.id), // Individual submissions
  teamId: uuid('team_id').references(() => teams.id), // Team submissions
  
  // Content
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // Files and attachments
  files: jsonb('files'), // Array of file metadata
  presentationUrl: text('presentation_url'),
  demoUrl: text('demo_url'),
  repositoryUrl: text('repository_url'),
  
  // Status and metadata
  status: submissionStatus('status').default('draft').notNull(),
  submittedAt: timestamp('submitted_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Judging assignments
export const judgeAssignments = pgTable('judge_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  competitionId: uuid('competition_id').notNull().references(() => competitions.id, { onDelete: 'cascade' }),
  judgeId: uuid('judge_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  submissionId: uuid('submission_id').references(() => submissions.id, { onDelete: 'cascade' }),
  
  // Assignment configuration
  weight: decimal('weight', { precision: 3, scale: 2 }).default('1.00'),
  category: varchar('category', { length: 100 }), // For specialized judges
  
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
}, (table) => ({
  uniqueJudgeSubmission: uniqueIndex('judge_assignments_judge_submission_idx').on(
    table.judgeId, table.submissionId
  ),
}))

// Scores and evaluations
export const evaluations = pgTable('evaluations', {
  id: uuid('id').defaultRandom().primaryKey(),
  submissionId: uuid('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
  judgeId: uuid('judge_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Scoring
  scores: jsonb('scores'), // Flexible scoring based on criteria
  totalScore: decimal('total_score', { precision: 5, scale: 2 }),
  maxScore: decimal('max_score', { precision: 5, scale: 2 }),
  
  // Feedback
  feedback: text('feedback'),
  privateNotes: text('private_notes'), // Only visible to judges and admins
  
  // Status
  isComplete: boolean('is_complete').default(false),
  submittedAt: timestamp('submitted_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueSubmissionJudge: uniqueIndex('evaluations_submission_judge_idx').on(
    table.submissionId, table.judgeId
  ),
}))

// Notifications system
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  type: varchar('type', { length: 100 }).notNull(), // 'competition_update', 'submission_feedback', etc.
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  
  // Metadata
  relatedId: uuid('related_id'), // Competition, submission, etc.
  relatedType: varchar('related_type', { length: 50 }), // 'competition', 'submission', etc.
  
  // Status
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Define relationships for better query experience
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  competitions: many(competitions),
  teamMemberships: many(teamMembers),
  submissions: many(submissions),
  evaluations: many(evaluations),
  notifications: many(notifications),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const competitionsRelations = relations(competitions, ({ one, many }) => ({
  creator: one(users, {
    fields: [competitions.createdBy],
    references: [users.id],
  }),
  teams: many(teams),
  submissions: many(submissions),
  judgeAssignments: many(judgeAssignments),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  competition: one(competitions, {
    fields: [teams.competitionId],
    references: [competitions.id],
  }),
  leader: one(users, {
    fields: [teams.leaderId],
    references: [users.id],
  }),
  members: many(teamMembers),
  submissions: many(submissions),
}))

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  competition: one(competitions, {
    fields: [submissions.competitionId],
    references: [competitions.id],
  }),
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [submissions.teamId],
    references: [teams.id],
  }),
  evaluations: many(evaluations),
}))

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  submission: one(submissions, {
    fields: [evaluations.submissionId],
    references: [submissions.id],
  }),
  judge: one(users, {
    fields: [evaluations.judgeId],
    references: [users.id],
  }),
}))

// Export types for use throughout the application
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Competition = typeof competitions.$inferSelect
export type NewCompetition = typeof competitions.$inferInsert
export type Submission = typeof submissions.$inferSelect
export type NewSubmission = typeof submissions.$inferInsert
export type Evaluation = typeof evaluations.$inferSelect
export type NewEvaluation = typeof evaluations.$inferInsert