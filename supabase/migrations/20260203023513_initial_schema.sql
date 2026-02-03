-- ============================================================================
-- NOMEKOP BEQUEST - INITIAL DATABASE SCHEMA
-- ============================================================================
-- This migration sets up the complete database infrastructure including:
-- - User profiles and settings
-- - Session tracking
-- - Wallet connections for blockchain integration
-- - Activity logging
-- - Row Level Security (RLS) policies
-- - Database functions and triggers
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: user_profiles
-- ============================================================================
-- Stores extended user information beyond basic auth data
-- Automatically created when a user signs up via trigger

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    
    -- Game-specific fields
    player_level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    total_playtime INTEGER DEFAULT 0, -- in seconds
    achievements JSONB DEFAULT '[]'::JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
    CONSTRAINT display_name_length CHECK (char_length(display_name) <= 100),
    CONSTRAINT bio_length CHECK (char_length(bio) <= 500)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_player_level ON public.user_profiles(player_level);

-- Add comments
COMMENT ON TABLE public.user_profiles IS 'Extended user profile information for Nomekop Bequest players';
COMMENT ON COLUMN public.user_profiles.username IS 'Unique username for the player';
COMMENT ON COLUMN public.user_profiles.player_level IS 'Current level in the game (1-100)';
COMMENT ON COLUMN public.user_profiles.achievements IS 'JSON array of unlocked achievements';

-- ============================================================================
-- TABLE: user_settings
-- ============================================================================
-- Stores user preferences and configuration

CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Display preferences
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'de', 'ja')),
    
    -- Audio preferences
    master_volume DECIMAL(3,2) DEFAULT 1.0 CHECK (master_volume >= 0 AND master_volume <= 1),
    music_volume DECIMAL(3,2) DEFAULT 0.8 CHECK (music_volume >= 0 AND music_volume <= 1),
    sfx_volume DECIMAL(3,2) DEFAULT 1.0 CHECK (sfx_volume >= 0 AND sfx_volume <= 1),
    voice_volume DECIMAL(3,2) DEFAULT 1.0 CHECK (voice_volume >= 0 AND voice_volume <= 1),
    
    -- Gameplay preferences
    difficulty TEXT DEFAULT 'normal' CHECK (difficulty IN ('easy', 'normal', 'hard', 'expert')),
    auto_save_enabled BOOLEAN DEFAULT TRUE,
    subtitles_enabled BOOLEAN DEFAULT FALSE,
    
    -- Privacy settings
    profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
    show_online_status BOOLEAN DEFAULT TRUE,
    
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.user_settings IS 'User preferences and configuration settings';

-- ============================================================================
-- TABLE: user_sessions
-- ============================================================================
-- Tracks user login sessions for security and analytics

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session information
    session_token TEXT UNIQUE,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    
    -- Geolocation (if available)
    country TEXT,
    city TEXT,
    
    -- Session lifecycle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    logged_out_at TIMESTAMPTZ,
    
    -- Session status
    is_active BOOLEAN DEFAULT TRUE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON public.user_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON public.user_sessions(session_token);

-- Add comments
COMMENT ON TABLE public.user_sessions IS 'Tracks user login sessions for security monitoring';

-- ============================================================================
-- TABLE: wallet_connections
-- ============================================================================
-- Stores blockchain wallet connections for users

CREATE TABLE IF NOT EXISTS public.wallet_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Wallet information
    wallet_address TEXT NOT NULL,
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('metamask', 'walletconnect', 'coinbase', 'phantom', 'other')),
    chain_id INTEGER NOT NULL,
    chain_name TEXT,
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    signature TEXT,
    
    -- Metadata
    is_primary BOOLEAN DEFAULT FALSE,
    nickname TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT unique_user_wallet UNIQUE(user_id, wallet_address)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_connections_user_id ON public.wallet_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_wallet_address ON public.wallet_connections(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_is_verified ON public.wallet_connections(is_verified);

-- Add comments
COMMENT ON TABLE public.wallet_connections IS 'Blockchain wallet connections for NFT and Web3 integration';

-- ============================================================================
-- TABLE: activity_logs
-- ============================================================================
-- Comprehensive activity logging for security and analytics

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Activity details
    activity_type TEXT NOT NULL,
    activity_category TEXT NOT NULL CHECK (
        activity_category IN ('auth', 'profile', 'gameplay', 'social', 'purchase', 'settings', 'security', 'system')
    ),
    description TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Severity for security events
    severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON public.activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON public.activity_logs(activity_category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_severity ON public.activity_logs(severity) WHERE severity IS NOT NULL;

-- Partition activity_logs by month (optional, for high-volume scenarios)
-- CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at_month ON public.activity_logs(date_trunc('month', created_at));

-- Add comments
COMMENT ON TABLE public.activity_logs IS 'Comprehensive activity and audit logging';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: user_profiles
-- ============================================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile (for manual creation)
CREATE POLICY "Users can insert own profile"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy: Public profiles are viewable by everyone (if profile_visibility is public)
CREATE POLICY "Public profiles are viewable"
    ON public.user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_settings
            WHERE user_settings.id = user_profiles.id
            AND user_settings.profile_visibility = 'public'
        )
    );

-- ============================================================================
-- RLS POLICIES: user_settings
-- ============================================================================

-- Policy: Users can view their own settings
CREATE POLICY "Users can view own settings"
    ON public.user_settings
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own settings"
    ON public.user_settings
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert own settings"
    ON public.user_settings
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- RLS POLICIES: user_sessions
-- ============================================================================

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view own sessions"
    ON public.user_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
    ON public.user_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update own sessions"
    ON public.user_sessions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES: wallet_connections
-- ============================================================================

-- Policy: Users can view their own wallet connections
CREATE POLICY "Users can view own wallets"
    ON public.wallet_connections
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own wallet connections
CREATE POLICY "Users can insert own wallets"
    ON public.wallet_connections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own wallet connections
CREATE POLICY "Users can update own wallets"
    ON public.wallet_connections
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own wallet connections
CREATE POLICY "Users can delete own wallets"
    ON public.wallet_connections
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES: activity_logs
-- ============================================================================

-- Policy: Users can view their own activity logs
CREATE POLICY "Users can view own activity logs"
    ON public.activity_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Authenticated users can insert activity logs
CREATE POLICY "Authenticated users can insert activity logs"
    ON public.activity_logs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Function: Handle new user registration
-- Creates profile and settings when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert user profile
    INSERT INTO public.user_profiles (id, username, display_name, created_at, updated_at, last_login_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'player_' || substring(NEW.id::text from 1 for 8)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        NOW(),
        NOW(),
        NOW()
    );

    -- Insert user settings with defaults
    INSERT INTO public.user_settings (id, created_at, updated_at)
    VALUES (
        NEW.id,
        NOW(),
        NOW()
    );

    -- Log the registration activity
    INSERT INTO public.activity_logs (user_id, activity_type, activity_category, description, created_at)
    VALUES (
        NEW.id,
        'user_registered',
        'auth',
        'New user account created',
        NOW()
    );

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile and settings when a new user signs up';

-- Function: Update timestamp on row modification
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Automatically updates the updated_at timestamp';

-- Function: Update last login timestamp
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.user_profiles
    SET last_login_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_last_login() IS 'Updates last_login_at when a new session is created';

-- Function: Get user statistics
CREATE OR REPLACE FUNCTION public.get_user_stats(target_user_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    stats JSON;
BEGIN
    -- Only allow users to view their own stats or public profiles
    IF auth.uid() != target_user_id AND NOT EXISTS (
        SELECT 1 FROM public.user_settings
        WHERE id = target_user_id AND profile_visibility = 'public'
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT json_build_object(
        'player_level', p.player_level,
        'experience_points', p.experience_points,
        'total_playtime', p.total_playtime,
        'achievements_count', jsonb_array_length(p.achievements),
        'member_since', p.created_at,
        'last_login', p.last_login_at,
        'wallet_count', (SELECT COUNT(*) FROM public.wallet_connections WHERE user_id = target_user_id AND is_verified = TRUE)
    )
    INTO stats
    FROM public.user_profiles p
    WHERE p.id = target_user_id;

    RETURN stats;
END;
$$;

COMMENT ON FUNCTION public.get_user_stats(UUID) IS 'Returns user statistics and achievements';

-- Function: Log user activity
CREATE OR REPLACE FUNCTION public.log_activity(
    p_activity_type TEXT,
    p_category TEXT,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB,
    p_severity TEXT DEFAULT 'info'
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.activity_logs (
        user_id,
        activity_type,
        activity_category,
        description,
        metadata,
        severity,
        created_at
    )
    VALUES (
        auth.uid(),
        p_activity_type,
        p_category,
        p_description,
        p_metadata,
        p_severity,
        NOW()
    )
    RETURNING id INTO log_id;

    RETURN log_id;
END;
$$;

COMMENT ON FUNCTION public.log_activity IS 'Helper function to log user activities';

-- Function: Verify wallet ownership
CREATE OR REPLACE FUNCTION public.verify_wallet(
    p_wallet_id UUID,
    p_signature TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user_id for this wallet
    SELECT user_id INTO v_user_id
    FROM public.wallet_connections
    WHERE id = p_wallet_id;

    -- Verify the user owns this wallet connection
    IF auth.uid() != v_user_id THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Update the wallet as verified
    UPDATE public.wallet_connections
    SET 
        is_verified = TRUE,
        verified_at = NOW(),
        signature = p_signature,
        updated_at = NOW()
    WHERE id = p_wallet_id;

    -- Log the verification
    PERFORM public.log_activity(
        'wallet_verified',
        'security',
        'Wallet connection verified',
        json_build_object('wallet_id', p_wallet_id)::JSONB
    );

    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.verify_wallet IS 'Verifies wallet ownership via signature';

-- Function: Clean up old sessions (for scheduled cleanup)
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete sessions older than 90 days
    DELETE FROM public.user_sessions
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND is_active = FALSE;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_sessions IS 'Removes old inactive sessions (run periodically)';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Note: Trigger on auth.users (on_auth_user_created) is created in a separate migration
-- due to permission requirements. See: 20260203023514_auth_trigger.sql

-- Trigger: Update updated_at on user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at on user_settings
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at on wallet_connections
DROP TRIGGER IF EXISTS update_wallet_connections_updated_at ON public.wallet_connections;
CREATE TRIGGER update_wallet_connections_updated_at
    BEFORE UPDATE ON public.wallet_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update last_login_at when session created
DROP TRIGGER IF EXISTS update_last_login_on_session ON public.user_sessions;
CREATE TRIGGER update_last_login_on_session
    AFTER INSERT ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_last_login();

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_connections TO authenticated;
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.get_user_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_wallet TO authenticated;

-- ============================================================================
-- INITIAL DATA / SEED DATA (Optional)
-- ============================================================================

-- You can add any initial seed data here if needed
-- For example, default achievements, game constants, etc.

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Initial schema migration completed successfully';
    RAISE NOTICE 'Tables created: user_profiles, user_settings, user_sessions, wallet_connections, activity_logs';
    RAISE NOTICE 'RLS policies enabled on all tables';
    RAISE NOTICE 'Database functions and triggers created';
END $$;
