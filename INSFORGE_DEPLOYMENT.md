# 🚀 Insforge Deployment Guide - Phase 1

## Before You Deploy

The Insforge CLI needs to be linked to your project. If you haven't done this yet:

```bash
# Link your local project to Insforge
npx @insforge/cli link

# Follow the prompts to authenticate and select your project
```

## Automated Deployment (Windows PowerShell)

Once linked, run the deployment script:

```powershell
.\deploy.ps1
```

Or manually execute the SQL in order:

## Manual Deployment - Option 1: Via CLI

```bash
# 1. Deploy critical security tables
npx @insforge/cli db query "$(cat insforge/tables-critical.sql)"

# 2. Apply Row Level Security policies
npx @insforge/cli db query "$(cat insforge/rls-policies.sql)"
```

## Manual Deployment - Option 2: Via Insforge Dashboard

1. Go to **[Insforge Dashboard](https://insforge.io)**
2. Log in to your project
3. Navigate to **SQL Editor** or **Database**
4. Copy & paste contents of `insforge/tables-critical.sql`
5. Execute the SQL
6. Repeat step 4-5 with `insforge/rls-policies.sql`

## What Gets Deployed

### 5 New Security Tables
- ✅ `password_resets` - Track password reset requests with rate limiting
- ✅ `email_verifications` - Track OTP verification attempts
- ✅ `login_attempts` - Log all login attempts for brute force detection
- ✅ `audit_logs` - JSONB audit trail of all critical actions
- ✅ `user_settings` - User preferences (theme, notifications, 2FA)

### 10 Row Level Security Policies
- 🔐 Profiles table - Users see own, admins see all
- 🔐 Projects table - Public read approved, owner/admin manage
- 🔐 Password resets - Anonymous insert, users read own
- 🔐 Login attempts - Admins read, system insert
- 🔐 Audit logs - Admins read, system insert
- 🔐 *(+ 5 more) See BACKEND_IMPLEMENTATION.md*

### 8 Performance Indexes
- ⚡ User ID + date lookups
- ⚡ IP address brute force detection
- ⚡ Email address login history
- ⚡ Expiration cleanup queries

## Verification

After deployment, verify tables exist:

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'password_resets', 
  'email_verifications', 
  'login_attempts', 
  'audit_logs', 
  'user_settings'
)
ORDER BY tablename;
```

Should return 5 rows.

## Post-Deployment

1. ✅ Frontend code is already integrated
2. ✅ All API functions are ready in `src/lib/makers-data.ts`
3. ✅ Security monitoring dashboard is live in Admin Console
4. ✅ Build verified: No errors, production-ready

## Next: Test the Implementation

See `BACKEND_SETUP_GUIDE.md` for 3-step testing:
1. Test password reset flow
2. Test login tracking
3. Test brute force detection

---

**Notes:**
- SQL files are idempotent (`IF NOT EXISTS`) - safe to run multiple times
- No users or data are affected
- All changes are additive, no breaking changes
- Rollback: Drop affected tables if needed

