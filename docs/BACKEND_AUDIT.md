# Maker's Lab Backend Audit Report

## Current Table Structure

| Table | Columns | Purpose | Status |
|-------|---------|---------|--------|
| **profiles** | id, display_name, role, avatar_url, email, created_at | User profiles & roles | ✓ Active |
| **projects** | id, user_id, title, description, category, tags, budget, timeline, status, repo_url, featured, created_at, updated_at | Project submissions | ✓ Active |
| **project_files** | id, filename, original_name, mime_type, storage_key, storage_url, bucket, project_id, created_at | File attachments | ✓ Active |
| **testimonials** | id, rating, text, is_approved, user_id, project_id, created_at | Project testimonials | ✓ Active |
| **admin_notes** | id, note, project_id, admin_id, created_at | Admin annotations | ✓ Active |

---

## ⚠️ CRITICAL: Missing Row Level Security (RLS) Policies

### Current RLS Status: **NONE DEFINED**

**Gap Analysis:**

| Table | Missing Policies | Risk Level | Impact |
|-------|------------------|-----------|--------|
| **profiles** | • User can read own profile only<br>• Admin can read all<br>• Only owner/admin can update | **CRITICAL** | Users could query all profiles; emails exposed |
| **projects** | • Users see own + featured<br>• Admins see all<br>• Only owner can update/delete | **CRITICAL** | Non-owners could modify/delete projects |
| **project_files** | • Access via project ownership<br>• Secure file downloads | **CRITICAL** | Orphaned files accessible; storage abuse risk |
| **testimonials** | • Users read approved only<br>• Admins/owner see all<br>• Only owner can write | **HIGH** | Unapproved testimonials visible; spam possible |
| **admin_notes** | • Only admins can read/write<br>• Admins cannot delete own | **HIGH** | Non-admins could read sensitive notes |

**Required RLS Policies:**
```sql
-- profiles: users see own, admins see all
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR makers_is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR makers_is_admin());

-- projects: users see own + featured, admins see all
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own and featured projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id OR featured = true OR makers_is_admin());

CREATE POLICY "Users can only update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id AND status = 'PENDING' OR makers_is_admin());

-- project_files: inherit via project.user_id
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Files accessible via project ownership"
  ON project_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_files.project_id 
    AND (auth.uid() = projects.user_id OR makers_is_admin())
  ) OR project_id IS NULL);

-- testimonials: users see approved, admins/owner see all
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see approved testimonials"
  ON testimonials FOR SELECT
  USING (is_approved OR EXISTS (
    SELECT 1 FROM projects WHERE projects.id = testimonials.project_id 
    AND auth.uid() = projects.user_id
  ) OR makers_is_admin());

-- admin_notes: admin-only read/write
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins access admin notes"
  ON admin_notes FOR SELECT
  USING (makers_is_admin());
```

---

## 🔐 Table 1: Password Reset Tracking (MISSING)

**Purpose:** Track password reset tokens, expiry, and attempts

**Recommended Schema:**
```sql
CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_active_per_user UNIQUE (user_id) WHERE used_at IS NULL
);

CREATE INDEX idx_password_resets_user_id ON public.password_resets(user_id);
CREATE INDEX idx_password_resets_token_hash ON public.password_resets(token_hash);
CREATE INDEX idx_password_resets_expires_at ON public.password_resets(expires_at);

-- RLS Policy
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own reset requests"
  ON password_resets FOR SELECT
  USING (auth.uid() = user_id OR makers_is_admin());
```

**Priority:** 🔴 **CRITICAL** — Password resets currently untracked

---

## ✉️ Table 2: Email Verification (MISSING)

**Purpose:** Track email verification tokens and status

**Recommended Schema:**
```sql
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_pending_per_user UNIQUE (user_id) WHERE verified_at IS NULL
);

CREATE INDEX idx_email_verifications_user_id ON public.email_verifications(user_id);
CREATE INDEX idx_email_verifications_token_hash ON public.email_verifications(token_hash);
CREATE INDEX idx_email_verifications_email ON public.email_verifications(email);

-- Modify profiles to track verification status
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
```

**Priority:** 🟠 **HIGH** — Email verification should be enforced for security

---

## 📋 Table 3: Audit Logging (MISSING)

**Purpose:** Comprehensive audit trail for compliance and security

**Recommended Schema:**
```sql
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'
  resource_type TEXT NOT NULL, -- 'project', 'profile', 'testimonial', 'user'
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'SUCCESS', -- 'SUCCESS', 'FAILURE', 'DENIED'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- RLS: Admins only, users see own activities
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins see all audit logs"
  ON audit_logs FOR SELECT
  USING (makers_is_admin());
```

**Priority:** 🟠 **HIGH** — Audit trails required for compliance

---

## ⚙️ Table 4: User Preferences/Settings (MISSING)

**Purpose:** User-specific settings, notifications, privacy preferences

**Recommended Schema:**
```sql
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  project_update_notifications BOOLEAN NOT NULL DEFAULT true,
  testimonial_notifications BOOLEAN NOT NULL DEFAULT true,
  newsletter_subscribed BOOLEAN NOT NULL DEFAULT false,
  profile_private BOOLEAN NOT NULL DEFAULT false,
  allow_contact BOOLEAN NOT NULL DEFAULT true,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT,
  theme TEXT NOT NULL DEFAULT 'system', -- 'light', 'dark', 'system'
  last_login_at TIMESTAMPTZ,
  last_login_ip TEXT,
  login_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Users can only access own settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users edit own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = id);
```

**Priority:** 🟡 **MEDIUM** — Nice-to-have but improves UX

---

## 🚨 Table 5: Login Attempts (MISSING)

**Purpose:** Track login attempts for security monitoring

**Recommended Schema:**
```sql
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  failure_reason TEXT, -- 'invalid_password', 'user_not_found', 'account_locked'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_user_id ON public.login_attempts(user_id);
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX idx_login_attempts_created_at ON public.login_attempts(created_at DESC);
CREATE INDEX idx_login_attempts_ip ON public.login_attempts(ip_address, created_at DESC);

-- Admins only
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins view login attempts"
  ON login_attempts FOR SELECT
  USING (makers_is_admin());
```

**Priority:** 🟡 **MEDIUM** — Fraud detection & security monitoring

---

## 🔗 Data Integrity Gaps

| Issue | Current State | Recommendation |
|-------|--|--|
| **Project-Testimonial Relationship** | `UNIQUE(project_id)` allows 1:1 only | ✓ Acceptable for now |
| **Orphaned Files** | Files remain if project deleted (CASCADE exists) | ✓ Files deleted via cascade |
| **Project Status Flow** | No enforcement of valid transitions | 🔴 Add CHECK constraint |
| **Email Uniqueness** | Not enforced in profiles table | 🟠 Add UNIQUE constraint |
| **Foreign Key Cleanup** | ON DELETE CASCADE standard | ✓ Good |

---

## 🔓 Current Data Security Gaps

### 1. **No RLS Policies** (CRITICAL)
- Unauthenticated users cannot access data (InsForge handles JWT)
- But authenticated users can query all profiles, access non-owned projects
- **Fix:** Implement RLS policies above

### 2. **No Email Verification Requirement**
- Users register but emails never validated
- Fake email registration allowed
- **Fix:** Require email verification before full access

### 3. **Password Reset Tracking Missing**
- No token storage; could allow unlimited reset attempts
- No rate limiting or expiry tracking
- **Fix:** Implement `password_resets` table

### 4. **No Login Attempt Logging**
- Cannot detect brute force attacks or unusual activity
- **Fix:** Implement `login_attempts` table

### 5. **No Audit Trail**
- Cannot track who changed what, when, or why
- Compliance issues (GDPR, etc.)
- **Fix:** Implement `audit_logs` table

### 6. **File Access Control Not Enforced**
- `project_files.project_id` can be NULL (orphaned files)
- No size limits on uploads
- Storage key is predictable (timestamp-based)
- **Fix:** Enforce NOT NULL constraint, add file quota per project

### 7. **Testimonial Spam Risk**
- No rate limiting on testimonial creation
- Admin can create testimonials for any user/project
- No verification that commenter actually used project
- **Fix:** Rate limiting, user-only creation, verification

### 8. **Admin Notes Visible to All** (If RLS not set)
- Admin notes should be private
- **Fix:** Add RLS admin-only policy

### 9. **Profile Email Exposure**
- Profiles table has email but no access control
- Querying all profiles exposes all email addresses
- **Fix:** Implement RLS to restrict email visibility

### 10. **No Rate Limiting**
- API functions lack rate limiting (handled by InsForge?)
- No throttling on password resets, file uploads
- **Fix:** Coordinate with InsForge rate limiting or add client-side checks

---

## 📊 Missing/Incomplete API Functions in src/lib/api/

### ✅ Existing Functions (27 total)
- `fetchSessionUser()` - Get current user
- `fetchMyProjects()` - User's projects
- `deleteMyProject()` - User delete (PENDING only)
- `fetchFeaturedGallery()` - Public featured projects
- `fetchApprovedTestimonials()` - Public testimonials
- `createProjectWithFiles()` - Submit project
- `fetchAdminProjects()` - All projects (admin)
- `adminUpdateProject()` - Update + add notes (admin)
- `adminDeleteProject()` - Delete project (admin)
- `adminBulkUpdateProjects()` - Batch update (admin)
- `adminBulkDeleteProjects()` - Batch delete (admin)
- `adminDeleteProjectFile()` - Remove attachment (admin)
- `adminDeleteAdminNote()` - Delete note (admin)
- `adminUpdateUserProfile()` - Edit profile (admin)
- `adminReassignProject()` - Change owner (admin)
- `adminCreateTestimonial()` - Add testimonial (admin)
- `fetchAdminTestimonials()` - All testimonials (admin)
- `adminSetTestimonialApproved()` - Approve testimonial (admin)
- `adminDeleteTestimonial()` - Delete testimonial (admin)
- `fetchAdminUsers()` - All users + project counts (admin)
- `adminSetUserRole()` - Promote/demote (admin)
- `adminDeleteUserProfile()` - Delete user (admin)
- `fetchAdminAnalytics()` - Stats (admin)
- `updateMyProfile()` - Edit own profile
- `userFromAuthUser()` - Map auth user
- `ensureProfile()` - Create profile (internal)
- `profilesByIds()` - Batch fetch profiles (internal)

### ❌ MISSING Functions

**Auth & Security:**
- `requestPasswordReset(email)` - Initiate reset
- `validatePasswordResetToken(token)` - Check token validity
- `completePasswordReset(token, newPassword)` - Confirm reset
- `requestEmailVerification(userId)` - Send verification link
- `verifyEmailToken(token)` - Mark email as verified
- `changePassword(userId, oldPassword, newPassword)` - Authenticated password change
- `getLoginAttempts(userId, hours)` - Security monitoring
- `lockAccount(userId, reason)` - Disable account

**User Data:**
- `updateUserSettings(userId, settings)` - Update preferences
- `getUserSettings(userId)` - Fetch preferences
- `getAuditLogs(filters)` - Query activity history
- `exportUserData(userId)` - GDPR data export
- `deleteUserData(userId)` - GDPR delete request

**Testimonial Management:**
- `createUserTestimonial(projectId, rating, text)` - User submission
- `updateMyTestimonial(testimonialId, rating, text)` - User edit
- `deleteMyTestimonial(testimonialId)` - User delete

**File Management:**
- `uploadProjectFile(projectId, file)` - Add file to existing project
- `deleteProjectFile(fileId, userId)` - User delete file
- `getProjectFileCount(projectId)` - Quota check
- `getFileDownloadUrl(fileId)` - Secure download (already exists as storage_url)

**Admin Analytics:**
- `getDetailedAnalytics(dateRange)` - Time-series stats
- `getUserActivityReport(userId)` - Detailed user actions
- `getSystemHealthMetrics()` - Database size, query performance
- `exportAnalyticsReport(format)` - CSV/PDF export

**Priority:** 🔴 **CRITICAL** - Auth & security functions MUST be added

---

## 🏗️ Implementation Priority & Roadmap

### Phase 1: CRITICAL (Week 1-2)
1. ✅ Add RLS policies to all tables
2. ✅ Create `password_resets` table + API functions
3. ✅ Create `login_attempts` table + logging
4. ✅ Add password change/reset functions
5. ✅ Fix email uniqueness constraint in profiles

**Impact:** Prevents unauthorized data access, secures password resets

### Phase 2: HIGH (Week 3)
1. ✅ Create `email_verifications` table
2. ✅ Add email verification flow
3. ✅ Create `audit_logs` table
4. ✅ Add audit logging middleware
5. ✅ Implement user testimonial creation API

**Impact:** Improves data integrity, enables compliance reporting

### Phase 3: MEDIUM (Week 4)
1. ✅ Create `user_settings` table
2. ✅ Add notification preferences
3. ✅ Add user activity reports
4. ✅ Implement GDPR export/delete
5. ✅ Add rate limiting

**Impact:** Better UX, privacy compliance, abuse prevention

### Phase 4: LOW (Future)
1. File quota management
2. Advanced analytics & reports
3. User activity timeline
4. Notification service integration

---

## SQL Deployment Checklist

```sql
-- 1. Add constraints to existing tables
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD CONSTRAINT unique_email UNIQUE (email) WHERE email IS NOT NULL;

ALTER TABLE public.projects 
  ADD CONSTRAINT valid_status CHECK (status IN ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'));

-- 2. Create new tables (see schemas above)
-- 3. Create RLS policies (see above)
-- 4. Create indexes
-- 5. Test queries
```

---

## Recommendations Summary

| Area | Current | Recommendation | Effort | Priority |
|------|---------|---|--------|----------|
| **RLS Policies** | ❌ None | Implement 5 policies | 4h | 🔴 CRITICAL |
| **Password Reset** | ❌ No table | Add `password_resets` | 6h | 🔴 CRITICAL |
| **Email Verification** | ❌ No table | Add `email_verifications` | 4h | 🟠 HIGH |
| **Audit Logging** | ❌ No table | Add `audit_logs` | 8h | 🟠 HIGH |
| **Login Attempts** | ❌ No tracking | Add `login_attempts` | 3h | 🟡 MEDIUM |
| **User Settings** | ❌ No table | Add `user_settings` | 3h | 🟡 MEDIUM |
| **Auth APIs** | 🟠 Partial | Add 8-10 functions | 12h | 🔴 CRITICAL |
| **File Constraints** | 🟠 Partial | Add NOT NULL, quota checks | 2h | 🟡 MEDIUM |
| **Rate Limiting** | ❌ None | Coordinate with InsForge | 2h | 🟡 MEDIUM |

**Total Estimated Effort:** ~44 hours to fully secure backend

---

**Report Generated:** April 10, 2026
**Database:** InsForge Postgres
**Framework:** React + TSX (src/lib/api/)
