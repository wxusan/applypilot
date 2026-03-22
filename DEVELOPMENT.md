# ApplyPilot — Development Guide

## Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.11+
- A Supabase project (free tier works)

## Quick Start

### 1. Clone & install

```bash
git clone <repo>
cd ApplyPilot
```

### 2. Frontend setup

```bash
cd frontend
cp .env.example .env.local
# Fill in your Supabase keys in .env.local
npm install
npm run dev
```

Frontend runs on **http://localhost:3000**

### 3. Backend setup

```bash
cd backend
cp .env.example .env
# Fill in all required env vars in .env
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs on **http://localhost:8000**

API docs available at: http://localhost:8000/docs (DEBUG mode only)

## Environment Variables

See `frontend/.env.example` and `backend/.env.example` for all required variables.

### Required for basic operation:
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)
- `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` — Backend Supabase access
- `OPENAI_API_KEY` — For AI agents (essay writing, etc.)

### Optional:
- `TELEGRAM_BOT_TOKEN` — For Telegram notifications
- `CLOUDFLARE_R2_*` — For document storage
- `ENCRYPTION_KEY` — For encrypting student credentials
- `SENTRY_DSN` — Error tracking

## Database

The database schema is in `/supabase/`. Run migrations via Supabase CLI:

```bash
supabase db push
```

Seed test data:
```bash
cd backend && python seed.py
```

## Testing

```bash
# Frontend tests
cd frontend && npm test

# Frontend E2E
cd frontend && npm run test:e2e

# Backend tests
cd backend && pytest
```

## Architecture

```
frontend/          Next.js 14 App Router
  app/             Page routes (server components)
  components/      React components
  lib/             Supabase clients, utilities
  hooks/           Custom React hooks

backend/           FastAPI
  api/             HTTP route handlers
  agents/          AI agents (writer, browser, email, etc.)
  core/            Auth, DB, config, encryption
  services/        Telegram bot, scheduler, R2 storage
  models/          Pydantic models
```

## Key Concepts

- **Multi-tenancy**: Every DB query is scoped to `agency_id` from JWT. Never from request body.
- **AI Agents**: Autonomous agents run in background, send Telegram approval requests to staff.
- **Auth**: Supabase Auth + row-level security. Server components use service role (bypasses RLS).

## Common Issues

**"Agency not found" error**: Make sure your user has an entry in `agency_members` table.

**Telegram bot not starting**: Check `TELEGRAM_BOT_TOKEN` is set correctly.

**Build fails**: Run `npm run build` to see TypeScript errors.
