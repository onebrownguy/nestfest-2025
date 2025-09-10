-- =====================================================
-- NESTFEST DATABASE MIGRATION SCRIPTS
-- Production-ready migration framework with rollback support
-- =====================================================

-- =====================================================
-- MIGRATION TRACKING SYSTEM
-- =====================================================

-- Migration metadata table
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_by VARCHAR(100) DEFAULT current_user,
    execution_time_ms INTEGER,
    checksum VARCHAR(64), -- SHA-256 hash of migration content
    rollback_script TEXT, -- Optional rollback commands
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed', 'rolled_back'))
);

-- Function to start migration
CREATE OR REPLACE FUNCTION start_migration(migration_version VARCHAR(50), migration_name VARCHAR(255))
RETURNS INTEGER AS $$
DECLARE
    migration_id INTEGER;
    start_time TIMESTAMP;
BEGIN
    start_time := clock_timestamp();
    
    -- Check if migration already applied
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = migration_version AND status = 'completed') THEN
        RAISE EXCEPTION 'Migration % already applied', migration_version;
    END IF;
    
    -- Insert migration record
    INSERT INTO schema_migrations (version, name, status)
    VALUES (migration_version, migration_name, 'running')
    RETURNING id INTO migration_id;
    
    RAISE NOTICE 'Started migration %: %', migration_version, migration_name;
    RETURN migration_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete migration
CREATE OR REPLACE FUNCTION complete_migration(migration_id INTEGER)
RETURNS VOID AS $$
DECLARE
    start_time TIMESTAMP;
    execution_time INTEGER;
BEGIN
    SELECT applied_at INTO start_time FROM schema_migrations WHERE id = migration_id;
    execution_time := EXTRACT(epoch FROM (clock_timestamp() - start_time)) * 1000;
    
    UPDATE schema_migrations 
    SET status = 'completed', 
        execution_time_ms = execution_time
    WHERE id = migration_id;
    
    RAISE NOTICE 'Completed migration % in % ms', migration_id, execution_time;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRATION 001: INITIAL SCHEMA
-- =====================================================

DO $$
DECLARE
    migration_id INTEGER;
BEGIN
    migration_id := start_migration('001', 'Initial schema creation');
    
    -- Core schema creation is in nestfest_schema.sql
    -- This would be executed first
    
    SELECT complete_migration(migration_id);
END $$;

-- =====================================================
-- MIGRATION 002: ADD ANALYTICS PARTITIONING
-- =====================================================

DO $$
DECLARE
    migration_id INTEGER;
    partition_date DATE;
    partition_name TEXT;
    end_date DATE;
BEGIN
    migration_id := start_migration('002', 'Add analytics event partitioning');
    
    -- Create partitions for the next 12 months
    partition_date := date_trunc('month', CURRENT_DATE);
    
    FOR i IN 0..11 LOOP
        partition_name := 'analytics_events_' || to_char(partition_date, 'YYYY_MM');
        end_date := partition_date + INTERVAL '1 month';
        
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF analytics_events 
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, partition_date, end_date
        );
        
        -- Add indexes for each partition
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS idx_%I_user_time 
             ON %I (user_id, created_at DESC) WHERE user_id IS NOT NULL',
            partition_name, partition_name
        );
        
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS idx_%I_event_type 
             ON %I (event_type, created_at DESC)',
            partition_name, partition_name
        );
        
        partition_date := partition_date + INTERVAL '1 month';
    END LOOP;
    
    -- Create audit log partitions
    partition_date := date_trunc('month', CURRENT_DATE);
    
    FOR i IN 0..11 LOOP
        partition_name := 'audit_log_' || to_char(partition_date, 'YYYY_MM');
        end_date := partition_date + INTERVAL '1 month';
        
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_log 
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, partition_date, end_date
        );
        
        -- Add indexes for audit partitions
        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS idx_%I_user_action 
             ON %I (user_id, action, created_at DESC)',
            partition_name, partition_name
        );
        
        partition_date := partition_date + INTERVAL '1 month';
    END LOOP;
    
    SELECT complete_migration(migration_id);
END $$;

-- =====================================================
-- MIGRATION 003: ADD PERFORMANCE INDEXES
-- =====================================================

DO $$
DECLARE
    migration_id INTEGER;
BEGIN
    migration_id := start_migration('003', 'Add performance optimization indexes');
    
    -- Competition browsing indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitions_category_status_featured 
        ON competitions(category_id, status, featured DESC, created_at DESC);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitions_registration_timeline 
        ON competitions(registration_start, registration_end) 
        WHERE status IN ('published', 'active');
    
    -- Submission workflow indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_workflow 
        ON submissions(status, review_status, created_at DESC);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_round_status 
        ON submissions(round_id, status) WHERE status != 'draft';
    
    -- Judge assignment optimization
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_judge_assignments_availability 
        ON judge_assignments(judge_id, status) 
        WHERE status = 'active';
    
    -- Team management indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_status_institution 
        ON teams(status, is_cross_institutional) 
        WHERE status IN ('forming', 'active');
    
    -- Voting performance indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_session_option_time 
        ON votes(voting_session_id, vote_option_id, voted_at DESC);
    
    -- Notification delivery indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_delivery_queue 
        ON notifications(status, priority DESC, scheduled_for) 
        WHERE status = 'pending';
    
    SELECT complete_migration(migration_id);
END $$;

-- =====================================================
-- MIGRATION 004: ADD FULL-TEXT SEARCH
-- =====================================================

DO $$
DECLARE
    migration_id INTEGER;
BEGIN
    migration_id := start_migration('004', 'Add full-text search capabilities');
    
    -- Add search vectors for users
    ALTER TABLE users ADD COLUMN IF NOT EXISTS search_vector tsvector;
    
    UPDATE users SET search_vector = 
        to_tsvector('english', 
            COALESCE(first_name, '') || ' ' || 
            COALESCE(last_name, '') || ' ' || 
            COALESCE(username, '') || ' ' ||
            COALESCE(bio, '')
        );
    
    CREATE INDEX IF NOT EXISTS idx_users_search_vector ON users USING gin(search_vector);
    
    -- Add search vectors for competitions
    ALTER TABLE competitions ADD COLUMN IF NOT EXISTS search_vector tsvector;
    
    UPDATE competitions SET search_vector = 
        to_tsvector('english', 
            COALESCE(name, '') || ' ' || 
            COALESCE(description, '') || ' ' ||
            COALESCE(short_description, '')
        );
    
    CREATE INDEX IF NOT EXISTS idx_competitions_search_vector ON competitions USING gin(search_vector);
    
    -- Create trigger to maintain search vectors
    CREATE OR REPLACE FUNCTION update_search_vector()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_TABLE_NAME = 'users' THEN
            NEW.search_vector := to_tsvector('english', 
                COALESCE(NEW.first_name, '') || ' ' || 
                COALESCE(NEW.last_name, '') || ' ' || 
                COALESCE(NEW.username, '') || ' ' ||
                COALESCE(NEW.bio, '')
            );
        ELSIF TG_TABLE_NAME = 'competitions' THEN
            NEW.search_vector := to_tsvector('english', 
                COALESCE(NEW.name, '') || ' ' || 
                COALESCE(NEW.description, '') || ' ' ||
                COALESCE(NEW.short_description, '')
            );
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER update_users_search_vector 
        BEFORE INSERT OR UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_search_vector();
    
    CREATE TRIGGER update_competitions_search_vector 
        BEFORE INSERT OR UPDATE ON competitions 
        FOR EACH ROW EXECUTE FUNCTION update_search_vector();
    
    SELECT complete_migration(migration_id);
END $$;

-- =====================================================
-- MIGRATION 005: ADD ADVANCED CONSTRAINTS
-- =====================================================

DO $$
DECLARE
    migration_id INTEGER;
BEGIN
    migration_id := start_migration('005', 'Add advanced business logic constraints');
    
    -- Competition timeline validation
    ALTER TABLE competitions ADD CONSTRAINT valid_competition_timeline 
        CHECK (
            registration_start < registration_end AND 
            registration_end <= competition_start AND 
            competition_start < competition_end
        );
    
    -- Team size constraints
    ALTER TABLE teams ADD CONSTRAINT valid_team_size 
        CHECK (current_member_count <= max_members AND current_member_count > 0);
    
    -- Submission deadline constraint
    ALTER TABLE submissions ADD CONSTRAINT valid_submission_timing 
        CHECK (
            (status = 'draft') OR 
            (submitted_at IS NOT NULL AND submitted_at <= NOW())
        );
    
    -- Review score validation
    ALTER TABLE reviews ADD CONSTRAINT valid_review_score 
        CHECK (
            overall_score >= 0 AND 
            confidence_level BETWEEN 1 AND 5
        );
    
    -- Vote weight validation for quadratic voting
    ALTER TABLE votes ADD CONSTRAINT valid_vote_weight 
        CHECK (vote_weight >= 0 AND vote_weight <= 100);
    
    -- User age constraint for competitions
    ALTER TABLE users ADD CONSTRAINT valid_birth_date 
        CHECK (
            date_of_birth IS NULL OR 
            date_of_birth <= CURRENT_DATE - INTERVAL '13 years'
        );
    
    SELECT complete_migration(migration_id);
END $$;

-- =====================================================
-- MIGRATION 006: ADD DATA ARCHIVING
-- =====================================================

DO $$
DECLARE
    migration_id INTEGER;
BEGIN
    migration_id := start_migration('006', 'Add data archiving capabilities');
    
    -- Create archive tables
    CREATE TABLE IF NOT EXISTS archived_competitions (
        LIKE competitions INCLUDING ALL,
        archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        archived_by UUID REFERENCES users(id)
    );
    
    CREATE TABLE IF NOT EXISTS archived_submissions (
        LIKE submissions INCLUDING ALL,
        archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        original_competition_id UUID
    );
    
    -- Archive old analytics events (older than 2 years)
    CREATE OR REPLACE FUNCTION archive_old_analytics()
    RETURNS INTEGER AS $$
    DECLARE
        archived_count INTEGER := 0;
        cutoff_date TIMESTAMP;
    BEGIN
        cutoff_date := CURRENT_DATE - INTERVAL '2 years';
        
        -- Move old analytics to archive table
        CREATE TABLE IF NOT EXISTS archived_analytics_events AS 
        SELECT * FROM analytics_events WHERE 1=0;
        
        WITH archived_rows AS (
            DELETE FROM analytics_events 
            WHERE created_at < cutoff_date 
            RETURNING *
        )
        INSERT INTO archived_analytics_events 
        SELECT * FROM archived_rows;
        
        GET DIAGNOSTICS archived_count = ROW_COUNT;
        RETURN archived_count;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Function to archive completed competitions
    CREATE OR REPLACE FUNCTION archive_competition(comp_id UUID)
    RETURNS VOID AS $$
    BEGIN
        -- Archive competition
        INSERT INTO archived_competitions 
        SELECT *, NOW(), NULL FROM competitions WHERE id = comp_id;
        
        -- Archive related submissions
        INSERT INTO archived_submissions 
        SELECT s.*, NOW(), comp_id 
        FROM submissions s 
        WHERE s.competition_id = comp_id;
        
        -- Update competition status
        UPDATE competitions 
        SET status = 'archived' 
        WHERE id = comp_id;
        
        RAISE NOTICE 'Competition % archived successfully', comp_id;
    END;
    $$ LANGUAGE plpgsql;
    
    SELECT complete_migration(migration_id);
END $$;

-- =====================================================
-- MIGRATION ROLLBACK PROCEDURES
-- =====================================================

-- Rollback function
CREATE OR REPLACE FUNCTION rollback_migration(migration_version VARCHAR(50))
RETURNS VOID AS $$
DECLARE
    rollback_script TEXT;
    migration_rec RECORD;
BEGIN
    -- Get migration details
    SELECT * INTO migration_rec 
    FROM schema_migrations 
    WHERE version = migration_version AND status = 'completed';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Migration % not found or not completed', migration_version;
    END IF;
    
    -- Execute rollback script if available
    IF migration_rec.rollback_script IS NOT NULL THEN
        EXECUTE migration_rec.rollback_script;
    ELSE
        RAISE WARNING 'No rollback script available for migration %', migration_version;
    END IF;
    
    -- Update migration status
    UPDATE schema_migrations 
    SET status = 'rolled_back' 
    WHERE version = migration_version;
    
    RAISE NOTICE 'Migration % rolled back successfully', migration_version;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTITION MAINTENANCE PROCEDURES
-- =====================================================

-- Automatic partition creation for future months
CREATE OR REPLACE FUNCTION create_future_partitions()
RETURNS VOID AS $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
    end_date DATE;
BEGIN
    -- Create partitions for next 3 months if they don't exist
    partition_date := date_trunc('month', CURRENT_DATE + INTERVAL '1 month');
    
    FOR i IN 0..2 LOOP
        -- Analytics events partition
        partition_name := 'analytics_events_' || to_char(partition_date, 'YYYY_MM');
        end_date := partition_date + INTERVAL '1 month';
        
        IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = partition_name) THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF analytics_events 
                 FOR VALUES FROM (%L) TO (%L)',
                partition_name, partition_date, end_date
            );
            
            EXECUTE format(
                'CREATE INDEX idx_%I_user_time 
                 ON %I (user_id, created_at DESC) WHERE user_id IS NOT NULL',
                partition_name, partition_name
            );
        END IF;
        
        -- Audit log partition
        partition_name := 'audit_log_' || to_char(partition_date, 'YYYY_MM');
        
        IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = partition_name) THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF audit_log 
                 FOR VALUES FROM (%L) TO (%L)',
                partition_name, partition_date, end_date
            );
        END IF;
        
        partition_date := partition_date + INTERVAL '1 month';
    END LOOP;
    
    RAISE NOTICE 'Future partitions created successfully';
END;
$$ LANGUAGE plpgsql;

-- Drop old partitions (older than 2 years)
CREATE OR REPLACE FUNCTION cleanup_old_partitions()
RETURNS INTEGER AS $$
DECLARE
    partition_record RECORD;
    dropped_count INTEGER := 0;
    cutoff_date DATE;
BEGIN
    cutoff_date := CURRENT_DATE - INTERVAL '2 years';
    
    -- Find old analytics partitions
    FOR partition_record IN
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'analytics_events_%'
        AND substring(tablename FROM 'analytics_events_(\d{4}_\d{2})')::TEXT < to_char(cutoff_date, 'YYYY_MM')
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I.%I', partition_record.schemaname, partition_record.tablename);
        dropped_count := dropped_count + 1;
        RAISE NOTICE 'Dropped partition %', partition_record.tablename;
    END LOOP;
    
    RETURN dropped_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HEALTH CHECK AND MAINTENANCE PROCEDURES
-- =====================================================

-- Database health check
CREATE OR REPLACE FUNCTION database_health_check()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check table sizes
    RETURN QUERY
    SELECT 
        'large_tables'::TEXT,
        CASE WHEN max_size > 1000000000 THEN 'WARNING' ELSE 'OK' END::TEXT,
        'Largest table: ' || max_table || ' (' || pg_size_pretty(max_size) || ')'::TEXT
    FROM (
        SELECT 
            schemaname || '.' || tablename as max_table,
            pg_total_relation_size(schemaname||'.'||tablename) as max_size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 1
    ) sizes;
    
    -- Check index usage
    RETURN QUERY
    SELECT 
        'unused_indexes'::TEXT,
        CASE WHEN unused_count > 5 THEN 'WARNING' ELSE 'OK' END::TEXT,
        unused_count::TEXT || ' potentially unused indexes found'::TEXT
    FROM (
        SELECT COUNT(*) as unused_count
        FROM pg_stat_user_indexes
        WHERE idx_tup_read = 0 AND idx_tup_fetch = 0
        AND indexrelname NOT LIKE '%_pkey'
    ) unused;
    
    -- Check replication lag (if applicable)
    IF EXISTS (SELECT 1 FROM pg_stat_replication) THEN
        RETURN QUERY
        SELECT 
            'replication_lag'::TEXT,
            CASE WHEN max_lag > 60 THEN 'CRITICAL' 
                 WHEN max_lag > 10 THEN 'WARNING' 
                 ELSE 'OK' END::TEXT,
            'Max lag: ' || max_lag::TEXT || ' seconds'::TEXT
        FROM (
            SELECT MAX(EXTRACT(seconds FROM (now() - pg_last_xact_replay_timestamp()))) as max_lag
            FROM pg_stat_replication
        ) repl;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Performance monitoring view
CREATE OR REPLACE VIEW performance_summary AS
SELECT 
    'Active Connections' as metric,
    COUNT(*)::TEXT as value,
    'connections' as unit
FROM pg_stat_activity 
WHERE state = 'active'

UNION ALL

SELECT 
    'Cache Hit Ratio',
    ROUND(100.0 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)), 2)::TEXT,
    '%'
FROM pg_stat_database

UNION ALL

SELECT 
    'Database Size',
    pg_size_pretty(pg_database_size(current_database())),
    'bytes'

UNION ALL

SELECT 
    'Slow Queries (>1s)',
    COUNT(*)::TEXT,
    'queries'
FROM pg_stat_statements 
WHERE mean_time > 1000;

-- =====================================================
-- AUTOMATED MAINTENANCE SCHEDULING
-- =====================================================

-- Create maintenance log
CREATE TABLE IF NOT EXISTS maintenance_log (
    id SERIAL PRIMARY KEY,
    task_name VARCHAR(100) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    details TEXT,
    error_message TEXT
);

-- Main maintenance procedure
CREATE OR REPLACE FUNCTION run_maintenance()
RETURNS VOID AS $$
DECLARE
    task_id INTEGER;
    partition_count INTEGER;
    archive_count INTEGER;
BEGIN
    -- Log maintenance start
    INSERT INTO maintenance_log (task_name, status) 
    VALUES ('daily_maintenance', 'running') 
    RETURNING id INTO task_id;
    
    BEGIN
        -- Update table statistics
        ANALYZE users, competitions, submissions, reviews, votes;
        
        -- Create future partitions
        SELECT create_future_partitions();
        
        -- Archive old analytics data
        SELECT archive_old_analytics() INTO archive_count;
        
        -- Cleanup old partitions
        SELECT cleanup_old_partitions() INTO partition_count;
        
        -- Vacuum frequently updated tables
        VACUUM (VERBOSE, ANALYZE) notifications;
        VACUUM (VERBOSE, ANALYZE) votes;
        VACUUM (VERBOSE, ANALYZE) analytics_events;
        
        -- Update maintenance log
        UPDATE maintenance_log 
        SET completed_at = NOW(), 
            status = 'completed',
            details = format('Archived %s records, cleaned %s partitions', 
                           archive_count, partition_count)
        WHERE id = task_id;
        
        RAISE NOTICE 'Maintenance completed successfully';
        
    EXCEPTION WHEN OTHERS THEN
        -- Log maintenance failure
        UPDATE maintenance_log 
        SET completed_at = NOW(), 
            status = 'failed',
            error_message = SQLERRM
        WHERE id = task_id;
        
        RAISE;
    END;
END;
$$ LANGUAGE plpgsql;