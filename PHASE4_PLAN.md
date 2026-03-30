# Phase 4: ApplyPilot MVP Automation Plan
## Replacing Coordinators — Full Workflow Automation

---

## What This Phase Achieves

A coordinator at a college consulting agency does the following for every student:
1. Collects student data
2. Logs into student/teacher/counsellor Gmail accounts
3. Creates and fills out Common App for student (profile, universities, supplements, personal statement)
4. Submits applications on behalf of student
5. Logs into teacher Gmail → finds invitation → creates teacher Common App → writes and submits rec letter
6. Logs into counsellor Gmail → same + uploads transcript and other documents
7. Monitors student Gmail for university emails (portal activations, document requests, decisions)
8. Activates university portals, uploads missing documents
9. Downloads admission decisions → notifies staff to forward to student

This platform replaces ALL of that. Coordinator only inputs data and approves each step.
Platform does the rest autonomously.

---

## Ground Rules

- **No student contact.** Platform only talks to coordinators and admins.
- **Approve before every action.** Platform prepares → coordinator reviews screenshot + content → approves → platform executes.
- **AI generates everything by default.** Personal statement, supplements, rec letters — all AI-generated. Coordinator can edit before approving.
- **Payment = hard stop.** If a fee is required, platform pauses, notifies coordinator with full details, waits for manual payment confirmation.
- **2FA = soft stop.** Platform attempts Gmail login automatically. If 2FA is triggered, platform takes screenshot, notifies coordinator, waits for coordinator to handle it on the actual device.
- **Documents come from the platform.** Coordinator uploads all files (transcript, SAT scores, etc.) to the student's Documents section. Automation pulls from there.

---

## New Database Tables

### 1. `student_credentials`
Encrypted storage for Gmail and Common App credentials.

```sql
id              uuid PRIMARY KEY
student_id      uuid REFERENCES students(id)
agency_id       uuid REFERENCES agencies(id)
credential_type text  -- 'student' | 'teacher' | 'counsellor'
label           text  -- e.g. "Mr. Johnson (Physics Teacher)"
gmail_email     text
gmail_password  text  -- AES-256 encrypted
common_app_email    text
common_app_password text  -- AES-256 encrypted
notes           text
is_active       boolean DEFAULT true
last_tested_at  timestamptz
last_test_result text  -- 'success' | 'failed' | '2fa_required'
created_at      timestamptz
updated_at      timestamptz
```

### 2. `automation_workflows`
One per student. Tracks the full application journey.

```sql
id              uuid PRIMARY KEY
student_id      uuid REFERENCES students(id)
agency_id       uuid REFERENCES agencies(id)
status          text  -- 'draft' | 'running' | 'paused' | 'awaiting_approval' | 'completed' | 'failed'
current_step    integer DEFAULT 0
universities    jsonb  -- [{name, round, common_app_id, status}]
started_at      timestamptz
completed_at    timestamptz
started_by      uuid REFERENCES users(id)
notes           text
created_at      timestamptz
updated_at      timestamptz
```

### 3. `automation_steps`
One row per action in the workflow. Every step that touches a browser or generates content.

```sql
id              uuid PRIMARY KEY
workflow_id     uuid REFERENCES automation_workflows(id)
agency_id       uuid REFERENCES agencies(id)
step_index      integer
step_type       text  -- see Step Types below
step_name       text  -- human-readable name
status          text  -- 'pending'|'running'|'awaiting_approval'|'approved'|'completed'|'failed'|'skipped'
screenshots     jsonb  -- array of {url, caption, taken_at}
ai_content      text  -- AI-generated essay/supplement/letter
coordinator_content text  -- edited version (if coordinator changed it)
final_content   text  -- what was actually submitted
metadata        jsonb  -- step-specific data (university name, question text, etc.)
error_message   text
approved_by     uuid REFERENCES users(id)
approved_at     timestamptz
rejected_reason text
created_at      timestamptz
updated_at      timestamptz
```

**Step Types:**
- `gmail_login_student` / `gmail_login_teacher` / `gmail_login_counsellor`
- `common_app_create_student` / `common_app_login_student`
- `common_app_personal_info` / `common_app_family` / `common_app_education`
- `common_app_test_scores` / `common_app_activities`
- `common_app_personal_statement`
- `common_app_add_universities`
- `common_app_supplement` (one per university)
- `common_app_submit` (one per university)
- `teacher_find_invitation` / `teacher_create_account` / `teacher_fill_profile`
- `teacher_rec_letter` / `teacher_submit`
- `counsellor_find_invitation` / `counsellor_create_account` / `counsellor_fill_profile`
- `counsellor_upload_documents` / `counsellor_rec_letter` / `counsellor_submit`
- `email_monitor_check`
- `portal_activate` / `portal_check_documents` / `portal_upload_document`
- `decision_download`
- `payment_pause`

### 4. `monitored_emails`
Emails found in student Gmail, classified by AI.

```sql
id              uuid PRIMARY KEY
student_id      uuid REFERENCES students(id)
agency_id       uuid REFERENCES agencies(id)
gmail_message_id text UNIQUE
from_address    text
subject         text
received_at     timestamptz
body_preview    text  -- first 500 chars
classification  text  -- 'portal_activation'|'document_request'|'decision'|'general_university'|'ignore'
university_name text
portal_link     text
portal_pin      text
content_summary text  -- AI summary of what the email says
is_actioned     boolean DEFAULT false
actioned_at     timestamptz
created_at      timestamptz
```

### 5. `portal_sessions`
University portal access info per student.

```sql
id              uuid PRIMARY KEY
student_id      uuid REFERENCES students(id)
agency_id       uuid REFERENCES agencies(id)
university_name text
portal_url      text
portal_pin      text
activation_status text  -- 'not_started'|'activated'|'failed'
missing_documents jsonb  -- list of what portal is asking for
uploaded_documents jsonb  -- what has been uploaded
checklist_screenshot text  -- URL
decision_status text  -- 'pending'|'accepted'|'rejected'|'waitlisted'|'deferred'
decision_url    text
decision_pdf_path text  -- path in storage
decision_found_at timestamptz
last_checked_at timestamptz
created_at      timestamptz
updated_at      timestamptz
```

### 6. `payment_flags`
Paused steps that need manual payment.

```sql
id              uuid PRIMARY KEY
workflow_id     uuid REFERENCES automation_workflows(id)
step_id         uuid REFERENCES automation_steps(id)
student_id      uuid REFERENCES students(id)
agency_id       uuid REFERENCES agencies(id)
university_name text
amount          numeric(8,2)
currency        text DEFAULT 'USD'
payment_url     text
screenshot_url  text
status          text  -- 'pending'|'paid'|'waived'
marked_paid_by  uuid REFERENCES users(id)
marked_paid_at  timestamptz
notes           text
created_at      timestamptz
```

---

## New Backend Files

### `backend/api/credentials.py`
- `POST /api/credentials` — add credentials for a student
- `GET /api/credentials?student_id=` — list (passwords masked)
- `PATCH /api/credentials/{id}` — update
- `DELETE /api/credentials/{id}` — remove
- `POST /api/credentials/{id}/test` — attempt Gmail login, return result

### `backend/api/workflows.py`
- `POST /api/workflows` — create workflow for a student
- `GET /api/workflows?student_id=` — list workflows
- `GET /api/workflows/{id}` — get workflow with all steps
- `POST /api/workflows/{id}/start` — begin execution
- `POST /api/workflows/{id}/pause` — pause
- `POST /api/workflows/{id}/resume` — resume

### `backend/api/workflow_steps.py`
- `GET /api/workflow-steps/{id}` — get step detail with screenshots
- `POST /api/workflow-steps/{id}/approve` — approve + optional edited content
- `POST /api/workflow-steps/{id}/reject` — reject with reason
- `POST /api/workflow-steps/{id}/retry` — retry a failed step

### `backend/api/email_monitor.py`
- `GET /api/email-monitor?student_id=` — list classified emails
- `POST /api/email-monitor/{id}/action` — mark as actioned
- `POST /api/email-monitor/scan` — trigger manual scan of student Gmail

### `backend/api/portals.py`
- `GET /api/portals?student_id=` — list portal sessions
- `POST /api/portals` — create portal entry
- `PATCH /api/portals/{id}` — update portal status
- `POST /api/portals/{id}/activate` — trigger portal activation automation
- `POST /api/portals/{id}/upload-document` — trigger document upload

### `backend/api/payments.py`
- `GET /api/payments?workflow_id=` — list payment flags
- `POST /api/payments/{id}/mark-paid` — coordinator marks payment done
- `POST /api/payments/{id}/waive` — mark as waived (fee waiver applied)

### `backend/agents/gmail_agent.py`
Playwright-based Gmail automation:
- `login(email, password)` → returns `{status: success|failed|2fa_required, screenshot}`
- `find_email(subject_contains, from_contains)` → returns email content
- `extract_link_and_pin(email_content)` → returns `{link, pin}`
- `send_email(to, subject, body)` → sends from logged-in account
- `get_unread_emails(limit)` → returns list of email summaries

### `backend/agents/common_app_agent.py`
Playwright-based Common App automation:
- `create_account(student_data)` → creates new Common App account
- `login(email, password)` → logs into existing account
- `fill_personal_info(data)` → fills all personal info fields
- `fill_family(data)` → fills family section
- `fill_education(data)` → fills education history
- `fill_test_scores(data)` → fills SAT/ACT/TOEFL
- `fill_activities(data)` → fills up to 10 activities
- `paste_personal_statement(text)` → pastes essay
- `add_universities(university_list)` → searches + adds each university
- `get_available_rounds(university_name)` → returns [ED, EA, RD, etc.]
- `fill_supplement(university, question, answer)` → fills one supplement question
- `submit_application(university)` → submits (or pauses at payment)
- `fill_teacher_section(teacher_data, student_data)` → teacher profile
- `paste_recommendation_letter(text)` → pastes rec letter
- `fill_counsellor_section(counsellor_data, student_data)` → counsellor profile
- `upload_document(file_path, document_type)` → uploads file to Common App

### `backend/agents/portal_agent.py`
Playwright-based university portal automation:
- `activate_portal(url, pin)` → activates portal with one-time PIN
- `get_missing_documents(portal_url)` → returns list of required docs
- `upload_document(portal_url, file_path, doc_type)` → uploads to portal
- `check_for_decision(portal_url)` → returns decision status if available
- `download_decision(portal_url)` → downloads PDF, returns file path

### `backend/services/content_generator.py`
AI content generation (GPT-4o):
- `generate_personal_statement(student_profile)` → 650-word essay
- `generate_supplement(student_profile, university, question, word_limit)` → supplement answer
- `generate_rec_letter(student_profile, teacher_info, letter_type)` → recommendation letter
- `classify_email(subject, body)` → returns classification + summary
- `generate_activity_description(activity)` → 150-char activity description

### `backend/services/credential_vault.py`
AES-256 encryption for credentials:
- `encrypt(plaintext)` → encrypted string
- `decrypt(ciphertext)` → plaintext
- Key stored as Railway environment variable `CREDENTIAL_ENCRYPTION_KEY`

---

## New Frontend Pages

### `/students/[id]/credentials`
Tab added to student profile.
- Table: Type | Label | Gmail | Common App | Last Tested | Status | Actions
- Add Credential button → modal (type, label, gmail email+password, common app email+password)
- Test Connection button per row → shows spinner → result badge
- 2FA notice if test returns 2fa_required

### `/students/[id]/workflow`
Main automation dashboard for a student.
- "Start New Workflow" button → opens university list input
  - Textarea: one university per line
  - Platform fetches available rounds per university (via Common App agent)
  - Coordinator selects ED/EA/RD per university
  - Confirm → creates workflow
- Vertical timeline of all steps (pending → running → awaiting approval → done)
- Each awaiting-approval step glows amber and has Approve/Reject button
- Running step shows animated spinner
- Failed step shows red with error message + Retry button

### `/students/[id]/workflow/step/[stepId]`
Step detail / approval page.
- Screenshots carousel (all screenshots for this step)
- If step has AI content (essay, supplement, rec letter):
  - Shows AI-generated text in editable textarea
  - Word count, character count
  - "Use AI Version" or "Use My Version" toggle
- Step metadata (university name, question being answered, etc.)
- Approve & Proceed (green) / Reject & Stop (red) buttons

### `/students/[id]/emails`
Monitored Gmail inbox.
- Table: Received | From | Subject | Classification | University | Summary | Action
- Color-coded badges: portal_activation (blue), document_request (orange), decision (green), ignore (gray)
- "Scan Now" button → triggers immediate Gmail scan
- Action buttons per email:
  - portal_activation → "Activate Portal" → triggers portal automation
  - document_request → "Handle Request" → links to portal upload
  - decision → "View Decision" → opens decision detail

### `/students/[id]/portals`
University portal tracker.
- Card per university: name, activation status, missing docs, decision status
- Activate button → triggers portal activation step
- Upload Document button → pick from student's Documents + trigger upload
- Decision badge: Pending / Accepted (green) / Rejected (red) / Waitlisted (yellow) / Deferred (orange)

### `/students/[id]/payments`
Pending payment flags.
- Table: University | Amount | Status | Date | Actions
- Each row: screenshot thumbnail, payment link, "Mark as Paid" / "Waive Fee" buttons

---

## Approval Flow Detail

Every step that matters follows this exact sequence:

```
1. Platform executes action in background (Playwright)
2. Takes screenshot(s) at key moments
3. If step generates AI content: saves to automation_steps.ai_content
4. Sets step status → 'awaiting_approval'
5. Creates in-platform notification: "Step needs review: [name] — [student]"
6. Sends Telegram message to coordinator: same info
7. Coordinator opens step detail page → sees screenshots + content
8. Coordinator optionally edits content
9. Coordinator clicks Approve (or Reject)
10. If approved: platform proceeds to next step
11. If rejected: workflow pauses, coordinator can fix data and retry
```

---

## Execution Order (Priority)

| Order | Phase | What It Unlocks |
|-------|-------|-----------------|
| 1 | 4A — Credential Vault | Everything else needs credentials |
| 2 | 4B — Workflow Engine | Backbone for all automation |
| 3 | 4J — Approval UI | Coordinators need this to work |
| 4 | 4C — Gmail Login Agent | First thing the workflow does |
| 5 | 4I — Payment Pause | Needed during submit flow |
| 6 | 4D — Common App Student | Core value — fills + submits applications |
| 7 | 4C2 — Gmail Monitor | Runs after submission |
| 8 | 4E — Teacher Automation | After student submitted |
| 9 | 4F — Counsellor Automation | Parallel to teacher |
| 10 | 4G — Portal Automation | After emails arrive |
| 11 | 4H — Decision Detection | Final step of workflow |

---

## Environment Variables Needed on Railway

```
CREDENTIAL_ENCRYPTION_KEY=<32-byte random hex key>
PLAYWRIGHT_HEADLESS=true
GMAIL_SCAN_INTERVAL_MINUTES=5
```

---

## Supabase Migration Needed

Run `database/migrations/006_phase4_tables.sql` in Supabase SQL Editor after code is deployed.

---

*Total new files: ~13 backend, ~8 frontend pages, 6 database tables*
*This phase replaces a full-time coordinator for every student application.*
