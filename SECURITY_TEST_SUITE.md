# 🧪 Security Test Suite - Phase 1 Validation

## Prerequisites
- [ ] RLS policies deployed to Insforge (use `RLS_POLICIES_DASHBOARD.sql`)
- [ ] All 5 security tables created
- [ ] Frontend built and running
- [ ] Backend functions integrated

---

## Test 1: Password Reset Tracking ✅

**Steps:**
1. Go to Auth page → "Forgot Password"
2. Enter test email: `security-test@example.com`
3. Submit request

**Expected Results:**
```sql
-- Query in Insforge Dashboard
SELECT * FROM password_resets 
WHERE email = 'security-test@example.com' 
ORDER BY created_at DESC LIMIT 1;

-- Should see:
-- id: [UUID]
-- user_id: NULL (before clicking email link)
-- email: security-test@example.com
-- token_hash: [hashed]
-- used: false
-- expires_at: NOW() + 1 hour
-- ip_address: [your-ip]
-- user_agent: [your-browser]
```

**✓ Pass:** Entry exists with correct email, 1-hour expiry, IP/browser logged  
**✗ Fail:** No entry, incorrect expiry, missing IP/browser

---

## Test 2: Email Verification Tracking ✅

**Steps:**
1. Go to Auth page → "Sign Up"
2. Create account with: `verify-test@example.com`
3. Enter OTP when prompted

**Expected Results:**
```sql
-- Query: Check OTP verification attempt logged
SELECT id, user_id, verified, attempts, created_at 
FROM email_verifications 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'verify-test@example.com')
ORDER BY created_at DESC LIMIT 1;

-- Should see:
-- id: [UUID]
-- verified: true (after successful OTP)
-- attempts: 1 (or count of failed attempts before success)
-- created_at: [timestamp]
```

**Check in Admin Dashboard:**
- User's `email_verified` flag should be true in profiles table

**✓ Pass:** Verification tracked, attempts counted, email marked verified  
**✗ Fail:** No entry, incorrect attempt count, email not verified

---

## Test 3: Login Attempt Tracking ✅

**Steps:**
1. Go to Auth → Login
2. Try invalid credentials: `test@example.com` / `wrongpassword`
3. Then login with correct credentials

**Expected Results:**
```sql
-- Query: See all login attempts
SELECT email, success, failed_reason, ip_address, created_at 
FROM login_attempts 
WHERE email = 'test@example.com'
ORDER BY created_at DESC;

-- Should see:
-- Row 1: success=false, failed_reason='Invalid credentials', ip=[yours]
-- Row 2: success=true, failed_reason=NULL, ip=[yours]
```

**In Admin Console:**
- Security → Login Attempts tab shows both attempts
- Can click to see full details (IP, browser, device info)

**✓ Pass:** Both attempts logged, success/fail tracked, IP logging works  
**✗ Fail:** Missing attempts, incorrect success flag, no IP logged

---

## Test 4: Brute Force Detection ✅

**Steps:**
1. Try 15 failed login attempts from same IP
2. Check Admin Dashboard security alerts

**Expected Results:**
```sql
-- Query: Check brute force activity
SELECT ip_address, COUNT(*) as failure_count, MAX(created_at) as last_attempt
FROM login_attempts 
WHERE success = false 
GROUP BY ip_address 
ORDER BY failure_count DESC;

-- Should see your IP with 15 failures
```

**In Admin Console:**
- Security → Alerts tab shows CRITICAL severity
- Display: "192.168.x.x: 15 failed attempts in last 15 minutes"
- Color-coded: CRITICAL (red)

**✓ Pass:** Attack detected, severity correct, alert displayed  
**✗ Fail:** No alert, wrong severity, false positives

---

## Test 5: Audit Logging ✅

**Steps:**
1. Admin: Approve a pending project
2. Admin: Reject another project
3. Check audit logs

**Expected Results:**
```sql
-- Query: View admin actions
SELECT action, table_name, record_id, old_values, new_values, status, created_at
FROM audit_logs 
WHERE action IN ('project_approved', 'project_rejected')
ORDER BY created_at DESC LIMIT 2;

-- Should see:
-- action: 'project_approved'
-- table_name: 'projects'
-- old_values: {"status": "PENDING"}
-- new_values: {"status": "APPROVED"}
-- status: 'success'
```

**✓ Pass:** Actions logged, old/new values captured, timestamps correct  
**✗ Fail:** Missing logs, no JSONB snapshots, incorrect status

---

## Test 6: User Settings Persistence ✅

**Steps:**
1. Go to Dashboard → Settings
2. Change theme to "light"
3. Toggle email notifications OFF
4. Save

**Expected Results:**
```sql
-- Query: Check user settings saved
SELECT user_id, theme, email_notifications, updated_at
FROM user_settings 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'your-email@example.com');

-- Should see:
-- theme: 'light'
-- email_notifications: false
-- updated_at: [recent timestamp]
```

**✓ Pass:** Settings saved correctly, can be retrieved  
**✗ Fail:** Settings not persisted, defaults returned, timestamp old

---

## Test 7: RLS Enforcement ✅

**Steps:**
1. User A: Create a project (status=PENDING)
2. User B: Try to access that project via API

**Expected Results (if RLS working):**
```sql
-- Query as User B should return NO ROWS:
SELECT * FROM projects 
WHERE id = 'user-a-project-id' 
AND (status = 'APPROVED' OR user_id = auth.uid());

-- Should return: 0 rows (access denied by RLS)
```

**✗ Fail:** User B can see User A's pending project (RLS not enforced)

---

## Test 8: Admin Visibility ✅

**Steps:**
1. Admin user: Try to query login_attempts
2. Regular user: Try to query login_attempts

**Expected Results:**
```sql
-- Admin query: Should return rows
SELECT COUNT(*) FROM login_attempts;
-- Result: [number > 0]

-- Regular user query: Should return 0 (RLS blocks)
SELECT COUNT(*) FROM login_attempts;
-- Result: 0 (access denied)
```

**✓ Pass:** Admin sees data, regular users blocked  
**✗ Fail:** Regular users see data (RLS bypass)

---

## Quick Health Check Script

Run this in Insforge Dashboard SQL Editor to verify everything:

```sql
-- Check all security tables exist
SELECT COUNT(*)::int as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('password_resets','email_verifications','login_attempts','audit_logs','user_settings')
AND table_type = 'BASE TABLE';
-- Expected: 5

-- Check RLS is enabled on all 10 tables
SELECT COUNT(*)::int as rls_enabled_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND row_security_enabled = true;
-- Expected: 10 (or close to it)

-- Check function exists
SELECT COUNT(*)::int as function_count
FROM pg_proc 
WHERE proname = 'makers_is_admin' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
-- Expected: 1

-- Sample data verification
SELECT 
  (SELECT COUNT(*) FROM password_resets) as password_resets_count,
  (SELECT COUNT(*) FROM email_verifications) as email_verifications_count,
  (SELECT COUNT(*) FROM login_attempts) as login_attempts_count,
  (SELECT COUNT(*) FROM audit_logs) as audit_logs_count,
  (SELECT COUNT(*) FROM user_settings) as user_settings_count;
```

---

## Troubleshooting Guide

### Issue: "Database error when resetting password"
**Cause:** Function not deployed or RLS policy blocking insert  
**Fix:** Deploy `makers_is_admin()` function, check password_resets INSERT policy allows anonymous

### Issue: "Admin Dashboard shows no login attempts"
**Cause:** Data not being tracked or RLS blocking SELECT  
**Fix:** Check trackLoginAttempt() is called, verify login_attempts SELECT policy allows admins

### Issue: "User can see other users' projects"
**Cause:** RLS policy incorrect or not applied  
**Fix:** Re-deploy projects RLS policy, ensure status=APPROVED check works

### Issue: "Audit logs show no entries"
**Cause:** logAuditEvent() not being called or INSERT policy blocking  
**Fix:** Verify logAuditEvent() in Auth.tsx, check audit_logs INSERT policy

---

## Success Criteria

✅ All 8 tests pass → Phase 1 is production-ready  
✅ Security dashboard shows real data → Monitoring works  
✅ No unauthorized data access → RLS enforced  
✅ All admin actions logged → Compliance met

---

**Estimated Time: 30 minutes**  
**Last Updated: April 10, 2026**
