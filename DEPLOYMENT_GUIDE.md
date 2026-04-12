# Deployment Guide (April 11, 2026)

Project: Markers Lab  
Release: Production Candidate (Admin God Mode + PWA Navigation + Security Stack)

## 1) Current Release Scope

This release includes:
- Full Admin Console with God Mode modules, bulk actions, command palette, and responsive/mobile UX.
- Navigation/back-stack behavior tuned for PWA standalone and mobile usage.
- Updated PWA icons and generated web manifest wiring.
- Security and audit infrastructure connected to InsForge tables and RLS policies.
- Performance optimizations for admin bulk operations and data-table processing.

## 2) Prerequisites

- Node.js 20+ and npm installed.
- Vercel project connected to this repository.
- InsForge project linked and backend schema migrated.
- Required Vercel project secrets created:
  - `vite_insforge_oss_host`
  - `vite_insforge_anon_key`

## 3) Frontend Deployment (Vercel)

Vercel config is already committed in `vercel.json`.

Required runtime env vars (mapped in `vercel.json`):
- `VITE_INSFORGE_OSS_HOST` from `@vite_insforge_oss_host`
- `VITE_INSFORGE_ANON_KEY` from `@vite_insforge_anon_key`

Deploy flow:
1. Push changes to the tracked branch.
2. Trigger Vercel deployment (auto or manual).
3. Verify deployment logs show successful `npm run build`.

## 4) Backend Deployment (InsForge)

Run schema and policy SQL using InsForge CLI or SQL dashboard.

Primary SQL assets:
- `insforge/bootstrap.sql`
- `insforge/tables-critical.sql`
- `insforge/oauth-2fa-schema.sql`
- `insforge/rls-policies.sql`
- `insforge/performance-indexes.sql`
- `insforge/migrations/2026-04-11_rls_policy_cleanup.sql`

Rollback asset:
- `insforge/migrations/2026-04-11_rls_policy_cleanup_rollback.sql`

Optional helper script:
- `deploy.ps1` (initial security table and policy bootstrap helper)

## 5) Production Validation Checklist

Run locally before promoting:
1. `npm install`
2. `npm run lint`
3. `npm run build`

Validate after deploy:
- App loads and routes resolve on refresh.
- Auth sign-in/sign-out works.
- Admin route is protected and visible only to admins.
- God Mode modules load and bulk actions complete successfully.
- PWA manifest and icons load correctly.
- Security monitoring view returns login/audit rows for admin users.

## 6) Post-Deploy Smoke Tests

Functional:
- Submit a project and review from Admin Console.
- Execute one God Mode bulk action and verify DB changes.
- Open entity drill-down from God Mode list.

Security:
- Confirm role restrictions from a non-admin account.
- Confirm RLS behavior on protected tables.
- Confirm audit and login-attempt logging.

Performance:
- Verify Admin Console remains responsive with larger datasets.
- Verify no blocking errors in browser console.

## 7) Troubleshooting

If build fails in Vercel:
- Check environment variable names exactly match:
  - `VITE_INSFORGE_OSS_HOST`
  - `VITE_INSFORGE_ANON_KEY`

If auth/data fails in production:
- Confirm InsForge host and anon key are valid for the target project.
- Confirm schema and RLS SQL were applied to the same target project.
- Confirm admin user role in `profiles.role` is `ADMIN`.

If SPA routes return 404 on refresh:
- Confirm Vercel rewrite to `/index.html` is active in `vercel.json`.

## 8) Release Note

This deployment guide supersedes older Phase 1-only instructions and reflects the current full-stack production state as of April 11, 2026.
