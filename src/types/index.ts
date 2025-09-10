// Core Types for NestFest Competition Platform

// User Management Types
export type UserRole = 'student' | 'reviewer' | 'judge' | 'admin' | 'super_admin'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  status: 'active' | 'inactive' | 'suspended'
  university?: string
  graduation_year?: number
  program?: string
  phone_number?: string
  timezone?: string
  avatar_url?: string
  email_verified_at?: string
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  code: string // unique team join code
  captain_user_id: string
  max_members: number
  is_locked: boolean
  members: TeamMember[]
  created_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'captain' | 'member'
  joined_at: string
  removed_at?: string
}

// Competition Types
export type CompetitionStatus = 'draft' | 'open' | 'reviewing' | 'judging' | 'live' | 'completed' | 'archived'

export interface Competition {
  id: string
  name: string
  slug: string
  description: string
  rules_document_url?: string
  start_date: string
  submission_deadline: string
  judging_start_date: string
  judging_end_date: string
  event_date: string
  status: CompetitionStatus
  max_submissions_per_user: number
  allow_team_submissions: boolean
  team_size_min?: number
  team_size_max?: number
  voting_enabled: boolean
  public_voting_enabled: boolean
  config: CompetitionConfig
  rounds: CompetitionRound[]
  created_at: string
}

export interface CompetitionConfig {
  voting_rules: VotingRules
  advancement_rules: AdvancementRules
  file_restrictions: FileRestrictions
  notification_settings: NotificationSettings
}

export interface CompetitionRound {
  id: string
  competition_id: string
  round_number: number
  name: string
  start_date: string
  end_date: string
  advancement_quota?: number
  advancement_type: 'manual' | 'automatic' | 'hybrid'
  scoring_criteria: ScoringCriteria[]
  is_public_voting_round: boolean
}

// Submission Types
export type SubmissionStatus = 'draft' | 'submitted' | 'in_review' | 'accepted' | 'rejected' | 'advanced' | 'eliminated' | 'winner'

export interface Submission {
  id: string
  competition_id: string
  round_id: string
  user_id?: string
  team_id?: string
  title: string
  description: string
  category_id: string
  status: SubmissionStatus
  submission_number: string
  submitted_at?: string
  last_modified_at: string
  withdrawn_at?: string
  withdrawal_reason?: string
  metadata: SubmissionMetadata
  version: number
  files: SubmissionFile[]
  reviews: Review[]
  votes: Vote[]
}

export interface SubmissionFile {
  id: string
  submission_id: string
  file_type: 'document' | 'image' | 'video' | 'slide' | 'code' | 'other'
  original_filename: string
  storage_key: string
  file_size: number
  mime_type: string
  upload_status: 'pending' | 'processing' | 'ready' | 'failed'
  thumbnail_url?: string
  duration?: number
  page_count?: number
  virus_scan_status: 'pending' | 'clean' | 'infected'
  uploaded_at: string
}

export interface SubmissionMetadata {
  category: string
  tags: string[]
  technical_requirements?: string[]
  external_links?: string[]
  [key: string]: any
}

// Review & Judging Types
export type ReviewStatus = 'assigned' | 'in_progress' | 'completed' | 'recused'

export interface Review {
  id: string
  submission_id: string
  reviewer_user_id: string
  round_id: string
  status: ReviewStatus
  overall_score?: number
  scores: Record<string, number>
  feedback_for_participant?: string
  internal_notes?: string
  time_spent_seconds: number
  started_at?: string
  completed_at?: string
  conflict_of_interest: boolean
  confidence_level: 'low' | 'medium' | 'high'
}

export interface JudgeAssignment {
  id: string
  judge_user_id: string
  submission_id: string
  round_id: string
  assigned_by_user_id: string
  assignment_method: 'manual' | 'random' | 'load_balanced' | 'expertise_matched'
  priority: number
  due_date: string
  assigned_at: string
  viewed_at?: string
  completed_at?: string
}

export interface ScoringCriteria {
  id: string
  name: string
  description: string
  weight: number
  max_score: number
  scoring_type: 'numeric' | 'scale' | 'boolean' | 'rubric'
  rubric_definition?: RubricDefinition
  order_index: number
}

export interface RubricDefinition {
  levels: RubricLevel[]
}

export interface RubricLevel {
  score: number
  label: string
  description: string
}

// Voting Types
export type VoteType = 'simple' | 'quadratic' | 'ranked' | 'approval'

export interface Vote {
  id: string
  competition_id: string
  submission_id: string
  voter_user_id?: string
  voter_session_id?: string
  vote_type: VoteType
  vote_data: VoteData
  weight: number
  ip_address: string
  user_agent: string
  voted_at: string
  is_valid: boolean
}

export interface VoteData {
  // For simple voting
  value?: number
  
  // For quadratic voting
  credits_spent?: number
  vote_count?: number
  
  // For ranked voting
  rankings?: Array<{ submission_id: string; rank: number }>
  
  // For approval voting
  approved_submissions?: string[]
}

export interface QuadraticVotingBudget {
  user_id: string
  competition_id: string
  total_credits: number
  spent_credits: number
  bonus_credits: number
  credit_source: 'purchased' | 'earned' | 'granted'
}

// Live Event Types
export interface EventSession {
  id: string
  competition_id: string
  round_id: string
  name: string
  status: 'waiting' | 'active' | 'paused' | 'completed'
  start_time: string
  end_time?: string
  voting_start_time?: string
  voting_end_time?: string
  presentation_order: string[] // submission IDs
  current_presentation_id?: string
  stream_url?: string
  is_rehearsal: boolean
}

export interface LiveReaction {
  id: string
  session_id: string
  submission_id: string
  user_id: string
  reaction_type: 'emoji' | 'clap' | 'boost' | 'question'
  intensity: number // 1-10
  timestamp: string
  coordinates?: { x: number; y: number } // for heat map
}

// Permission & Security Types
export interface Permission {
  id: string
  role: UserRole
  resource: string
  action: 'read' | 'write' | 'delete' | 'admin'
  conditions?: Record<string, any>
}

export interface UserPermissionOverride {
  id: string
  user_id: string
  permission_id: string
  competition_id?: string
  granted_by_user_id: string
  expires_at?: string
}

// Configuration Types
export interface VotingRules {
  type: VoteType
  budget?: number // for quadratic voting
  max_selections?: number // for approval voting
  allow_ties: boolean
  weight_multiplier: number
}

export interface AdvancementRules {
  type: 'top_n' | 'top_percentage' | 'score_threshold'
  value: number
  tie_breaking_method: 'random' | 'timestamp' | 'judge_preference'
}

export interface FileRestrictions {
  max_file_size: number
  allowed_types: string[]
  max_files_per_submission: number
  require_virus_scan: boolean
}

export interface NotificationSettings {
  email_enabled: boolean
  sms_enabled: boolean
  in_app_enabled: boolean
  digest_frequency: 'immediate' | 'daily' | 'weekly'
}

// Analytics & Reporting Types
export interface VotingAnalytics {
  competition_id: string
  round_id?: string
  vote_velocity: number // votes per minute
  demographic_breakdown: Record<string, number>
  sentiment_analysis?: number
  engagement_score: number
  controversy_index: number // measure of split votes
  momentum_score: number
  predicted_winner?: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

// WebSocket Event Types
export interface SocketEvent {
  type: string
  payload: any
  timestamp: string
  user_id?: string
  competition_id?: string
}

// Real-time Communication Types
export interface RealtimeVoteData {
  competitionId: string
  submissionId: string
  voteType: VoteType
  voteData: VoteData
  userId?: string
}

export interface RealtimeVoteUpdate {
  submissionId: string
  newVoteCount: number
  voterId: string
  timestamp: string
}

export interface VotingMomentum {
  submissionId: string
  velocity: number // votes per minute
  trend: 'increasing' | 'decreasing' | 'stable'
  peak: number
  momentum_score: number
}

export interface FraudDetectionAlert {
  type: 'suspicious_voting_pattern' | 'rapid_voting' | 'duplicate_votes' | 'bot_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  submissionId?: string
  competitionId: string
  description: string
  metadata: Record<string, any>
  timestamp: string
}

// Event Session Management
export interface EventSessionState {
  session: EventSession
  currentPresentation?: Submission
  nextPresentation?: Submission
  timeRemaining?: number
  votingActive: boolean
  participantCount: number
}

export interface PresentationControl {
  action: 'start' | 'pause' | 'resume' | 'next' | 'previous' | 'end'
  sessionId: string
  presentationId?: string
  timestamp: string
  adminId: string
}

// Live Reactions and Engagement
export interface ReactionHeatMapPoint {
  x: number
  y: number
  intensity: number
  reactionType: string
  count: number
}

export interface ReactionAnalytics {
  totalReactions: number
  reactionsByType: Record<string, number>
  averageIntensity: number
  heatMapData: ReactionHeatMapPoint[]
  momentum: number
}

export interface LiveComment {
  id: string
  sessionId: string
  submissionId?: string
  userId: string
  userName: string
  content: string
  replyTo?: string
  reactions: Record<string, number>
  timestamp: string
  moderated: boolean
}

// Shark Tank Mode Types
export interface SharkTankOffer {
  id: string
  sessionId: string
  submissionId: string
  judgeId: string
  offerType: 'equity' | 'loan' | 'partnership' | 'mentorship'
  amount?: number
  equityPercentage?: number
  conditions: string[]
  status: 'pending' | 'accepted' | 'declined' | 'countered'
  timestamp: string
}

export interface DealNegotiation {
  id: string
  offerId: string
  participants: string[] // user IDs
  messages: NegotiationMessage[]
  currentOffer: SharkTankOffer
  status: 'active' | 'completed' | 'abandoned'
}

export interface NegotiationMessage {
  id: string
  senderId: string
  message: string
  offerUpdate?: Partial<SharkTankOffer>
  timestamp: string
}

export interface AudienceInvestmentPool {
  sessionId: string
  totalPool: number
  participantCount: number
  submissions: Record<string, {
    amount: number
    percentage: number
    backers: number
  }>
}

// Competition Flow Management
export interface CompetitionFlow {
  id: string
  competitionId: string
  currentRound: CompetitionRound
  nextRound?: CompetitionRound
  autoAdvancement: boolean
  advancementCriteria: AdvancementRules
  deadlines: FlowDeadline[]
}

export interface FlowDeadline {
  id: string
  type: 'submission' | 'review' | 'voting' | 'advancement'
  deadline: string
  warningThreshold: number // minutes before deadline
  autoActions: string[]
}

export interface RoundProgressionNotification {
  competitionId: string
  fromRound: string
  toRound: string
  advancedSubmissions: string[]
  eliminatedSubmissions: string[]
  timestamp: string
}

// Performance Monitoring
export interface SystemHealthMetrics {
  timestamp: string
  connectionsCount: number
  messagesPerSecond: number
  averageLatency: number
  errorRate: number
  memoryUsage: number
  cpuUsage: number
  redisHealth: 'healthy' | 'degraded' | 'unhealthy'
}

export interface LoadBalancingMetrics {
  serverId: string
  connections: number
  rooms: number
  messagesHandled: number
  uptime: number
  region: string
}

// Real-time Dashboard Types
export interface DashboardUpdate {
  type: 'competition_stats' | 'voting_update' | 'user_activity' | 'system_alert'
  data: any
  timestamp: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

export interface LiveLeaderboard {
  competitionId: string
  rankings: LeaderboardEntry[]
  lastUpdate: string
  nextUpdate: string
}

export interface LeaderboardEntry {
  rank: number
  submissionId: string
  title: string
  author: string
  score: number
  voteCount: number
  trend: 'up' | 'down' | 'stable'
  change: number
}

// Geographic and Demographic Analytics
export interface VotingGeographics {
  competitionId: string
  regions: Record<string, {
    votes: number
    percentage: number
    topSubmissions: string[]
  }>
  heatMap: GeographicHeatMapPoint[]
}

export interface GeographicHeatMapPoint {
  latitude: number
  longitude: number
  votes: number
  intensity: number
}

export interface DemographicBreakdown {
  byRole: Record<UserRole, number>
  byUniversity: Record<string, number>
  byGraduationYear: Record<number, number>
  byProgram: Record<string, number>
}

// Wave Voting System
export interface WaveVotingSession {
  id: string
  competitionId: string
  rounds: WaveRound[]
  currentRound: number
  status: 'waiting' | 'active' | 'break' | 'completed'
  participants: string[]
}

export interface WaveRound {
  roundNumber: number
  duration: number // seconds
  submissions: string[]
  startTime?: string
  endTime?: string
  results?: Record<string, number>
}

// Sentiment Analysis
export interface SentimentAnalysis {
  submissionId: string
  overall: number // -1 to 1
  confidence: number
  aspects: Record<string, number>
  keywords: string[]
  timestamp: string
}

// Connection Status
export interface ConnectionStatus {
  isConnected: boolean
  reconnectAttempts: number
  latency: number
  lastHeartbeat: string
  serverRegion: string
}

// Error Types
export interface AppError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
}

// AI Enhancement Types
export interface AIEnhancementRequest {
  text: string
  context: 'project_description' | 'competition_pitch' | 'executive_summary' | 'general'
  target_length: 'maintain' | 'expand' | 'condense'
  tone: 'professional' | 'enthusiastic' | 'technical' | 'conversational'
  focus_areas: Array<'clarity' | 'impact' | 'technical_detail' | 'market_appeal' | 'innovation'>
}

export interface AIEnhancementResponse {
  originalText: string
  enhancedText: string
  improvements: Array<{
    category: string
    description: string
    before?: string
    after?: string
  }>
  characterCount: {
    original: number
    enhanced: number
    change: number
  }
  wordCount: {
    original: number
    enhanced: number
    change: number
  }
  enhancementStrength: 'minor' | 'moderate' | 'significant'
  processingTime: number
  model: string
}