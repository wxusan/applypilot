# ApplyPilot — Owner's Complete Guide
**For Xusan | How to use, manage, and grow the system**

---

## What ApplyPilot Is

ApplyPilot is your personal AI-powered college application operating system. It replaces everything you currently do manually — filling Common App forms, writing rec letters, tracking deadlines, managing student emails, organizing documents — and either does it automatically or prepares it for your approval.

You remain in control. Nothing gets submitted, sent, or published without your tap. The system does the work, you review and approve.

---

## The Big Picture

Here is the complete flow from signing a new student to submitting their application:

```
1. Agency gives you a student
        ↓
2. You type "new student" to your Telegram bot
        ↓
3. Intake agent asks you 20 questions one by one
        ↓
4. Student profile created in database automatically
        ↓
5. System generates document checklist
        ↓
6. You upload documents via dashboard as student sends them
        ↓
7. Document processor reads and categorizes them automatically
        ↓
8. You ask Writer agent for essays and rec letters
        ↓
9. Writer sends drafts to Telegram — you approve or edit
        ↓
10. Email agent monitors student inbox hourly
        ↓
11. Email agent drafts replies — you approve before sending
        ↓
12. You click "Fill Common App" on the application
        ↓
13. Browser agent logs in and fills each section
        ↓
14. Screenshots arrive in Telegram after each section
        ↓
15. You approve section by section
        ↓
16. Final approval — application submitted
        ↓
17. System updates status, saves confirmation screenshot
        ↓
18. Email agent monitors for university decisions
        ↓
19. Instant Telegram alert when decision arrives
```

That is your entire workflow. You interact almost entirely through Telegram and the dashboard. The heavy work happens automatically.

---

## Your Daily Routine

### Morning (8AM — automatic)
You receive a morning briefing on Telegram:

```
🌅 Good morning
━━━━━━━━━━━━━━━
📅 Deadlines this week: 3
⏳ Pending approvals: 2
📧 New emails: 5
🤖 Agent jobs overnight: 4
[View Dashboard]
```

This is your starting point. Check pending approvals first, then deal with anything urgent.

### During the day
- New emails arrive in student inboxes → Email agent reads, categorizes, drafts replies → you get Telegram notifications for anything important
- Agents working on essays or browser tasks → you get approval requests as they come
- Any deadline within 3 days → Telegram alert

### Evening (9PM — automatic)
Evening summary arrives on Telegram:
- What was completed today
- What is still pending
- Deadlines due tomorrow

---

## How to Use Telegram

Your Telegram bot is your primary interface. Everything you need is available through it.

### Commands
```
/status [student name]    See a student's application status
/deadlines                See all upcoming deadlines
/approvals                See all pending approval requests
/students                 See your active student list
/help                     List all commands
```

### Approval buttons
When an agent finishes a task, you receive a message with buttons:

```
✅ Approve    ✏️ Edit    ❌ Reject
```

Tap Approve to let the action proceed. Tap Edit to go to the dashboard and make changes first. Tap Reject to stop the action entirely and add a reason.

### Starting a new student
Just type:
```
new student
```
The intake agent will ask you questions one by one. Answer each one. It takes about 5 minutes and creates the full student profile automatically.

### Requesting writing tasks
Type naturally to the bot:
```
Write a personal statement for Alibek
Write a rec letter for Malika from her math teacher Aziz
Draft an email reply to Harvard's document request for Bobur
```

The writer agent will generate the content, score it, check word limits, and send you the full draft for approval.

---

## How to Use the Dashboard

Open `app.applypilot.com` in any browser. Log in with your credentials.

### Main Dashboard
The first thing you see every time you open the app:

**Stats row** — 4 numbers at a glance: active students, total applications, pending approvals, deadlines this week. Red numbers need immediate attention.

**Pipeline table** — all your students in one view. Shows name, universities, current status, next deadline, and which agent is working on them. Click any student name to open their full profile.

**Pending approvals** — the most important panel. Lists everything waiting for your decision. Approve or reject directly from this panel without navigating away.

**Agent activity** — what agents have been doing in the last few hours. Useful for checking progress without asking.

### Student Profile
Click any student to open their full profile. Tabs across the top:

**Profile** — all personal information, academic scores, contact details. Edit any field by clicking Edit.

**Applications** — all university applications for this student. Click any application to see the Common App section progress grid (10 sections, each tracked). Click "Fill Common App" to start the browser agent.

**Documents** — the document checklist. Green checkmark means uploaded and processed. Red X means missing. Upload any document by clicking the upload button. Supports PDF, JPG, PNG, DOCX.

**Emails** — all emails from the student's monitored inbox. Color coded by category. Blue for university updates. Red for urgent items. Shows AI draft status.

**Deadlines** — all application deadlines for this student. Countdown in days. Green is safe. Yellow is within 7 days. Red is within 3 days. Click any deadline to mark it complete.

**Activity** — the complete audit log for this student. Every action taken by any agent or any staff member, with timestamps and what changed.

### Approvals Page
`/approvals` — your most important page. Lists all pending agent jobs across all students. Each item shows the student, task type, which agent ran it, and when it was created. Approve or reject with one click. You can also see the output data — screenshots for browser tasks, full draft text for writing tasks.

### Analytics Page
`/analytics` — charts and numbers showing your operation at a glance:
- Students by status (donut chart)
- Applications by decision outcome (bar chart)
- Deadline compliance rate (how many you complete on time)
- Agent activity over the last 30 days

### Settings
`/settings` — manage your agency profile:
- Upload your logo (appears in the dashboard header)
- Change your primary brand color
- Switch dashboard language (English, Uzbek, Russian)
- Change your timezone (affects when daily briefings arrive)

`/settings/staff` — manage your team:
- Invite a staff member by email
- Set their role
- Deactivate them when they leave

---

## Understanding Agent Status

Every agent job shows a status. Here is what each means:

| Status | What it means | What to do |
|--------|--------------|------------|
| Pending | Job created, not started yet | Nothing — wait |
| Running | Agent is actively working | Nothing — wait |
| Waiting approval | Agent needs your decision | Go to approvals and tap approve/reject |
| Approved | You approved, agent continuing | Nothing — wait |
| Completed | Task finished successfully | Review the output |
| Failed | Something went wrong | Check the error in the activity log |
| Rejected | You rejected it | It stopped. No further action taken |

---

## The Browser Agent — Step by Step

When you click "Fill Common App" on an application, this is the exact sequence:

1. Agent logs into Common App with student credentials
2. Screenshot appears in Telegram → you tap Approve
3. Agent fills Personal Info → screenshot → you tap Approve
4. Agent fills Family section → screenshot → you tap Approve
5. Agent fills Education → screenshot → you tap Approve
6. Agent fills Test Scores → screenshot → you tap Approve
7. Agent fills Activities → screenshot → you tap Approve
8. Agent uploads approved essays to Writing section → screenshot → you tap Approve
9. Agent requests teacher recommendations → screenshot → you tap Approve
10. Agent completes School Report → screenshot → you tap Approve
11. Agent fills Payment/Fee Waiver → screenshot → you see:

```
⚠️ FINAL STEP
Ready to SUBMIT application for [student] to [university].
This cannot be undone.
[✅ Submit] [❌ Cancel]
```

12. You tap Submit → application is submitted → confirmation screenshot saved

The entire process takes 15–30 minutes depending on how quickly you approve each step. You can approve in Telegram from your phone while doing other things.

---

## Document Checklist

For every student, the system tracks these documents:

- Passport / national ID
- High school transcript (official)
- SAT/ACT score report (if applicable)
- TOEFL or IELTS report (if applicable)
- Personal statement (generated by Writer agent)
- Recommendation letters (generated by Writer agent, one per recommender)
- Financial documents (if required)
- Additional essays (supplemental, generated by Writer agent)

Green checkmark = uploaded and OCR processed.
Red X = still missing.

Upload documents by going to the student's Documents tab and dragging files into the upload area. The document processor agent runs automatically and extracts the text content for reference.

---

## Email Monitoring

The email agent monitors student inboxes hourly. Here is how it categorizes emails:

| Category | Color | What it means |
|----------|-------|--------------|
| Acceptance | Green | 🎉 Student got in |
| Rejection | Red | Student did not get in |
| Waitlist | Yellow | Student is waitlisted |
| Document request | Orange | University needs more docs |
| Interview invite | Blue | Student has an interview |
| Financial aid | Purple | Financial aid update |
| University update | Gray | General update |
| General | Gray | Everything else |

For acceptance, rejection, and waitlist emails — you get an instant Telegram alert. Do not wait for the morning briefing for these.

The agent drafts a reply for document requests and other university communications. You review the draft and approve before it sends.

---

## Staff Access

Staff members you invite can:
- View all student profiles and applications
- Upload documents
- See agent activity and task status
- See the pipeline and deadline tracker

Staff members cannot:
- See student email passwords or portal passwords
- Approve agent job submissions
- Access the credential vault
- Change system settings
- Invite or deactivate other staff

You are the only one who can approve submissions and access credentials. This is intentional — it protects you if a staff member makes a mistake or leaves.

---

## Exporting Data

From the students list (`/students`) — export all students as Excel. Includes all fields.

From a student profile page — export that student's full application report as PDF. Includes profile, all applications, statuses, deadlines, and decisions. Good for client-facing updates.

---

## What To Do When Something Goes Wrong

**Agent job failed:** Go to `/approvals` or the student's Activity tab. Find the failed job. Read the error message. Most failures are either expired credentials or a network error. For browser failures, you can simply click "Fill Common App" again — the agent will start fresh.

**Telegram bot not responding:** Check that your Mac Mini is on and OpenClaw (or Railway) is running. Check that your Telegram bot token is valid.

**Document not uploading:** Check file size (maximum 25MB). Check file format (PDF, JPG, PNG, DOCX, XLSX only). Try again.

**Common App section not filling correctly:** The browser agent uses Playwright selectors that may break if Common App changes their layout. If a section fails, open the Common App manually and fill that section yourself. Mark the section as "completed" manually in the dashboard and continue with the next section.

**Deadline alert not arriving:** Check your Telegram bot is active. Check your agency timezone setting in `/settings`. Check that the deadline's `alert_days_before` includes the correct number.

---

## Growing to a SaaS Business

When you are ready to bring other agencies on:

1. Go to `/admin` (super admin only)
2. Click "Create Agency"
3. Enter agency name and admin email
4. The agency admin receives an email invitation
5. They log in, see only their own data, start working

Each agency is completely isolated. They cannot see your students. You cannot see their students by accident. The database enforces this at the query level.

Pricing you can charge:
- Starter: $99/month — up to 15 students
- Growth: $249/month — up to 40 students
- Agency: $499/month — unlimited

Your running cost for each additional agency on Railway and Supabase is approximately $8–15/month. Everything above that is profit.

---

## Important Things to Never Do

- Never share your `ENCRYPTION_KEY` with anyone. If you lose it, all stored credentials become unrecoverable.
- Never post API keys in any chat or message.
- Never approve a Common App submission without reviewing the screenshots.
- Never give staff admin role unless absolutely necessary.
- Never delete a student record — deactivate instead, in case you need the audit trail.

---

## Quick Reference Card

| Task | How |
|------|-----|
| Add new student | Type "new student" in Telegram |
| Request essay | Type "write essay for [name]" in Telegram |
| Request rec letter | Type "write rec letter for [name] from [teacher]" in Telegram |
| Fill Common App | Dashboard → Student → Applications → Fill Common App button |
| Approve pending task | Telegram inline button or `/approvals` page |
| Check deadlines | `/deadlines` in Telegram or Deadlines tab in dashboard |
| Upload document | Dashboard → Student → Documents → Upload |
| Export student data | `/students` page → Export button |
| Invite staff | `/settings/staff` → Invite |
| Add new agency | `/admin` → Create Agency |
| Check agent activity | Dashboard → Agent Activity panel |

---

*This guide covers everything you need to run ApplyPilot day to day. Keep it bookmarked.*
