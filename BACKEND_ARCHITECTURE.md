# 🏗️ Backend Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Auth.tsx (Password Reset, Login, Register, Email Verify)      │
│    ├─ handleForgotPassword()                                     │
│    ├─ handleResetPasswordVerify()                               │
│    ├─ handleSubmit() (Login)                                     │
│    └─ handleVerify() (Email OTP)                                 │
│                                                                   │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │ HTTP Requests
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                    INSFORGE AUTH SERVICE                         │
│  (Insforge Managed - Email, Password, OAuth)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  - resetPasswordForEmail()     ← Reset email link               │
│  - updateUser()                ← Set new password               │
│  - signInWithPassword()        ← Login                           │
│  - signUp()                    ← Register                        │
│  - verifyEmail()               ← OTP validation                  │
│  - signInWithOAuth()           ← Google OAuth                    │
│                                                                   │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │ Insforge SDK
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│              INSFORGE POSTGRES DATABASE                          │
│  (Managed by Insforge, Row Level Security Enabled)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ AUTH TABLES (Managed by Insforge)                        │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ - auth.users (id, email, created_at, ...)               │   │
│  │ - auth.sessions                                          │   │
│  │ - auth.refresh_tokens                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ PUBLIC TABLES (Our Application Schema)                   │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                            │   │
│  │ Core Entities:                                             │   │
│  │  ├─ profiles (id, display_name, role, email_verified)   │   │
│  │  ├─ projects (id, user_id, title, status, ...)          │   │
│  │  ├─ project_files (id, project_id, storage_key, ...)    │   │
│  │  ├─ testimonials (id, rating, is_approved, ...)         │   │
│  │  └─ admin_notes (id, note, project_id, admin_id)        │   │
│  │                                                            │   │
│  │ Security & Audit:                                          │   │
│  │  ├─ password_resets (token_hash, used, expires_at)      │   │
│  │  ├─ email_verifications (otp_hash, verified, expires)   │   │
│  │  ├─ login_attempts (email, success, ip_address)         │   │
│  │  ├─ audit_logs (action, table_name, old/new_values)     │   │
│  │  └─ user_settings (theme, notifications, 2fa_enabled)   │   │
│  │                                                            │   │
│  │ All tables have:                                           │   │
│  │  ✓ Row Level Security (RLS) policies                      │   │
│  │  ✓ Performance indexes                                     │   │
│  │  ✓ Proper foreign key constraints                         │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                       ↑
                       │
                       │ JavaScript SDK Layer
                       │
┌─────────────────────────────────────────────────────────────────┐
│              MAKERS-DATA.TS (Backend API Layer)                  │
│  (TypeScript functions for database operations)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Auth & Security Functions:                                      │
│  ├─ trackPasswordResetRequest(userId, email, options)           │
│  ├─ completePasswordReset(userId)                                │
│  ├─ getRecentPasswordResets(userId, minutes)                     │
│  ├─ trackLoginAttempt(email, success, options)                   │
│  ├─ checkBruteForceAttempts(ip, minutes)                         │
│  ├─ logAuditEvent(action, tableName, recordId, options)          │
│  └─ markEmailAsVerified(userId)                                  │
│                                                                   │
│  User Settings Functions:                                        │
│  ├─ fetchUserSettings(userId)                                    │
│  ├─ updateUserSettings(userId, patch)                            │
│  └─ ...                                                           │
│                                                                   │
│  Admin Monitoring Functions:                                     │
│  ├─ adminGetRecentLoginAttempts(limit)                           │
│  ├─ adminGetAuditLogs(options)                                   │
│  └─ ...                                                           │
│                                                                   │
│  Project Functions: (Existing)                                   │
│  ├─ fetchMyProjects()                                            │
│  ├─ createProjectWithFiles()                                     │
│  ├─ adminUpdateProject()                                         │
│  └─ ...                                                           │
│                                                                   │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │ Imports
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│           FRONTEND COMPONENTS (React + TypeScript)              │
│                                                                   │
│  pages/Auth.tsx                                                  │
│  ├─ Imports: trackPasswordResetRequest, completePasswordReset   │
│  ├─ Imports: trackLoginAttempt, logAuditEvent                   │
│  ├─ Imports: markEmailAsVerified                                 │
│  └─ All functions called on user actions                        │
│                                                                   │
│  pages/Dashboard.tsx                                             │
│  ├─ Imports: fetchUserSettings, updateUserSettings              │
│  └─ Display user preferences                                     │
│                                                                   │
│  pages/AdminDashboard.tsx                                        │
│  ├─ Imports: adminGetRecentLoginAttempts                         │
│  ├─ Imports: adminGetAuditLogs                                   │
│  └─ Display monitoring data                                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Password Reset

```
┌─────────────────────────────────────────────────────────────────┐
│ USER CLICKS "FORGOT PASSWORD?"                                   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────────┐
│ handleForgotPassword()                                            │
│ ├─ input: email                                                   │
│ └─ action: insforge.auth.resetPasswordForEmail(email)            │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ↓ [Auth Service sends email]
┌─────────────────────────────────────────────────────────────────┐
│ SUCCESS: Email sent with recovery link                           │
│ ├─ Link: /login?reset=true&token=xxx                             │
│ └─ Call: trackPasswordResetRequest(userId, email)               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ↓ [INSERT INTO password_resets]
┌─────────────────────────────────────────────────────────────────┐
│ password_resets table:                                           │
│ {                                                                 │
│   id: uuid,                                                      │
│   user_id: uuid,            ← Tracking                           │
│   email: text,              ← For notifications                  │
│   token_hash: text,         ← Insforge token reference          │
│   used: false,              ← Not yet completed                  │
│   expires_at: timestamp,    ← NOW() + 1 hour                    │
│   ip_address: text,         ← Geographic tracking                │
│   user_agent: text,         ← Device tracking                    │
│   created_at: timestamp                                          │
│ }                                                                 │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ↓ [User checks email...]
┌─────────────────────────────────────────────────────────────────┐
│ USER CLICKS EMAIL LINK                                           │
│ /login?reset=true&token=xxx                                      │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ↓ [useEffect detects ?reset=true]
┌─────────────────────────────────────────────────────────────────┐
│ setStep("reset")                                                  │
│ └─ Shows: Reset Password Form                                    │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ↓ [User enters new password...]
┌─────────────────────────────────────────────────────────────────┐
│ handleResetPasswordVerify()                                       │
│ ├─ input: newPassword, confirmPassword                           │
│ ├─ validation: password match, strength >= "fair"                │
│ └─ action: insforge.auth.updateUser({ password })               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ↓ [Password changed in auth service]
┌─────────────────────────────────────────────────────────────────┐
│ SUCCESS: Password updated                                        │
│ ├─ Call: completePasswordReset(userId)                           │
│ ├─ Call: markEmailAsVerified(userId)                             │
│ └─ Call: logAuditEvent("password_reset_success", ...)            │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ├─→ [UPDATE password_resets SET used=true]
                  ├─→ [UPDATE profiles SET email_verified=true]
                  └─→ [INSERT INTO audit_logs]
                  
                  ↓
┌─────────────────────────────────────────────────────────────────┐
│ Success Message: "Password updated! Login with new password"    │
│ → Redirect to /login                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Login with Brute Force Detection

```
┌─────────────────────────────────────────────────────────────────┐
│ USER ENTERS EMAIL & PASSWORD                                     │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────────┐
│ handleSubmit() - Login Mode                                      │
│ └─ action: insforge.auth.signInWithPassword({ email, password }) │
└─────────────────┬───────────────────────────────────────────────┘
                  │
           ┌──────┴──────────────────┐
           │                         │
           ↓                         ↓
    [SUCCESS]              [FAILURE: Invalid]
           │                         │
           ├─→ trackLoginAttempt()   ├─→ checkBruteForceAttempts(ip, 15min)
           │   (success=true)        │   
           │   │                     ├─ if failures > 10
           │   │                     │  └─ BLOCK this IP!
           │   │                     │
           │   │                     └─→ trackLoginAttempt()
           │   │                         (success=false)
           │   │                         │
           │   │                         └─→ [INSERT INTO login_attempts]
           │   │                             {
           │   │                               email,
           │   │                               success: false,
           │   │                               failed_reason: "Invalid",
           │   │                               ip_address,
           │   │                               user_agent,
           │   │                               created_at
           │   │                             }
           │   │                         
           │   │                         ↓
           │   │                    Show error to user
           │   │                    "Invalid email or password"
           │   │
           │   └─→ [INSERT INTO login_attempts]
           │       {
           │         email,
           │         user_id,
           │         success: true,
           │         ip_address,
           │         user_agent,
           │         created_at
           │       }
           │
           ├─→ fetchSessionUser()
           ├─→ login(user)
           └─→ navigate("/dashboard")
```

---

## Security Policies by Table

```
PROFILES
├─ SELECT: auth.uid() = id  OR  maker_is_admin()
├─ UPDATE: auth.uid() = id  OR  maker_is_admin()
├─ INSERT: auth.uid() = id
└─ DELETE: maker_is_admin()

PROJECTS
├─ SELECT: user_id = auth.uid()  OR  status IN (approved,...)  OR  maker_is_admin()
├─ UPDATE: user_id = auth.uid() + PENDING  OR  maker_is_admin()
├─ INSERT: user_id = auth.uid()
└─ DELETE: user_id = auth.uid() + PENDING  OR  maker_is_admin()

PROJECT_FILES
├─ SELECT: owner of project  OR  public project  OR  maker_is_admin()
├─ INSERT: owner of project
└─ DELETE: maker_is_admin()

TESTIMONIALS
├─ SELECT: is_approved = true  OR  auth.uid() = user_id  OR  maker_is_admin()
├─ INSERT: auth.uid() = user_id
└─ UPDATE: maker_is_admin()

ADMIN_NOTES
├─ SELECT: maker_is_admin()  OR  project owner
└─ INSERT: maker_is_admin()

PASSWORD_RESETS
├─ SELECT: auth.uid() = user_id
├─ INSERT: anonymous (anyone can reset)
└─ No UPDATE/DELETE (integrity)

EMAIL_VERIFICATIONS
├─ SELECT: auth.uid() = user_id
├─ INSERT: anonymous (anyone can verify)
└─ No UPDATE/DELETE (integrity)

LOGIN_ATTEMPTS
├─ SELECT: maker_is_admin()
├─ INSERT: anonymous (system logging)
└─ No UPDATE/DELETE (integrity)

AUDIT_LOGS
├─ SELECT: maker_is_admin()
├─ INSERT: anonymous (system logging)
└─ No UPDATE/DELETE (integrity)

USER_SETTINGS
├─ SELECT: auth.uid() = user_id  OR  maker_is_admin()
├─ INSERT: auth.uid() = user_id
└─ UPDATE: auth.uid() = user_id  OR  maker_is_admin()
```

---

## Database Relationships

```
auth.users (Managed by Insforge)
    │
    ├─ 1:1 ─→ profiles
    │          ├─ 1:N ─→ projects
    │          │         ├─ 1:N ─→ project_files
    │          │         ├─ 1:N ─→ admin_notes
    │          │         └─ 1:1 ─→ testimonials
    │          ├─ 1:N ─→ password_resets
    │          ├─ 1:N ─→ email_verifications
    │          ├─ 1:N ─→ login_attempts
    │          ├─ 1:N ─→ audit_logs
    │          └─ 1:1 ─→ user_settings
    │
    ├─ 1:N ─→ admin_notes (admin_id)
    ├─ 1:N ─→ testimonials (user_id)
    └─ 1:N ─→ audit_logs (user_id)

testimonials
    └─ N:1 ─→ projects (project_id - UNIQUE)
```

---

## Query Performance

### Most Frequent Queries

```sql
-- Get user's projects (O(1) via index)
SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC;
INDEX: idx_projects_user_id

-- Check featured projects (O(1) via index)
SELECT * FROM projects WHERE featured = true ORDER BY created_at DESC;
INDEX: idx_projects_featured_created

-- Get approved testimonials (O(1) via index)
SELECT * FROM testimonials WHERE is_approved = true ORDER BY created_at DESC;
INDEX: idx_testimonials_approved_created

-- Check brute force attempts (O(1) via index)
SELECT COUNT(*) FROM login_attempts 
WHERE ip_address = ? AND created_at > NOW() - INTERVAL '15 minutes' AND success = false;
INDEX: idx_login_attempts_ip_created

-- Get password reset history (O(1) via index)
SELECT COUNT(*) FROM password_resets
WHERE user_id = ? AND created_at > NOW() - INTERVAL '1 hour' AND used = false;
INDEX: idx_password_resets_user_id

-- Get admin notes (O(1) via index)
SELECT * FROM admin_notes WHERE project_id = ? ORDER BY created_at DESC;
INDEX: idx_admin_notes_project_id
```

---

## Error Handling Flow

```
Frontend Request
    │
    ↓
┌─────────────────┐
│ Validation      │
│ - Email format  │
│ - Password      │
│ - Passwords     │
│   match         │
└────────┬────────┘
         │
    ┌────┴────────┐
    │ PASS         │ FAIL
    │             └─→ Show error
    ↓              
Backend Request (Insforge)
    │
    ├─→ Auth Service
    ├─→ Database Query
    │
    ├─ SUCCESS ──→ Response 200
    │              ├─ Clear errors
    │              ├─ Log success
    │              └─ Action (redirect/show form)
    │
    └─ ERROR ────→ Response 400+
                   ├─ Extract error message
                   ├─ Log failure
                   ├─ Track attempt
                   └─ Show error to user

User Error Messages:
    ├─ "Invalid email"
    ├─ "Password too weak"
    ├─ "Passwords don't match"
    ├─ "Invalid credentials"
    ├─ "Too many reset requests"
    ├─ "Too many login attempts"
    ├─ "Code expired"
    └─ "Check your network"
```

---

**Architecture Version**: 1.0  
**Last Updated**: April 10, 2026  
**Status**: Production Ready ✅
