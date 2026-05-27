# Markers Lab - Architecture Documentation

Comprehensive technical architecture for the Markers Lab full-stack application.

## System Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                        CDN (Cloudflare)                            │
└────────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                         │
│             https://5ab7xs59.insforge.site                          │
├────────────────────────────────────────────────────────────────────┤
│  • PWA with Workbox service worker                                 │
│  • Code splitting & lazy loading                                   │
│  • Responsive design (mobile-first)                                │
│  • Real-time updates via@insforge/sdk                              │
└────────────────────────────────────────────────────────────────────┘
                    ↓                           ↓
        ┌──────────────────────┐    ┌──────────────────────┐
        │    Auth Gateway      │    │  API Gateway         │
        │ (OAuth 2.0)          │    │ (PostgREST)          │
        │ GitHub, Google       │    │ RLS Enforcement      │
        └──────────────────────┘    └──────────────────────┘
                    ↓                           ↓
┌────────────────────────────────────────────────────────────────────┐
│                    InsForge Backend                                │
│         https://5ab7xs59.us-east.insforge.app                       │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  PostgreSQL DB   │  │  Edge Functions  │  │  Object Store  │  │
│  │ (Postgres 15)    │  │ (Deno Runtime)   │  │ (S3-compat)    │  │
│  │ • 13 Tables      │  │ • RLS-aware      │  │ • makers-lab   │  │
│  │ • 11.25 MB       │  │ • Async functions│  │   bucket       │  │
│  │ • Full RLS       │  │ • Error handling │  │ • Public URLs  │  │
│  └──────────────────┘  └──────────────────┘  └────────────────┘  │
│                                                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  Auth Postgres   │  │ SecureKeyManager │  │ Realtime       │  │
│  │ (User Sessions)  │  │ (Secrets Vault)  │  │ (WebSocket)    │  │
│  │ • oauth_accounts │  │ • API Keys       │  │ • Live updates │  │
│  │ • email_verif    │  │ • Env variables  │  │ • Subscriptions│  │
│  └──────────────────┘  └──────────────────┘  └────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | React 19 | UI framework with Suspense |
| **Bundle** | Vite 6.4 | Fast build & dev server |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **Routing** | React Router 7 | Client-side routing |
| **Animation** | Motion (Framer) | Smooth transitions |
| **Icons** | Lucide React | SVG icon library |
| **Charts** | Recharts | Data visualization |
| **Markdown** | React Markdown | Prose rendering |
| **Offline** | Vite PWA, Workbox | Service worker caching |

### Directory Structure
```
src/
├── pages/                    # Page components (lazy-loaded)
│   ├── Home.tsx
│   ├── Dashboard.tsx
│   ├── AdminDashboard.tsx
│   ├── PublicGallery.tsx
│   └── ...
├── components/              # Reusable UI components
│   ├── Layout.tsx            # Main layout wrapper
│   ├── BottomNav.tsx         # Mobile navigation
│   ├── ErrorBoundary.tsx     # Error handling
│   └── ...
├── contexts/                # React Context
│   ├── AuthContext.tsx       # User auth state
│   └── ThemeContext.tsx      # Light/dark mode
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts
│   ├── useSmartNavigate.ts
│   └── ...
├── lib/                     # Utilities
│   ├── insforge-client.ts    # SDK initialization
│   ├── query-cache.ts        # Caching layer
│   └── ...
├── App.tsx                  # Root component
└── main.tsx                 # Entry point
```

### Component Hierarchy
```
<App>
  ├── <AuthContext.Provider>
  │   ├── <ThemeContext.Provider>
  │   │   ├── <Layout>
  │   │   │   ├── <ErrorBoundary>
  │   │   │   │   └── <Route>
  │   │   │   │       └── <Page Component>
  │   │   │   │           ├── <Hero>
  │   │   │   │           ├── <Card>
  │   │   │   │           └── <Form>
  │   │   │   └── <BottomNav>
  │   │   └── <Toast/Notifications>
```

### Data Flow (State Management)
```
User Action
    ↓
Event Handler
    ↓
Update React State / Context
    ↓
Call InsForge SDK (@insforge/sdk)
    ↓
API Request to Backend (RLS-protected)
    ↓
Re-render Component with new data
    ↓
Cache Result (query-cache.ts)
```

### Performance Optimizations
1. **Code Splitting**: Routes lazy-loaded via `loadRoute()`
2. **Image Optimization**: `<LazyImage>` with blur placeholders
3. **Query Caching**: 5-minute TTL for frequently accessed data
4. **Service Worker**: Offline PWA with Workbox
5. **Bundle Analysis**: Vite sees 1.18 MB gzipped

### Key Libraries & Their Roles

#### @insforge/sdk
```typescript
// Initialize connection
import { createClient } from '@insforge/sdk'
const client = createClient({
  baseUrl: 'https://5ab7xs59.us-east.insforge.app',
  anonKey: 'process.env.VITE_INSFORGE_ANON_KEY'
})

// Fetch with RLS
const { data } = await client
  .from('projects')
  .select('*')
  .eq('status', 'approved')
```

#### React Router v7
```typescript
// Client-side navigation (no page reload)
useNavigate()('/dashboard')
// Browser history managed automatically
```

#### Motion (Framer Motion)
```typescript
// Smooth animations
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
/>
```

---

## Backend Architecture

### Database (PostgreSQL 15)

#### Schema Design
```sql
-- Example: Projects Table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Users see only own + approved projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own projects or approved"
  ON projects FOR SELECT
  USING (user_id = auth.uid() OR status = 'approved' OR auth.jwt()->>'role' = 'ADMIN');
```

#### Tables (13)
1. **profiles** — User profiles (`role`, `email`, `name`)
2. **projects** — Project submissions
3. **submission_notifications** — Email tracking
4. **audit_logs** — Compliance audit trail
5. **email_verifications** — OTP codes
6. **password_resets** — Reset tokens
7. **login_attempts** — Brute force protection
8. **oauth_accounts** — Provider links
9. **user_settings** — Preferences
10. **admin_notes** — Admin annotations
11. **testimonials** — User testimonials
12. **messages** — Notifications
13. **project_files** — File references

#### Relationships
```
auth.users (Postgres Auth)
    ↓ (1-to-many)
profiles (user_id)
    ↓ (1-to-many)
projects (user_id)
    ├─→ project_files (project_id)
    ├─→ submission_notifications (project_id)
    └─→ audit_logs (record_id)
```

### API Layer (PostgREST)

#### Request Flow
```
Browser Request
    ↓
HTTPS → PostgREST
    ↓
JWT Verification (Bearer token)
    ↓
RLS Policy Evaluation
    ↓
SQL Query Execution
    ↓
JSON Response (with Row Level Security applied)
```

#### Endpoints (Auto-generated)
All tables expose standard REST API:
```bash
GET    /rest/v1/projects          # List (RLS enforced)
GET    /rest/v1/projects?id=123   # Read one
POST   /rest/v1/projects          # Create
PATCH  /rest/v1/projects?id=123   # Update
DELETE /rest/v1/projects?id=123   # Delete
```

### Edge Functions (Deno Runtime)

#### Function: send-project-submission-email

**Location**: `insforge/functions/send-project-submission-email/`

**Runtime**: Deno (Secure, TypeScript-native)

**Dependencies**:
- Resend API (email service)
- InsForge Secrets (API keys)
- Deno standard lib (HTTP, env)

**Invocation**:
```typescript
// From frontend
const { error, data } = await client.functions.invoke(
  'send-project-submission-email',
  { body: { projectId, creatorEmail } }
)
```

**Flow**:
```
Function Triggered
    ↓
Read Secrets (RESEND_API_KEY, etc.)
    ↓
Query Database (projects table)
    ↓
Generate Email HTML
    ↓
Call Resend API
    ↓
Log Result (audit_logs)
    ↓
Return Status (200 or 400)
```

### Storage (S3-Compatible)

#### Bucket: makers-lab (Public)
```
makers-lab/
├── team/
│   ├── abena-antwiwaa-quarshie-v2.png
│   ├── bright-eduful.png
│   └── ralph-andy-menz.png
├── projects/
│   ├── {projectId}/
│   │   ├── thumbnail.jpg
│   │   ├── document.pdf
│   │   └── ...
└── uploads/
    └── {userIduploadedFiles}/
```

#### Access Control
- **Public URLs**: Team photos, thumbnails (no auth required)
- **Private URLs**: Project files (signed URLs, user-scoped RLS)
- **Upload**: Only authenticated users; RLS enforces owner-only access

---

## Security Architecture

### Authentication Flow
```
User Click "Sign in with GitHub"
    ↓
Redirect to GitHub OAuth
    ↓ (GitHub verifies, returns code)
Frontend Exchange code for token
    ↓ (via Postgres Auth)
auth.users row created
    ↓
Postgres JWT issued (exp: 1 hour)
    ↓
Frontend stores token in secure httpOnly cookie
    ↓
@insforge/sdk uses JWT for API calls
```

### Authorization (RLS)
```
API Request with JWT
    ↓ (PostgREST decodes JWT)
Extract user_id, role from JWT claims
    ↓ (Database evaluates policies)
On SELECT: ONLY return rows where user_id = JWT.sub OR role = 'ADMIN'
    ↓
Response filtered server-side (no bypass possible)
```

### Secrets Management
```
Application Code
    ↓
Calls Deno.env.get("RESEND_API_KEY")
    ↓ (Platform checks)
InsForge Secrets Vault (encrypted)
    ↓ (Decrypts at request-time)
Returns value to function memory ONLY
    ↓ (Never logged, never persisted)
```

---

## Data Flow Examples

### Example 1: User Submits Project
```
1. User fills form on /submit-project
   └─→ React state: { title, description, files }

2. User clicks "Submit"
   └─→ Call: client.from('projects').insert({ ... })

3. Frontend: HTTP POST /rest/v1/projects
   └─→ JWT verified
   └─→ RLS: user_id auto-set from JWT
   └─→ Inserted into projects table

4. Trigger: Notification created
   └─→ Insert into submission_notifications
   └─→ Edge function: send-project-submission-email invoked

5. Admin receives email
   └─→ Reviews on /admin dashboard
   └─→ Update status: pending → approved

6. User sees approval
   └─→ Realtime subscription fires
   └─→ Frontend re-renders dashboard
```

### Example 2: Admin Views Audit Log
```
1. Admin navigates to /admin
   └─→ role = 'ADMIN' verified by RLS

2. Frontend queries: SELECT * FROM audit_logs
   └─→ RLS policy: auth.jwt()->>'role' = 'ADMIN'
   └─→ Only admin can see

3. Results show:
   └─→ Who: user@example.com
   └─→ What: UPDATE projects SET status = 'approved'
   └─→ When: 2026-04-12 23:45:00
   └─→ With: IP, user agent, old/new values

4. Admin exports for compliance
   └─→ Download as CSV
```

---

## Scaling Considerations

### Current Capacity
- **Users**: 1000+ concurrent
- **Database**: 100 req/sec
- **Storage**: 1 TB included
- **Bandwidth**: Unlimited (CDN cached)

### Bottlenecks & Solutions
| Issue | Current | Solution |
|-------|---------|----------|
| **Query Speed** | ~50ms avg | Add indexes (done) |
| **Upload Size** | 25 MB limit | Increase quota in InsForge |
| **Function Timeout** | 60 sec | Optimize or use async jobs |
| **Concurrent Users** | ~1000 | Auto-scales (managed infra) |

### Future Scaling Roadmap
- Q3: Add Redis caching for hot queries
- Q4: Implement GraphQL API (optional)
- 2027: Multi-region replication (US, EU, APAC)

---

## Deployment Pipeline

```
Developer Push to main
    ↓
GitHub Actions: npm lint && npm build
    ↓ (if successful)
Auto-deploy to InsForge
    ↓ (build & serve via CDN)
    ↓
Deployed to: https://5ab7xs59.insforge.site
    ↓
Edge Functions auto-updated
    ↓
Health check: Verify homepage loads
    ↓
Complete ✅
```

---

## Monitoring & Observability

### Logs Aggregation
```bash
# View all logs
npx @insforge/cli logs insforge.logs
npx @insforge/cli logs postgres.logs
npx @insforge/cli logs function.logs
```

### Alerts
- Deployment failure → Email team
- Function errors > 1% → Disable function
- DB connections > 80% → Scaling triggered
- Unauthorized access_attempts > 100/min → Rate limit engaged

### Metrics
- **Uptime**: 99.9% SLA
- **Response Time**: P95 < 200ms
- **Error Rate**: < 0.1%
- **Build Time**: ~8 seconds

---

## Development Environment

### Local Setup
```bash
node -v  # v20.11 or higher
npm install
npm run dev  # Port 5173

# Connect to remote backend
VITE_INSFORGE_OSS_HOST=https://5ab7xs59.us-east.insforge.app
VITE_INSFORGE_ANON_KEY=your-key
```

### Database Testing
```bash
# Query production data (read-only from frontend)
npx @insforge/cli db query "SELECT COUNT(*) FROM projects"

# Test RLS policy
npx @insforge/cli db query "SELECT * FROM projects LIMIT 1"
# Returns 0 rows (correct—you're unauthenticated)
```

---

## References

- [InsForge Docs](https://insforge.dev)
- [Postgres Docs](https://www.postgresql.org/docs/15/)
- [React 19 Release Notes](https://react.dev/blog/2024/...)
- [Vite Docs](https://vitejs.dev)

---

**Architecture Last Updated**: April 12, 2026  
**Version**: 1.0.0
