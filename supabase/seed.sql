-- ============================================================================
-- NOMEKOP BEQUEST - SEED DATA
-- ============================================================================
-- This file contains test data for development and testing purposes
-- Run with: npx supabase db reset (includes migrations + seeds)
-- ============================================================================

-- Note: This seed data is for development only
-- In production, data will be created through the application

-- The auth.users table is managed by Supabase Auth
-- User profiles, settings, etc. will be automatically created via triggers
-- when users sign up through the application

-- You can manually create test users via the Supabase dashboard or API
-- Example: Use the Supabase Studio UI to create test users

-- ============================================================================
-- SEED COMPLETE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Seed data loaded successfully';
    RAISE NOTICE 'To create test users, use Supabase Studio or the Auth API';
END $$;
