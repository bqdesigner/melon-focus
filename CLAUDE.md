# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Project documentation:** The canonical reference for vision, architecture, data model, modules, phases, and how to run the app is **[README.md](./README.md)**. Prefer README for product and ops context; keep this file for agent-oriented commands and constraints.

@AGENTS.md

## Commands

```bash
# Dev
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run lint         # ESLint

# Tests
npm run test                                    # All unit/integration tests (Vitest)
npm run test:watch                              # Watch mode
npx vitest tests/unit/focus-engine.test.ts     # Single unit test
npm run test:e2e                                # E2E tests (Playwright, needs running server)
npx playwright test tests/e2e/example.spec.ts  # Single E2E test

# Database
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:migrate   # Run migrations
npm run db:push      # Push schema without migration (dev only)
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

## Environment

Copy `.env.example` → `.env.local`. Required vars:

```
DATABASE_URL=postgresql://user:password@localhost:5432/melon_focus?schema=public
AUTH_SECRET=<generate with: npx auth secret>
AUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

## Architecture

Melon Focus is a productivity app for personalized focus sessions (Pomodoro, Deep Work, Flowtime, Custom) linked to objectives, with metrics and insights.

### Request flow

1. `src/middleware.ts` — NextAuth guards all routes except `/`, `/login`, `/register`, `/api/auth`
2. `src/app/api/` — API routes call services
3. `src/services/` — Business logic (focus-config, focus-session, metrics, objective, user)
4. `src/lib/db.ts` — Prisma singleton → PostgreSQL

### Key modules

- **`src/lib/focus-engine.ts`** — Pure timer logic, no React, no side effects. Designed to run in a Web Worker. Emits events: `tick`, `interval_complete`, `phase_change`, `session_complete`.
- **`src/stores/`** — Zustand stores wire `FocusEngine` to React UI.
- **`src/lib/auth.ts`** — Full NextAuth config (JWT, Prisma adapter, Credentials + Google). `auth.config.ts` is the Edge-safe subset.
- **`src/lib/validators/`** — Zod schemas for all API inputs (auth, focus-config, focus-session, objective).

### Database (Prisma)

Client is generated to `src/generated/prisma/` — import from there, not `@prisma/client`.

Core models: `User` → `Objective`, `FocusConfig` → `FocusSession` → `FocusInterval`. All cascade-delete on user deletion. `Tag` links to both objectives and sessions.

### UI

- Tailwind CSS 4 with CSS variables
- shadcn/ui components in `src/components/ui/`
- Path alias: `@/*` → `src/*`

## Important constraints

- **Zod**: use v3 API only — v4 is incompatible with `eslint-config-next` in this project.
- **Prisma imports**: always from `@/generated/prisma`, never `@prisma/client`.
- **Auth split**: edge-compatible logic goes in `auth.config.ts`; Node.js-only (bcrypt, Prisma adapter) stays in `auth.ts`.
