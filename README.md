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

Build static assets with `npm run build` and host `dist/` on any static host (configure SPA fallback to `index.html`). Ensure production origins are allowed for InsForge auth and CORS as required by your InsForge project settings.
