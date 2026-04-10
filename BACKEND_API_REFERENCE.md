# 🔧 Developer Quick Reference - Backend Functions

**Quick lookup for all 16 new backend functions**

---

## 🔐 Password Reset Functions

### `trackPasswordResetRequest(userId, email, options?)`
**Purpose**: Log password reset request after email sent

```typescript
import { trackPasswordResetRequest } from "../lib/makers-data";

// After Insforge sends reset email
await trackPasswordResetRequest(user.id, email, {
  ipAddress: "192.168.1.1",
  userAgent: navigator.userAgent
});

// Database: Logs to password_resets table
// {
//   user_id: uuid,
//   email: text,
//   token_hash: text,
//   used: false,
//   expires_at: timestamp (NOW() + 1 hour),
//   ip_address: text,
//   user_agent: text
// }
```

**Use Case**: 
- Rate limiting checks (max 3 requests/hour)
- Geographic anomaly detection
- Failed reset email tracking

---

### `completePasswordReset(userId)`
**Purpose**: Mark password reset as used after successful change

```typescript
import { completePasswordReset } from "../lib/makers-data";

// After insforge.auth.updateUser({ password })
await completePasswordReset(userId);

// Database: Updates password_resets table
// SET used = true, completed_at = NOW()
// WHERE user_id = ? AND used = false
// LIMIT 1 (only most recent)
```

**Use Case**:
- Prevent token reuse attacks
- Mark completion for audit trail
- Enable success logging

---

### `getRecentPasswordResets(userId, minutes = 60)`
**Purpose**: Query recent reset attempts for rate limiting

```typescript
import { getRecentPasswordResets } from "../lib/makers-data";

// Check rate limit before allowing new request
const attempts = await getRecentPasswordResets(userId, 60);

if (attempts.length > 3) {
  setError("Too many reset requests. Try again in 1 hour.");
  return;
}

// Database query returns last N attempts in given timeframe
```

**Use Case**:
- Prevent password reset spam
- Enforce rate limits
- Log excessive attempts

**Returns**: `Array<{id: string}>`

---

## 🚨 Login & Brute Force Functions

### `trackLoginAttempt(email, success, options?)`
**Purpose**: Log every login attempt (success and failure)

```typescript
import { trackLoginAttempt } from "../lib/makers-data";

// On login success
await trackLoginAttempt(email, true, {
  userId: user.id,
  ipAddress: "192.168.1.1",
  userAgent: navigator.userAgent
});

// On login failure
await trackLoginAttempt(email, false, {
  ipAddress: "192.168.1.1",
  userAgent: navigator.userAgent,
  failedReason: "Invalid credentials",
  deviceFingerprint: "Chrome/Linux"
});

// Database: Inserts into login_attempts
// {
//   email: text,
//   user_id: uuid (nullable),
//   success: boolean,
//   failed_reason: text,
//   ip_address: text,
//   user_agent: text,
//   device_fingerprint: text
// }
```

**Use Case**:
- Brute force detection
- Geographic anomaly detection
- Account takeover prevention
- Compliance audit trail

---

### `checkBruteForceAttempts(ipAddress, minutes = 15)`
**Purpose**: Detect ongoing brute force attacks from IP

```typescript
import { checkBruteForceAttempts } from "../lib/makers-data";

// Check for brute force activity
const failedAttempts = await checkBruteForceAttempts(clientIp, 15);

if (failedAttempts > 10) {
  // BLOCK this IP for security
  setError("Too many failed attempts. Try again in 30 minutes.");
  // Send admin alert
  return;
}

// Database query:
// SELECT COUNT(*) FROM login_attempts
// WHERE ip_address = ? AND success = false
// AND created_at > NOW() - INTERVAL '15 minutes'
```

**Use Case**:
- Real-time brute force detection
- IP-based rate limiting
- Admin alerts for attacks
- Automatic IP blocking

**Returns**: `number` (count of failures)

---

## 📊 Audit Logging Functions

### `logAuditEvent(action, tableName, recordId?, options?)`
**Purpose**: Track all critical admin actions and events

```typescript
import { logAuditEvent } from "../lib/makers-data";

// Example 1: Admin rejects project
await logAuditEvent("project_rejected", "projects", projectId, {
  userId: adminId,
  oldValues: { status: "PENDING" },
  newValues: { status: "REJECTED" },
  ipAddress: request.ip,
  userAgent: navigator.userAgent,
  status: "success"
});

// Example 2: Registration failed
await logAuditEvent("registration_failed", "auth", null, {
  status: "failed",
  errorMessage: "Email already exists"
});

// Example 3: Password reset
await logAuditEvent("password_reset_success", "auth", userId, {
  userId,
  status: "success"
});

// Database: Inserts into audit_logs
// {
//   user_id: uuid,
//   action: text,
//   table_name: text,
//   record_id: uuid,
//   old_values: jsonb,
//   new_values: jsonb,
//   ip_address: text,
//   user_agent: text,
//   status: text,
//   error_message: text
// }
```

**Common Actions**:
```
AUTH:
  - registration_success
  - registration_failed
  - login_success  
  - login_failed
  - password_reset_success
  - password_reset_failed
  - email_verified
  - forgot_password_failed

ADMIN:
  - project_approved
  - project_rejected
  - user_role_changed
  - user_deleted
  - admin_note_created
```

**Use Case**:
- GDPR compliance audit trail
- Security investigation
- Change tracking with before/after
- Admin accountability

---

## 👤 User Settings Functions

### `fetchUserSettings(userId)`
**Purpose**: Get user preferences and configuration

```typescript
import { fetchUserSettings } from "../lib/makers-data";

const settings = await fetchUserSettings(userId);

// Returns:
// {
//   userId: string,
//   theme: 'light' | 'dark',
//   emailNotifications: boolean,
//   marketingEmails: boolean,
//   twoFactorEnabled: boolean,
//   twoFactorMethod: string | null,
//   privacyLevel: 'public' | 'private',
//   bio: string | null
// }

// Display user preferences
if (settings.theme === 'light') {
  applyLightTheme();
}
```

**Returns**: Settings object with defaults

---

### `updateUserSettings(userId, patch)`
**Purpose**: Update user preferences

```typescript
import { updateUserSettings } from "../lib/makers-data";

// Update multiple settings
await updateUserSettings(userId, {
  theme: "light",
  emailNotifications: false,
  marketingEmails: false,
  twoFactorEnabled: true,
  twoFactorMethod: "totp",
  privacyLevel: "public",
  bio: "I build cool stuff"
});

// Update single setting
await updateUserSettings(userId, {
  theme: "dark"
});

// Database: Upserts user_settings
// Creates row if not exists, updates if does
```

**Use Case**:
- User preference persistence
- Theme switching
- Notification opt-in/out
- 2FA configuration
- Privacy settings

---

## ✉️ Email Verification Functions

### `markEmailAsVerified(userId)`
**Purpose**: Mark email as verified after OTP validation

```typescript
import { markEmailAsVerified } from "../lib/makers-data";

// After successful email OTP verification
await markEmailAsVerified(userId);

// Database:
// UPDATE profiles SET email_verified = true WHERE id = ?

// Later check:
const profile = await fetchSessionUser(); // Returns with email_verified flag
```

**Use Case**:
- Mark email as confirmed after OTP check
- GDPR compliance (verified users)
- Newsletter qualification
- Communication preferences

---

## 👨‍💼 Admin Monitoring Functions

### `adminGetRecentLoginAttempts(limit = 100)`
**Purpose**: Get recent login attempts for security monitoring

```typescript
import { adminGetRecentLoginAttempts } from "../lib/makers-data";

// Admin dashboard: security monitoring
const attempts = await adminGetRecentLoginAttempts(100);

// Returns array of:
// [{
//   email: string,
//   success: boolean,
//   ip_address: string,
//   user_agent: string,
//   created_at: timestamp,
//   ...
// }]

// Display suspicious activity
const failures = attempts.filter(a => !a.success);

failures.forEach(attempt => {
  if (countByIp(attempt.ip_address) > 10) {
    alertAdmin(`Brute force from ${attempt.ip_address}`);
  }
});
```

**Use Case**:
- Real-time security dashboard
- Brute force detection
- Geographic anomaly alerts
- Account takeover prevention

**Returns**: `Array<LoginAttemptRecord>`

---

### `adminGetAuditLogs(options?)`
**Purpose**: Query audit logs for compliance and investigation

```typescript
import { adminGetAuditLogs } from "../lib/makers-data";

// Get password reset attempts
const resets = await adminGetAuditLogs({
  action: "password_reset",
  limit: 500
});

// Get all changes by specific user
const userChanges = await adminGetAuditLogs({
  userId: "user-id-123",
  limit: 1000
});

// Get admin actions
const adminActions = await adminGetAuditLogs({
  action: "project_approved",
  limit: 100
});

// Export all logs for GDPR
const allLogs = await adminGetAuditLogs({
  limit: 10000
});

// Database query returns:
// [{
//   id: uuid,
//   user_id: uuid,
//   action: string,
//   table_name: string,
//   record_id: uuid,
//   old_values: jsonb,
//   new_values: jsonb,
//   ip_address: string,
//   status: string,
//   created_at: timestamp
// }]
```

**Use Case**:
- GDPR data export
- Compliance audits
- Forensics investigation
- Change tracking
- User activity history

**Returns**: `Array<AuditLogRecord>`

---

## 📱 Implementation Patterns

### Pattern 1: Track Login
```typescript
// Successful login
try {
  const { data, error } = await insforge.auth.signInWithPassword({ email, password });
  if (error) throw error;
  
  // Success: track attempt
  await trackLoginAttempt(email, true, {
    userId: data.user.id,
    ipAddress: clientIp,
    userAgent: navigator.userAgent
  });
  
  login(user);
  navigate("/dashboard");
} catch (err) {
  // Failure: track attempt
  await trackLoginAttempt(email, false, {
    ipAddress: clientIp,
    userAgent: navigator.userAgent,
    failedReason: err.message
  });
  
  // Check for brute force
  const failures = await checkBruteForceAttempts(clientIp);
  if (failures > 10) {
    setError("Too many attempts. Please try again later.");
  } else {
    setError(err.message);
  }
}
```

### Pattern 2: Password Reset Flow
```typescript
// Step 1: Request reset
async function handleForgotPassword() {
  const { data, error } = await insforge.auth.resetPasswordForEmail(email);
  if (error) {
    await logAuditEvent("forgot_password_failed", "auth", null, {
      errorMessage: error.message
    });
    setError("Failed to send reset email");
    return;
  }
  
  // Track request for rate limiting
  await trackPasswordResetRequest(userId, email, {
    userAgent: navigator.userAgent
  });
  
  setSuccessMessage("Check your email for reset link");
}

// Step 2: Complete reset
async function handleResetPasswordVerify() {
  // Validate
  if (newPassword !== confirmPassword) {
    setError("Passwords don't match");
    return;
  }
  
  // Update password
  const { error } = await insforge.auth.updateUser({
    password: newPassword
  });
  
  if (error) {
    await logAuditEvent("password_reset_failed", "auth", null, {
      errorMessage: error.message
    });
    setError(error.message);
    return;
  }
  
  // Mark complete & verified
  await completePasswordReset(userId);
  await markEmailAsVerified(userId);
  await logAuditEvent("password_reset_success", "auth", userId);
  
  navigate("/login");
}
```

### Pattern 3: Admin Monitoring
```typescript
// Display security dashboard
useEffect(() => {
  const loadSecurityData = async () => {
    // Get recent login attempts
    const attempts = await adminGetRecentLoginAttempts(100);
    
    // Detect suspicious activity
    const ipFailures = new Map();
    attempts
      .filter(a => !a.success)
      .forEach(a => {
        ipFailures.set(a.ip_address, 
          (ipFailures.get(a.ip_address) || 0) + 1);
      });
    
    // Alert on brute force
    const suspicious = Array.from(ipFailures.entries())
      .filter(([ip, count]) => count > 5)
      .map(([ip, count]) => ({ ip, count }));
    
    setSecurityAlerts(suspicious);
  };
  
  loadSecurityData();
  const interval = setInterval(loadSecurityData, 30000); // Refresh every 30s
  
  return () => clearInterval(interval);
}, []);
```

---

## 🎯 Error Handling

```typescript
try {
  await trackLoginAttempt(...);
} catch (err) {
  // Log audit tracking failed, but don't block user
  console.warn("Audit logging failed:", err);
  // Continue - audit is nice-to-have
}

try {
  await checkBruteForceAttempts(...);
} catch (err) {
  // Log error, but allow login to proceed (fail open)
  console.error("Brute force check failed:", err);
  // Don't block user - security check is advisory
}

try {
  await logAuditEvent(...);
} catch (err) {
  // Audit logging should never affect user experience
  console.warn("Audit logging failed:", err);
}
```

---

## 📚 Database Schema Reference

```sql
-- Password Resets
CREATE TABLE password_resets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  email TEXT,
  token_hash TEXT UNIQUE,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Login Attempts  
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users,
  success BOOLEAN DEFAULT false,
  failed_reason TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Settings
CREATE TABLE user_settings (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users,
  theme TEXT DEFAULT 'dark',
  email_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_method TEXT,
  privacy_level TEXT DEFAULT 'private',
  bio TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

**Last Updated**: April 10, 2026  
**Status**: Production Ready ✅
