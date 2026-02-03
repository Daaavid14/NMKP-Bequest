-- ============================================================================
-- NOMEKOP BEQUEST - SQL QUERY REFERENCE
-- ============================================================================
-- Common queries for managing and monitoring the database
-- ============================================================================

-- ============================================================================
-- USER MANAGEMENT
-- ============================================================================

-- Get all users with their profiles
SELECT 
    au.id,
    au.email,
    au.created_at as registered_at,
    up.username,
    up.display_name,
    up.player_level,
    up.experience_points,
    up.last_login_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;

-- Get user details with settings
SELECT 
    up.*,
    us.theme,
    us.language,
    us.profile_visibility,
    us.difficulty
FROM public.user_profiles up
JOIN public.user_settings us ON up.id = us.id
WHERE up.id = 'USER_ID_HERE';

-- Get top players by level
SELECT 
    username,
    display_name,
    player_level,
    experience_points,
    total_playtime,
    jsonb_array_length(achievements) as achievement_count
FROM public.user_profiles
ORDER BY player_level DESC, experience_points DESC
LIMIT 10;

-- Get recently active users
SELECT 
    username,
    display_name,
    last_login_at,
    player_level
FROM public.user_profiles
WHERE last_login_at > NOW() - INTERVAL '24 hours'
ORDER BY last_login_at DESC;

-- ============================================================================
-- SESSION MANAGEMENT
-- ============================================================================

-- Get active sessions
SELECT 
    s.id,
    s.user_id,
    up.username,
    s.created_at,
    s.last_activity_at,
    s.ip_address,
    s.country,
    s.is_active
FROM public.user_sessions s
JOIN public.user_profiles up ON s.user_id = up.id
WHERE s.is_active = TRUE
ORDER BY s.last_activity_at DESC;

-- Get session count per user
SELECT 
    up.username,
    COUNT(s.id) as active_sessions
FROM public.user_sessions s
JOIN public.user_profiles up ON s.user_id = up.id
WHERE s.is_active = TRUE
GROUP BY up.username
ORDER BY active_sessions DESC;

-- Close all sessions for a user
UPDATE public.user_sessions
SET is_active = FALSE, logged_out_at = NOW()
WHERE user_id = 'USER_ID_HERE' AND is_active = TRUE;

-- ============================================================================
-- WALLET MANAGEMENT
-- ============================================================================

-- Get all wallet connections
SELECT 
    wc.id,
    up.username,
    wc.wallet_address,
    wc.wallet_type,
    wc.chain_name,
    wc.is_verified,
    wc.is_primary,
    wc.created_at
FROM public.wallet_connections wc
JOIN public.user_profiles up ON wc.user_id = up.id
ORDER BY wc.created_at DESC;

-- Get verified wallets by type
SELECT 
    wallet_type,
    COUNT(*) as total,
    COUNT(CASE WHEN is_verified THEN 1 END) as verified,
    COUNT(CASE WHEN is_primary THEN 1 END) as primary_wallets
FROM public.wallet_connections
GROUP BY wallet_type
ORDER BY total DESC;

-- Get users with multiple wallets
SELECT 
    up.username,
    COUNT(wc.id) as wallet_count,
    json_agg(json_build_object(
        'type', wc.wallet_type,
        'address', wc.wallet_address,
        'verified', wc.is_verified
    )) as wallets
FROM public.wallet_connections wc
JOIN public.user_profiles up ON wc.user_id = up.id
GROUP BY up.id, up.username
HAVING COUNT(wc.id) > 1
ORDER BY wallet_count DESC;

-- ============================================================================
-- ACTIVITY LOGGING
-- ============================================================================

-- Get recent activity logs
SELECT 
    al.created_at,
    up.username,
    al.activity_type,
    al.activity_category,
    al.description,
    al.severity
FROM public.activity_logs al
LEFT JOIN public.user_profiles up ON al.user_id = up.id
ORDER BY al.created_at DESC
LIMIT 100;

-- Get activity by category
SELECT 
    activity_category,
    COUNT(*) as count
FROM public.activity_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY activity_category
ORDER BY count DESC;

-- Get security events
SELECT 
    al.created_at,
    up.username,
    al.activity_type,
    al.description,
    al.severity,
    al.ip_address
FROM public.activity_logs al
LEFT JOIN public.user_profiles up ON al.user_id = up.id
WHERE al.activity_category = 'security'
    AND al.severity IN ('warning', 'error', 'critical')
ORDER BY al.created_at DESC;

-- Get user activity timeline
SELECT 
    created_at,
    activity_type,
    activity_category,
    description
FROM public.activity_logs
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at DESC
LIMIT 50;

-- ============================================================================
-- STATISTICS & ANALYTICS
-- ============================================================================

-- Overall platform statistics
SELECT 
    COUNT(DISTINCT up.id) as total_users,
    COUNT(DISTINCT CASE WHEN up.created_at > NOW() - INTERVAL '7 days' THEN up.id END) as new_users_week,
    COUNT(DISTINCT CASE WHEN up.last_login_at > NOW() - INTERVAL '24 hours' THEN up.id END) as active_today,
    AVG(up.player_level)::numeric(10,2) as avg_level,
    SUM(up.total_playtime) as total_playtime_seconds,
    COUNT(DISTINCT wc.id) as total_wallets,
    COUNT(DISTINCT CASE WHEN wc.is_verified THEN wc.id END) as verified_wallets
FROM public.user_profiles up
LEFT JOIN public.wallet_connections wc ON up.id = wc.user_id;

-- User growth over time (daily)
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_users
FROM public.user_profiles
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- Engagement metrics
SELECT 
    CASE 
        WHEN total_playtime = 0 THEN 'No playtime'
        WHEN total_playtime < 3600 THEN 'Less than 1 hour'
        WHEN total_playtime < 36000 THEN '1-10 hours'
        WHEN total_playtime < 360000 THEN '10-100 hours'
        ELSE 'Over 100 hours'
    END as playtime_bucket,
    COUNT(*) as user_count
FROM public.user_profiles
GROUP BY 
    CASE 
        WHEN total_playtime = 0 THEN 'No playtime'
        WHEN total_playtime < 3600 THEN 'Less than 1 hour'
        WHEN total_playtime < 36000 THEN '1-10 hours'
        WHEN total_playtime < 360000 THEN '10-100 hours'
        ELSE 'Over 100 hours'
    END
ORDER BY 
    CASE playtime_bucket
        WHEN 'No playtime' THEN 1
        WHEN 'Less than 1 hour' THEN 2
        WHEN '1-10 hours' THEN 3
        WHEN '10-100 hours' THEN 4
        ELSE 5
    END;

-- Achievement distribution
SELECT 
    jsonb_array_length(achievements) as achievement_count,
    COUNT(*) as user_count
FROM public.user_profiles
GROUP BY jsonb_array_length(achievements)
ORDER BY achievement_count;

-- ============================================================================
-- SETTINGS ANALYSIS
-- ============================================================================

-- Theme preferences
SELECT 
    theme,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM public.user_settings
GROUP BY theme;

-- Language distribution
SELECT 
    language,
    COUNT(*) as count
FROM public.user_settings
GROUP BY language
ORDER BY count DESC;

-- Difficulty preferences
SELECT 
    difficulty,
    COUNT(*) as count
FROM public.user_settings
GROUP BY difficulty
ORDER BY count DESC;

-- Privacy settings summary
SELECT 
    profile_visibility,
    COUNT(*) as count,
    COUNT(CASE WHEN show_online_status THEN 1 END) as show_online_count
FROM public.user_settings
GROUP BY profile_visibility;

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Find old inactive sessions (for cleanup)
SELECT 
    id,
    user_id,
    created_at,
    last_activity_at
FROM public.user_sessions
WHERE created_at < NOW() - INTERVAL '90 days'
    AND is_active = FALSE
ORDER BY created_at;

-- Database size and table statistics
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- Index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Table row counts
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- ============================================================================
-- SECURITY & AUDIT
-- ============================================================================

-- Check for suspicious login patterns
SELECT 
    up.username,
    COUNT(DISTINCT s.ip_address) as unique_ips,
    COUNT(s.id) as session_count,
    MIN(s.created_at) as first_session,
    MAX(s.created_at) as last_session
FROM public.user_sessions s
JOIN public.user_profiles up ON s.user_id = up.id
WHERE s.created_at > NOW() - INTERVAL '24 hours'
GROUP BY up.id, up.username
HAVING COUNT(DISTINCT s.ip_address) > 3
ORDER BY unique_ips DESC;

-- Failed login attempts (from activity logs)
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as failed_attempts
FROM public.activity_logs
WHERE activity_type LIKE '%failed%login%'
    AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Recently changed passwords (security audit)
SELECT 
    al.created_at,
    up.username,
    al.ip_address
FROM public.activity_logs al
JOIN public.user_profiles up ON al.user_id = up.id
WHERE al.activity_type = 'password_changed'
ORDER BY al.created_at DESC
LIMIT 50;

-- ============================================================================
-- PERFORMANCE QUERIES
-- ============================================================================

-- Slow query analysis (requires pg_stat_statements extension)
-- Enable with: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
/*
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_time DESC
LIMIT 10;
*/

-- Check for missing indexes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
    AND n_distinct > 100
    AND correlation < 0.1
ORDER BY n_distinct DESC;

-- ============================================================================
-- DATA EXPORT QUERIES
-- ============================================================================

-- Export user data (GDPR compliance)
SELECT 
    up.*,
    us.*,
    (
        SELECT json_agg(row_to_json(s))
        FROM public.user_sessions s
        WHERE s.user_id = up.id
    ) as sessions,
    (
        SELECT json_agg(row_to_json(w))
        FROM public.wallet_connections w
        WHERE w.user_id = up.id
    ) as wallets,
    (
        SELECT json_agg(row_to_json(a))
        FROM public.activity_logs a
        WHERE a.user_id = up.id
    ) as activities
FROM public.user_profiles up
JOIN public.user_settings us ON up.id = us.id
WHERE up.id = 'USER_ID_HERE';

-- ============================================================================
-- TESTING QUERIES
-- ============================================================================

-- Verify RLS policies are active
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- List all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test function execution
SELECT public.log_activity(
    'test_query',
    'system',
    'Testing SQL queries',
    '{"source": "sql_reference"}'::jsonb,
    'info'
);

-- ============================================================================
-- END OF QUERY REFERENCE
-- ============================================================================
