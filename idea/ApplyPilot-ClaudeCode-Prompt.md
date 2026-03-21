# ApplyPilot — Complete Claude Code Prompt
### Paste this entire file into Claude Code to build the system

---

You are a senior full-stack engineer building ApplyPilot — a multi-tenant SaaS platform for college application consulting agencies. Read every word of this spec before writing a single line of code.

---

## WHAT YOU ARE BUILDING

A platform where college consulting agencies log in at app.applypilot.com, manage their students' college applications, and use AI agents to automate Common App form filling, essay writing, email management, and deadline tracking.

The system must work without any setup or configuration per agency. An agency owner gets login credentials, goes to the URL, and starts working immediately. Nothing to install. Nothing to configure.

---

## CRITICAL REQUIREMENTS

1. **Multi-tenancy**: Every database table has agency_id. Row Level Security enforced at PostgreSQL level via Supabase RLS. Agency A can NEVER see Agency B's data under any circumstances — not through bugs, not through API calls, not through any means.

2. **Approval gates**: No irreversible action (submit application, send email, upload to portal) executes without explicit human approval. The system prepares everything. A human taps approve before it executes.

3. **Credential security**: Student email passwords and portal passwords encrypted with AES-256 Fernet encryption. Key stored in environment variable only. Decrypted only in memory during active agent jobs. Never logged. Never stored in plain text.

4. **Agent isolation**: Each agent is an independent service. If one crashes, others keep running. No single point of failure.

5. **Screenshot everything**: Browser agent takes and saves screenshots after every form section filled. Screenshots sent to Telegram for approval before continuing.

6. **Audit everything**: Every action by every agent and every user written to audit_logs with timestamp, user_id, agency_id, old value, new value.

---

## TECH STACK

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: FastAPI (Python 3.11), fully async, Pydantic v2 for validation
- **Database**: Supabase PostgreSQL with Row Level Security enabled on ALL tables
- **Storage**: Cloudflare R2 (S3 compatible) for all documents and screenshots
- **Agents**: LangGraph for multi-agent orchestration, GPT-4o-mini as AI model
- **Browser**: Steel.dev SDK for cloud browser automation
- **Telegram**: python-telegram-bot v20 (async)
- **Auth**: Supabase Auth with JWT tokens
- **Email**: imaplib for IMAP access to student email accounts

---

## ENVIRONMENT VARIABLES

Backend (.env):
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_JWT_SECRET=
SUPABASE_ANON_KEY=
ENCRYPTION_KEY=
OPENAI_API_KEY=
TELEGRAM_BOT_TOKEN=
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=applypilot-docs
STEEL_API_KEY=
SENTRY_DSN=
```

Frontend (.env.local):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
```

---

## DATABASE SCHEMA

Run all migrations in order. Enable RLS on every table.

```sql
-- ============================================
-- AGENCIES
-- ============================================

CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1D9E75',
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'Asia/Tashkent',
  subscription_status TEXT DEFAULT 'active',
  subscription_plan TEXT DEFAULT 'starter',
  max_staff INTEGER DEFAULT 2,
  terms_accepted_at TIMESTAMPTZ,
  terms_accepted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  telegram_chat_id TEXT,
  phone TEXT,
  language TEXT DEFAULT 'en',
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff',
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, user_id)
);

-- ============================================
-- STUDENTS
-- ============================================

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  assigned_staff_id UUID REFERENCES users(id),
  full_name TEXT NOT NULL,
  preferred_name TEXT,
  date_of_birth DATE,
  nationality TEXT,
  passport_number TEXT,
  passport_expiry DATE,
  photo_url TEXT,
  email TEXT,
  phone TEXT,
  telegram_username TEXT,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  high_school_name TEXT,
  high_school_country TEXT,
  graduation_year INTEGER,
  gpa DECIMAL(4,2),
  gpa_scale DECIMAL(4,2) DEFAULT 4.0,
  class_rank TEXT,
  sat_total INTEGER,
  sat_math INTEGER,
  sat_reading INTEGER,
  act_score INTEGER,
  toefl_score INTEGER,
  ielts_score DECIMAL(3,1),
  duolingo_score INTEGER,
  activities JSONB DEFAULT '[]',
  awards JSONB DEFAULT '[]',
  work_experience JSONB DEFAULT '[]',
  languages JSONB DEFAULT '[]',
  intended_major TEXT,
  application_type TEXT DEFAULT 'freshman',
  notes TEXT,
  status TEXT DEFAULT 'intake',
  season TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- UNIVERSITIES
-- ============================================

CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  common_app_id TEXT,
  website TEXT,
  location_city TEXT,
  location_state TEXT,
  location_country TEXT DEFAULT 'USA',
  acceptance_rate DECIMAL(5,2),
  ranking_us_news INTEGER,
  common_app_required_sections JSONB,
  application_fee INTEGER,
  fee_waiver_available BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APPLICATIONS
-- ============================================

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id),
  university_name TEXT NOT NULL,
  application_type TEXT DEFAULT 'regular',
  deadline_regular DATE,
  deadline_financial_aid DATE,
  deadline_scholarship DATE,
  common_app_status JSONB DEFAULT '{
    "personal_info": "not_started",
    "family": "not_started",
    "education": "not_started",
    "test_scores": "not_started",
    "activities": "not_started",
    "writing": "not_started",
    "additional_info": "not_started",
    "school_report": "not_started",
    "recommendations": "not_started",
    "payment": "not_started"
  }',
  portal_url TEXT,
  portal_username TEXT,
  portal_password_encrypted TEXT,
  status TEXT DEFAULT 'not_started',
  submitted_at TIMESTAMPTZ,
  decision_received_at TIMESTAMPTZ,
  decision TEXT,
  scholarship_amount DECIMAL(10,2),
  financial_aid_amount DECIMAL(10,2),
  notes TEXT,
  application_fee_paid BOOLEAN DEFAULT false,
  fee_waiver_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ESSAYS
-- ============================================

CREATE TABLE essay_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES universities(id),
  university_name TEXT,
  prompt_type TEXT,
  prompt_text TEXT NOT NULL,
  word_limit_min INTEGER,
  word_limit_max INTEGER,
  season TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id),
  prompt_id UUID REFERENCES essay_prompts(id),
  prompt_text TEXT,
  content TEXT,
  word_count INTEGER,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',
  ai_score INTEGER,
  ai_feedback TEXT,
  plagiarism_score DECIMAL(5,2),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RECOMMENDATION LETTERS
-- ============================================

CREATE TABLE recommenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  subject TEXT,
  school TEXT,
  email TEXT,
  relationship TEXT,
  notes TEXT
);

CREATE TABLE recommendation_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  recommender_id UUID REFERENCES recommenders(id),
  application_id UUID REFERENCES applications(id),
  content TEXT,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',
  word_count INTEGER,
  ai_generated BOOLEAN DEFAULT true,
  ai_score INTEGER,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS
-- ============================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  file_size_bytes INTEGER,
  mime_type TEXT,
  version INTEGER DEFAULT 1,
  ocr_text TEXT,
  ocr_processed BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'uploaded',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEADLINES
-- ============================================

CREATE TABLE deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id),
  title TEXT NOT NULL,
  type TEXT,
  due_date DATE NOT NULL,
  due_time TIME,
  timezone TEXT DEFAULT 'Asia/Tashkent',
  alert_days_before JSONB DEFAULT '[30, 14, 7, 3, 1]',
  alerts_sent JSONB DEFAULT '[]',
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  google_calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMAIL ACCOUNTS
-- ============================================

CREATE TABLE email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  provider TEXT,
  imap_host TEXT,
  imap_port INTEGER,
  password_encrypted TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  email_account_id UUID REFERENCES email_accounts(id),
  direction TEXT NOT NULL,
  message_id TEXT,
  from_address TEXT,
  to_address TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  received_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  category TEXT,
  university_name TEXT,
  importance TEXT DEFAULT 'normal',
  ai_draft TEXT,
  draft_status TEXT DEFAULT 'none',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AGENT JOBS
-- ============================================

CREATE TABLE agent_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id),
  application_id UUID REFERENCES applications(id),
  agent_type TEXT NOT NULL,
  job_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  requires_approval BOOLEAN DEFAULT false,
  approval_message TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  screenshot_urls JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id),
  user_id UUID REFERENCES users(id),
  student_id UUID REFERENCES students(id),
  application_id UUID REFERENCES applications(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE essays ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_isolation_students" ON students
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));

CREATE POLICY "agency_isolation_applications" ON applications
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));

CREATE POLICY "agency_isolation_documents" ON documents
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));

CREATE POLICY "agency_isolation_emails" ON emails
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));

CREATE POLICY "agency_isolation_essays" ON essays
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));

CREATE POLICY "agency_isolation_deadlines" ON deadlines
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));

CREATE POLICY "agency_isolation_agent_jobs" ON agent_jobs
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));
```

---

## FOLDER STRUCTURE

```
applypilot/
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── students/
│   │   │   │   └── [id]/
│   │   │   │       ├── profile/
│   │   │   │       ├── applications/
│   │   │   │       ├── documents/
│   │   │   │       ├── emails/
│   │   │   │       └── deadlines/
│   │   │   ├── approvals/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   └── admin/
│   ├── components/
│   │   ├── ui/
│   │   ├── students/
│   │   ├── applications/
│   │   ├── documents/
│   │   └── agents/
│   └── lib/
│       ├── supabase.ts
│       ├── api.ts
│       └── utils.ts
│
├── backend/
│   ├── agents/
│   │   ├── coordinator.py
│   │   ├── intake.py
│   │   ├── writer.py
│   │   ├── browser.py
│   │   ├── email_agent.py
│   │   ├── deadline_tracker.py
│   │   └── document_processor.py
│   ├── api/
│   │   ├── students.py
│   │   ├── applications.py
│   │   ├── documents.py
│   │   ├── emails.py
│   │   ├── essays.py
│   │   ├── deadlines.py
│   │   └── admin.py
│   ├── core/
│   │   ├── auth.py
│   │   ├── encryption.py
│   │   ├── rate_limiter.py
│   │   └── audit.py
│   ├── services/
│   │   ├── steel_browser.py
│   │   ├── email_service.py
│   │   ├── storage.py
│   │   ├── telegram_bot.py
│   │   └── ocr_service.py
│   ├── models/
│   └── main.py
│
├── database/
│   ├── migrations/
│   └── schema.sql
│
├── infrastructure/
│   ├── railway.toml
│   └── .env.example
│
└── docs/
    └── README.md
```

---

## THE 7 AGENTS

### Agent 1 — COORDINATOR
Routes all messages, sends daily briefings, tracks pipeline.

- 8AM daily: morning briefing to Telegram — deadlines this week, pending approvals, overnight activity
- 9PM daily: evening summary — completed tasks, pending items
- Instant routing: receives any staff message, decides which agent handles it
- Writes every action to audit_logs

### Agent 2 — INTAKE
Collects student info conversationally via Telegram.

- Triggered when staff types "new student"
- Asks questions one by one: name, DOB, nationality, passport, school, GPA, test scores, activities, awards, target universities, deadlines, email credentials, Common App credentials
- Creates student record in database
- Generates document checklist
- Creates folder structure in Cloudflare R2

### Agent 3 — WRITER
Generates all written content.

- Personal statements from student profile
- Supplemental essays per university prompt
- Recommendation letters in teacher's voice
- Emails in coordinator's voice
- Checks word count against limits automatically
- Scores essay quality 1-100 before sending for approval
- Checks for plagiarism via API
- Always sends draft to Telegram for approval — never saves as final without approval

### Agent 4 — EMAIL
Monitors and manages student email accounts.

- IMAP connection to student email (Gmail, Outlook, etc.)
- Reads all emails every hour
- Categorizes: university_update, document_request, interview_invite, acceptance, rejection, waitlist, financial_aid, general
- Drafts replies in coordinator's voice
- Sends morning digest to Telegram
- Instant alert when acceptance/rejection/waitlist decision arrives
- Never sends email without explicit approval

### Agent 5 — BROWSER
Automates Common App via Steel.dev cloud browser.

Section by section flow with approval gate after each:
1. Login → screenshot → report success
2. Personal Info → fill from profile → screenshot → await approval
3. Family → fill from profile → screenshot → await approval
4. Education → fill from profile → screenshot → await approval
5. Test Scores → fill from profile → screenshot → await approval
6. Activities → fill from profile → screenshot → await approval
7. Writing → upload approved essays → screenshot → await approval
8. Recommendations → request teacher recs → screenshot → await approval
9. School Report → screenshot → await approval
10. Payment/Fee Waiver → screenshot → await FINAL approval
11. Submit → screenshot confirmation → save PDF → mark submitted in database

NEVER submits without explicit "approve and submit" command.
Takes screenshots after EVERY action.
Sends screenshots to Telegram for review.

### Agent 6 — DEADLINE TRACKER
Single responsibility: never let a deadline slip.

- Runs daily cron at 7AM
- Alerts at 30, 14, 7, 3, 1 days before each deadline
- Emergency alerts day-of at 7AM, 12PM, 6PM if task incomplete
- Sends to staff Telegram and dashboard notification
- Updates coordinator morning briefing
- Marks complete when application submitted

### Agent 7 — DOCUMENT PROCESSOR
Processes uploaded documents automatically.

- Triggered on every new document upload to R2
- OCR extraction using GPT-4o Vision
- Categorizes document type automatically
- Updates document checklist
- Notifies staff of successful processing or issues

---

## THE APPROVAL SYSTEM

### Level 1 — Fully Automatic
- Document upload and organization
- OCR processing
- Email reading and categorization
- Deadline alerts
- Morning/evening briefings
- Student profile creation

### Level 2 — Draft Created, Awaits Approval
- Essays — draft shown in Telegram, staff approves before saving
- Rec letters — draft shown, staff approves before saving
- Email replies — draft shown, staff approves before sending
- Common App sections — filled, screenshot shown, staff approves before continuing

### Level 3 — Hard Gate, Explicit Approval Required
- Submitting Common App application
- Sending any email from student account
- Uploading documents to university portals
- Any permanent irreversible action

### Telegram Approval Format
```
🤖 Browser Agent
━━━━━━━━━━━━━━━━━━
Student: [Name]
Task: Fill Personal Info — Common App
Status: ✅ Complete

[View Screenshot] [✅ Approve] [✏️ Edit] [❌ Reject]
```

---

## SECURITY REQUIREMENTS

- Every database query includes agency_id filter from JWT — NEVER from request body or params
- Credential encryption: Fernet symmetric encryption, key in ENCRYPTION_KEY environment variable only
- Rate limiting: 1000 requests/hour per agency, 200 per user, implemented with slowapi
- All passwords hashed with bcrypt, minimum 8 characters
- Session expires after 8 hours of inactivity
- All agent actions logged in audit_logs with user_id, timestamp, old/new values
- HTTPS only everywhere
- Staff can view student credentials only if role is admin — never for staff role
- Failed login attempts: lock after 10 attempts, unlock after 30 minutes

---

## TELEGRAM BOT REQUIREMENTS

- Staff link their Telegram account in dashboard settings
- Morning briefing at 8AM (agency timezone): deadlines this week, pending approvals, overnight activity
- Evening summary at 9PM: completed tasks, upcoming deadlines
- Instant alerts for: urgent emails (acceptance/rejection), deadlines within 3 days, agent jobs waiting approval
- Each alert has inline keyboard buttons for approval actions
- Commands: /status [student name], /deadlines, /approvals, /help, /students

---

## DESIGN SYSTEM

The product must look premium and trustworthy. Agencies pay $99-499/month — it cannot look like a student project.

### Typography
- Primary font: DM Sans (Google Fonts) — import in layout.tsx
- Mono font: DM Mono — for deadline dates, IDs, status codes
- Sizes: 22px page titles, 15px section titles, 13px body, 11px labels/metadata
- Weights: 300, 400, 500, 600 only

### Colors
Use these exact values as CSS variables throughout:
```css
:root {
  --brand: #1D9E75;
  --brand-light: #E1F5EE;
  --brand-dark: #0F6E56;
  --danger-text: #A32D2D;
  --danger-bg: #FCEBEB;
  --warning-text: #854F0B;
  --warning-bg: #FAEEDA;
  --info-text: #185FA5;
  --info-bg: #E6F1FB;
  --success-text: #3B6D11;
  --success-bg: #EAF3DE;
}
```

### Component Rules
- All cards: white background, 0.5px border (#e5e7eb), border-radius 10px
- NO drop shadows anywhere — borders only
- Buttons: border-radius 6px, height 32px small, 36px regular
- Primary button: #1D9E75 background, white text, no border
- Secondary button: white background, 0.5px border, gray text
- Table rows: 12px 20px padding, 0.5px bottom border, hover bg-gray-50
- Status pills: font-size 11px, font-weight 500, 3px 8px padding, border-radius 4px
- ALL borders: 0.5px solid — never 1px

### Status Pills Colors
```
intake:    background #E1F5EE, color #0F6E56
forms:     background #E6F1FB, color #185FA5
writing:   background #FAEEDA, color #854F0B
review:    background #FBEAF0, color #993556
submitted: background #EAF3DE, color #3B6D11
accepted:  background #EAF3DE, color #3B6D11
rejected:  background #FCEBEB, color #A32D2D
```

### Sidebar
- Width: 200px fixed
- White background, right border 0.5px
- Active nav item: #E1F5EE background, #0F6E56 text
- Nav font size: 13px
- Section labels: 10px uppercase letter-spacing 0.5px text-gray-400
- Agent indicators: 6px dot, green (#1D9E75) with CSS pulse animation when active

### Top Bar
- Height: 52px
- White background, bottom border 0.5px
- Logo: 15px semibold with small green dot
- Agency name badge: rounded pill, gray background

### Dashboard Layout
- Topbar (52px) + Sidebar (200px) + Main content area
- Main content padding: 24px
- Stats row: 4 equal cards in grid, gap 12px
- Pipeline table below stats
- Two-column grid at bottom: approvals + agent activity

### Pipeline Table Columns
Student | Universities | Status | Next Deadline | Agent

### Deadline Display
- Urgent (≤3 days): color #A32D2D, font-weight 500, DM Mono font
- Soon (≤7 days): color #854F0B, DM Mono font
- Normal: text-secondary gray, DM Mono font

### Overall Aesthetic
Design must feel like Linear or Notion — minimal, fast, professional. Never Bootstrap, never Material Design. No rounded corners bigger than 10px. No gradients. No decorative elements. No drop shadows. Everything flat with thin borders.

---

## BUILD ORDER

Build in this exact order. Do not move to the next phase until the current phase works and tests pass.

### PHASE 1 — Foundation
1. Initialize Next.js 14 project with TypeScript and Tailwind in /frontend
2. Initialize FastAPI project with folder structure in /backend
3. Connect FastAPI to Supabase — test connection
4. Run database migrations — all tables created with RLS enabled
5. Implement Supabase Auth — login page, session management, JWT middleware
6. Implement agency_id injection middleware — every request gets agency_id from JWT only, never from params
7. Test: create two agencies, create students in each, verify neither can see the other's data
8. Basic CRUD for students with agency isolation

**End of Phase 1 test:** Two test agencies exist. Agency A cannot see Agency B's students. Login works. JWT middleware injects agency_id on every request.

### PHASE 2 — Student Management
1. Complete student CRUD API with all fields
2. Student list page with search and filter
3. Student detail page with tabbed navigation
4. Document upload to Cloudflare R2
5. Document checklist component
6. Audit log — every create/update/delete writes to audit_logs

**End of Phase 2 test:** Can create a student, fill all fields, upload a document, see it in the checklist.

### PHASE 3 — Applications and Deadlines
1. Application CRUD
2. Common App section status tracker (10 sections)
3. Deadline creation and management
4. Deadline tracker agent — daily cron, Telegram alerts at 30/14/7/3/1 days
5. Approval queue page — shows all pending agent jobs

**End of Phase 3 test:** Create an application with deadlines. Receive a Telegram alert for an upcoming deadline. See pending approvals in the queue.

### PHASE 4 — AI Agents
1. Agent job system — create, run, update status, store output
2. Writer agent — essay draft from student profile, sends to Telegram for approval
3. Writer agent — rec letter generation same flow
4. Email agent — IMAP to student email, reads, categorizes, drafts replies
5. Document processor — OCR on uploaded documents

**End of Phase 4 test:** Request an essay. Receive draft in Telegram. Approve it. See it saved in database.

### PHASE 5 — Browser Agent
1. Steel.dev integration — launch cloud browser
2. Common App login with student credentials
3. Personal Info section fill from student profile
4. Screenshot capture, save to R2, send URL to Telegram
5. Approval gate — wait for approval before continuing
6. Remaining sections: Family, Education, Test Scores, Activities, Writing, Recommendations, Payment
7. Final submission gate — explicit approval required
8. Save confirmation screenshot PDF after submission

**End of Phase 5 test:** Run browser agent on a test Common App account. Each section fills, screenshot arrives in Telegram, approval continues to next section.

### PHASE 6 — Dashboard Polish
1. Pipeline Kanban board
2. Analytics page — acceptance rates, deadline compliance charts
3. Agency settings — logo, color, language
4. Staff management — invite, set role, deactivate
5. Real-time updates using Supabase Realtime
6. Export to PDF and Excel

**End of Phase 6 test:** Full demo walkthrough. Create agency, create student, run writer agent, approve essay, check analytics.

---

## DELIVERABLES

1. Complete working codebase with all files
2. Database migration files that run in order
3. README with setup instructions
4. railway.toml for Railway deployment
5. vercel.json for Vercel deployment
6. .env.example with all required variables listed
7. Seed script that creates a test super admin and two test agencies with sample data

---

## RULES

- Do not use placeholder code
- Do not use TODO comments
- Every function must be complete and working
- If uncertain about something, ask before guessing
- Start with Phase 1 only
- After each phase report: what was built, what to test, what comes next
- agency_id ALWAYS comes from JWT token — NEVER from request body or URL params
- Every database operation MUST include agency_id filter
- Every agent action MUST write to audit_logs

Start now with Phase 1. Report back when Phase 1 is complete and ready to test.
