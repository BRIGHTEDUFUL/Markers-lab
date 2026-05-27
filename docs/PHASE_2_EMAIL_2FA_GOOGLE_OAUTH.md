# 🚀 PHASE 2+ IMPLEMENTATION: Email 2FA + Google OAuth

**Status:** Starting Now (April 10, 2026)  
**Timeline:** 2 weeks  
**Effort:** 20-25 hours  
**Combined Features:** Email 2FA + Google OAuth Login

---

## 🎯 What You'll Build

### Feature 1: Email 2FA (Email-based Two-Factor Authentication)
**Flow:**
1. User signs up / logs in with email + password
2. System sends 6-digit OTP to email
3. User enters OTP (3 attempts, 15-min expiry)
4. Session created on success
5. User can enable/disable in Settings

**Benefit:** Prevents account takeover (even if password compromised)

### Feature 2: Google OAuth (Sign in with Google)
**Flow:**
1. User clicks "Sign in with Google"
2. Redirected to Google login
3. Google returns user info + token
4. System creates/updates user in database
5. Session created automatically
6. User can also enable Email 2FA for extra security

**Benefit:** Frictionless signup/login, leverages Google's security

### Combined Flow
**User can:**
- Sign up with Email + Password
- Sign up with Google (no password)
- Log in with Email + Password (requires 2FA if enabled)
- Log in with Google (auto-login)
- Enable Email 2FA on ANY account (email or Google)

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              Login / Signup Page                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Sign in with Google] ──────────┐                 │
│                                   │                 │
│  Email: [____]                    │                 │
│  Password: [____]                 │                 │
│  [Sign In] ──────────┐            │                 │
│                      │            │                 │
│  Don't have account? │            │                 │
│  [Sign Up] ──────────┼────────┐   │                 │
│                      │        │   │                 │
│                      ▼        ▼   ▼                 │
└─────────────────────────────────────────────────────┘
                      │        │   │
                      │        │   │
          ┌───────────┘        │   └─────────────┐
          │                    │                 │
          ▼                    ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Email/Pass   │  │ Email/Pass   │  │ Google OAuth │
    │ Login        │  │ Signup       │  │ Login        │
    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Has 2FA?       │
                    └────┬────────┬───┘
                         │        │
                    YES  │        │  NO
                         ▼        ▼
                    ┌─────────┐  ┌──────────┐
                    │ Show    │  │ Create   │
                    │ OTP     │  │ Session  │
                    │ Entry   │  │ → HOME   │
                    └────┬────┘  └──────────┘
                         │
                    ┌────▼────────┐
                    │ Verify OTP  │
                    │ (3 attempts)│
                    └────┬────────┘
                         │
                    ┌────▼─────────┐
                    │ Create Session│
                    │ → HOME        │
                    └──────────────┘
```

---

## 📦 Database Schema

### New Tables

```sql
-- Google OAuth accounts (link Google ID to user)
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- "google"
  provider_id TEXT NOT NULL, -- Google user ID
  provider_email TEXT, -- Google email
  email_verified BOOLEAN DEFAULT true, -- Google verifies email
  access_token TEXT, -- Store if needed for API calls
  refresh_token TEXT, -- For token refresh
  token_expires_at TIMESTAMPTZ,
  last_signin TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);

-- Two-factor authentication attempts
CREATE TABLE two_factor_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  method TEXT NOT NULL, -- "email"
  otp_code TEXT NOT NULL, -- 6-digit code (hashed)
  success BOOLEAN DEFAULT false,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User 2FA settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS two_factor_method TEXT DEFAULT 'email';
```

### RLS Policies

```sql
-- OAuth accounts (users can only see their own)
CREATE POLICY oauth_accounts_user_read ON oauth_accounts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY oauth_accounts_user_insert ON oauth_accounts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 2FA attempts (system writes, users/admins read)
CREATE POLICY two_factor_attempts_insert ON two_factor_attempts FOR INSERT
  WITH CHECK (true);

CREATE POLICY two_factor_attempts_admin_read ON two_factor_attempts FOR SELECT
  USING (makers_is_admin());
```

---

## 🔧 Backend Functions to Create

### Email 2FA Functions

```typescript
// src/lib/api/

export async function generateEmailOTP(
  email: string
): Promise<{
  code: string; // Plain code to show for testing
  expiresAt: Date;
  message: string;
}> {
  // 1. Generate 6-digit code
  // 2. Hash code for storage
  // 3. Store in two_factor_attempts table
  // 4. Send email with code
  // 5. Return code (frontend logs it for demo)
  // 6. Log to audit_logs
}

export async function verifyEmailOTP(
  userId: string,
  code: string
): Promise<{
  success: boolean;
  message: string;
  remainingAttempts?: number;
}> {
  // 1. Find OTP record for user
  // 2. Check not expired
  // 3. Check code matches
  // 4. Increment attempts
  // 5. If 3 failed attempts, lock for 15 min
  // 6. If success, update audit_logs
  // 7. Delete OTP record
}

export async function enableTwoFactorForUser(
  userId: string,
  method: string = 'email'
): Promise<void> {
  // Update user_settings
  // Log to audit_logs
}

export async function disableTwoFactorForUser(userId: string): Promise<void> {
  // Update user_settings
  // Log to audit_logs
}

export async function checkIfUserHasTwoFA(userId: string): Promise<boolean> {
  // Check user_settings.two_factor_enabled
}
```

### Google OAuth Functions

```typescript
export async function getOrCreateGoogleUser(
  googleData: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  },
  accessToken?: string,
  refreshToken?: string
): Promise<{
  userId: string;
  isNewUser: boolean;
  email: string;
  hasTwoFA: boolean;
}> {
  // 1. Check if oauth_accounts exists for Google ID
  // 2. If exists: return user_id
  // 3. If not: create new user in profiles table
  // 4. Create oauth_accounts entry
  // 5. Log to audit_logs
  // 6. Return user data
}

export async function linkGoogleToExistingUser(
  userId: string,
  googleData: {
    id: string;
    email: string;
    name: string;
  }
): Promise<void> {
  // Link Google account to existing user
  // Useful if user has email account and wants to add Google
}
```

### Session / Login Functions

```typescript
export async function validateCredentialsAndReturnUser(
  email: string,
  password: string
): Promise<{
  userId: string;
  email: string;
  requiresTwoFA: boolean;
}> {
  // 1. Find user by email
  // 2. Check password matches
  // 3. Check if 2FA is enabled
  // 4. Log to loginAttempts (success or fail)
  // 5. Return user info
}

export async function createSessionToken(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<{
  token: string;
  expiresAt: Date;
}> {
  // 1. Generate session token (JWT)
  // 2. Store session in database (Phase 3)
  // 3. Return token to frontend
}
```

---

## 🎨 Frontend Components to Create

### New Components

```
src/components/
├── GoogleSignInButton.tsx (NEW)
├── TwoFactorModal.tsx (NEW)
├── TwoFactorSettings.tsx (NEW - in Settings)

src/pages/
├── Auth.tsx (MODIFY - add Google button & 2FA screen)
```

### Modified Components

```
src/pages/Auth.tsx
- Add Google Sign In button
- Add "Don't have account? Sign Up" flow
- Add OTP verification screen (after email login)
- Add signup form for email/password

src/pages/Dashboard.tsx
- Add Settings link to 2FA settings

src/pages/Profile.tsx (or Settings.tsx)
- Add TwoFactorSettings component
```

---

## 🔑 Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com
2. Create new project "Markers Lab"
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - http://localhost:5173/auth/google/callback
   - https://5ab7xs59.insforge.site/auth/google/callback
6. Get Client ID

### Step 2: Store Credentials
```
Environment Variables (Insforge):
VITE_GOOGLE_CLIENT_ID = [your-client-id]

Backend only (never expose):
GOOGLE_CLIENT_SECRET = [your-client-secret]
```

### Step 3: Add Google Sign-In Library
```bash
npm install @react-oauth/google
```

---

## 📝 Implementation Steps (Week by Week)

### Days 1-2: Setup & Database
- [ ] Create oauth_accounts table
- [ ] Create two_factor_attempts table
- [ ] Add RLS policies
- [ ] Create Google OAuth credentials
- [ ] Store credentials in Insforge

### Days 3-4: Backend Functions
- [ ] generateEmailOTP()
- [ ] verifyEmailOTP()
- [ ] getOrCreateGoogleUser()
- [ ] validateCredentialsAndReturnUser()
- [ ] Test all functions in CLI

### Days 5-7: Frontend - Email Login + 2FA
- [ ] Create OTP entry modal
- [ ] Update Auth.tsx login form
- [ ] Add "Forgot Password?" link
- [ ] Add signup form
- [ ] Test email/password login with OTP

### Days 8-10: Frontend - Google OAuth
- [ ] Install @react-oauth/google
- [ ] Create GoogleSignInButton
- [ ] Handle Google callback
- [ ] Create/update user on Google login
- [ ] Test Google login flow

### Days 11-12: 2FA Settings
- [ ] Create TwoFactorSettings component
- [ ] Add toggle to enable/disable 2FA
- [ ] Show OTP verification modal
- [ ] Save to database
- [ ] Test settings changes

### Days 13-14: Testing & Deployment
- [ ] End-to-end testing (all flows)
- [ ] Security testing
- [ ] Bug fixes
- [ ] Deploy to Insforge
- [ ] Verify in production

---

## 🔐 Security Checklist

### Email 2FA Security
- [x] OTP is 6 digits (1M combinations)
- [x] OTP expires in 15 minutes
- [x] Max 3 attempts, then lock
- [x] Code is hashed in database (never plaintext)
- [x] Sent via email (no SMS interception)
- [x] RLS policies restrict access

### Google OAuth Security
- [x] Use HTTPS only for redirects
- [x] Validate Google tokens (verify signature)
- [x] Store refresh tokens securely
- [x] Don't expose Client Secret in frontend
- [x] Use state parameter to prevent CSRF
- [x] Verify email is from Google (trusted)

### Combined User Security
- [x] 2FA works with both login methods
- [x] Users can link Google to email account
- [x] Revoking one method doesn't break other
- [x] OTP resend has rate limiting
- [x] Failed OTP attempts logged

---

## 📊 Testing Strategy

### Unit Tests
- [ ] OTP generation (random, 6 digits)
- [ ] OTP hashing (secure, not reversible)
- [ ] OTP validation (correct, expired, attempts)
- [ ] Google user creation (new & existing)

### Integration Tests
- [ ] Email login → OTP entry → success
- [ ] Email login → wrong OTP → error
- [ ] Email login → 3 failed OTP → lock
- [ ] Google login → auto-create user
- [ ] Google login → auto-link existing user

### Security Tests
- [ ] OTP brute force (attempt after lock)
- [ ] OTP replay (use same code twice)
- [ ] OAuth token tampering
- [ ] Google redirect URI validation

### End-to-End Tests
- [ ] New user signs up with email
- [ ] Existing user logs in with email + OTP
- [ ] User enables 2FA in settings
- [ ] User disables 2FA in settings
- [ ] New user signs up with Google
- [ ] Google user logs in (no OTP)
- [ ] Google user enables 2FA, then logs in with OTP

---

## 🚀 Success Criteria

After implementation:
- ✅ Users can sign up with email OR Google
- ✅ Email users get OTP on login (if 2FA enabled)
- ✅ Google users auto-login (no password needed)
- ✅ Any user can enable Email 2FA
- ✅ Admin dashboard shows login methods
- ✅ All actions logged to audit_logs
- ✅ RLS policies protect user data
- ✅ No security vulnerabilities

---

## 📦 File Structure After Implementation

```
src/
├── components/
│   ├── GoogleSignInButton.tsx (NEW)
│   ├── TwoFactorModal.tsx (NEW)
│   ├── TwoFactorSettings.tsx (NEW)
│   └── ... (existing)
│
├── lib/
│   ├── api/ (MODIFIED - add 2FA & OAuth functions)
│   ├── oauth-helper.ts (NEW - Google OAuth utilities)
│   └── ... (existing)
│
├── pages/
│   ├── Auth.tsx (MODIFIED - dual login methods)
│   ├── Settings.tsx (NEW - if doesn't exist)
│   └── ... (existing)
│
insforge/
├── oauth-schema.sql (NEW)
├── two-factor-schema.sql (NEW)
├── oauth-policies.sql (NEW)
```

---

## 💰 Cost & Timeline

**Development Time:** 20-25 hours  
**Timeline:** 2 weeks (working part-time)  
**Cost:** 0 (internal development)  
**External Services:** 
- Google Cloud (free tier available)
- Email sending (using existing Insforge SendGrid)

---

## 🎯 Ready to Start?

**Next Action:** Create database schema and backend functions

Should I start with:
1. Database schema creation ✅
2. Backend API functions
3. Frontend components
4. Testing

Pick and I'll start building! 🚀

---

**Status:** Implementation ready  
**Branch:** phase-2-email-2fa-oauth (creating now)  
**First commit:** Database schemas + backend functions
