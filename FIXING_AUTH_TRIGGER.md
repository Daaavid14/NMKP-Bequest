# 🔧 Fixing the Auth Trigger Permission Error

## The Problem

When running `npx supabase start`, you encountered this error:

```
ERROR: must be owner of relation users (SQLSTATE 42501)
At statement: 67
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS...
```

This happens because the migration is trying to create a trigger on the `auth.users` table, which is owned by `supabase_auth_admin`, not the `postgres` role that runs migrations.

---

## ✅ Solution Applied (Recommended)

I've already applied the fix by splitting the migration into two parts:

### 1. Main Schema Migration
**File:** `supabase/migrations/20260203023513_initial_schema.sql`
- Creates all tables, functions, RLS policies
- Does NOT create the auth trigger (moved to separate file)

### 2. Auth Trigger Migration  
**File:** `supabase/migrations/20260203023514_auth_trigger.sql`
- Creates the trigger on `auth.users` with proper error handling
- Gracefully handles permission issues

---

## 🚀 Next Steps

### Try Starting Supabase Again

```powershell
npx supabase start
```

This should now work! The migrations will run in order:
1. First migration creates all your tables and functions
2. Second migration attempts to create the auth trigger
3. If permissions are insufficient, it will warn you but continue

---

## Alternative Solutions (If Still Having Issues)

### Option 1: Manual Trigger Creation via Dashboard

If the automatic trigger creation fails:

1. **Start Supabase** (even if trigger creation fails, other parts work)
   ```powershell
   npx supabase start
   ```

2. **Open Supabase Studio**
   - Go to: http://127.0.0.1:54323

3. **Create Trigger Manually**
   - Navigate to **SQL Editor**
   - Run this SQL:

   ```sql
   CREATE OR REPLACE TRIGGER on_auth_user_created
       AFTER INSERT ON auth.users
       FOR EACH ROW
       EXECUTE FUNCTION public.handle_new_user();
   ```

### Option 2: Use Supabase Auth Hooks (Production Recommended)

For production environments, use Supabase Auth Hooks instead:

1. **Create a database webhook function:**
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
   RETURNS trigger
   SECURITY DEFINER
   SET search_path = public
   LANGUAGE plpgsql
   AS $$
   BEGIN
       -- Same logic as handle_new_user()
       INSERT INTO public.user_profiles (id, username, display_name, created_at, updated_at, last_login_at)
       VALUES (
           NEW.id,
           COALESCE(NEW.raw_user_meta_data->>'username', 'player_' || substring(NEW.id::text from 1 for 8)),
           COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
           NOW(),
           NOW(),
           NOW()
       );
       
       INSERT INTO public.user_settings (id, created_at, updated_at)
       VALUES (NEW.id, NOW(), NOW());
       
       RETURN NEW;
   END;
   $$;
   ```

2. **Configure in Supabase Dashboard:**
   - Go to Authentication → Hooks
   - Add "Before User Created" hook
   - Point to your function

### Option 3: Remove Trigger Entirely (Testing Only)

If you just want to test without the automatic trigger:

1. **Delete the auth trigger migration:**
   ```powershell
   Remove-Item "supabase\migrations\20260203023514_auth_trigger.sql"
   ```

2. **Create profiles manually** when testing:
   ```sql
   -- After creating a user, manually create their profile:
   INSERT INTO user_profiles (id, username) 
   VALUES ('[user-id]', 'testuser');
   
   INSERT INTO user_settings (id) 
   VALUES ('[user-id]');
   ```

---

## 🔍 Verifying the Fix

### Check if Supabase Started Successfully

```powershell
npx supabase status
```

Expected output:
```
         API URL: http://127.0.0.1:54321
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
```

### Check if Tables Were Created

1. Open Supabase Studio: http://127.0.0.1:54323
2. Go to **Table Editor**
3. You should see:
   - ✅ user_profiles
   - ✅ user_settings
   - ✅ user_sessions
   - ✅ wallet_connections
   - ✅ activity_logs

### Test Profile Creation

1. **Create a test user** in Supabase Studio:
   - Authentication → Users → Add User
   - Email: `test@example.com`
   - Password: `TestPass123`

2. **Check if profile was auto-created**:
   ```sql
   SELECT * FROM user_profiles 
   WHERE id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
   ```

If this returns a row, the trigger is working! ✅

If it returns nothing, the trigger didn't fire - use Option 1 above to create it manually.

---

## 🐛 Troubleshooting

### Still Getting Permission Errors?

The `auth.users` table has special permissions in Supabase. If you continue to have issues:

1. **Check Docker is running properly:**
   ```powershell
   docker ps
   ```
   Should show multiple supabase containers running

2. **Reset completely:**
   ```powershell
   npx supabase stop
   npx supabase start
   ```

3. **Check migration logs:**
   ```powershell
   npx supabase db reset --debug
   ```

### Database Won't Start?

```powershell
# Stop all containers
npx supabase stop

# Remove volumes (WARNING: Deletes all data)
docker volume prune

# Start fresh
npx supabase start
```

---

## ✨ What Changed

### Before (Caused Error)
```sql
-- In main migration file:
CREATE TRIGGER on_auth_user_created ON auth.users ...
COMMENT ON TRIGGER ... -- This line caused the error
```

### After (Fixed)
```sql
-- Main migration: No auth trigger
-- Separate migration: Auth trigger with error handling
DO $$ 
BEGIN
    CREATE TRIGGER on_auth_user_created ...
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Create manually if needed';
END $$;
```

---

## 📝 Summary

The fix I applied:
- ✅ Removed problematic `COMMENT ON TRIGGER` statement
- ✅ Split auth trigger into separate migration
- ✅ Added error handling for permission issues
- ✅ Provided graceful fallback options

**Now try:** `npx supabase start`

It should work! If you still see issues, the database will still start, you'll just need to create the auth trigger manually using Option 1 above.

---

## Need More Help?

- Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed setup
- Review logs: `npx supabase logs`
- Check status: `npx supabase status`

🎮 **Good luck with your Nomekop Bequest project!**
