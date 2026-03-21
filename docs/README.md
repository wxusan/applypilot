# ApplyPilot

AI-powered college application management platform for consulting agencies.

## What It Does

ApplyPilot gives college consulting agencies a single platform to manage their students' applications, run AI agents to automate essay writing, form filling, email management, and deadline tracking — all with human approval gates before any irreversible action.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python 3.11), async |
| Database | Supabase PostgreSQL + RLS |
| Storage | Cloudflare R2 |
| AI | OpenAI GPT-4o-mini |
| Browser | Steel.dev cloud browser |
| Notifications | Telegram Bot |
| Deploy | Railway (backend) + Vercel (frontend) |

---

## Phase 1 Setup

### 1. Database

Run the migration in your Supabase SQL Editor:

```sql
-- Copy contents of: database/migrations/001_initial_schema.sql
```

Get your JWT secret from: Supabase Dashboard → Settings → API → JWT Secret

### 2. Backend

```bash
cd backend
pip install -r requirements.txt

# Copy and fill in .env
cp ../infrastructure/.env.example .env
# Edit .env with your credentials

# Run
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install

# Copy and fill in .env.local
cp ../infrastructure/.env.example .env.local
# Edit .env.local with frontend vars

# Run
npm run dev
```

### 4. Seed Database

```bash
cd database
python3 seed.py
```

**Test accounts after seeding:**
- Agency 1 Admin: `admin@premier.com` / `ApplyPilot2024!`
- Agency 1 Staff: `staff@premier.com` / `ApplyPilot2024!`
- Agency 2 Admin: `admin@edupath.com` / `ApplyPilot2024!`

---

## Phase 1 Test Checklist

- [ ] Login works with seeded credentials
- [ ] Agency 1 admin sees Alisher and Nilufar but NOT Elena (Agency 2's student)
- [ ] Agency 2 admin sees Elena but NOT Alisher or Nilufar
- [ ] Create a student via the UI — appears only in the correct agency
- [ ] JWT middleware injects `agency_id` from token — never from params

---

## Security

- **Multi-tenancy**: Every query filtered by `agency_id` from JWT. RLS enforced at DB level as defence-in-depth.
- **Credentials**: Student passwords encrypted with AES-256 Fernet. Key in env only. Never logged.
- **Approval gates**: No irreversible action without explicit human approval.
- **Rate limiting**: 1000 req/hour per agency, 200 per user (slowapi).
- **Sessions**: Expire after 8 hours of inactivity.

---

## The 7 Agents

| Agent | Responsibility |
|-------|---------------|
| Coordinator | Daily briefings, pipeline tracking |
| Intake | Collect student info via Telegram |
| Writer | Essays, rec letters, email drafts |
| Email | IMAP monitoring, categorization |
| Browser | Common App automation (Steel.dev) |
| Deadline Tracker | Daily cron, multi-tier alerts |
| Document Processor | OCR via GPT-4o Vision |

All agents require human approval before any irreversible action.

---

## Deployment

### Backend → Railway

```bash
railway up
```

Set all env vars from `.env.example` in Railway dashboard.

### Frontend → Vercel

```bash
vercel --prod
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` in Vercel.

---

## Build Phases

- **Phase 1** ✅ — Foundation: auth, DB, agency isolation, basic student CRUD
- **Phase 2** — Student management: full CRUD, document upload, audit log
- **Phase 3** — Applications, deadlines, Telegram alerts
- **Phase 4** — Writer, Email, and Document Processor agents
- **Phase 5** — Browser agent (Steel.dev Common App automation)
- **Phase 6** — Dashboard polish, analytics, real-time updates
