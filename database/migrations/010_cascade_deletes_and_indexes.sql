-- Migration 010: Cascade deletes + performance indexes
-- Fixes:
--   H4 — Add ON DELETE CASCADE so deleting a student cleans up all child rows
--   H9 — Add indexes on high-traffic columns to speed up common queries

-- ─── H4: Cascade deletes ────────────────────────────────────────────────────
-- Without CASCADE, deleting a student leaves orphaned rows in every child
-- table. The fix is to drop the existing FK constraints and recreate them
-- with ON DELETE CASCADE.

-- automation_steps → automation_workflows
ALTER TABLE automation_steps
  DROP CONSTRAINT IF EXISTS automation_steps_workflow_id_fkey,
  ADD CONSTRAINT automation_steps_workflow_id_fkey
    FOREIGN KEY (workflow_id)
    REFERENCES automation_workflows(id)
    ON DELETE CASCADE;

-- automation_steps → students (via workflow)
-- automation_workflows → students
ALTER TABLE automation_workflows
  DROP CONSTRAINT IF EXISTS automation_workflows_student_id_fkey,
  ADD CONSTRAINT automation_workflows_student_id_fkey
    FOREIGN KEY (student_id)
    REFERENCES students(id)
    ON DELETE CASCADE;

-- agent_jobs → students
ALTER TABLE agent_jobs
  DROP CONSTRAINT IF EXISTS agent_jobs_student_id_fkey,
  ADD CONSTRAINT agent_jobs_student_id_fkey
    FOREIGN KEY (student_id)
    REFERENCES students(id)
    ON DELETE CASCADE;

-- emails → students
ALTER TABLE emails
  DROP CONSTRAINT IF EXISTS emails_student_id_fkey,
  ADD CONSTRAINT emails_student_id_fkey
    FOREIGN KEY (student_id)
    REFERENCES students(id)
    ON DELETE CASCADE;

-- documents → students
ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_student_id_fkey,
  ADD CONSTRAINT documents_student_id_fkey
    FOREIGN KEY (student_id)
    REFERENCES students(id)
    ON DELETE CASCADE;

-- essays → students
ALTER TABLE essays
  DROP CONSTRAINT IF EXISTS essays_student_id_fkey,
  ADD CONSTRAINT essays_student_id_fkey
    FOREIGN KEY (student_id)
    REFERENCES students(id)
    ON DELETE CASCADE;

-- essay_versions → essays
ALTER TABLE essay_versions
  DROP CONSTRAINT IF EXISTS essay_versions_essay_id_fkey,
  ADD CONSTRAINT essay_versions_essay_id_fkey
    FOREIGN KEY (essay_id)
    REFERENCES essays(id)
    ON DELETE CASCADE;

-- student_credentials → students
ALTER TABLE student_credentials
  DROP CONSTRAINT IF EXISTS student_credentials_student_id_fkey,
  ADD CONSTRAINT student_credentials_student_id_fkey
    FOREIGN KEY (student_id)
    REFERENCES students(id)
    ON DELETE CASCADE;

-- applications → students
ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_student_id_fkey,
  ADD CONSTRAINT applications_student_id_fkey
    FOREIGN KEY (student_id)
    REFERENCES students(id)
    ON DELETE CASCADE;


-- ─── H9: Performance indexes ─────────────────────────────────────────────────
-- These cover the most common query patterns in the application.

-- automation_steps: dispatcher polls (workflow_id, status) constantly
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_automation_steps_workflow_status
  ON automation_steps(workflow_id, status);

-- automation_steps: step ordering within a workflow
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_automation_steps_workflow_order
  ON automation_steps(workflow_id, step_index);

-- agent_jobs: list by agency + status (dashboard, approvals page)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_jobs_agency_status
  ON agent_jobs(agency_id, status);

-- agent_jobs: list by student
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_jobs_student
  ON agent_jobs(student_id);

-- emails: most common query — by student + received_at for timeline
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_student_received
  ON emails(student_id, received_at DESC);

-- emails: unread count badge
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_agency_unread
  ON emails(agency_id, is_read) WHERE is_read = false;

-- documents: by student (document checklist, documents tab)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_student
  ON documents(student_id, created_at DESC);

-- students: search by name (ilike query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_name_lower
  ON students(agency_id, lower(full_name));

-- essays: by student
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_essays_student
  ON essays(student_id, created_at DESC);
