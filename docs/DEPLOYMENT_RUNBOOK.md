# Markers Lab - Deployment Runbook

Complete guide for deploying, maintaining, and troubleshooting the Markers Lab full-stack application on InsForge.

## Quick Start Deployment

```bash
# 1. Build the frontend
npm run build

# 2. Deploy to InsForge
npx @insforge/cli deployments deploy . -y

# 3. Commit changes to GitHub
git add -A
git commit -m "chore: deploy [describe changes]"
git push origin main
```

## Live URLs

| Component | URL |
|-----------|-----|
| **Frontend (Hosted)** | https://5ab7xs59.insforge.site |
| **Backend API** | https://5ab7xs59.us-east.insforge.app |
| **Edge Functions** | https://5ab7xs59.functions.insforge.app |
| **GitHub Repository** | https://github.com/BRIGHTEDUFUL/Markers-lab |

## Full-Stack Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ InsForge Project (cd196d17-52da-45b1-b5a3-b79819e6bef5)   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────────────┐  ┌──────────────────┐                │
│ │ Frontend (React) │  │ PostgreSQL DB    │                │
│ │ Vite SPA         │  │ 13 Tables        │                │
│ │ PWA              │  │ 11.25 MB         │                │
│ │ @insforge.site   │  │ RLS Enabled      │                │
│ └──────────────────┘  └──────────────────┘                │
│          ↓                     ↓                           │
│ ┌──────────────────┐  ┌──────────────────┐                │
│ │ Auth (OAuth)     │  │ Storage (Public) │                │
│ │ GitHub, Google   │  │ makers-lab bucket│                │
│ │ Email Verification   │ Team photos      │                │
│ └──────────────────┘  └──────────────────┘                │
│                                                             │
│ ┌──────────────────┐  ┌──────────────────┐                │
│ │ Edge Functions   │  │ AI Integration   │                │
│ │ send-project-    │  │ 6 Models         │                │
│ │ submission-email │  │ Claude, GPT-4o   │                │
│ └──────────────────┘  └──────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Tables (13)
- **profiles** — User accounts (4 records)
- **projects** — Project submissions (5 records)
- **submission_notifications** — Email tracking (4 records)
- **audit_logs** — Compliance logging
- **email_verifications** — OTP & verification
- **password_resets** — Reset token tracking
- **login_attempts** — Brute force protection
- **oauth_accounts** — OAuth provider links
- **user_settings** — User preferences
- **admin_notes** — Admin annotations
- **testimonials** — User testimonials
- **messages** — Messaging/notifications
- **project_files** — File references

### RLS Policies

All tables are protected with Row-Level Security (RLS):
- **profiles** — Users see own profile; admins see all
- **projects** — Creators see own; approved visible to public; admins see all
- **submission_notifications** — Users see own; admins see all
- **audit_logs** — Admins only; full record preservation

## Deployment Tasks

### 1. Before Deploying
```bash
# Verify authentication
npx @insforge/cli whoami
npx @insforge/cli current

# Check backend status
npx @insforge/cli metadata --json

# Verify functions
npx @insforge/cli functions list

# Lint and build
npm run lint
npm run build
```

### 2. Deploy Frontend
```bash
# Standard deployment
npx @insforge/cli deployments deploy . -y

# Check deployment status
npx @insforge/cli deployments list
npx @insforge/cli deployments status <deployment-id> --sync
```

### 3. Deploy Edge Functions
```bash
# Deploy/update specific function
npx @insforge/cli functions deploy send-project-submission-email -y

# View function code
npx @insforge/cli functions code send-project-submission-email

# Invoke for testing
npx @insforge/cli functions invoke send-project-submission-email --data '{"test": true}' --method POST
```

### 4. Manage Secrets
```bash
# List all secrets
npx @insforge/cli secrets list

# Add environment variable
npx @insforge/cli secrets add RESEND_API_KEY "sk-..."
npx @insforge/cli secrets add OFFICIAL_FROM_EMAIL "noreply@markerslab.com"

# Update secret value
npx @insforge/cli secrets update KEY --value "new-value"

# Delete secret (soft delete)
npx @insforge/cli secrets delete KEY

# Restore deleted secret
npx @insforge/cli secrets update KEY --active true
```

### 5. Database Operations
```bash
# Export schema and data backup
npx @insforge/cli db export --json

# Run SQL query
npx @insforge/cli db query "SELECT COUNT(*) FROM public.profiles"

# Promote user to admin
npx @insforge/cli db query "UPDATE public.profiles SET role = 'ADMIN' WHERE email = 'user@example.com'"

# View RLS policies
npx @insforge/cli db policies

# Check indexes
npx @insforge/cli db indexes
```

### 6. Logs & Monitoring
```bash
# View main backend logs
npx @insforge/cli logs insforge.logs --limit 50

# View database logs
npx @insforge/cli logs postgres.logs --limit 20

# View function execution logs
npx @insforge/cli logs function.logs --limit 30

# Run health diagnostics
npx @insforge/cli diagnose

# Check database health
npx @insforge/cli diagnose db --check all

# View performance metrics
npx @insforge/cli diagnose metrics --range 24h
```

### 7. Storage Management
```bash
# List buckets
npx @insforge/cli storage buckets

# List objects in bucket
npx @insforge/cli storage list-objects makers-lab

# Upload file
npx @insforge/cli storage upload ./public/team/photo.png --bucket makers-lab

# Download file
npx @insforge/cli storage download team/photo.png --bucket makers-lab --output ./photo.png
```

## Common Tasks

### Add New User
1. User signs up via GitHub/Google OAuth
2. `profiles` table auto-creates record
3. To promote to admin:
   ```sql
   UPDATE public.profiles SET role = 'ADMIN' WHERE email = 'user@example.com';
   ```

### Approve Project Submission
1. Check `projects` table (status = pending)
2. Admin reviews via `/admin` dashboard
3. Update status to `approved`
4. Email notification sent to creator

### Send Bulk Email
Use edge function endpoint:
```bash
curl -X POST https://5ab7xs59.functions.insforge.app/send-project-submission-email \
  -H "Content-Type: application/json" \
  -d '{
    "projectTitle": "My Project",
    "creatorName": "John Doe",
    "creatorEmail": "john@example.com",
    "submittedAt": "2026-04-12T23:00:00Z"
  }'
```

### Backup Database
```bash
# Full backup
npx @insforge/cli db export > backup-$(date +%Y%m%d).sql

# Restore from backup
npx @insforge/cli db import backup-20260412.sql -y
```

### Update Environment Variables
1. For functions: `npx @insforge/cli secrets add KEY value`
2. For frontend: Update `.env` and redeploy
3. For Compute: `npx @insforge/cli compute update <id> --env '{"KEY":"val"}'`

## Rollback Procedure

### Frontend Rollback
```bash
# List recent deployments
npx @insforge/cli deployments list | head -10

# Check status of previous deployment
npx @insforge/cli deployments status <previous-deployment-id>

# Redeploy from previous git commit
git log --oneline | head -5
git checkout <commit-hash>
npx @insforge/cli deployments deploy . -y
```

### Database Rollback
```bash
# Restore from backup
npx @insforge/cli db import backup-20260412.sql -y

# Or run specific migration rollback
npx @insforge/cli db import insforge/migrations/2026-04-11_rls_policy_cleanup_rollback.sql -y
```

## Monitoring & Health Checks

### Automated Checks (Daily)
1. **Build Pipeline**: `npm run lint && npm run build`
2. **Database Health**: `npx @insforge/cli diagnose db`
3. **Function Status**: `npx @insforge/cli functions list | grep active`
4. **Deployment Status**: `npx @insforge/cli deployments list | head -1`

### Performance Baselines
| Metric | Target | Current |
|--------|--------|---------|
| Frontend Bundle Size | < 1.2 MB | 1.18 MB |
| Database Query Time | < 100ms | ~50ms |
| Function Execution | < 5s | ~2s |
| PageSpeed Score | > 80 | 87 |

### Alert Conditions
- ❌ Lint errors: Stop deployment
- ❌ Build failure: Check `npm run build`
- ❌ DB connection errors: Check `npx @insforge/cli diagnose db`
- ❌ Function failures: Check `npx @insforge/cli logs function.logs`
- ❌ High error rate: Check `npx @insforge/cli diagnose advisor`

## Security Best Practices

1. **Secrets Management**
   - Never commit `.env` files
   - Store secrets in InsForge: `npx @insforge/cli secrets add`
   - Rotate keys quarterly

2. **Database Security**
   - RLS enabled on all tables
   - Admin-only audit logging
   - Email verification enforced

3. **Frontend Security**
   - CORS configured for InsForge API only
   - Cache-Control headers optimized
   - CSP (Content Security Policy) recommended

4. **Access Control**
   - OAuth only (GitHub, Google)
   - Admin role limited to core team
   - Audit logs all admin actions

## Troubleshooting

### "INVALID_INPUT" on db import
- Files may already be imported; safe to ignore
- Check: `npx @insforge/cli db tables`

### Deployment status stuck
- Cancel and retry: `npx @insforge/cli deployments cancel <id>`
- Git commit hash must change for new deployment

### Functions returning 500
- Check secrets: `npx @insforge/cli secrets list`
- View logs: `npx @insforge/cli logs function-deploy.logs`
- Verify RESEND_API_KEY is set

### High database load
- Check slow queries: `npx @insforge/cli diagnose db --check slow-queries`
- View slow query logs: `npx @insforge/cli logs postgres.logs`
- Add indexes if needed: Run `insforge/performance-indexes.sql`

## Support & Resources

- **InsForge Docs**: https://insforge.dev/docs
- **GitHub Issues**: https://github.com/BRIGHTEDUFUL/Markers-lab/issues
- **InsForge Dashboard**: https://app.insforge.dev
- **CLI Help**: `npx @insforge/cli --help`

---

**Last Updated**: April 12, 2026  
**Version**: 1.0.0  
**Maintainer**: @BRIGHTEDUFUL
