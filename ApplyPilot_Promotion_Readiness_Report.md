# ApplyPilot — Promotion Readiness Report
**Date:** March 31, 2026
**Prepared by:** Claude (Cowork AI)
**Purpose:** Status check after Phase 4C + 4G wiring session

---

## Summary Verdict

> **Not yet ready to deploy — but the code is done. You need to deploy and set one env var.**

The three features that were blocking promotion are now fully wired in code. Nothing is stubbed anymore. The only remaining step is deploying to Railway + Vercel and setting `STEEL_API_KEY` in Railway's environment.

---

## What Was Done This Session

### 1. ✅ Gmail Email Monitor Scan — WIRED (was stub)

**File:** `backend/api/email_monitor.py`

The `/api/email-monitor/scan` endpoint now:
- Fetches the student's Gmail credentials from `student_credentials` table
- Decrypts the password in memory only (never logged)
- Creates an `agent_job` record for tracking
- Launches a background IMAP task that:
  - Connects to `imap.gmail.com` with SSL
  - Fetches up to 30 recent emails
  - Classifies each with OpenAI GPT-4o-mini into: `portal_activation`, `document_request`, `decision`, `general_university`, or `ignore`
  - Saves to `monitored_emails` (skips duplicates by `gmail_message_id`)
- Returns immediately with `job_id` — UI doesn't freeze

**Note for deployment:** Student must have active Gmail credentials saved in the Credentials tab. Gmail may require an App Password (not the regular password) — you should document this for consultants.

### 2. ✅ Frontend Email Monitor — FIXED (was broken)

**File:** `frontend/app/(dashboard)/students/[id]/emails/page.tsx`

Fixed three field name mismatches that caused the email list to always show empty even when data existed:
- `from_email` → `from_address` (matches database column)
- `university` → `university_name` (matches database column)
- `summary` → `content_summary` (matches database column)
- Fixed `apiFetch<{ emails: EmailMonitor[] }>` → `apiFetch<EmailMonitor[]>` (backend returns a plain array, not wrapped in an object)

### 3. ✅ Portal Activation Agent — WIRED (was stub)

**File:** `backend/api/portals.py`

The `/api/portals/{id}/activate` endpoint now:
- Validates the portal has a URL (returns helpful error if missing)
- Checks for duplicate active jobs (prevents double-clicking)
- Creates an `agent_job` for tracking
- Launches a Steel.dev browser session in background that:
  - Navigates to the portal URL
  - Tries common PIN input selectors to fill the portal PIN
  - Takes a screenshot and uploads to Cloudflare R2
  - Updates `portal_sessions.activation_status` to `activated` or `failed`
- Returns immediately with `job_id`

### 4. ✅ Browser Agent (Common App Fill) — ALREADY WIRED (verified)

**File:** `backend/api/browser_agent.py` + `backend/agents/browser.py`

This was fully wired in the previous phase. The `/api/agents/browser/start` endpoint:
- Creates an `agent_job`
- Launches `BrowserAgent.fill_common_app()` as an async background task
- Uses Steel.dev for the cloud browser session
- Pauses at every section for human approval via Telegram
- Is fully integrated — **needs `STEEL_API_KEY` set in Railway to run**

---

## What Still Needs To Happen Before You Promote

### Must-Do (Blockers)

| # | Task | Where | Effort |
|---|------|--------|--------|
| 1 | Push today's code to Railway (backend) | `git push` → Railway auto-deploys | 5 min |
| 2 | Push today's code to Vercel (frontend) | `git push` → Vercel auto-deploys | 5 min |
| 3 | Set `STEEL_API_KEY` in Railway env vars | Railway dashboard → Variables | 2 min |
| 4 | Run migration 007 in Supabase (if pending) | Supabase SQL editor | 5 min |
| 5 | Test Gmail scan with one real student | Try Scan Now button | 10 min |
| 6 | Test Portal Activation with one real portal | Add portal → click Activate | 10 min |

### Should-Do (Not blockers, but needed before first real client)

| # | Task | Notes |
|---|------|-------|
| 7 | Document Gmail App Password setup | Google blocks password login by default; consultants need App Passwords |
| 8 | Add job status polling to frontend | So user sees "scanning..." progress instead of just toasting |
| 9 | Smoke test Common App fill end-to-end | Requires `STEEL_API_KEY` + real Common App credentials |

---

## Feature Status Matrix

| Feature | Code Status | Deploy Status | Works? |
|---------|-------------|---------------|--------|
| Auth + Login | ✅ Done | ✅ Live | ✅ Yes |
| Student Management | ✅ Done | ✅ Live | ✅ Yes |
| Agency/Tenant Isolation | ✅ Done | ✅ Live | ✅ Yes |
| Billing / Subscriptions | ✅ Done | ✅ Live | ✅ Yes |
| Essay Workshop | ✅ Done | ✅ Live | ✅ Yes |
| College Search + Fit | ✅ Done | ✅ Live | ✅ Yes |
| Deadline Tracker | ✅ Done | ✅ Live | ✅ Yes |
| Gmail Email Monitor | ✅ Wired (today) | ⏳ Push needed | ✅ Ready to test |
| Portal Activation Agent | ✅ Wired (today) | ⏳ Push needed | ✅ Ready to test |
| Browser Agent (Common App) | ✅ Wired | ⏳ Push needed | ⚠️ Needs STEEL_API_KEY |
| Workflow Engine | ✅ Done | ✅ Live | ✅ Yes |
| Audit Logs | ✅ Done | ✅ Live | ✅ Yes |

---

## Risks to Know Before Promoting

**1. Gmail IMAP Access**
Google restricts direct password login for IMAP in most accounts. Students need to either enable "Less Secure App Access" (deprecated) or create a Gmail **App Password** under their Google Account security settings. This is a setup step the consultant must walk the student through once.

**2. STEEL_API_KEY is required for browser automation**
Without this key, any request to `/api/agents/browser/start` or portal activation that uses the browser will throw `RuntimeError: STEEL_API_KEY is not configured`. Set this in Railway before demoing the Common App fill feature.

**3. Portal activation is best-effort**
Every university portal is different. The activation task fills the PIN field using common selectors and takes a screenshot as proof. For portals with unusual layouts, the PIN may not auto-fill — the portal will be marked `failed` and you can retry. This is expected behaviour at this stage.

---

## Recommendation

**Deploy today's code first (30 minutes), then do one full end-to-end test on a test student.**
If Gmail scan returns emails and Common App fill starts a session, you are ready to show this to your first paying clients. The core value proposition — automated university email monitoring + Common App form filling with human approval — is now functional.
