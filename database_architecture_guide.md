# NestFest Competition Platform - Database Architecture Guide

## Table of Contents
1. [Schema Overview](#schema-overview)
2. [Indexing Strategy](#indexing-strategy)
3. [Data Integrity & Validation](#data-integrity--validation)
4. [Scalability Considerations](#scalability-considerations)
5. [Security Considerations](#security-considerations)
6. [Migration & Maintenance](#migration--maintenance)
7. [Performance Optimization](#performance-optimization)

## Schema Overview

The NestFest database schema consists of 35+ interconnected tables organized into logical domains:

### Core Domains

**User Management (7 tables)**
- `users` - Core user profiles with academic information
- `institutions` - Universities and educational institutions
- `programs` - Academic programs and departments
- `roles` - Role definitions with JSON-based permissions
- `user_roles` - User-role assignments with expiration support
- `user_notification_preferences` - Granular notification settings
- `user_points` - Gamification and leaderboard data

**Competition Structure (4 tables)**
- `categories` - Hierarchical competition categories
- `competitions` - Main competition definitions with flexible configuration
- `competition_rounds` - Multi-stage competition support
- `registrations` - Participant registration tracking

**Team Management (3 tables)**
- `teams` - Team profiles and settings
- `team_members` - Team membership with role hierarchy
- `team_invitations` - Invitation and join request system

**Submission System (3 tables)**
- `submissions` - Version-controlled submission tracking
- `files` - Centralized file metadata with integrity checking
- `submission_files` - Many-to-many submission-file relationships

**Judging & Review (4 tables)**
- `judges` - Judge profiles with expertise and availability
- `judge_assignments` - Competition-specific judge assignments
- `scoring_rubrics` - Configurable scoring criteria
- `reviews` - Individual judge reviews with detailed scoring

**Voting Systems (4 tables)**
- `voting_sessions` - Live voting event management
- `vote_options` - Voting choices and candidates
- `votes` - Individual vote records with fraud detection
- `vote_audit_log` - Complete vote audit trail

**Additional Systems (10+ tables)**
- Analytics and reporting infrastructure
- Notification system with templates
- Gamification and achievements
- Audit logging and security
- Emergency procedures

## Indexing Strategy

### Performance-Critical Indexes

```sql
-- User lookup optimization
CREATE INDEX idx_users_email_active ON users(email) WHERE account_status = 'active';
CREATE INDEX idx_users_institution ON users(institution_id) WHERE institution_id IS NOT NULL;

-- Competition browsing
CREATE INDEX idx_competitions_status_featured ON competitions(status, featured DESC, created_at DESC);
CREATE INDEX idx_competitions_timeline ON competitions(registration_start, registration_end, competition_start);

-- Submission processing
CREATE INDEX idx_submissions_competition_round ON submissions(competition_id, round_id, status);
CREATE INDEX idx_submissions_review_status ON submissions(review_status, review_started_at);

-- Real-time voting
CREATE INDEX idx_votes_session_voter ON votes(voting_session_id, voter_id);
CREATE INDEX idx_voting_sessions_active ON voting_sessions(status, start_time) WHERE status = 'active';
```

### Composite Indexes for Complex Queries

```sql
-- Judge workload management
CREATE INDEX idx_reviews_judge_status ON reviews(judge_id, status, created_at DESC);
CREATE INDEX idx_judge_assignments_competition ON judge_assignments(competition_id, round_id, status);

-- Analytics optimization
CREATE INDEX idx_analytics_events_user_time ON analytics_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_analytics_events_type_time ON analytics_events(event_type, created_at DESC);
```

### Full-Text Search Indexes

```sql
-- User and content search
CREATE INDEX idx_users_search ON users USING gin(to_tsvector('english', 
    first_name || ' ' || last_name || ' ' || COALESCE(username, '')));

-- Competition discovery
CREATE INDEX idx_competitions_search ON competitions USING gin(to_tsvector('english', 
    name || ' ' || COALESCE(description, '')));
```

## Data Integrity & Validation

### Database Constraints

**Referential Integrity**
```sql
-- Cascade deletes for dependent data
ALTER TABLE team_members ADD CONSTRAINT fk_team_members_team 
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- Prevent orphaned records
ALTER TABLE submissions ADD CONSTRAINT fk_submissions_registration 
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE;
```

**Business Logic Constraints**
```sql
-- Team size validation
CONSTRAINT valid_team_size CHECK (
    (type = 'individual' AND max_team_size IS NULL AND min_team_size = 1) OR
    (type IN ('team', 'hybrid') AND max_team_size >= min_team_size)
)

-- Timeline validation
CONSTRAINT valid_competition_timeline CHECK (
    registration_start < registration_end AND 
    registration_end <= competition_start AND 
    competition_start < competition_end
)

-- Score validation
CONSTRAINT valid_score CHECK (overall_score >= 0 AND overall_score <= total_points)
```

### Application-Level Validation

**User Registration Validation**
```sql
-- Email format validation (application layer)
-- Password complexity requirements
-- Institution verification process
-- Duplicate email prevention across soft-deleted users
```

**Submission Validation**
```sql
-- File type verification against competition requirements
-- File size limits per competition
-- Submission deadline enforcement
-- Version control integrity
```

## Scalability Considerations

### Horizontal Partitioning Strategy

**Time-Based Partitioning**
```sql
-- Analytics events partitioning (monthly)
CREATE TABLE analytics_events (
    -- columns
) PARTITION BY RANGE (created_at);

CREATE TABLE analytics_events_2024_01 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Audit log partitioning (monthly)  
CREATE TABLE audit_log (
    -- columns
) PARTITION BY RANGE (created_at);
```

**Entity-Based Partitioning**
```sql
-- Large competitions can be partitioned by competition_id
CREATE TABLE submissions_large PARTITION BY HASH (competition_id);

-- Voting data partitioned by session for isolation
CREATE TABLE votes_partitioned PARTITION BY HASH (voting_session_id);
```

### Read Replica Strategy

**Query Distribution**
- **Write Operations**: Primary database only
  - User registrations, submissions, vote casting
  - Real-time updates, notifications
  
- **Read Operations**: Read replicas
  - Competition browsing, leaderboards
  - Analytics queries, reporting
  - Public voting results

**Implementation Pattern**
```python
# Database routing example
class DatabaseRouter:
    def db_for_read(self, model):
        if model._meta.app_label == 'analytics':
            return 'analytics_replica'
        return 'read_replica'
    
    def db_for_write(self, model):
        return 'primary'
```

### Caching Architecture

**Multi-Level Caching**
```python
# Redis caching strategy
CACHE_KEYS = {
    'competition_list': 'competitions:active:{page}',
    'user_profile': 'user:{user_id}:profile',
    'leaderboard': 'competition:{comp_id}:leaderboard',
    'voting_results': 'voting:{session_id}:results'
}

# Cache invalidation patterns
def invalidate_competition_cache(competition_id):
    cache.delete_pattern(f'competition:{competition_id}:*')
    cache.delete_pattern('competitions:active:*')
```

### Database Sharding Strategy

**Shard by Institution**
```sql
-- Separate databases for large institutions
-- Cross-shard queries handled by application layer
-- Shared tables: competitions, categories, system data
-- Sharded tables: users, teams, submissions, reviews
```

## Security Considerations

### Data Encryption

**At Rest Encryption**
```sql
-- Sensitive data encryption using pgcrypto
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    -- Phone numbers encrypted
    phone_encrypted BYTEA, -- encrypt(phone, key, 'aes')
    -- PII data encryption
    date_of_birth_encrypted BYTEA,
    -- Other fields...
);

-- Encryption helper functions
CREATE OR REPLACE FUNCTION encrypt_pii(data TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN encrypt(data::BYTEA, current_setting('app.encryption_key'), 'aes');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**In Transit Encryption**
- TLS 1.3 for all database connections
- Certificate-based authentication for applications
- VPN tunneling for cross-region replication

### Access Control

**Row-Level Security (RLS)**
```sql
-- Enable RLS for sensitive tables
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own submissions
CREATE POLICY user_submissions_policy ON submissions
    FOR ALL TO application_user
    USING (
        registration_id IN (
            SELECT id FROM registrations 
            WHERE participant_id = current_user_id()
            AND participant_type = 'individual'
        )
    );

-- Judges can only see assigned submissions
CREATE POLICY judge_submissions_policy ON submissions
    FOR SELECT TO judge_user
    USING (
        id IN (
            SELECT s.id FROM submissions s
            JOIN reviews r ON s.id = r.submission_id
            JOIN judges j ON r.judge_id = j.id
            WHERE j.user_id = current_user_id()
        )
    );
```

**Database Roles and Permissions**
```sql
-- Application roles
CREATE ROLE app_read WITH LOGIN PASSWORD 'secure_password';
CREATE ROLE app_write WITH LOGIN PASSWORD 'secure_password';
CREATE ROLE app_admin WITH LOGIN PASSWORD 'secure_password';

-- Permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_read;
GRANT INSERT, UPDATE, DELETE ON user_tables TO app_write;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_admin;
```

### Audit and Compliance

**Comprehensive Audit Trail**
```sql
-- Trigger-based audit logging
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        table_name, action, old_values, new_values, 
        user_id, ip_address, created_at
    ) VALUES (
        TG_TABLE_NAME, TG_OP, 
        row_to_json(OLD), row_to_json(NEW),
        current_user_id(), current_client_ip(), NOW()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to sensitive tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE 
    ON users FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

**GDPR Compliance**
```sql
-- Right to be forgotten implementation
CREATE OR REPLACE FUNCTION anonymize_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Anonymize PII while preserving referential integrity
    UPDATE users SET
        email = 'deleted_' || user_uuid::text || '@anonymous.local',
        first_name = 'Deleted',
        last_name = 'User',
        phone = NULL,
        date_of_birth = NULL,
        bio = NULL,
        profile_picture_url = NULL
    WHERE id = user_uuid;
    
    -- Log the anonymization
    INSERT INTO audit_log (action, resource_type, resource_id, metadata)
    VALUES ('anonymize', 'user', user_uuid, '{"reason": "gdpr_request"}');
END;
$$ LANGUAGE plpgsql;
```

## Migration & Maintenance

### Migration Framework

**Version-Controlled Migrations**
```sql
-- migrations/001_initial_schema.sql
-- migrations/002_add_voting_system.sql
-- migrations/003_add_analytics_partitions.sql

-- Migration tracking table
CREATE TABLE schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_by VARCHAR(100),
    execution_time_ms INTEGER
);
```

**Safe Migration Patterns**
```sql
-- Add columns with defaults (safe)
ALTER TABLE users ADD COLUMN new_field VARCHAR(100) DEFAULT 'default_value';

-- Rename columns safely
ALTER TABLE users RENAME COLUMN old_name TO new_name;

-- Drop columns with dependency check
ALTER TABLE users DROP COLUMN IF EXISTS deprecated_field;

-- Index creation (concurrent)
CREATE INDEX CONCURRENTLY idx_new_index ON large_table(column);
```

**Data Migration Scripts**
```sql
-- Large data migration with batching
DO $$
DECLARE
    batch_size INTEGER := 10000;
    total_rows INTEGER;
    processed INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO total_rows FROM old_table;
    
    WHILE processed < total_rows LOOP
        WITH batch AS (
            SELECT * FROM old_table 
            ORDER BY id 
            LIMIT batch_size OFFSET processed
        )
        INSERT INTO new_table (mapped_columns)
        SELECT transformed_data FROM batch;
        
        processed := processed + batch_size;
        RAISE NOTICE 'Processed % of % rows', processed, total_rows;
        
        -- Commit in batches to avoid long-running transactions
        COMMIT;
    END LOOP;
END $$;
```

### Backup and Recovery

**Backup Strategy**
```bash
# Full database backup (daily)
pg_dump -h localhost -U postgres -F custom -b -v -f "nestfest_full_$(date +%Y%m%d).backup" nestfest

# Incremental WAL archiving
archive_command = 'cp %p /backup/wal/%f'

# Point-in-time recovery setup
recovery_target_time = '2024-03-15 14:30:00'
```

**Disaster Recovery Plan**
1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 15 minutes
3. **Hot standby servers** in different availability zones
4. **Automated failover** with health checks
5. **Cross-region replication** for critical data

### Monitoring and Maintenance

**Performance Monitoring**
```sql
-- Query performance tracking
CREATE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY mean_time DESC;

-- Index usage analysis
CREATE VIEW unused_indexes AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_tup_read = 0 AND idx_tup_fetch = 0;
```

**Automated Maintenance**
```sql
-- Vacuum and analyze scheduling
-- VACUUM ANALYZE for frequently updated tables
-- REINDEX for heavily fragmented indexes
-- Partition pruning for time-based partitions

-- Statistics updates
ANALYZE users, competitions, submissions, reviews;

-- Connection pooling optimization
-- max_connections = 200
-- shared_buffers = 256MB
-- effective_cache_size = 1GB
```

## Performance Optimization

### Query Optimization Patterns

**Efficient Pagination**
```sql
-- Cursor-based pagination instead of OFFSET
SELECT * FROM competitions 
WHERE created_at < cursor_timestamp 
ORDER BY created_at DESC 
LIMIT 20;

-- Keyset pagination for large datasets
SELECT * FROM submissions 
WHERE (competition_id, created_at, id) > (last_competition_id, last_created_at, last_id)
ORDER BY competition_id, created_at, id 
LIMIT 20;
```

**Optimized Aggregations**
```sql
-- Materialized views for expensive aggregations
CREATE MATERIALIZED VIEW competition_leaderboard AS
SELECT 
    r.competition_id,
    r.participant_id,
    r.participant_type,
    AVG(rev.overall_score) as avg_score,
    COUNT(rev.id) as review_count,
    RANK() OVER (PARTITION BY r.competition_id ORDER BY AVG(rev.overall_score) DESC) as rank
FROM registrations r
JOIN submissions s ON r.id = s.registration_id
JOIN reviews rev ON s.id = rev.submission_id
WHERE rev.status = 'final'
GROUP BY r.competition_id, r.participant_id, r.participant_type;

-- Refresh strategy with minimal locking
REFRESH MATERIALIZED VIEW CONCURRENTLY competition_leaderboard;
```

**Efficient JOIN Strategies**
```sql
-- Use EXISTS instead of IN for better performance
SELECT * FROM users u
WHERE EXISTS (
    SELECT 1 FROM registrations r 
    WHERE r.participant_id = u.id 
    AND r.participant_type = 'individual'
);

-- Partial indexes for conditional queries
CREATE INDEX idx_active_competitions ON competitions(created_at DESC) 
WHERE status = 'active';
```

### Connection and Resource Management

**Connection Pooling Configuration**
```python
# Database connection pool settings
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'OPTIONS': {
            'MAX_CONNS': 20,
            'MIN_CONNS': 5,
            'connection_pool_kwargs': {
                'max_connections': 20,
                'min_connections': 5,
                'max_idle_time': 300,
                'health_check_interval': 30
            }
        }
    }
}
```

**Query Timeout and Resource Limits**
```sql
-- Query timeouts
SET statement_timeout = '30s';
SET lock_timeout = '10s';

-- Memory limits
SET work_mem = '64MB';
SET shared_buffers = '256MB';
SET effective_cache_size = '1GB';
```

This comprehensive database architecture provides a robust foundation for the NestFest competition platform, supporting complex competition workflows while maintaining high performance and security standards.