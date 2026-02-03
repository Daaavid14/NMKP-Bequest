-- ============================================================================
-- NOMEKOP BEQUEST - AUTH TRIGGER SETUP
-- ============================================================================
-- This separate migration creates the auth trigger using proper permissions
-- Run this AFTER the initial schema migration
-- ============================================================================

-- Create the trigger on auth.users for automatic profile creation
-- This must be done separately as it requires elevated privileges

BEGIN;

-- Create trigger on auth.users (if it doesn't exist)
DO $$
BEGIN
    -- Drop trigger if exists
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- Create trigger
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
        
    RAISE NOTICE 'Successfully created trigger on_auth_user_created';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Insufficient privileges to create trigger on auth.users';
        RAISE NOTICE 'You may need to create this trigger manually in Supabase Dashboard';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating trigger: %', SQLERRM;
END $$;

COMMIT;
