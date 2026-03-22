# ApplyPilot — Development Setup

## Prerequisites
- Node.js 18+
- Python 3.10+
- A Supabase project

## Quick Start

### 1. Clone and install
```bash
git clone <repo>
cd ApplyPilot/frontend
npm install
```

### 2. Environment variables
```bash
cp .env.example .env.local
# Fill in your Supabase URL, anon key, and service role key
```

### 3. Seed the database
```bash
# From the ApplyPilot root:
node database/seed.js
```

### 4. Run the dev server
```bash
cd frontend
npm run dev
# App runs at http://localhost:3000
```

## Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Super Admin | owner@applypilot.com | ApplyPilot2024! |
| Agency Admin | admin@premier.com | ApplyPilot2024! |
| Staff | staff@premier.com | ApplyPilot2024! |
| Agency Admin | admin@edupath.com | ApplyPilot2024! |

## Project Structure
```
ApplyPilot/
├── frontend/          # Next.js 14 App Router
│   ├── app/           # Pages and layouts
│   ├── components/    # UI components
│   └── lib/           # Supabase clients, utils
├── backend/           # FastAPI
│   └── routers/       # API routes
├── database/          # Seed scripts
└── supabase/          # Migrations
```

## Common Commands
```bash
# Frontend
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # Run ESLint
npx tsc --noEmit  # Type check

# Database
node database/seed.js         # Seed all test data
node database/fix_edupath.js  # Fix EduPath admin account
```
