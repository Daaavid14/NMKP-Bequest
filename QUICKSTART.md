# 🚀 Quick Start Guide - Nomekop Bequest Database

Get up and running in 5 minutes!

## Step 1: Install Docker Desktop

Download and install Docker Desktop:

- **Windows/Mac**: https://www.docker.com/products/docker-desktop/
- Start Docker Desktop and wait for it to initialize

## Step 2: Start Supabase

Open PowerShell in this directory and run:

```powershell
npx supabase start
```

⏳ First run takes 2-3 minutes (downloads Docker images)

## Step 3: Save Your Credentials

After Supabase starts, you'll see:

```
API URL: http://127.0.0.1:54321
anon key: eyJhbGc...
service_role key: eyJhbGc...
```

**Copy these values!** You'll need them.

## Step 4: Create .env File

Copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and paste your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-step-3
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-step-3
```

## Step 5: Access Your Database

Open these URLs in your browser:

1. **Supabase Studio** (Database Management)
   - http://127.0.0.1:54323
   - Create users, view tables, run queries

2. **Inbucket** (Email Testing)
   - http://127.0.0.1:54324
   - View test emails sent by the system

## Step 6: Create a Test User

In Supabase Studio:

1. Click **Authentication** → **Users**
2. Click **Add User**
3. Enter:
   - Email: `test@example.com`
   - Password: `TestPass123`
4. Click **Create User**

✅ Profile and settings automatically created!

## Step 7: Verify Setup

In Supabase Studio SQL Editor, run:

```sql
-- Check user profile was auto-created
SELECT * FROM user_profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

-- Check settings were auto-created
SELECT * FROM user_settings
WHERE id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
```

Both should return rows with data!

## 🎉 You're Done!

Your database is ready to use. Now you can:

- ✅ Create users via Supabase Auth
- ✅ Automatically get profiles and settings
- ✅ Query data with Row Level Security
- ✅ Track user sessions
- ✅ Connect blockchain wallets
- ✅ Log activities

## 📖 Next Steps

- Read [README.md](./README.md) for overview
- Read [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed guide
- Check [supabase/queries.sql](./supabase/queries.sql) for useful queries
- Review [types/database.types.ts](./types/database.types.ts) for TypeScript integration

## 🛠️ Common Commands

```powershell
# Stop Supabase
npx supabase stop

# Restart Supabase
npx supabase restart

# Reset database (clear all data)
npx supabase db reset

# Check status
npx supabase status

# Generate TypeScript types
npx supabase gen types typescript --local > types/database.types.ts
```

## ❓ Need Help?

- Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) troubleshooting section
- View logs: `npx supabase logs`
- Verify setup: Run `supabase/verify.sql` in SQL Editor

---

**Happy coding!** 🎮
