# 🎮 Nomekop Bequest - Supabase Database Infrastructure

> Complete authentication, user management, and player data system for the Nomekop Bequest game

## 📋 Quick Start

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/))

### Installation

1. **Install Docker Desktop and start it**

2. **Start Supabase**

   ```powershell
   npx supabase start
   ```

3. **Access Supabase Studio**
   - Open: http://127.0.0.1:54323
   - View your database, create test users, run queries

4. **Check email testing**
   - Open: http://127.0.0.1:54324 (Inbucket)
   - All authentication emails will appear here

## 🗄️ What's Included

### Database Tables

- **`user_profiles`** - Player profiles with game statistics
- **`user_settings`** - User preferences and configuration
- **`user_sessions`** - Session tracking for security
- **`wallet_connections`** - Blockchain wallet integration
- **`activity_logs`** - Comprehensive activity logging

### Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ User isolation - users can only access their own data
- ✅ Public profile visibility controls
- ✅ Automated profile creation on signup
- ✅ Activity logging for audit trails

### Database Functions

- `handle_new_user()` - Auto-creates profile/settings on signup
- `get_user_stats()` - Retrieves player statistics
- `log_activity()` - Logs user activities
- `verify_wallet()` - Verifies blockchain wallet ownership
- `cleanup_old_sessions()` - Removes old inactive sessions

### Authentication

- Email/password authentication
- Custom branded email templates
- Password requirements (8+ chars, mixed case, numbers)
- JWT token authentication
- Session management

## 📁 Project Structure

```
NMKP Bequest/
├── supabase/
│   ├── migrations/
│   │   └── 20260203023513_initial_schema.sql  # Complete database schema
│   ├── templates/
│   │   ├── confirmation.html                   # Email confirmation template
│   │   ├── recovery.html                       # Password reset template
│   │   └── email_change.html                   # Email change template
│   ├── config.toml                             # Supabase configuration
│   ├── seed.sql                                # Seed data (for testing)
│   ├── queries.sql                             # Useful SQL queries
│   └── verify.sql                              # Verification script
├── types/
│   └── database.types.ts                       # TypeScript type definitions
├── .env.example                                # Environment variables template
├── SUPABASE_SETUP.md                          # Detailed setup guide
└── README.md                                   # This file
```

## 🔧 Common Commands

```powershell
# Start Supabase
npx supabase start

# Stop Supabase
npx supabase stop

# Reset database (reapply migrations)
npx supabase db reset

# Check status
npx supabase status

# Create new migration
npx supabase migration new my_migration

# Generate TypeScript types
npx supabase gen types typescript --local > types/database.types.ts

# View logs
npx supabase logs
```

## ✅ Verification

Run the verification script in Supabase Studio SQL Editor:

1. Open http://127.0.0.1:54323
2. Go to SQL Editor
3. Copy contents of `supabase/verify.sql`
4. Execute

Or use the checklist in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## 📧 Email Templates

Custom branded email templates are configured for:

- ✉️ **Account Confirmation** - New user email verification
- 🔐 **Password Reset** - Password recovery emails
- 🔄 **Email Change** - Email address change confirmation

Test emails in Inbucket: http://127.0.0.1:54324

## 🔒 Security

### Row Level Security (RLS)

All tables protected with policies:

- Users can only access their own data
- Public profiles viewable when visibility = 'public'
- Proper authentication required
- No cross-user data access

### Password Requirements

- Minimum 8 characters
- Must include uppercase, lowercase, and numbers
- Configured in `config.toml`

### Activity Logging

All actions logged:

- User registration
- Login/logout
- Profile changes
- Wallet verifications
- Security events

## 🌐 Environment Variables

Copy `.env.example` to `.env` and fill in values:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these values from: `npx supabase status`

⚠️ **Never commit `.env` to version control!**

## 📖 Documentation

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Complete setup and verification guide
- [supabase/queries.sql](./supabase/queries.sql) - SQL query reference
- [types/database.types.ts](./types/database.types.ts) - TypeScript types

## 🧪 Testing

### Create Test User

In Supabase Studio:

1. Go to Authentication → Users
2. Click "Add User"
3. Email: `test@example.com`
4. Password: `TestPass123`
5. Profile automatically created!

### Verify Auto-Creation

```sql
-- Check profile
SELECT * FROM user_profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

-- Check settings
SELECT * FROM user_settings
WHERE id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
```

## 📊 Monitoring

### View Recent Activity

```sql
SELECT
  al.created_at,
  up.username,
  al.activity_type,
  al.description
FROM activity_logs al
LEFT JOIN user_profiles up ON al.user_id = up.id
ORDER BY al.created_at DESC
LIMIT 50;
```

### User Statistics

```sql
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week,
  COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '24 hours' THEN 1 END) as active_today
FROM user_profiles;
```

More queries in [supabase/queries.sql](./supabase/queries.sql).

## 🐛 Troubleshooting

### Docker Not Running

**Error:** `docker daemon is not running`

**Fix:**

1. Start Docker Desktop
2. Wait for it to fully initialize
3. Run `npx supabase start` again

### Port Conflicts

**Error:** `Port already in use`

**Fix:**

- Stop other services using ports 54321-54326
- Or change ports in `config.toml`

### Migration Errors

**Fix:**

```powershell
npx supabase db reset
```

## 🚀 Production Deployment

When deploying to production:

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Link project: `npx supabase link --project-ref your-project-ref`
3. Push migrations: `npx supabase db push`
4. Configure production SMTP in Supabase dashboard
5. Update environment variables with production values

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

## ✨ Features Checklist

- [x] User authentication with Supabase Auth
- [x] User profiles with game statistics
- [x] User settings and preferences
- [x] Session tracking
- [x] Wallet connections for Web3
- [x] Activity logging
- [x] Row Level Security (RLS)
- [x] Automated profile creation
- [x] Database functions
- [x] Triggers for automation
- [x] Custom email templates
- [x] Performance indexes
- [x] TypeScript types
- [x] SQL query reference
- [x] Comprehensive documentation

## 🎉 Success Criteria

Your database is ready when:

- ✅ All tables created
- ✅ Indexes created
- ✅ RLS enabled on all tables
- ✅ RLS policies active
- ✅ Functions created
- ✅ Triggers active
- ✅ Auth trigger works
- ✅ Test user creates profile automatically
- ✅ Settings auto-created
- ✅ Can query with RLS active
- ✅ Users isolated from each other

Run `supabase/verify.sql` to check all criteria!

## 📞 Support

For issues or questions:

1. Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
2. Review [supabase/queries.sql](./supabase/queries.sql)
3. Check Supabase logs: `npx supabase logs`
4. Create an issue in the repository

---

**Built with** [Supabase](https://supabase.com) • **Powered by** PostgreSQL

_Nomekop Bequest - Adventure Awaits_ 🎮
