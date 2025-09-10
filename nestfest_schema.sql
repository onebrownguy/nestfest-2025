-- =====================================================
-- NESTFEST COMPETITION PLATFORM DATABASE SCHEMA
-- PostgreSQL 15+ with UUID, JSONB, and advanced features
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- CORE USER MANAGEMENT
-- =====================================================

-- User roles and permissions
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]', -- Array of permission strings
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Universities and educational institutions
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL, -- University code
    type VARCHAR(50) NOT NULL CHECK (type IN ('university', 'college', 'institute', 'school')),
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    website VARCHAR(255),
    contact_info JSONB, -- {email, phone, address}
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Academic programs and departments
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    department VARCHAR(100),
    degree_level VARCHAR(50) CHECK (degree_level IN ('undergraduate', 'graduate', 'postgraduate', 'phd')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(institution_id, code)
);

-- Main users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- Academic information
    institution_id UUID REFERENCES institutions(id),
    program_id UUID REFERENCES programs(id),
    student_id VARCHAR(50), -- University student ID
    graduation_year INTEGER,
    current_year INTEGER, -- 1st year, 2nd year, etc.
    
    -- Profile and preferences
    profile_picture_url VARCHAR(500),
    bio TEXT,
    skills JSONB DEFAULT '[]', -- Array of skills
    interests JSONB DEFAULT '[]', -- Array of interests
    social_links JSONB DEFAULT '{}', -- {linkedin, github, portfolio}
    preferences JSONB DEFAULT '{}', -- User preferences
    
    -- Account status
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    phone_verified BOOLEAN DEFAULT FALSE,
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned', 'pending')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_academic_info CHECK (
        (institution_id IS NULL AND program_id IS NULL) OR 
        (institution_id IS NOT NULL)
    )
);

-- User role assignments (many-to-many)
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, role_id)
);

-- =====================================================
-- COMPETITION STRUCTURE
-- =====================================================

-- Competition categories and tracks
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100), -- Icon identifier
    color VARCHAR(7), -- Hex color code
    parent_id UUID REFERENCES categories(id), -- For subcategories
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Main competitions table
CREATE TABLE competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    category_id UUID NOT NULL REFERENCES categories(id),
    
    -- Competition settings
    type VARCHAR(50) NOT NULL CHECK (type IN ('individual', 'team', 'hybrid')),
    max_team_size INTEGER,
    min_team_size INTEGER DEFAULT 1,
    allow_cross_institution BOOLEAN DEFAULT TRUE,
    
    -- Timeline
    registration_start TIMESTAMP WITH TIME ZONE NOT NULL,
    registration_end TIMESTAMP WITH TIME ZONE NOT NULL,
    competition_start TIMESTAMP WITH TIME ZONE NOT NULL,
    competition_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Submission requirements
    submission_requirements JSONB NOT NULL DEFAULT '{}',
    file_types_allowed JSONB DEFAULT '["pdf", "docx", "pptx", "mp4", "zip"]',
    max_file_size_mb INTEGER DEFAULT 100,
    max_files_per_submission INTEGER DEFAULT 10,
    
    -- Rules and configuration
    rules JSONB DEFAULT '{}',
    judging_criteria JSONB DEFAULT '[]',
    advancement_rules JSONB DEFAULT '{}', -- How participants advance between rounds
    
    -- Status and visibility
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed', 'cancelled')),
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'restricted')),
    featured BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    banner_image_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    prize_info JSONB DEFAULT '{}',
    sponsor_info JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_team_size CHECK (
        (type = 'individual' AND max_team_size IS NULL AND min_team_size = 1) OR
        (type IN ('team', 'hybrid') AND max_team_size >= min_team_size)
    )
);

-- Competition rounds (Preliminary, Semi-Final, Final, etc.)
CREATE TABLE competition_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    round_number INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('preliminary', 'qualification', 'semifinal', 'final', 'special')),
    
    -- Timeline
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    submission_deadline TIMESTAMP WITH TIME ZONE,
    judging_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Round configuration
    max_participants INTEGER,
    advancement_count INTEGER, -- How many advance to next round
    advancement_criteria JSONB DEFAULT '{}',
    scoring_method VARCHAR(50) DEFAULT 'standard',
    
    -- Requirements specific to this round
    requirements JSONB DEFAULT '{}',
    allowed_file_types JSONB,
    max_submission_size_mb INTEGER,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(competition_id, round_number),
    CONSTRAINT valid_dates CHECK (start_date < end_date)
);

-- =====================================================
-- TEAM MANAGEMENT
-- =====================================================

-- Teams for team-based competitions
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    description TEXT,
    team_logo_url VARCHAR(500),
    
    -- Team composition
    captain_id UUID NOT NULL REFERENCES users(id),
    max_members INTEGER NOT NULL DEFAULT 4,
    current_member_count INTEGER DEFAULT 1,
    
    -- Team status
    status VARCHAR(20) DEFAULT 'forming' CHECK (status IN ('forming', 'active', 'disbanded', 'banned')),
    is_cross_institutional BOOLEAN DEFAULT FALSE,
    
    -- Invitation settings
    invite_code VARCHAR(20) UNIQUE,
    is_public BOOLEAN DEFAULT FALSE, -- Can others request to join
    requires_approval BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('captain', 'co_captain', 'member')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'left', 'removed')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    
    PRIMARY KEY (team_id, user_id)
);

-- Team invitations and requests
CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('invitation', 'request')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(team_id, user_id, type)
);

-- =====================================================
-- SUBMISSIONS AND FILE MANAGEMENT
-- =====================================================

-- Competition registrations
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    participant_type VARCHAR(20) NOT NULL CHECK (participant_type IN ('individual', 'team')),
    participant_id UUID NOT NULL, -- user_id or team_id
    
    -- Registration details
    registration_data JSONB DEFAULT '{}', -- Additional registration info
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'withdrawn', 'disqualified')),
    
    -- Track current round progression
    current_round_id UUID REFERENCES competition_rounds(id),
    advancement_status VARCHAR(20) DEFAULT 'active' CHECK (advancement_status IN ('active', 'advanced', 'eliminated')),
    
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(competition_id, participant_type, participant_id)
);

-- File storage metadata
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL, -- Relative path in storage
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for integrity
    
    -- File metadata
    uploaded_by UUID NOT NULL REFERENCES users(id),
    upload_ip INET,
    scan_status VARCHAR(20) DEFAULT 'pending' CHECK (scan_status IN ('pending', 'clean', 'infected', 'error')),
    scan_result JSONB,
    
    -- Access control
    access_level VARCHAR(20) DEFAULT 'private' CHECK (access_level IN ('public', 'restricted', 'private')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(file_hash) -- Prevent duplicate files
);

-- Submissions for competition rounds
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES competition_rounds(id) ON DELETE CASCADE,
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    
    -- Submission metadata
    title VARCHAR(255) NOT NULL,
    description TEXT,
    submission_data JSONB DEFAULT '{}', -- Flexible data storage
    
    -- Version control
    version INTEGER DEFAULT 1,
    is_final BOOLEAN DEFAULT FALSE,
    parent_submission_id UUID REFERENCES submissions(id), -- For version tracking
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'reviewed', 'disqualified')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    
    -- Review tracking
    review_status VARCHAR(20) DEFAULT 'pending' CHECK (review_status IN ('pending', 'in_progress', 'completed', 'needs_revision')),
    review_started_at TIMESTAMP WITH TIME ZONE,
    review_completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_submission_date CHECK (
        submitted_at IS NULL OR submitted_at >= created_at
    )
);

-- Files attached to submissions
CREATE TABLE submission_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    file_category VARCHAR(50), -- main_document, presentation, video, etc.
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    
    PRIMARY KEY (submission_id, file_id)
);

-- =====================================================
-- JUDGING AND REVIEW SYSTEM
-- =====================================================

-- Judge profiles and expertise
CREATE TABLE judges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    expertise_areas JSONB DEFAULT '[]', -- Array of expertise areas
    bio TEXT,
    qualification TEXT,
    years_of_experience INTEGER,
    max_concurrent_reviews INTEGER DEFAULT 10,
    preferred_categories JSONB DEFAULT '[]',
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable')),
    
    -- Performance metrics
    average_review_time_hours DECIMAL(10,2),
    total_reviews_completed INTEGER DEFAULT 0,
    quality_rating DECIMAL(3,2) DEFAULT 5.0,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Judge assignments to competitions
CREATE TABLE judge_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    round_id UUID REFERENCES competition_rounds(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'reviewer' CHECK (role IN ('reviewer', 'lead_judge', 'panel_chair')),
    
    -- Assignment configuration
    assignment_method VARCHAR(50) CHECK (assignment_method IN ('manual', 'automatic', 'random', 'expertise_matched')),
    max_submissions INTEGER, -- Max submissions this judge can review
    assigned_by UUID REFERENCES users(id),
    
    -- Conflict of interest tracking
    conflict_declarations JSONB DEFAULT '[]',
    has_conflicts BOOLEAN DEFAULT FALSE,
    
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'recused')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(competition_id, round_id, judge_id)
);

-- Scoring rubrics and criteria
CREATE TABLE scoring_rubrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    round_id UUID REFERENCES competition_rounds(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Rubric configuration
    criteria JSONB NOT NULL, -- Array of scoring criteria with weights
    total_points DECIMAL(10,2) NOT NULL,
    scoring_type VARCHAR(50) DEFAULT 'points' CHECK (scoring_type IN ('points', 'percentage', 'ranking')),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(competition_id, round_id, name)
);

-- Individual reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
    rubric_id UUID NOT NULL REFERENCES scoring_rubrics(id) ON DELETE CASCADE,
    
    -- Review content
    overall_score DECIMAL(10,2),
    criteria_scores JSONB NOT NULL DEFAULT '{}', -- Scores for each criterion
    comments TEXT,
    strengths TEXT,
    areas_for_improvement TEXT,
    recommendation VARCHAR(50) CHECK (recommendation IN ('accept', 'reject', 'revise', 'advance', 'eliminate')),
    
    -- Review metadata
    is_blind_review BOOLEAN DEFAULT FALSE,
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    time_spent_minutes INTEGER,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'final')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    
    -- Conflict tracking
    has_conflict BOOLEAN DEFAULT FALSE,
    conflict_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(submission_id, judge_id),
    CONSTRAINT valid_score CHECK (overall_score >= 0)
);

-- =====================================================
-- VOTING SYSTEMS
-- =====================================================

-- Voting sessions for live events
CREATE TABLE voting_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    round_id UUID REFERENCES competition_rounds(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Voting configuration
    voting_type VARCHAR(50) NOT NULL CHECK (voting_type IN ('traditional', 'quadratic', 'ranked_choice', 'approval')),
    voter_eligibility JSONB NOT NULL DEFAULT '{}', -- Who can vote
    requires_authentication BOOLEAN DEFAULT TRUE,
    allow_anonymous_voting BOOLEAN DEFAULT FALSE,
    
    -- Session timing
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Vote limits
    votes_per_voter INTEGER DEFAULT 1,
    max_total_votes INTEGER, -- For quadratic voting
    
    -- Results configuration
    show_real_time_results BOOLEAN DEFAULT FALSE,
    show_results_after_voting BOOLEAN DEFAULT TRUE,
    
    -- Security settings
    prevent_vote_changing BOOLEAN DEFAULT FALSE,
    require_vote_verification BOOLEAN DEFAULT FALSE,
    
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_voting_times CHECK (start_time < end_time)
);

-- Vote options (submissions or candidates)
CREATE TABLE vote_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voting_session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Individual votes cast
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voting_session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES users(id), -- NULL for anonymous votes
    vote_option_id UUID NOT NULL REFERENCES vote_options(id) ON DELETE CASCADE,
    
    -- Vote value (for different voting types)
    vote_weight DECIMAL(10,4) DEFAULT 1.0, -- For quadratic voting
    rank_position INTEGER, -- For ranked choice voting
    
    -- Vote metadata
    voter_ip INET NOT NULL,
    voter_user_agent TEXT,
    vote_hash VARCHAR(64) NOT NULL, -- For verification
    
    -- Verification and security
    verification_token VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    fraud_score DECIMAL(3,2) DEFAULT 0.0, -- 0.0 = clean, 1.0 = likely fraud
    
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(voting_session_id, voter_id, vote_option_id) -- Prevent duplicate votes
);

-- Vote audit trail
CREATE TABLE vote_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vote_id UUID NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('cast', 'modified', 'withdrawn', 'verified', 'flagged')),
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS AND COMMUNICATIONS
-- =====================================================

-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'in_app', 'sms', 'push')),
    subject_template TEXT,
    content_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- Available template variables
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification queue
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES notification_templates(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'in_app', 'sms', 'push')),
    
    -- Message content
    subject VARCHAR(255),
    content TEXT NOT NULL,
    data JSONB DEFAULT '{}', -- Additional data for the notification
    
    -- Delivery tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notification preferences
CREATE TABLE user_notification_preferences (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (user_id, notification_type)
);

-- =====================================================
-- GAMIFICATION AND ACHIEVEMENTS
-- =====================================================

-- Achievement definitions
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    type VARCHAR(50) CHECK (type IN ('participation', 'performance', 'milestone', 'special')),
    category VARCHAR(50),
    
    -- Achievement criteria
    criteria JSONB NOT NULL, -- Conditions to unlock achievement
    points_value INTEGER DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    
    -- Availability
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    
    -- Achievement context
    context JSONB DEFAULT '{}', -- What triggered this achievement
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Display settings
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    
    UNIQUE(user_id, achievement_id)
);

-- User points and leaderboard
CREATE TABLE user_points (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
    
    -- Point totals
    total_points INTEGER DEFAULT 0,
    participation_points INTEGER DEFAULT 0,
    performance_points INTEGER DEFAULT 0,
    achievement_points INTEGER DEFAULT 0,
    
    -- Rankings
    overall_rank INTEGER,
    category_rank INTEGER,
    institution_rank INTEGER,
    
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (user_id, competition_id)
);

-- =====================================================
-- ANALYTICS AND REPORTING
-- =====================================================

-- Event tracking for analytics
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(100),
    event_action VARCHAR(100),
    event_label VARCHAR(255),
    
    -- Event data
    event_data JSONB DEFAULT '{}',
    
    -- Context
    page_url VARCHAR(1000),
    referrer VARCHAR(1000),
    user_agent TEXT,
    ip_address INET,
    
    -- Device and location
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    country VARCHAR(100),
    region VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create partitions for analytics events (monthly)
CREATE TABLE analytics_events_2024_01 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Competition statistics
CREATE TABLE competition_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    
    -- Registration stats
    total_registrations INTEGER DEFAULT 0,
    individual_registrations INTEGER DEFAULT 0,
    team_registrations INTEGER DEFAULT 0,
    
    -- Submission stats
    total_submissions INTEGER DEFAULT 0,
    on_time_submissions INTEGER DEFAULT 0,
    late_submissions INTEGER DEFAULT 0,
    
    -- Engagement stats
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    avg_session_duration INTEGER DEFAULT 0,
    
    -- Geographic distribution
    countries_represented JSONB DEFAULT '{}',
    institutions_represented INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(competition_id, stat_date)
);

-- =====================================================
-- AUDIT LOGGING AND SECURITY
-- =====================================================

-- System audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Actor information
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(255),
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create partitions for audit log (monthly)
CREATE TABLE audit_log_2024_01 PARTITION OF audit_log
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Security incidents and alerts
CREATE TABLE security_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Incident details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    affected_user_id UUID REFERENCES users(id),
    affected_resources JSONB DEFAULT '[]',
    
    -- Detection and response
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    detection_method VARCHAR(100),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    
    -- Investigation details
    assigned_to UUID REFERENCES users(id),
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Evidence and context
    evidence JSONB DEFAULT '{}',
    source_ip INET,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EMERGENCY PROCEDURES AND OVERRIDES
-- =====================================================

-- Emergency procedures and overrides
CREATE TABLE emergency_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    
    -- Override details
    affected_resource_type VARCHAR(100) NOT NULL,
    affected_resource_id UUID,
    override_data JSONB NOT NULL,
    
    -- Authorization
    authorized_by UUID NOT NULL REFERENCES users(id),
    approval_level VARCHAR(50) NOT NULL,
    emergency_justification TEXT NOT NULL,
    
    -- Timing
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    revoked_by UUID REFERENCES users(id),
    revoked_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System maintenance windows
CREATE TABLE maintenance_windows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Timing
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    
    -- Impact
    affected_services JSONB DEFAULT '[]',
    impact_level VARCHAR(20) CHECK (impact_level IN ('low', 'medium', 'high')),
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_email_active ON users(email) WHERE account_status = 'active';
CREATE INDEX idx_users_institution ON users(institution_id) WHERE institution_id IS NOT NULL;
CREATE INDEX idx_users_last_login ON users(last_login_at DESC);
CREATE INDEX idx_users_search ON users USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(username, '')));

-- Competitions and rounds
CREATE INDEX idx_competitions_status_featured ON competitions(status, featured DESC, created_at DESC);
CREATE INDEX idx_competitions_category_status ON competitions(category_id, status);
CREATE INDEX idx_competitions_timeline ON competitions(registration_start, registration_end, competition_start);
CREATE INDEX idx_competition_rounds_timeline ON competition_rounds(competition_id, round_number, start_date);

-- Registrations and submissions
CREATE INDEX idx_registrations_participant ON registrations(participant_type, participant_id);
CREATE INDEX idx_registrations_competition_status ON registrations(competition_id, status);
CREATE INDEX idx_submissions_competition_round ON submissions(competition_id, round_id, status);
CREATE INDEX idx_submissions_registration ON submissions(registration_id, version DESC);
CREATE INDEX idx_submissions_review_status ON submissions(review_status, review_started_at);

-- Teams and memberships
CREATE INDEX idx_teams_captain ON teams(captain_id, status);
CREATE INDEX idx_team_members_user ON team_members(user_id, status);
CREATE INDEX idx_team_invitations_pending ON team_invitations(user_id, status) WHERE status = 'pending';

-- Judging and reviews
CREATE INDEX idx_judge_assignments_competition ON judge_assignments(competition_id, round_id, status);
CREATE INDEX idx_reviews_submission_judge ON reviews(submission_id, judge_id);
CREATE INDEX idx_reviews_judge_status ON reviews(judge_id, status, created_at DESC);

-- Voting system
CREATE INDEX idx_voting_sessions_active ON voting_sessions(status, start_time) WHERE status = 'active';
CREATE INDEX idx_votes_session_voter ON votes(voting_session_id, voter_id);
CREATE INDEX idx_votes_option_timestamp ON votes(vote_option_id, voted_at DESC);

-- Notifications
CREATE INDEX idx_notifications_recipient_status ON notifications(recipient_id, status, scheduled_for);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE status = 'pending';

-- Analytics (with partial indexes for performance)
CREATE INDEX idx_analytics_events_user_time ON analytics_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_analytics_events_type_time ON analytics_events(event_type, created_at DESC);

-- Audit and security
CREATE INDEX idx_audit_log_user_time ON audit_log(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id, created_at DESC);
CREATE INDEX idx_security_incidents_severity ON security_incidents(severity, status, detected_at DESC);

-- =====================================================
-- CONSTRAINTS AND TRIGGERS
-- =====================================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Team member count maintenance
CREATE OR REPLACE FUNCTION update_team_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE teams SET current_member_count = current_member_count + 1 WHERE id = NEW.team_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'active' AND NEW.status = 'active' THEN
            UPDATE teams SET current_member_count = current_member_count + 1 WHERE id = NEW.team_id;
        ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
            UPDATE teams SET current_member_count = current_member_count - 1 WHERE id = NEW.team_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
        UPDATE teams SET current_member_count = current_member_count - 1 WHERE id = OLD.team_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER maintain_team_member_count
    AFTER INSERT OR UPDATE OR DELETE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_team_member_count();

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert default roles
INSERT INTO roles (name, description, permissions, is_system_role) VALUES
('super_admin', 'Super Administrator with all permissions', '["*"]', true),
('admin', 'System Administrator', '["competitions.manage", "users.manage", "system.configure"]', true),
('judge', 'Competition Judge', '["submissions.review", "scores.submit"]', true),
('student', 'Student Participant', '["competitions.register", "submissions.create", "teams.join"]', true),
('organizer', 'Competition Organizer', '["competitions.create", "competitions.manage", "judges.assign"]', true);

-- Insert default categories
INSERT INTO categories (name, code, description) VALUES
('Technology', 'TECH', 'Technology and software development competitions'),
('Business', 'BIZ', 'Business case studies and entrepreneurship'),
('Design', 'DESIGN', 'UI/UX and graphic design challenges'),
('Innovation', 'INNOV', 'Innovation and creative problem solving'),
('Research', 'RESEARCH', 'Academic research and thesis presentations');

-- Insert notification templates
INSERT INTO notification_templates (name, type, subject_template, content_template, variables) VALUES
('registration_confirmation', 'email', 'Registration Confirmed - {{competition_name}}', 
 'Dear {{user_name}}, your registration for {{competition_name}} has been confirmed.', 
 '["user_name", "competition_name", "registration_date"]'),
('submission_deadline_reminder', 'email', 'Submission Deadline Approaching - {{competition_name}}', 
 'Reminder: The submission deadline for {{competition_name}} is {{deadline_date}}.', 
 '["user_name", "competition_name", "deadline_date"]'),
('review_assignment', 'email', 'New Review Assignment - {{competition_name}}', 
 'You have been assigned to review submissions for {{competition_name}}.', 
 '["judge_name", "competition_name", "submission_count"]');

-- Create database functions for common operations
CREATE OR REPLACE FUNCTION get_user_competitions(user_uuid UUID)
RETURNS TABLE(
    competition_id UUID,
    competition_name VARCHAR,
    registration_status VARCHAR,
    current_round VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        r.status,
        cr.name
    FROM competitions c
    JOIN registrations r ON c.id = r.competition_id
    LEFT JOIN competition_rounds cr ON r.current_round_id = cr.id
    WHERE r.participant_id = user_uuid AND r.participant_type = 'individual'
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get competition leaderboard
CREATE OR REPLACE FUNCTION get_competition_leaderboard(comp_id UUID, round_id UUID DEFAULT NULL)
RETURNS TABLE(
    participant_name VARCHAR,
    participant_type VARCHAR,
    average_score DECIMAL,
    total_reviews INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN r.participant_type = 'individual' THEN u.first_name || ' ' || u.last_name
            ELSE t.name
        END as participant_name,
        r.participant_type,
        AVG(rev.overall_score) as average_score,
        COUNT(rev.id)::INTEGER as total_reviews
    FROM registrations r
    LEFT JOIN users u ON (r.participant_type = 'individual' AND r.participant_id = u.id)
    LEFT JOIN teams t ON (r.participant_type = 'team' AND r.participant_id = t.id)
    LEFT JOIN submissions s ON r.id = s.registration_id
    LEFT JOIN reviews rev ON s.id = rev.submission_id
    WHERE r.competition_id = comp_id
    AND (round_id IS NULL OR s.round_id = round_id)
    AND rev.status = 'final'
    GROUP BY r.participant_id, r.participant_type, u.first_name, u.last_name, t.name
    HAVING COUNT(rev.id) > 0
    ORDER BY average_score DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- END OF SCHEMA
-- =====================================================