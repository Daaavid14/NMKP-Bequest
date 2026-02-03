-- Create a test user via SQL
-- This will automatically trigger profile and settings creation

-- Insert a test user into auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test@example.com',
    crypt('TestPass123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"testuser"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (email) DO NOTHING;

-- Check if user was created
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'test@example.com';

-- Check if profile was auto-created
SELECT 
    id,
    username,
    display_name,
    player_level,
    experience_points,
    created_at
FROM public.user_profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

-- Check if settings were auto-created
SELECT 
    id,
    theme,
    language,
    master_volume,
    created_at
FROM public.user_settings 
WHERE id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
