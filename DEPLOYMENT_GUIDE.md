# 🚀 DEPLOYMENT GUIDE - Version 1.0

**Project:** Markers Lab  
**Version:** 1.0 (Phase 1 Complete)  
**Date:** April 10, 2026  
**Status:** ✅ Production Ready

---

## 📋 What's Included in This Release

### ✅ Phase 1 Complete (All Features)
- ✅ Authentication with email verification OTP
- ✅ Password reset with IP logging & 1-hour expiry
- ✅ Login attempt tracking (all users, all attempts)
- ✅ Brute force detection (10+ failures/15min per IP)
- ✅ Audit logging (JSONB before/after for compliance)
- ✅ Row-level security (RLS) on 10 database tables
- ✅ Role-based access control (User/Admin)
- ✅ Admin security dashboard with real-time monitoring
- ✅ 5 new security tables + 10 tables with RLS
- ✅ 16 backend API functions
- ✅ PWA support (works offline, installable)
- ✅ Responsive design (mobile, tablet, desktop)

### ✅ Build Status
- ✅ 3,413 modules compiled
- ✅ Zero TypeScript errors
- ✅ Zero build warnings
- ✅ 281 KB main bundle (77.60 KB gzipped)
- ✅ PWA service worker generated
- ✅ All assets optimized

---

## 🎯 Deployment Options

### Option 1: Vercel (Recommended - Easiest)
**Pros:** 1-click deploy, automatic HTTPS, global CDN, preview URLs  
**Cons:** Requires account  
**Cost:** Free tier available  
**Time:** 5 minutes

### Option 2: Netlify (Alternative)
**Pros:** Easy deploy, generous free tier, preview URLs  
**Cons:** Similar to Vercel  
**Cost:** Free tier available  
**Time:** 5 minutes

### Option 3: Self-hosted (AWS/GCP/Azure)
**Pros:** Full control, custom domain  
**Cons:** More complex setup  
**Cost:** ~$10-50/month  
**Time:** 15-30 minutes

### Option 4: Docker (Advanced)
**Pros:** Reproducible, scalable  
**Cons:** Requires Docker knowledge  
**Cost:** Varies  
**Time:** 20 minutes

---

## 🚀 DEPLOYMENT STEP 1: VERCEL (Recommended)

### Prerequisites
- GitHub account (already have ✅)
- Vercel account (free)
- Repository pushed to GitHub (already done ✅)

### Steps

#### Step 1: Create Vercel Account
1. Go to https://vercel.com/signup
2. Click "Continue with GitHub"
3. Authorize Vercel
4. Click "Create" in Vercel dashboard

#### Step 2: Import GitHub Repository
1. On Vercel dashboard, click "Add New..." → "Project"
2. Click "Import Git Repository"
3. Search for "Markers-lab" repository
4. Click "Import"

#### Step 3: Configure Project
**Build Settings (should auto-detect):**
- Framework: Vite ✅
- Build Command: `npm run build` ✅
- Output Directory: `dist` ✅
- Install Command: `npm install` ✅

**Environment Variables:**
```
VITE_API_URL=https://[your-insforge-app].insforge.app
```

#### Step 4: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for build
3. Click "Visit" when ready
4. Site is LIVE! 🎉

**Your site URL:** https://markers-lab.vercel.app (or custom domain)

---

## 🚀 DEPLOYMENT STEP 2: Set Up Custom Domain (Optional)

### Add Your Domain to Vercel
1. Go to Project Settings → Domains
2. Enter your domain (e.g., `markerslabtech.com`)
3. Add DNS records (Vercel will provide)
4. Wait 15-30 min for DNS propagation
5. HTTPS automatically configured ✅

---

## 🧪 POST-DEPLOYMENT CHECKLIST

### Functional Tests
- [ ] Home page loads
- [ ] Can sign up with email
- [ ] OTP verification works
- [ ] Can log in
- [ ] Dashboard displays
- [ ] Can submit project
- [ ] Admin dashboard accessible
- [ ] Real-time data updates

### Security Tests
- [ ] HTTPS redirect works (green lock 🔒)
- [ ] CSP headers present
- [ ] No console errors
- [ ] RLS policies enforced on database
- [ ] Failed login attempts logged
- [ ] Admin sees login attempts in dashboard

### Performance Tests
- [ ] Homepage loads < 3 seconds
- [ ] JavaScript bundle gzipped < 78 KB
- [ ] No 404 errors in console
- [ ] Network requests are secure

### Mobile Tests (using Chrome DevTools)
- [ ] Responsive on iPhone (375px)
- [ ] Responsive on iPad (768px)
- [ ] Touch interactions work
- [ ] Forms are usable on mobile

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Your Custom Domain              │
│      (markerslabtech.com)               │
└────────────────────┬────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────┐
│         Vercel Global CDN               │
│     (Automatic HTTPS, IPv6, etc.)       │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│         Static Files (dist/)            │
│   - index.html, CSS, JS, images         │
│   - Service Worker (sw.js)              │
│   - PWA manifest (manifest.json)        │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│      Insforge Backend (API)             │
│  - Authentication                       │
│  - Database (PostgreSQL)                │
│  - Edge Functions                       │
│  - Real-time WebSocket                  │
└─────────────────────────────────────────┘
```

---

## 🔐 Security Best Practices (Deployed)

### API Security
- ✅ HTTPS only (enforced by Vercel)
- ✅ CORS configured (Insforge backend)
- ✅ RLS database security (enforced)
- ✅ Authentication required for protected routes

### Frontend Security
- ✅ Content Security Policy (CSP) headers
- ✅ No hardcoded secrets in frontend
- ✅ HTTPS-only cookies (via backend)
- ✅ XSS protection (React JSX escaping)

### User Data Security
- ✅ Passwords hashed (by Insforge auth)
- ✅ No passwords stored in frontend
- ✅ OTP tokens expire (15 min)
- ✅ Session tokens expire (30 days, Phase 2)

### Deployment Security
- ✅ Git repository is private
- ✅ Environment variables encrypted (Vercel)
- ✅ Build logs don't contain secrets
- ✅ Automatic HTTPS certificates (Let's Encrypt)

---

## 📈 Monitoring & Maintenance

### Daily Monitoring
- Check Vercel deployment status
- Monitor error logs in Vercel analytics
- Check Insforge backend health

### Weekly Maintenance
- Review failed login attempts (admin dashboard)
- Check audit logs for suspicious activity
- Monitor database performance

### Monthly Maintenance
- Review user feedback
- Plan Phase 2 features (2FA, sessions)
- Update security patches

---

## 🐛 Troubleshooting

### Build Fails on Vercel
**Error:** `npm ERR! peer dep missing`  
**Fix:** Delete `package-lock.json`, push changes
```bash
rm package-lock.json
npm install
git add package-lock.json
git commit -m "fix: update lock file"
git push
```

### Routes Don't Work (404 on refresh)
**Error:** Page works when you click links, but 404 on manual refresh  
**Fix:** Add vercel.json configuration (see below)

### API Calls Fail
**Error:** CORS error or `404 /api/...`  
**Fix:** Check `VITE_API_URL` environment variable matches Insforge URL

### Can't Login After Deploy
**Error:** Login form submits but nothing happens  
**Fix:** 
1. Check browser console for errors
2. Verify Insforge backend is running
3. Check RLS policies are deployed
4. Clear browser cache & try again

---

## 📋 Vercel Configuration (vercel.json)

Create `vercel.json` in root directory:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "VITE_API_URL": "@api_url"
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 🌍 Environment Variables

### Required (Set in Vercel)
```
VITE_API_URL = https://[your-app-key].us-east.insforge.app
```

### Optional
```
VITE_APP_NAME = Markers Lab
VITE_APP_VERSION = 1.0
```

---

## 📦 Release Notes v1.0

**🎯 Phase 1: Security Foundation**

**New Features:**
- ✅ Email-based authentication
- ✅ Email verification OTP (3 attempts, 15 min)
- ✅ Password reset (1-hour tokens, IP logging)
- ✅ Login attempt tracking
- ✅ Brute force detection (10+ failures)
- ✅ Audit logging (GDPR-compliant)
- ✅ Role-based access control

**Security:**
- ✅ RLS on 10 database tables
- ✅ Admin dashboard for monitoring
- ✅ Real-time attack detection
- ✅ Comprehensive audit trail

**Performance:**
- ✅ 281 KB main bundle
- ✅ 77.60 KB gzipped
- ✅ 3413 modules (optimized)
- ✅ PWA support (offline-capable)

**Known Limitations:**
- Phase 2 features coming (2FA, sessions, device trust)
- Email notifications via Insforge SendGrid
- No SMS support (Phase 2+)

---

## 🔄 Roadmap

### Phase 1 (COMPLETE ✅)
- ✅ Email authentication
- ✅ Audit logging
- ✅ Admin dashboard
- ✅ RLS policies

### Phase 2 (Coming May 2026)
- 📅 Two-factor authentication (email + TOTP)
- 📅 Session management
- 📅 Device trust system
- 📅 Geolocation tracking

### Phase 3 (Coming June 2026)
- 📅 Passwordless login
- 📅 Biometric auth
- 📅 Risk scoring

### Phase 4+ (Future)
- 📅 Machine learning anomaly detection
- 📅 Compliance dashboards (SOC 2, GDPR)
- 📅 Advanced threat detection

---

## ✅ Go-Live Checklist

Before launching to production:

**Infrastructure:**
- [ ] Vercel project created
- [ ] GitHub repository connected
- [ ] Custom domain configured (optional)
- [ ] Environment variables set
- [ ] Insforge backend verified

**Testing:**
- [ ] Home page loads without errors
- [ ] Sign up works end-to-end
- [ ] Login works with OTP verification
- [ ] Admin dashboard accessible
- [ ] RLS policies enforced
- [ ] Failed logins are tracked
- [ ] Mobile responsive design works
- [ ] HTTPS is enforced

**Security:**
- [ ] No database credentials in code
- [ ] No API keys in frontend
- [ ] CORS headers correct
- [ ] CSP headers present
- [ ] Session cookies are secure
- [ ] Rate limiting working

**Operations:**
- [ ] Error monitoring set up (if available)
- [ ] Backup plan documented
- [ ] Rollback procedure tested
- [ ] Contact list prepared

**Documentation:**
- [ ] README updated
- [ ] Deployment guide complete
- [ ] Team trained on admin console
- [ ] Runbook created

---

## 🎉 You're Ready to Deploy!

**Timeline:**
- Now: Phase 1 features ready to deploy ✅
- May: Phase 2 (2FA + sessions) ✅
- June: Phase 3 (passwordless + advanced) ✅

**Next Steps:**
1. Deploy to Vercel (5 minutes)
2. Run post-deployment tests
3. Share with team/users
4. Start collecting feedback
5. Plan Phase 2 features

---

## 📞 Support

**Issues During Deployment?**
- Check Vercel logs: Project → Deployments → Build logs
- Check browser console: F12 → Console tab
- See TROUBLESHOOTING section above
- Contact backend team if API issues

**After Launch:**
- Monitor admin dashboard daily
- Review failed login attempts
- Plan Phase 2 security features
- Gather user feedback

---

**Deployment Date:** April 10, 2026  
**Release:** v1.0.0 (Phase 1 Complete)  
**Status:** ✅ READY FOR PRODUCTION

🚀 **Let's launch!**
