# Contributing to Markers Lab

Thank you for your interest in contributing! This guide outlines the process for contributing code, reporting issues, and proposing features.

## Code of Conduct

Be respectful, inclusive, and professional. Discrimination, harassment, or abusive behavior is not tolerated.

## Getting Started

### Fork & Clone
```bash
git clone https://github.com/BRIGHTEDUFUL/Markers-lab.git
cd Markers-lab
npm install
```

### Set Up InsForge
```bash
# Link to your project
npx @insforge/cli link --project-id <your-project-id>

# Verify connection
npx @insforge/cli current
```

### Start Development
```bash
npm run dev
# App runs at http://localhost:5173
```

## Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feat/your-feature-name
```

### 2. Commit Guidelines
Use conventional commits:
```
feat: Add user profile page
fix: Resolve auth token expiry bug
docs: Update deployment runbook
style: Format BottomNav component
refactor: Simplify database queries
test: Add integration tests for email
chore: Update dependencies
```

### 3. Before Submitting
```bash
# Run linter
npm run lint

# Build for production
npm run build

# Commit
git commit -m "feat: Describe your change"
git push origin feat/your-feature-name
```

## Pull Request Process

1. **Create PR** on GitHub with clear title & description
2. **Link related issues** (e.g., "Closes #42")
3. **Describe changes** - what & why
4. **Request review** from @BRIGHTEDUFUL
5. **Address feedback** - update code and re-request review
6. **Merge** once approved

### PR Template
```markdown
## Description
Brief summary of what you implemented

## Related Issues
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How you tested the change

## Screenshots (if UI change)
[Optional images showing before/after]
```

## Development Standards

### Code Quality
- **TypeScript**: No `any` types; use explicit types
- **Linting**: `npm run lint` must pass
- **Testing**: Unit tests for util functions; E2E for flows
- **Components**: Use React 19 + Suspense where applicable

### Performance
- **Bundle Size**: Monitor with `npm run build`
- **Image Optimization**: Use `<LazyImage>` component
- **Database Queries**: Keep to < 100ms response time

### Security
- **Secrets**: Use InsForge vault, never hardcode
- **RLS**: All database changes require RLS policy
- **Auth**: OAuth only; no password storage

### Accessibility
- **ARIA Labels**: All interactive elements labeled
- **Keyboard Navigation**: All UI navigable via keyboard
- **Color Contrast**: WCAG AA standard minimum

## Large Changes

### Database Schema Changes
1. Create migration in `insforge/migrations/`
2. Name: `2026-04-12_feature_description.sql`
3. Use `CREATE TABLE IF NOT EXISTS` for safety
4. Include RLS policies
5. Test with `npx @insforge/cli db import <file>`
6. Document in PR with schema diagram

###  New Edge Functions
1. Create in `insforge/functions/my-function/`
2. Implement in `index.ts`
3. Deploy with `npx @insforge/cli functions deploy my-function -y`
4. Document in DEPLOYMENT_RUNBOOK.md
5. Add error handling & logging

### Breaking Changes
1. Propose in GitHub discussion first
2. Get approval from maintainers
3. Create major version release notes
4. Provide migration guide

## Common Tasks

### Add New Page
```bash
# Create component in src/pages/NewPage.tsx
# Add route in src/App.tsx
# Add nav item in src/components/BottomNav.tsx
# Test at http://localhost:5173/newpage
```

### Update Database Table
```bash
# Create migration: insforge/migrations/YYYY-MM-DD_description.sql
# Apply: npx @insforge/cli db import migration.sql

# Example:
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
CREATE INDEX idx_projects_featured ON public.projects(featured) WHERE featured = true;
```

### Deploy to Production
```bash
npm run build
npx @insforge/cli deployments deploy . -y
git add -A && git commit -m "chore: deploy [feature]"
git push origin main
```

## Getting Help

- **Discord**: [Join community server](#) (if available)
- **GitHub Issues**: Report bugs or request features
- **Email**: nhanakwameotto@gmail.com
- **Discussions**: Use GitHub Discussions tab for ideas

## Recognition

Contributors will be recognized in:
- README.md: Contributors section
- GitHub: Commit attribution
- Releases: Acknowledged in release notes

## Resources

- [React 19 Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [InsForge Docs](https://insforge.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Thank you for contributing to Markers Lab! 🎉**
