# Maker’s Lab

Project management PWA backed by [InsForge](https://insforge.dev): Postgres, auth, storage, and row-level security. The UI is a React (Vite) SPA that talks to InsForge with `@insforge/sdk`.

## Features

- User dashboard: submit and track projects; file uploads to InsForge storage.
- Admin console: projects, users, testimonials, analytics (requires `ADMIN` in `public.profiles`).
- Public gallery: featured projects and approved testimonials.
- PWA: installable with offline shell (Vite PWA plugin).

## Prerequisites

- Node.js 20+
- An InsForge project linked to this repo (`npx @insforge/cli link --project-id <uuid>`).
- Database tables and storage bucket provisioned (see `insforge/bootstrap.sql` and InsForge CLI docs).

## Setup

1. Clone and install:

   ```bash
   git clone https://github.com/BRIGHTEDUFUL/Marker-Lab-.git
   cd Marker-Lab-
   npm install
   ```

2. Environment — copy `.env.example` to `.env` and set:

   - `VITE_INSFORGE_OSS_HOST` — e.g. `https://<appkey>.<region>.insforge.app`
   - `VITE_INSFORGE_ANON_KEY` — from `npx @insforge/cli current --json`
   - `VITE_HERO_RING_IMAGE_URL` — backend/public URL for the hero background image (optional)
   - `VITE_HERO_RING_IMAGE_VERSION` — increment when image changes (forces fresh image instead of stale cache)

3. Run the dev server (port 3000):

   ```bash
   npm run dev
   ```

4. **Admin role:** after your first sign-in (so a `profiles` row exists), promote yourself in Postgres, e.g.:

   ```sql
   UPDATE public.profiles SET role = 'ADMIN' WHERE email = 'you@example.com';
   ```

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Vite dev server          |
| `npm run build`| Production build → `dist`|
| `npm run preview` / `start` | Preview production build |
| `npm run lint` | `tsc --noEmit`           |

## Deployment

**Hosted on InsForge** — frontend and backend fully integrated.

- **🌐 Live App**: https://5ab7xs59.insforge.site
- **📡 Backend API**: https://5ab7xs59.us-east.insforge.app
- **⚡ Edge Functions**: https://5ab7xs59.functions.insforge.app
- **📊 InsForge Dashboard**: https://app.insforge.dev

### Quick Deploy
```bash
npm run build
npx @insforge/cli deployments deploy . -y
```

For comprehensive deployment instructions, see [DEPLOYMENT_RUNBOOK.md](docs/DEPLOYMENT_RUNBOOK.md).
For security details, see [SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md).

## Documentation

Detailed documentation has been moved to the [`docs/`](docs/) directory:

- [Architecture](docs/ARCHITECTURE.md) — system architecture overview
- [Backend API Reference](docs/BACKEND_API_REFERENCE.md) — PostgREST API endpoints
- [Backend Architecture](docs/BACKEND_ARCHITECTURE.md) — backend design decisions
- [Backend Audit](docs/BACKEND_AUDIT.md) — backend security audit
- [Backend Implementation](docs/BACKEND_IMPLEMENTATION.md) — implementation details
- [Backend Setup Guide](docs/BACKEND_SETUP_GUIDE.md) — backend setup instructions
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) — deployment walkthrough
- [Deployment Runbook](docs/DEPLOYMENT_RUNBOOK.md) — operational runbook
- [Security Audit](docs/SECURITY_AUDIT.md) — security assessment
- [Project Summary](docs/PROJECT_SUMMARY.md) — project overview and status

## Team Image Convention

- Store team photos under `public/team/`.
- Use kebab-case full-name filenames for consistency, e.g. `abena-antwiwaa-quarshie.png`.
- Reference team photos by a single canonical path across pages to avoid drift.
