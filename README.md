# ApplyPilot

AI-powered college application management platform for agencies. Automates essay drafting, email handling, Common App form filling, and deadline tracking — all with human-in-the-loop approval via Telegram.

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Supabase SSR |
| Backend | FastAPI (Python), APScheduler, python-telegram-bot v20 |
| Database | Supabase (PostgreSQL + Realtime) |
| Storage | Cloudflare R2 (documents, screenshots, logos) |
| AI | OpenAI GPT-4o-mini (essays, scoring, OCR, email) |
| Browser | Steel.dev + Playwright (Common App automation) |
| Hosting | Railway (backend) + Vercel (frontend) |

---

## Quick Start (Local Dev)

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Supabase project
- A Cloudflare R2 bucket
- OpenAI API key
- Telegram bot token (via @BotFather)
- Steel.dev API key (for browser agent)

### Backend

```bash
cd backend
cp .env.example .env
# Fill in all values in .env

pip install -r requirements.txt

# Seed sample data (after creating users in Supabase Auth first)
python seed.py

# Start the dev server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
Swagger docs (debug mode only): `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL

npm install --legacy-peer-deps
npm run dev
```

Open `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role key (server-only) |
| `SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_JWT_SECRET` | JWT secret for token verification |
| `ENCRYPTION_KEY` | Fernet key for portal/email passwords |
| `OPENAI_API_KEY` | GPT-4o-mini access |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather |
| `CLOUDFLARE_R2_ACCOUNT_ID` | R2 account ID |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 access key |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 secret key |
| `CLOUDFLARE_R2_BUCKET_NAME` | R2 bucket name |
| `STEEL_API_KEY` | Steel.dev API key |
| `SENTRY_DSN` | (optional) Sentry error tracking |
| `DASHBOARD_URL` | Frontend URL for Telegram links |
| `FRONTEND_URL` | Frontend URL for invite redirects |

Generate `ENCRYPTION_KEY`:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | Backend API URL |

---

## Deploy to Railway (Backend)

1. Push your code to GitHub.

2. In Railway: **New Project → Deploy from GitHub repo** → select your repo.

3. Set **Root Directory** to `backend`.

4. Add all environment variables from `backend/.env.example` under **Variables**.

5. Railway auto-detects `railway.toml` and uses:
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4`
   - Health check: `/health`

6. Note your Railway deployment URL (e.g. `https://applypilot-backend.up.railway.app`).
   Set it as `NEXT_PUBLIC_API_URL` in Vercel and as `DASHBOARD_URL` / `FRONTEND_URL` in Railway variables.

7. Add your Vercel frontend domain to `CORS_ORIGINS` in Railway variables:
   ```
   CORS_ORIGINS=["https://app.applypilot.co","https://applypilot.vercel.app"]
   ```

---

## Deploy to Vercel (Frontend)

1. In Vercel: **New Project → Import Git Repository** → select your repo.

2. Set **Root Directory** to `frontend`.

3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` → your Railway backend URL

4. Click **Deploy**. Vercel detects Next.js automatically.

5. (Optional) Add a custom domain under **Domains**.

---

## Supabase Setup

### Auth
- Enable **Email** provider under Authentication → Providers.
- Set **Site URL** to your Vercel deployment URL.
- Add your Vercel URL to **Redirect URLs**.

### Realtime
Enable Realtime on these tables (Database → Replication):
- `agent_jobs`
- `audit_logs`
- `students`

### Row Level Security
All tables enforce agency-scoped RLS. The backend always uses the `service_role` key which bypasses RLS — this is intentional since all agency isolation is enforced in application code via `agency_id` from the JWT.

---

## Key Features

**Agents (all run async, all require Telegram approval)**
- **Writer Agent** — generates essays and recommendation letter drafts with GPT-4o-mini, scores 1-100, checks word limits
- **Email Agent** — IMAP inbox sync, classifies emails into 8 categories, drafts replies, sends via SMTP on approval
- **Browser Agent** — fills Common App step-by-step using Steel.dev + Playwright, screenshots at every step
- **Document Processor** — OCR via GPT-4o Vision for uploaded transcripts and test score reports
- **Coordinator** — sends morning briefing (9AM) and evening summary (6PM) via Telegram

**Dashboard**
- Live activity feed via Supabase Realtime
- Kanban board with native drag-and-drop
- Analytics with SVG charts (pipeline, decisions, compliance, agent activity)
- CSV + Print-to-PDF export

**Settings**
- Agency logo upload to R2, brand color picker, language (en/uz/ru), timezone
- Staff management with max-staff enforcement and Supabase Auth invite

---

## Project Structure

```
ApplyPilot/
├── backend/
│   ├── agents/          # writer.py, email_agent.py, browser.py, coordinator.py
│   ├── api/             # FastAPI routers
│   ├── core/            # auth, config, db, audit
│   ├── models/          # Pydantic models
│   ├── services/        # telegram_bot, scheduler, r2_storage, steel_browser
│   ├── main.py
│   ├── seed.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/(dashboard)/ # Next.js App Router pages
│   ├── components/      # React components
│   ├── lib/             # supabase-browser, supabase-server, api, utils
│   ├── vercel.json
│   └── .env.example
└── README.md
```

---

## License

Proprietary — all rights reserved.
