# ApplyPilot — Product Brief for Google Stitch

## What is ApplyPilot?

ApplyPilot is a B2B SaaS platform for college consulting agencies. These are professional businesses that help high school students apply to universities. An agency has a team of counselors (staff) who each manage a portfolio of students. The platform handles everything from the first student intake meeting through final application submissions and decisions.

The core problem it solves: college consulting agencies currently manage their work across spreadsheets, WhatsApp, Google Drive, and email. ApplyPilot consolidates all of it — student records, application tracking, deadlines, documents, emails, and team coordination — into one tool.

---

## User Roles

**Super Admin** (ApplyPilot team) — manages all agencies on the platform. Creates new agencies, controls billing and plan limits, reviews audit logs across all accounts.

**Agency Admin / Owner** — runs one consulting agency. Manages their staff, views all students across the agency, controls agency settings and billing.

**Staff / Counselor** — day-to-day user. Manages their assigned students, tracks applications and deadlines, drafts emails, uploads documents.

**Student** — not a platform user. They are the subject being managed. Their data lives in the system but they don't log in.

---

## Platform Structure

### Authentication
- Login (email/password or Google OAuth)
- Invitation-based access — no self-serve signup. New agencies are created by Super Admin. New staff are invited by Agency Admin.
- Accept invite page — staff receive an email link to set their password
- Password reset flow
- Terms of Service acceptance — first login shows a full-screen agreement modal

### Public Marketing Site
A landing page explaining the product to prospective agency clients. Contains: product value proposition, feature overview, pricing tiers (Starter / Pro / Enterprise), and a contact/request-access form. Not a login wall — it's a real marketing page.

---

## Core Application Pages

### Students
The central resource of the platform. A student record contains:
- Personal info: name (including preferred name), email, phone, nationality, date of birth
- Academic profile: GPA, SAT score, ACT score, TOEFL/IELTS scores
- Enrollment info: application season (e.g. Fall 2026), graduation year, intended major
- Status: tracks where they are in the process — Intake → Forms → Writing → Review → Submitted → Accepted/Rejected
- Notes

**Students List** — the main view staff use every day. Shows all students with their status, key academic stats, next upcoming deadline, and when they were added. Has search, status filter, season filter, and bulk actions (change multiple students' status at once). Supports pagination (25 per page). Can export to CSV.

**Student Profile** — a detail view organized into tabs:
- *Profile tab*: all personal and academic info. Fields are editable inline (click a value to edit it, press Enter to save).
- *Applications tab*: list of universities the student is applying to. Each entry has the school name, application type (Regular Decision / Early Action / Early Decision / Rolling), deadline date, and the current decision status (Pending / Applied / Accepted / Rejected / Waitlisted).
- *Deadlines tab*: all deadlines across all applications. Visually highlights overdue deadlines (past due) and urgent deadlines (within 3 days). Sortable and filterable by type.
- *Documents tab*: file uploads organized by category (Transcripts, Test Scores, Essays, Recommendations, Other). Drag-and-drop upload.
- *Emails tab*: email history for this student. Staff can compose emails with AI assistance — the AI drafts the email, but a human must review and approve before it sends.
- *Activity tab*: audit log of everything that's happened to this student's record.

**New Student Form** — a form to add a new student. Collects all personal, academic, and enrollment info.

### Pipeline / Kanban
A visual board showing all students organized by their current status. Seven columns corresponding to the seven statuses. Staff can drag students between columns to update their status. Useful for getting a quick overview of where everyone is in the process. Shows a summary bar indicating the distribution of students across stages.

### Analytics
Charts and statistics about the agency's performance:
- Total students, acceptance rate, average GPA, applications submitted
- Breakdown of applications by status
- Students by application season
- Top schools by number of applications
- Monthly student intake trend

### Notifications
In-app notification center. Alerts for: upcoming deadlines, new students added, application decisions received, system events. Shows unread count badge on the nav icon.

---

## Agency Admin Pages (Settings)

**Team Management** — invite new staff members by email, assign roles (Admin / Staff / Viewer), deactivate or remove members. Shows how many staff slots are used vs the plan limit.

**Billing** — shows current plan, renewal date, days remaining, and usage against limits (staff count, student count, AI token usage). Has a "Request Renewal or Upgrade" action that notifies the Super Admin. Shows billing history.

**Agency Profile** — agency name, logo, contact email, timezone.

---

## Super Admin Pages

**Agencies List** — table of all agencies on the platform. Shows plan, usage, status (active/suspended). Each row can be expanded to show a billing management panel where Super Admin can:
- Approve next billing month (manually mark as paid)
- Upgrade the agency's plan
- Increase their staff or student limits
- Unlock specific premium features
- Add a payment note (e.g. "paid 150k UZS via Click")
- View billing history for that agency

**Create New Agency** — a form/modal to create a new agency and send an invitation email to the agency owner.

**Audit Log** — a full log of all actions taken across the platform: who did what, when, on which record, from which agency. Filterable by action type, entity, agency, user, and date range.

---

## Key Interactions and Behaviors

- **Status changes** happen in multiple places: inline dropdown on student profile header, drag-and-drop on Kanban, bulk action from the students list
- **Inline editing** on the student profile — clicking any field value makes it editable in place without navigating to a separate edit page
- **AI email drafting** — staff click "Draft with AI" when composing an email, the AI generates a draft based on the student's context, the counselor edits it, then approves it for sending
- **Browser agent** (premium feature) — for supported application portals (CommonApp, Coalition), an AI agent can log into the portal using stored credentials, fill in the student's information section by section, and take screenshots for the counselor to review. The agent never submits — the human always reviews and submits manually.
- **Deadline urgency** — deadlines are color-coded: overdue shows red, due within 3 days shows amber, everything else is normal
- **Device restriction** — the dashboard only works on desktop/laptop. Phone users see a full-screen message to switch to a computer. Small tablets see a warning with an option to continue anyway.
- **First login** — always shows a Terms of Service agreement in both English and Uzbek before accessing the dashboard

---

## Technical Context (for design decisions)

- Web app, desktop-first (minimum ~1100px width)
- Used in Uzbekistan primarily, with English as the interface language (Uzbek and Russian supported in AI responses)
- Agencies range from 2-person boutique firms to 15-person teams
- Students per agency: typically 20–200 active at a time
- The platform handles sensitive data: student academic records, passport info, application credentials. Design should feel trustworthy and professional, not casual.
