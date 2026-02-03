-- ============================================================================
-- NOMEKOP BEQUEST - DATABASE VERIFICATION SCRIPT
-- ============================================================================
-- Run this script to verify that the database setup is complete and correct
-- Execute in Supabase SQL Editor: http://127.0.0.1:54323
-- ============================================================================

-- Start transaction for verification (read-only)
BEGIN;

\echo '============================================================================'
\echo 'NOMEKOP BEQUEST - DATABASE VERIFICATION'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- 1. CHECK EXTENSIONS
-- ============================================================================
\echo '1. Checking PostgreSQL Extensions...'
SELECT 
    extname as "Extension Name",
    extversion as "Version"
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto')
ORDER BY extname;

\echo ''
\echo 'Expected: uuid-ossp and pgcrypto should be installed'
\echo ''

-- ============================================================================
-- 2. CHECK TABLES
-- ============================================================================
\echo '2. Checking Database Tables...'
SELECT 
    tablename as "Table Name",
    CASE 
        WHEN tablename IN ('user_profiles', 'user_settings', 'user_sessions', 'wallet_connections', 'activity_logs')
        THEN '✓ EXISTS'
        ELSE '✗ UNEXPECTED'
    END as "Status"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''
\echo 'Expected Tables:'
\echo '  ✓ activity_logs'
\echo '  ✓ user_profiles'
\echo '  ✓ user_sessions'
\echo '  ✓ user_settings'
\echo '  ✓ wallet_connections'
\echo ''

-- ============================================================================
-- 3. CHECK ROW LEVEL SECURITY
-- ============================================================================
\echo '3. Checking Row Level Security (RLS)...'
SELECT 
    schemaname,
    tablename as "Table Name",
    CASE 
        WHEN rowsecurity = TRUE THEN '✓ ENABLED'
        ELSE '✗ DISABLED'
    END as "RLS Status"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''
\echo 'Expected: All tables should have RLS ENABLED'
\echo ''

-- ============================================================================
-- 4. CHECK RLS POLICIES
-- ============================================================================
\echo '4. Checking RLS Policies...'
SELECT 
    tablename as "Table",
    COUNT(*) as "Policy Count"
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

\echo ''
\echo 'Expected: Each table should have multiple policies'
\echo ''

-- ============================================================================
-- 5. CHECK INDEXES
-- ============================================================================
\echo '5. Checking Database Indexes...'
SELECT 
    schemaname,
    tablename as "Table",
    indexname as "Index Name"
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

\echo ''
\echo 'Expected: Multiple indexes for performance optimization'
\echo ''

-- ============================================================================
-- 6. CHECK FUNCTIONS
-- ============================================================================
\echo '6. Checking Database Functions...'
SELECT 
    routine_name as "Function Name",
    routine_type as "Type",
    CASE 
        WHEN routine_name IN (
            'handle_new_user',
            'update_updated_at_column',
            'update_last_login',
            'get_user_stats',
            'log_activity',
            'verify_wallet',
            'cleanup_old_sessions'
        )
        THEN '✓ EXPECTED'
        ELSE '? CUSTOM'
    END as "Status"
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

\echo ''
\echo 'Expected Functions:'
\echo '  ✓ cleanup_old_sessions'
\echo '  ✓ get_user_stats'
\echo '  ✓ handle_new_user'
\echo '  ✓ log_activity'
\echo '  ✓ update_last_login'
\echo '  ✓ update_updated_at_column'
\echo '  ✓ verify_wallet'
\echo ''

-- ============================================================================
-- 7. CHECK TRIGGERS
-- ============================================================================
\echo '7. Checking Database Triggers...'
SELECT 
    trigger_name as "Trigger Name",
    event_object_table as "Table",
    event_manipulation as "Event"
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_schema = 'auth'
ORDER BY event_object_table, trigger_name;

\echo ''
\echo 'Expected Triggers:'
\echo '  ✓ on_auth_user_created (auth.users)'
\echo '  ✓ update_user_profiles_updated_at'
\echo '  ✓ update_user_settings_updated_at'
\echo '  ✓ update_wallet_connections_updated_at'
\echo '  ✓ update_last_login_on_session'
\echo ''

-- ============================================================================
-- 8. CHECK CONSTRAINTS
-- ============================================================================
\echo '8. Checking Table Constraints...'
SELECT 
    tc.table_name as "Table",
    tc.constraint_name as "Constraint",
    tc.constraint_type as "Type"
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
    AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

\echo ''
\echo 'Expected: Multiple constraints for data integrity'
\echo ''

-- ============================================================================
-- 9. CHECK TABLE COLUMNS
-- ============================================================================
\echo '9. Checking Table Structures...'

\echo 'user_profiles columns:'
SELECT 
    column_name as "Column",
    data_type as "Type",
    is_nullable as "Nullable",
    column_default as "Default"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

\echo ''
\echo 'user_settings columns:'
SELECT 
    column_name as "Column",
    data_type as "Type",
    is_nullable as "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_settings'
ORDER BY ordinal_position;

\echo ''

-- ============================================================================
-- 10. CHECK PERMISSIONS
-- ============================================================================
\echo '10. Checking Table Permissions...'
SELECT 
    grantee as "Role",
    table_name as "Table",
    string_agg(privilege_type, ', ') as "Privileges"
FROM information_schema.table_privileges
WHERE table_schema = 'public'
    AND grantee IN ('authenticated', 'anon')
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

\echo ''
\echo 'Expected: authenticated role should have SELECT, INSERT, UPDATE permissions'
\echo ''

-- ============================================================================
-- 11. CHECK FUNCTION PERMISSIONS
-- ============================================================================
\echo '11. Checking Function Permissions...'
SELECT DISTINCT
    r.routine_name as "Function",
    r.routine_type as "Type",
    CASE 
        WHEN p.grantee IS NOT NULL THEN '✓ HAS PERMISSIONS'
        ELSE '✗ NO PERMISSIONS'
    END as "Status"
FROM information_schema.routines r
LEFT JOIN information_schema.routine_privileges p 
    ON r.routine_name = p.routine_name 
    AND r.routine_schema = p.routine_schema
    AND p.grantee = 'authenticated'
WHERE r.routine_schema = 'public'
ORDER BY r.routine_name;

\echo ''

-- ============================================================================
-- 12. TEST FUNCTION EXECUTION (if safe)
-- ============================================================================
\echo '12. Testing Functions (safe operations)...'

-- Test get_user_stats with a non-existent user (should handle gracefully)
\echo 'Testing get_user_stats function...'
DO $$
DECLARE
    test_result JSON;
BEGIN
    -- This should return NULL or handle gracefully for non-existent user
    SELECT public.get_user_stats('00000000-0000-0000-0000-000000000000'::UUID) INTO test_result;
    
    IF test_result IS NULL THEN
        RAISE NOTICE '✓ Function get_user_stats executed successfully (returned NULL for non-existent user)';
    ELSE
        RAISE NOTICE '✓ Function get_user_stats executed successfully';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '✗ Function get_user_stats failed: %', SQLERRM;
END $$;

\echo ''

-- ============================================================================
-- 13. DATABASE STATISTICS
-- ============================================================================
\echo '13. Database Statistics...'
SELECT 
    schemaname as "Schema",
    tablename as "Table",
    n_live_tup as "Row Count",
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "Total Size"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

\echo ''

-- ============================================================================
-- 14. MIGRATION HISTORY
-- ============================================================================
\echo '14. Checking Migration History...'
SELECT 
    version,
    name,
    executed_at
FROM supabase_migrations.schema_migrations
ORDER BY version;

\echo ''

-- ============================================================================
-- 15. COMPREHENSIVE VERIFICATION SUMMARY
-- ============================================================================
\echo '============================================================================'
\echo 'VERIFICATION SUMMARY'
\echo '============================================================================'

DO $$
DECLARE
    table_count INTEGER;
    rls_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename IN ('user_profiles', 'user_settings', 'user_sessions', 'wallet_connections', 'activity_logs');
    
    -- Count RLS enabled tables
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables
    WHERE schemaname = 'public'
        AND rowsecurity = TRUE;
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public';
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public' OR event_object_schema = 'auth';
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%';
    
    RAISE NOTICE '';
    RAISE NOTICE '✓ Tables Created: % / 5', table_count;
    RAISE NOTICE '✓ RLS Enabled: % / 5', rls_count;
    RAISE NOTICE '✓ Functions Created: % (expected: 7)', function_count;
    RAISE NOTICE '✓ Triggers Created: % (expected: 5)', trigger_count;
    RAISE NOTICE '✓ RLS Policies: % (expected: 15+)', policy_count;
    RAISE NOTICE '✓ Performance Indexes: % (expected: 12+)', index_count;
    RAISE NOTICE '';
    
    IF table_count = 5 AND rls_count = 5 AND function_count >= 7 AND trigger_count >= 5 THEN
        RAISE NOTICE '🎉 ALL CHECKS PASSED!';
        RAISE NOTICE 'Your Nomekop Bequest database is ready to use.';
    ELSE
        RAISE NOTICE '⚠️  SOME CHECKS FAILED';
        RAISE NOTICE 'Review the output above to identify issues.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
END $$;

-- Rollback transaction (verification only, no changes)
ROLLBACK;

\echo ''
\echo 'Verification complete. No changes were made to the database.'
\echo ''
