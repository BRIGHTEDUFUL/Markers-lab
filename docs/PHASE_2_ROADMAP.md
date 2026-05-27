# 🚀 Phase 2 Implementation Roadmap

**Timeline:** 2-3 weeks  
**Complexity:** High (20-40 hours)  
**Dependencies:** Phase 1 must be complete

---

## Phase 2 Overview

**Goal:** Add enterprise-grade authentication security features  
**Components:** 2FA, Session Management, Device Trust, Geographic Tracking  
**Impact:** Prevent account takeover, enable session control, anomaly detection

---

## Phase 2.1: Two-Factor Authentication (2FA)

### 2FA Methods to Support

#### Option A: TOTP (Time-based One-Time Password)
**Libraries:** `speakeasy`, `qrcode`  
**Flow:**
1. User enables 2FA in Settings
2. Generate secret key
3. Show QR code (Google Authenticator, Authy, Microsoft Authenticator)
4. User scans QR code
5. Test code entry to confirm setup

**UI Requirements:**
```
Dashboard → Settings → Security → Two-Factor Authentication
- [Enable 2FA Button]
  ↓
- Show QR code with secret
- [Backup codes: Store safely]
- Enter verification code to confirm
- [2FA is now ACTIVE]
```

**Backend Tasks:**
1. Generate TOTP secret for user
2. Store secret in user_settings.two_factor_secret
3. Verify TOTP code at login
4. Generate/store backup codes (10 one-time codes)
5. Log 2FA setup to audit_logs

**Database Changes:**
```sql
ALTER TABLE user_settings ADD COLUMN two_factor_secret TEXT;
ALTER TABLE user_settings ADD COLUMN backup_codes JSONB;
ALTER TABLE user_settings ADD COLUMN two_factor_verified_at TIMESTAMPTZ;
```

#### Option B: SMS-based 2FA
**Libraries:** `twilio` SDK  
**Flow:**
1. User enters phone number
2. System sends OTP via SMS
3. User enters OTP to verify
4. Number is confirmed

**Requires:** Twilio account + API keys

#### Option C: Email Code
**Flow:**
1. User enters email
2. System sends 6-digit code
3. User enters code

**Simplest to implement** (no external service needed)

### 2FA Implementation Order
1. **Week 1:** Email-based 2FA (simplest, no external dependencies)
2. **Week 2:** TOTP (most popular, better UX)
3. **Week 3:** SMS (requires Twilio) + Backup codes

### Files to Create/Modify

**New Files:**
- `src/components/TwoFactorSetup.tsx` - QR code generation UI
- `src/utils/totp-helper.ts` - TOTP generation/verification
- `src/pages/SecuritySettings.tsx` - 2FA settings page

**Modify:**
- `src/pages/Auth.tsx` - Add 2FA verification screen after password login
- `src/lib/api/` - Add functions (to submodules / barrel exports):
  - `generateTOTPSecret(userId)`
  - `verifyTOTPCode(userId, code)`
  - `generateBackupCodes(userId, count)`
  - `verifyBackupCode(userId, code)`
  - `enableTwoFactor(userId, method)`
  - `disableTwoFactor(userId)`

**Database Functions:**
- `validateCredentialsAndReturnUser(email, password)` - Returns user after password check
- `requireTwoFactorForUser(userId)` - Check if 2FA required
- `recordTwoFactorAttempt(userId, success)` - Track 2FA attempts
- `completeTwoFactorVerification(userId)` - Issue session token

### UI Mockup

```
┌─────────────────────────────────────┐
│ Enable Two-Factor Authentication   │
├─────────────────────────────────────┤
│                                     │
│ 1. Scan QR Code                    │
│    ┌─────────────────────┐         │
│    │  [QR CODE HERE]     │         │
│    └─────────────────────┘         │
│    Use: Google Authenticator       │
│         Authy                      │
│         Microsoft Authenticator    │
│                                     │
│ 2. Enter 6-digit code              │
│    ┌──────────────────────┐        │
│    │ [_][_][_][_][_][_] │        │
│    └──────────────────────┘        │
│                                     │
│ 3. Save backup codes (store safely)│
│    [SHOW BACKUP CODES]             │
│                                     │
│    [Enable 2FA] [CANCEL]           │
└─────────────────────────────────────┘
```

---

## Phase 2.2: Session Management

### Goal: Track and manage user sessions

**Features:**
- User can see all active sessions
- Revoke sessions remotely
- Auto-logout on suspicious activity
- Session timeout enforcement

### Database Schema

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  device_name TEXT,
  device_fingerprint TEXT,
  last_activity TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

### Implementation Tasks

1. **Session Creation**
   - Generate JWT token on successful login + 2FA
   - Calculate expiry (30 days default, configurable per user)
   - Store session record with device fingerprint

2. **Session Validation**
   - Middleware to validate session token
   - Check expiry, active status, IP address
   - Update last_activity timestamp

3. **Device Fingerprinting**
   - Browser name + version
   - OS name + version  
   - Screen resolution
   - Hash all together for comparison

4. **Anomaly Detection**
   - Compare current IP with last 5 sessions
   - If different country/ISP: flag as suspicious
   - If unrealistic travel speed: block access

5. **Session Dashboard**
   - List all active sessions
   - Show device name, last activity, IP, location
   - One-click revoke button
   - Auto-logout option

### Backend Functions to Add

```typescript
export async function createSession(
  userId: string, 
  ipAddress: string, 
  userAgent: string,
  deviceFingerprint?: string
): Promise<SessionToken>

export async function validateSessionToken(token: string): Promise<UserId>

export async function revokeSession(userId: string, sessionId: string): Promise<void>

export async function revokeAllSessions(userId: string): Promise<void>

export async function getActiveSessions(userId: string): Promise<Session[]>

export async function detectAnomalousLogin(
  userId: string, 
  currentIp: string, 
  currentCountry: string
): Promise<{ isAnomalous: boolean, reason?: string }>
```

### UI Implementation

**Dashboard → Sessions**
```
Active Sessions (3)

Current Session (This Browser)
├─ Chrome on macOS
├─ IP: 192.168.1.100
├─ Location: Accra, Ghana
├─ Last active: 5 minutes ago
├─ Created: 3 days ago
└─ [Sign out other sessions]

Other Sessions
├─ Safari on iPhone
│  ├─ IP: 192.168.1.50
│  ├─ Location: Accra, Ghana
│  ├─ Last active: 2 hours ago
│  └─ [Revoke]

├─ Firefox on Windows
│  ├─ IP: 192.168.1.75
│  ├─ Location: Accra, Ghana
│  ├─ Last active: 1 day ago
│  └─ [Revoke]
```

---

## Phase 2.3: Device Trust & Geolocation

### Goal: Track where users log in from, prevent unauthorized access

**Features:**
- Store user device history (browser, OS, device name)
- Geolocate IP addresses (country, city, ISP)
- Block logins from suspicious locations
- Require email confirmation for new device/location

### Libraries

**IP Geolocation:**
- `MaxMind GeoIP2` (paid, most accurate)
- `ip-api.com` (free API)
- `geoip-lite` (local database)

**Device Detection:**
- `ua-parser-js` (parse user agent)

### Implementation

1. **IP Geolocation**
   ```typescript
   const geoData = await getIpGeolocation(ipAddress);
   // Returns: { country, region, city, latitude, longitude, isp }
   ```

2. **Device Fingerprinting**
   ```typescript
   const fingerprint = generateDeviceFingerprint({
     userAgent: navigator.userAgent,
     language: navigator.language,
     platform: navigator.platform,
     screenResolution: `${screen.width}x${screen.height}`
   });
   ```

3. **Trust Storage**
   ```sql
   CREATE TABLE trusted_devices (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     device_fingerprint TEXT NOT NULL,
     device_name TEXT,
     location TEXT,
     ip_address TEXT,
     last_used TIMESTAMPTZ,
     is_trusted BOOLEAN,
     created_at TIMESTAMPTZ
   );
   ```

4. **New Device Detection**
   - On login: Check if device fingerprint is known
   - If new: Send email "New login from [Device] at [Location]"
   - User clicks "Trust this device" → Added to trusted list
   - User clicks "Wasn't me" → Flags as suspicious, revokes session

### Database Schema

```sql
ALTER TABLE sessions ADD COLUMN trusted_device_id UUID REFERENCES trusted_devices(id);
ALTER TABLE login_attempts ADD COLUMN geolocation JSONB;
ALTER TABLE login_attempts ADD COLUMN device_fingerprint TEXT;
```

---

## Phase 2.4: Passwordless Authentication (Bonus)

### Magic Link Login

**Flow:**
1. User enters email on login page
2. System sends email with unique link + 4-digit code
3. User clicks link OR enters code
4. Session created automatically

**Benefits:**
- No password to remember or compromise
- Works on all devices
- Can't be brute forced (1 attempt per email per 5 min)

**Implementation:**
```sql
CREATE TABLE magic_links (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  link_token TEXT NOT NULL UNIQUE,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Simple to add:** Requires email service only (already have)

---

## Phase 2 Implementation Timeline

### Week 1: Email-based 2FA (15 hours)
- [ ] Database schema update
- [ ] TOTP generation (speakeasy)
- [ ] Email OTP verification
- [ ] Auth.tsx update (2FA entry screen)
- [ ] Dashboard 2FA settings UI
- [ ] Backup code generation
- [ ] Testing & documentation

### Week 2: Session Management (15 hours)
- [ ] Sessions table creation
- [ ] JWT token generation
- [ ] Session middleware
- [ ] Session validation on API calls
- [ ] Device fingerprinting
- [ ] Dashboard session browser UI
- [ ] Session revocation flow
- [ ] Testing & documentation

### Week 2.5: Device Trust (8 hours)
- [ ] IP geolocation integration
- [ ] Device fingerprinting storage
- [ ] New device detection email
- [ ] Device trust dashboard
- [ ] Suspicious activity alerts

### Week 3: TOTP & Backup (10 hours)
- [ ] QR code generation (qrcode library)
- [ ] TOTP verification
- [ ] Backup code management UI
- [ ] Recovery procedures
- [ ] Testing with authenticator apps

---

## Phase 2 File Structure

```
src/
├── components/
│   ├── TwoFactorSetup.tsx (NEW)
│   ├── DeviceTrust.tsx (NEW)
│   ├── SessionManager.tsx (NEW)
│   └── SecurityMonitoring.tsx (existing)
│
├── pages/
│   ├── SecuritySettings.tsx (NEW)
│   ├── SessionsDashboard.tsx (NEW)
│   └── Auth.tsx (MODIFY - add 2FA screen)
│
├── lib/
│   ├── api/ (MODIFY - add new functions)
│   ├── totp-helper.ts (NEW)
│   ├── device-fingerprint.ts (NEW)
│   ├── geolocation.ts (NEW)
│   └── session-manager.ts (NEW)
│
└── types.ts (MODIFY - add Session, TrustedDevice)

database/
├── sessions-schema.sql (NEW)
├── device-trust-schema.sql (NEW)
├── session-policies.sql (NEW)
└── device-policies.sql (NEW)
```

---

## Phase 2 Dependencies & Costs

### NPM Packages Needed
```json
{
  "speakeasy": "^2.0.0",
  "qrcode": "^1.5.3",
  "ua-parser-js": "^1.0.36",
  "jwt-decode": "^3.1.2"
}
```

### External Services (Optional)
- **IP Geolocation:** MaxMind GeoIP2 (~$0-120/month depending on volume)
- **Email:** Already have (Insforge/SendGrid)
- **SMS (future):** Twilio (~$0.0075 per SMS)

### Time Estimate
- **Minimum (Email 2FA only):** 10-15 hours
- **Standard (Email 2FA + Sessions):** 25-30 hours
- **Full (Email + TOTP + Sessions + Device Trust):** 40-50 hours

---

## Phase 2 Testing Strategy

### Unit Tests
- [ ] TOTP code generation/verification
- [ ] Device fingerprint generation
- [ ] Session token creation/validation
- [ ] IP geolocation parsing

### Integration Tests
- [ ] Full 2FA setup flow
- [ ] Session creation on login
- [ ] New device detection
- [ ] Session revocation flow

### Security Tests
- [ ] Brute force on TOTP codes
- [ ] Replay attack on tokens
- [ ] Session fixation attempts
- [ ] Geographic anomaly detection

### End-to-End Tests
- [ ] 2FA setup → Login → Verify code
- [ ] Create session → View in dashboard → Revoke
- [ ] New device → Email alert → Trust device

---

## Phase 2 Success Criteria

✅ Users can enable 2FA via email codes  
✅ Users can see all active sessions  
✅ Sessions expire after 30 days (or user logout)  
✅ New devices detected and flagged  
✅ Admin can see all user sessions in dashboard  
✅ Unauthorized attempts blocked  
✅ All changes logged to audit_logs  
✅ GDPR compliant (can export all session data)  

---

## Next Steps After Phase 2

### Phase 3: Advanced Features (Future)
- Machine learning: Anomaly detection model
- Risk scoring: Calculate login risk based on factors
- Behavioral analysis: Learn user patterns
- Geographic policies: Restrict logins by country
- Device approval workflow: Admin approves new devices

### Phase 4: Compliance & Audit
- SOC 2 compliance
- GDPR compliance audit
- Security incident response plan
- Penetration testing

---

## Quick Reference: Which Feature To Build First?

**If you want maximum security ASAP:**
→ Start with Session Management (easier, protects current logins)

**If you want best user experience:**
→ Start with Email 2FA (simple, no new apps needed)

**If you want production-ready:**
→ Do both simultaneously (2FA for authentication, Sessions for account control)

---

**Estimated Total Phase 2 Effort: 30-40 hours**  
**Recommended Pace: 10 hours/week**  
**Target Completion: 3-4 weeks from start of Phase 1**

---

Last Updated: April 10, 2026  
Status: Planning phase complete, ready for implementation
