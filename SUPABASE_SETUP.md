# Nomekop Bequest - Supabase Database Setup Guide

## 📋 Overview

This guide will help you set up the complete Supabase database infrastructure for the Nomekop Bequest project, including user authentication, account management, and player data.

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
3. **Git** - [Download](https://git-scm.com/)

## 📦 Installation Steps

### 1. Install Docker Desktop

1. Download and install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
2. Start Docker Desktop and wait for it to fully initialize
3. Verify Docker is running:
   ```powershell
   docker --version
   ```

### 2. Start Supabase Local Development

Once Docker is running, start the Supabase local instance:

```powershell
npx supabase start
```

This command will:

- Pull required Docker images
- Start all Supabase services (PostgreSQL, GoTrue Auth, PostgREST, etc.)
- Apply all database migrations
- Run seed data

**Expected output:**

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: [your-anon-key]
service_role key: [your-service-role-key]
```

**Save these credentials!** You'll need them to configure your application.

### 3. Access Supabase Studio

Open your browser and navigate to: `http://127.0.0.1:54323`

This is your local Supabase Studio dashboard where you can:

- View and manage database tables
- Create test users
- Monitor authentication
- Run SQL queries
- View logs and metrics

## 🗄️ Database Schema

The migration creates the following tables:

### Core Tables

1. **`user_profiles`** - Extended user information
   - `id` (UUID, Primary Key, references auth.users)
   - `username` (TEXT, Unique)
   - `display_name` (TEXT)
   - `avatar_url` (TEXT)
   - `bio` (TEXT)
   - `player_level` (INTEGER, default: 1)
   - `experience_points` (INTEGER, default: 0)
   - `total_playtime` (INTEGER, in seconds)
   - `achievements` (JSONB array)
   - Timestamps: `created_at`, `updated_at`, `last_login_at`

2. **`user_settings`** - User preferences
   - Display preferences (theme, language)
   - Audio settings (master, music, sfx, voice volumes)
   - Gameplay preferences (difficulty, auto-save, subtitles)
   - Privacy settings (profile visibility, online status)
   - Notification preferences (email, push)

3. **`user_sessions`** - Session tracking
   - Session tokens and metadata
   - IP address and user agent
   - Device information
   - Session lifecycle tracking

4. **`wallet_connections`** - Blockchain wallets
   - Wallet addresses and types
   - Chain information
   - Verification status
   - Connection metadata

5. **`activity_logs`** - Activity tracking
   - User activities across all categories
   - Security events
   - Metadata and context
   - Severity levels

### Database Functions

- `handle_new_user()` - Auto-creates profile and settings on signup
- `update_updated_at_column()` - Auto-updates timestamps
- `update_last_login()` - Tracks last login time
- `get_user_stats(user_id)` - Retrieves user statistics
- `log_activity()` - Helper for logging activities
- `verify_wallet(wallet_id, signature)` - Verifies wallet ownership
- `cleanup_old_sessions()` - Removes old inactive sessions

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

- **user_profiles**: Users can view/edit their own profile; public profiles viewable by all
- **user_settings**: Users can only access their own settings
- **user_sessions**: Users can only see their own sessions
- **wallet_connections**: Users manage their own wallet connections
- **activity_logs**: Users can view their own logs and insert new ones

## ✅ Verification Checklist

### 1. Check Tables

In Supabase Studio (http://127.0.0.1:54323):

1. Navigate to **Table Editor**
2. Verify these tables exist:
   - ✅ `user_profiles`
   - ✅ `user_settings`
   - ✅ `user_sessions`
   - ✅ `wallet_connections`
   - ✅ `activity_logs`

### 2. Verify Indexes

In the **SQL Editor**, run:

```sql
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Expected indexes:

- `idx_user_profiles_username`
- `idx_user_profiles_created_at`
- `idx_user_profiles_player_level`
- `idx_user_sessions_user_id`
- `idx_wallet_connections_user_id`
- `idx_activity_logs_user_id`
- And more...

### 3. Verify RLS Policies

Run this query:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

You should see multiple policies for each table.

### 4. Verify Functions

Run:

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

Expected functions:

- ✅ `handle_new_user`
- ✅ `update_updated_at_column`
- ✅ `update_last_login`
- ✅ `get_user_stats`
- ✅ `log_activity`
- ✅ `verify_wallet`
- ✅ `cleanup_old_sessions`

### 5. Verify Triggers

Run:

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

Expected triggers:

- ✅ `on_auth_user_created` (on auth.users)
- ✅ `update_user_profiles_updated_at`
- ✅ `update_user_settings_updated_at`
- ✅ `update_wallet_connections_updated_at`
- ✅ `update_last_login_on_session`

### 6. Test User Creation

In Supabase Studio:

1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Create a test user:
   - Email: `test@example.com`
   - Password: `TestPass123`
4. Click **Create User**

**Verify automatic profile creation:**

In SQL Editor, run:

```sql
SELECT * FROM public.user_profiles WHERE id = (
  SELECT id FROM auth.users WHERE email = 'test@example.com'
);
```

You should see:

- ✅ Profile created automatically
- ✅ Username auto-generated
- ✅ Default values set (player_level = 1, etc.)

**Verify settings creation:**

```sql
SELECT * FROM public.user_settings WHERE id = (
  SELECT id FROM auth.users WHERE email = 'test@example.com'
);
```

You should see:

- ✅ Settings created with defaults
- ✅ Theme = 'dark'
- ✅ All volumes set
- ✅ Privacy defaults applied

### 7. Test RLS Policies

#### Test User Isolation

Create a second test user and verify users cannot access each other's data:

```sql
-- As user 1, try to access user 2's profile (should fail/return nothing)
SELECT * FROM public.user_profiles
WHERE id = '[user-2-id]';
```

With RLS active, this should return no results (unless profile is public).

#### Test Public Profile Visibility

Update a user's profile to public:

```sql
UPDATE public.user_settings
SET profile_visibility = 'public'
WHERE id = '[user-id]';
```

Then verify other users can view it via the "Public profiles are viewable" policy.

### 8. Test Functions

Test the `get_user_stats` function:

```sql
SELECT public.get_user_stats('[user-id]'::uuid);
```

Expected output (JSON):

```json
{
  "player_level": 1,
  "experience_points": 0,
  "total_playtime": 0,
  "achievements_count": 0,
  "member_since": "2026-02-03T...",
  "last_login": "2026-02-03T...",
  "wallet_count": 0
}
```

Test the `log_activity` function:

```sql
SELECT public.log_activity(
  'test_activity',
  'system',
  'Testing activity logging',
  '{"test": true}'::jsonb,
  'info'
);
```

Then verify the log was created:

```sql
SELECT * FROM public.activity_logs
WHERE activity_type = 'test_activity';
```

### 9. Test Email Templates

1. Go to **Inbucket** (http://127.0.0.1:54324)
2. In Supabase Studio, trigger a password reset for your test user
3. Check Inbucket - you should see the custom-styled email

### 10. Performance Check

Run this query to check table sizes and row counts:

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
```

## 🔒 Security Features

### Row Level Security (RLS)

All tables are protected with RLS policies that ensure:

- ✅ Users can only access their own data
- ✅ Public profiles are viewable when visibility is set to 'public'
- ✅ No unauthorized cross-user data access
- ✅ Proper authentication required for all operations

### Password Requirements

Configured in `config.toml`:

- Minimum length: 8 characters
- Required: Lowercase, uppercase, and digits
- Refresh token rotation enabled
- Secure session management

### Activity Logging

All significant actions are logged:

- User registration
- Login/logout events
- Profile changes
- Wallet verifications
- Security events

## 📧 Email Configuration

### Local Development

Emails are captured by Inbucket (http://127.0.0.1:54324) for testing.

### Production Setup

To use real email in production, configure SMTP in `config.toml`:

```toml
[auth.email.smtp]
enabled = true
host = "smtp.sendgrid.net"
port = 587
user = "apikey"
pass = "env(SENDGRID_API_KEY)"
admin_email = "noreply@nomekopbequest.com"
sender_name = "Nomekop Bequest"
```

Custom templates are already configured:

- ✅ Confirmation email
- ✅ Password recovery
- ✅ Email change confirmation

## 🔧 Useful Commands

### Start Supabase

```powershell
npx supabase start
```

### Stop Supabase

```powershell
npx supabase stop
```

### Reset Database (Reapply migrations)

```powershell
npx supabase db reset
```

### Create New Migration

```powershell
npx supabase migration new migration_name
```

### Generate TypeScript Types

```powershell
npx supabase gen types typescript --local > types/supabase.ts
```

### View Logs

```powershell
npx supabase logs
```

### Check Status

```powershell
npx supabase status
```

## 🌐 Environment Variables

For your application, create a `.env` file with:

```env
# Get these from `npx supabase status`
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **Never commit the service role key to version control!**

## 📊 Monitoring & Analytics

### Activity Logs

Query recent user activity:

```sql
SELECT
  al.activity_type,
  al.activity_category,
  al.description,
  al.created_at,
  up.username
FROM public.activity_logs al
LEFT JOIN public.user_profiles up ON al.user_id = up.id
ORDER BY al.created_at DESC
LIMIT 100;
```

### User Statistics

Get aggregated user stats:

```sql
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week,
  COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '24 hours' THEN 1 END) as active_today
FROM public.user_profiles;
```

### Wallet Connections

Track wallet adoption:

```sql
SELECT
  wallet_type,
  COUNT(*) as count,
  COUNT(CASE WHEN is_verified THEN 1 END) as verified_count
FROM public.wallet_connections
GROUP BY wallet_type;
```

## 🔄 Backup & Recovery

### Manual Backup

```powershell
npx supabase db dump -f backup.sql
```

### Restore from Backup

```powershell
npx supabase db reset
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f backup.sql
```

## 🐛 Troubleshooting

### Docker Not Running

**Error:** `Error during connect: This error may indicate that the docker daemon is not running`

**Solution:**

1. Start Docker Desktop
2. Wait for it to fully initialize
3. Run `npx supabase start` again

### Port Conflicts

**Error:** `Port 54321 is already in use`

**Solution:**

1. Check what's using the port: `netstat -ano | findstr :54321`
2. Either stop that process or change the port in `config.toml`

### Migration Errors

**Error:** `Migration failed`

**Solution:**

1. Check the migration file for SQL errors
2. Reset the database: `npx supabase db reset`
3. Review error logs: `npx supabase logs`

### RLS Policy Issues

**Error:** `new row violates row-level security policy`

**Solution:**

1. Verify you're authenticated: Check JWT token
2. Review RLS policies in Studio
3. Ensure `auth.uid()` matches the user ID

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

## ✅ Final Verification Checklist

Before deploying to production:

- [ ] All tables created successfully
- [ ] Indexes created on appropriate columns
- [ ] RLS enabled on all tables
- [ ] RLS policies created and tested
- [ ] Functions created without errors
- [ ] Triggers created and active
- [ ] Auth trigger creates profile automatically
- [ ] Can create test user via Supabase auth
- [ ] Profile auto-created when user signs up
- [ ] Settings auto-created when user signs up
- [ ] Can query user data with RLS active
- [ ] Users cannot access other users' private data
- [ ] Email templates customized and tested
- [ ] Activity logging working
- [ ] Wallet connection system functional
- [ ] Performance indexes in place
- [ ] Backup strategy implemented

## 🎉 Success!

If all checks pass, your Supabase database infrastructure is ready for the Nomekop Bequest project!

---

**Need Help?** Create an issue in the repository or contact the development team.
