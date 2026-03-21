# ApplyPilot — Technical Architecture Report
**Version 1.0 | March 2026 | Confidential**

---

## Executive Summary

ApplyPilot is a multi-tenant SaaS platform built to automate college application workflows for consulting agencies. The system is architected as a cloud-native, event-driven platform with seven independent AI agents, a PostgreSQL database with row-level security, and a Next.js frontend. It handles everything from student intake to Common App submission, with human approval gates at every critical action.

This document covers the complete technical architecture, data model, agent design, security implementation, and deployment infrastructure.

---

## 1. System Architecture

### 1.1 High-Level Design

ApplyPilot follows a three-tier architecture:

**Presentation Layer** — Next.js 14 (App Router) hosted on Vercel. Handles all UI rendering, client-side state, and real-time updates via Supabase Realtime subscriptions. Server components used by default; client components only where interactivity is required.

**Application Layer** — FastAPI (Python 3.11) hosted on Railway. Fully async throughout using asyncio. Handles all business logic, agent orchestration, credential management, and third-party integrations.

**Data Layer** — Supabase PostgreSQL with Row Level Security. Cloudflare R2 for binary storage. All credentials encrypted at rest using AES-256 Fernet encryption.

### 1.2 Multi-Tenancy Model

Every database table includes an `agency_id` UUID column. Multi-tenancy is enforced at three independent layers:

**Layer 1 — Application layer:** The `agency_id` is always extracted from the authenticated JWT token in the FastAPI middleware. It is never accepted from request parameters or request body. This is enforced by the `get_current_agency_id()` dependency injected into every route handler.

**Layer 2 — Database layer:** PostgreSQL Row Level Security policies are enabled on all tenant tables. Even if a bug in application code omits the `agency_id` filter, the database itself enforces isolation. The RLS policy reads:

```sql
CREATE POLICY "agency_isolation" ON students
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));
```

**Layer 3 — Storage layer:** All Cloudflare R2 paths are prefixed with `/{agency_id}/{student_id}/`, making cross-agency file access structurally impossible.

---

## 2. Database Schema

### 2.1 Core Tables

The database contains 14 tables across four domains:

**Identity domain:** `agencies`, `users`, `agency_members`

**Student domain:** `students`, `recommenders`

**Application domain:** `applications`, `essay_prompts`, `essays`, `recommendation_letters`, `documents`, `deadlines`

**Communication domain:** `email_accounts`, `emails`

**System domain:** `agent_jobs`, `audit_logs`

### 2.2 Key Design Decisions

**Denormalized university name:** The `applications` table stores `university_name TEXT` alongside `university_id UUID`. This allows applications to reference universities not yet in the universities master table, and prevents cascading deletes from breaking application records.

**JSONB for flexible data:** Student `activities`, `awards`, `work_experience`, and `languages` are stored as JSONB arrays. Common App section status is stored as a JSONB object with 10 keys. This avoids over-normalized join tables for data that is queried and updated as a unit.

**Encrypted credentials:** The `email_accounts` table stores `password_encrypted TEXT`. The `applications` table stores `portal_password_encrypted TEXT`. Both are encrypted using AES-256 Fernet before storage. The encryption key is stored only in the Railway environment variable `ENCRYPTION_KEY` and is never written to the database, logs, or any file.

**Agent job state machine:** The `agent_jobs` table tracks every agent action with status transitions: `pending → running → waiting_approval → approved/rejected → completed/failed`. The `output_data JSONB` field stores agent-specific state including Steel.dev session IDs and completed step numbers, enabling resume after server restart.

**Alert tracking:** The `deadlines` table includes `alert_days_before JSONB` (default `[30, 14, 7, 3, 1]`) and `alerts_sent JSONB` (default `[]`). The deadline tracker agent adds to `alerts_sent` after each alert, preventing duplicate notifications. When `due_date` changes, `alerts_sent` resets to `[]` to re-arm all alerts.

---

## 3. Agent Architecture

### 3.1 Agent Framework

All seven agents are built using LangGraph, an agent orchestration framework designed for multi-step, stateful workflows. Each agent is an independent Python module in `backend/agents/`. Agents communicate via the PostgreSQL `agent_jobs` table, not via direct function calls. This means:

- Agents can be restarted independently without affecting others
- Job state persists across server restarts
- Approval actions from Telegram update the database, which the polling loop detects

### 3.2 Agent Inventory

**Coordinator Agent** (`agents/coordinator.py`)
Receives all Telegram commands and messages, determines which agent should handle the request, spawns the appropriate agent as an asyncio background task, and sends daily briefings. Runs morning cron at 8AM and evening cron at 9PM per agency timezone.

**Intake Agent** (`agents/intake.py`)
Triggered when staff types "new student". Conducts a structured conversational intake via Telegram, asking 20 questions one by one. Creates the student record in PostgreSQL, generates a document checklist, and creates the folder structure in Cloudflare R2.

**Writer Agent** (`agents/writer.py`)
Handles three task types: `essay`, `rec_letter`, `email_reply`. Reads the full student profile from the database, fetches the relevant prompt or recommender context, calls GPT-4o-mini for generation, scores the output 1-100, checks word count against limits, and saves the draft. Creates an `agent_job` with `status=waiting_approval` and sends the full draft to Telegram for approval.

**Email Agent** (`agents/email_agent.py`)
Connects to student email accounts via IMAP using stored encrypted credentials. Reads all unread emails, classifies each using GPT-4o-mini into eight categories, saves to the `emails` table, and drafts replies. Sends instant Telegram alerts for acceptance/rejection/waitlist decisions. Sends email replies via SMTP only after approval. The SMTP host is derived from the IMAP host using a provider map. Credentials are decrypted in memory and cleared in the `finally` block.

**Deadline Tracker Agent** (`agents/deadline_tracker.py`)
Runs via APScheduler cron at 7AM daily. Queries all incomplete deadlines across all agencies. For each deadline, checks if the current day matches any configured alert threshold. Sends formatted Telegram messages with student name, university, deadline date, days remaining, and a dashboard link. Sends emergency alerts (🚨) day-of at 7AM, 12PM, and 6PM if the task remains incomplete.

**Browser Agent** (`agents/browser.py`)
The most complex agent. Uses Steel.dev cloud browser SDK via Playwright CDP. Executes an 11-step Common App workflow with an approval gate after every step. Credentials are decrypted immediately before login and cleared immediately after. Screenshots are taken after every action, uploaded to R2, and the URL is sent to Telegram. The `output_data` JSON field stores `{session_id, step, completed_steps}` enabling resume after server restart. If the Steel session expires mid-task, the agent reconnects and re-authenticates transparently.

**Document Processor Agent** (`agents/document_processor.py`)
Triggered asynchronously on every document upload. Downloads the file from R2, runs OCR using GPT-4o Vision, extracts text, saves to `documents.ocr_text`, sets `ocr_processed=true`, and updates the document checklist. Writes character count and document type to `audit_logs`.

### 3.3 Approval System

Three approval tiers are implemented:

**Automatic:** Document processing, email reading, deadline alerts, briefings, student profile creation. No human action required.

**Draft approval:** Essays, rec letters, email replies, Common App section fills. Agent creates `agent_job` with `status=waiting_approval`, sends content or screenshot to Telegram with inline keyboard buttons. On approval, the Telegram callback handler calls the appropriate background task function.

**Hard gate:** Application submission, email sending, portal uploads. Agent stops completely and waits. Cannot proceed without explicit approval. Double-approval guard prevents processing a callback twice.

---

## 4. Security Architecture

### 4.1 Credential Encryption

```python
# core/encryption.py
from cryptography.fernet import Fernet

class CredentialVault:
    def __init__(self):
        self.cipher = Fernet(os.environ['ENCRYPTION_KEY'].encode())

    def encrypt(self, plaintext: str) -> str:
        return self.cipher.encrypt(plaintext.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        return self.cipher.decrypt(ciphertext.encode()).decode()
```

The encryption key is generated once using `Fernet.generate_key()` and stored only in the Railway environment variable. It is never written to any file, database, or log. Decryption happens only in memory during active agent sessions. After use, the plaintext variable is explicitly overwritten with an empty string.

### 4.2 Authentication Flow

1. User submits credentials to Supabase Auth
2. Supabase returns a JWT containing the user's UUID
3. Every FastAPI request includes the JWT in the Authorization header
4. `core/auth.py` validates the JWT signature using `SUPABASE_JWT_SECRET`
5. The validated user UUID is used to query `agency_members` for `agency_id`
6. The `agency_id` is injected into every route handler via FastAPI dependency injection
7. It is never read from request parameters under any circumstances

### 4.3 Rate Limiting

Implemented using `slowapi`:
- 1,000 requests per hour per agency
- 200 requests per hour per user
- 50 concurrent agent jobs maximum per agency
- Email sync maximum every 15 minutes per account

### 4.4 Access Control Matrix

| Resource | Super Admin | Agency Admin | Agency Staff |
|----------|-------------|--------------|--------------|
| Student credentials | Read | Read | No access |
| Other agency data | Read | No access | No access |
| Own students | Full | Full | Assigned only |
| Audit logs | All agencies | Own agency | Own actions |
| Billing | All | Own agency | No access |
| Agent jobs | All | All | Own students |

### 4.5 Audit Logging

Every database write operation calls `core/audit.py` which inserts a record into `audit_logs` with: `agency_id`, `user_id`, `student_id` (if applicable), `action`, `entity_type`, `entity_id`, `old_value` (JSONB), `new_value` (JSONB), `ip_address`, and `timestamp`. Telegram approval actions are logged with `source: telegram`.

---

## 5. API Structure

All routes are authenticated. The `agency_id` is always derived from the JWT, never from request parameters.

```
POST   /api/students              Create student
GET    /api/students              List students (agency-scoped)
GET    /api/students/{id}         Get student
PATCH  /api/students/{id}         Update student
DELETE /api/students/{id}         Delete student

POST   /api/applications          Create application
GET    /api/applications          List applications
PATCH  /api/applications/{id}     Update application
PATCH  /api/applications/{id}/sections  Update Common App section status
DELETE /api/applications/{id}     Delete application

POST   /api/documents/upload      Upload document to R2
GET    /api/documents/checklist   Get checklist for student
PATCH  /api/documents/{id}        Update document status
DELETE /api/documents/{id}        Delete document

POST   /api/deadlines             Create deadline
PATCH  /api/deadlines/{id}        Update deadline
DELETE /api/deadlines/{id}        Delete deadline
POST   /api/deadlines/{id}/complete    Mark complete
POST   /api/deadlines/{id}/uncomplete  Mark incomplete

POST   /api/agents/browser/start  Start browser agent for application
GET    /api/agent-jobs            List agent jobs
PATCH  /api/agent-jobs/{id}/approve  Approve job
PATCH  /api/agent-jobs/{id}/reject   Reject job

GET    /api/audit                 Get audit log (agency-scoped)
GET    /api/analytics             Get analytics data

POST   /api/settings/agency/logo  Upload agency logo
PATCH  /api/settings/agency       Update agency settings
POST   /api/staff/invite          Invite staff member
PATCH  /api/staff/{id}/deactivate Deactivate staff member
```

---

## 6. Frontend Architecture

### 6.1 Next.js 14 App Router Structure

The frontend uses the Next.js 14 App Router with route groups for layout separation:

- `(auth)` — unauthenticated routes (login)
- `(dashboard)` — authenticated routes with sidebar layout
- `admin` — super admin routes

### 6.2 Real-Time Updates

Supabase Realtime subscriptions are used in two places:

**Activity feed** (`components/dashboard/ActivityFeed.tsx`) — subscribes to `audit_logs` filtered by `agency_id`. Updates every 5 seconds with the latest 10 actions.

**Browser agent status** (`components/applications/FillCommonAppButton.tsx`) — subscribes to `agent_jobs` filtered by `application_id`. Updates the button state in real time as the agent progresses through steps.

### 6.3 Design System

Typography: DM Sans (primary), DM Mono (dates, codes, IDs). Colors: brand green `#1D9E75` with semantic variants. All borders: `0.5px solid` — never 1px. No drop shadows. No gradients. Border radius maximum 10px. The visual language is intentionally similar to Linear and Notion.

---

## 7. Infrastructure

### 7.1 Deployment

| Service | Platform | Configuration |
|---------|----------|---------------|
| Frontend | Vercel | Next.js auto-detected, `vercel.json` for routes |
| Backend | Railway | `railway.toml`, uvicorn with 4 workers |
| Database | Supabase | Managed PostgreSQL, daily backups |
| Storage | Cloudflare R2 | S3-compatible, `applypilot-docs` bucket |
| Browser | Steel.dev | Cloud browser sessions, CAPTCHA solving |

### 7.2 Background Jobs

APScheduler is used for all cron jobs within the FastAPI process:

| Job | Schedule | Function |
|-----|----------|----------|
| Morning briefing | 8AM per agency timezone | Coordinator agent |
| Evening summary | 9PM per agency timezone | Coordinator agent |
| Deadline tracker | 7AM daily | Deadline tracker agent |
| Emergency deadline alerts | 12PM, 6PM daily | Deadline tracker agent |
| Email sync | Hourly | Email agent |

### 7.3 Environment Variables

All secrets are stored as Railway environment variables. No secrets exist in code, configuration files, or the database. The `ENCRYPTION_KEY` is the most sensitive variable — loss of this key makes all stored credentials unrecoverable.

---

## 8. Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | Next.js | 14 |
| Frontend language | TypeScript | 5 |
| CSS framework | Tailwind CSS | 3 |
| UI components | shadcn/ui | Latest |
| Charts | Recharts | Latest |
| Drag and drop | @dnd-kit/core | Latest |
| Backend framework | FastAPI | Latest |
| Backend language | Python | 3.11 |
| Data validation | Pydantic | v2 |
| Agent framework | LangGraph | Latest |
| AI model | GPT-4o-mini | gpt-4o-mini |
| Database | PostgreSQL | 15 (via Supabase) |
| Auth | Supabase Auth | Latest |
| File storage | Cloudflare R2 | S3 API |
| Browser automation | Steel.dev | Latest |
| Email protocol | IMAP/SMTP | imaplib/smtplib |
| Telegram | python-telegram-bot | v20 |
| Job scheduling | APScheduler | 3.x |
| Encryption | cryptography (Fernet) | 46.x |
| Rate limiting | slowapi | Latest |
| Error tracking | Sentry | Latest |

---

*Document prepared March 2026. Internal use only.*
