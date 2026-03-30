-- Phase 4A/B/C Tables Migration
-- Creates all 6 Phase 4 tables with encryption, RLS, and automation workflows

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- Table 1: student_credentials
-- Encrypted storage of Gmail and Common App credentials
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_credentials (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    credential_type text NOT NULL CHECK (credential_type IN ('student', 'teacher', 'counsellor')),
    label text NOT NULL,
    gmail_email text NOT NULL,
    gmail_password text NOT NULL,  -- Encrypted with credential_vault
    common_app_email text,
    common_app_password text,  -- Encrypted with credential_vault
    notes text,
    is_active boolean NOT NULL DEFAULT true,
    last_tested_at timestamptz,
    last_test_result text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_credentials_student_id ON student_credentials(student_id);
CREATE INDEX idx_student_credentials_agency_id ON student_credentials(agency_id);
CREATE INDEX idx_student_credentials_student_agency ON student_credentials(student_id, agency_id);
CREATE INDEX idx_student_credentials_is_active ON student_credentials(is_active);

-- RLS for student_credentials
ALTER TABLE student_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY student_credentials_agency_isolation ON student_credentials
    FOR ALL
    USING (agency_id = auth.uid() OR agency_id IN (
        SELECT agency_id FROM users WHERE id = auth.uid()
    ));

-- Updated_at trigger
CREATE TRIGGER student_credentials_updated_at
    BEFORE UPDATE ON student_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- Table 2: automation_workflows
-- Tracks multi-step application automation for each student
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_workflows (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'paused', 'completed', 'failed')),
    current_step integer NOT NULL DEFAULT 0,
    universities jsonb NOT NULL DEFAULT '[]',  -- [{name, portal_url, status}, ...]
    started_at timestamptz,
    completed_at timestamptz,
    started_by uuid REFERENCES users(id) ON DELETE SET NULL,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_workflows_student_id ON automation_workflows(student_id);
CREATE INDEX idx_automation_workflows_agency_id ON automation_workflows(agency_id);
CREATE INDEX idx_automation_workflows_status ON automation_workflows(status);
CREATE INDEX idx_automation_workflows_student_agency ON automation_workflows(student_id, agency_id);

-- RLS for automation_workflows
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY automation_workflows_agency_isolation ON automation_workflows
    FOR ALL
    USING (agency_id = auth.uid() OR agency_id IN (
        SELECT agency_id FROM users WHERE id = auth.uid()
    ));

-- Updated_at trigger
CREATE TRIGGER automation_workflows_updated_at
    BEFORE UPDATE ON automation_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- Table 3: automation_steps
-- Individual steps within a workflow (AI fills Common App, coordinator reviews, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_steps (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id uuid NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    step_index integer NOT NULL,
    step_type text NOT NULL,  -- 'ai_fill', 'coordinator_review', 'payment_check', etc.
    step_name text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved', 'rejected', 'skipped', 'failed')),
    screenshots jsonb NOT NULL DEFAULT '[]',  -- [{url, timestamp, caption}, ...]
    ai_content text,  -- AI-generated form fill or analysis
    coordinator_content text,  -- Coordinator's notes/feedback
    final_content text,  -- Approved final content submitted to portal
    metadata jsonb NOT NULL DEFAULT '{}',
    error_message text,
    approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
    approved_at timestamptz,
    rejected_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_steps_workflow_id ON automation_steps(workflow_id);
CREATE INDEX idx_automation_steps_agency_id ON automation_steps(agency_id);
CREATE INDEX idx_automation_steps_status ON automation_steps(status);
CREATE INDEX idx_automation_steps_step_type ON automation_steps(step_type);
CREATE INDEX idx_automation_steps_workflow_agency ON automation_steps(workflow_id, agency_id);

-- RLS for automation_steps
ALTER TABLE automation_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY automation_steps_agency_isolation ON automation_steps
    FOR ALL
    USING (agency_id = auth.uid() OR agency_id IN (
        SELECT agency_id FROM users WHERE id = auth.uid()
    ));

-- Updated_at trigger
CREATE TRIGGER automation_steps_updated_at
    BEFORE UPDATE ON automation_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- Table 4: monitored_emails
-- Inbound emails from universities (decisions, portal links, payment reminders)
-- ============================================================================

CREATE TABLE IF NOT EXISTS monitored_emails (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    gmail_message_id text NOT NULL UNIQUE,
    from_address text NOT NULL,
    subject text NOT NULL,
    received_at timestamptz NOT NULL,
    body_preview text,
    classification text,  -- 'admission_decision', 'portal_link', 'payment_reminder', 'document_request', 'other'
    university_name text,
    portal_link text,
    portal_pin text,
    content_summary text,
    is_actioned boolean NOT NULL DEFAULT false,
    actioned_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_monitored_emails_student_id ON monitored_emails(student_id);
CREATE INDEX idx_monitored_emails_agency_id ON monitored_emails(agency_id);
CREATE INDEX idx_monitored_emails_classification ON monitored_emails(classification);
CREATE INDEX idx_monitored_emails_is_actioned ON monitored_emails(is_actioned);
CREATE INDEX idx_monitored_emails_student_agency ON monitored_emails(student_id, agency_id);

-- RLS for monitored_emails
ALTER TABLE monitored_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY monitored_emails_agency_isolation ON monitored_emails
    FOR ALL
    USING (agency_id = auth.uid() OR agency_id IN (
        SELECT agency_id FROM users WHERE id = auth.uid()
    ));


-- ============================================================================
-- Table 5: portal_sessions
-- Tracks login sessions and progress in each university's portal
-- ============================================================================

CREATE TABLE IF NOT EXISTS portal_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    university_name text NOT NULL,
    portal_url text,
    portal_pin text,
    activation_status text NOT NULL DEFAULT 'not_started' CHECK (activation_status IN ('not_started', 'activated', 'locked', 'expired')),
    missing_documents jsonb NOT NULL DEFAULT '[]',  -- [{name, status, deadline}, ...]
    uploaded_documents jsonb NOT NULL DEFAULT '[]',  -- [{name, uploaded_at, filename}, ...]
    checklist_screenshot text,
    decision_status text NOT NULL DEFAULT 'pending' CHECK (decision_status IN ('pending', 'waitlisted', 'accepted', 'rejected')),
    decision_url text,
    decision_pdf_path text,
    decision_found_at timestamptz,
    last_checked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_portal_sessions_student_id ON portal_sessions(student_id);
CREATE INDEX idx_portal_sessions_agency_id ON portal_sessions(agency_id);
CREATE INDEX idx_portal_sessions_university_name ON portal_sessions(university_name);
CREATE INDEX idx_portal_sessions_decision_status ON portal_sessions(decision_status);
CREATE INDEX idx_portal_sessions_student_agency ON portal_sessions(student_id, agency_id);

-- RLS for portal_sessions
ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY portal_sessions_agency_isolation ON portal_sessions
    FOR ALL
    USING (agency_id = auth.uid() OR agency_id IN (
        SELECT agency_id FROM users WHERE id = auth.uid()
    ));

-- Updated_at trigger
CREATE TRIGGER portal_sessions_updated_at
    BEFORE UPDATE ON portal_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- Table 6: payment_flags
-- Tracks payment requirements and status for applications
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_flags (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id uuid REFERENCES automation_workflows(id) ON DELETE SET NULL,
    step_id uuid REFERENCES automation_steps(id) ON DELETE SET NULL,
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    university_name text NOT NULL,
    amount numeric(8,2) NOT NULL,
    currency text NOT NULL DEFAULT 'USD',
    payment_url text,
    screenshot_url text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pending_approval', 'approved', 'paid', 'waived', 'failed')),
    marked_paid_by uuid REFERENCES users(id) ON DELETE SET NULL,
    marked_paid_at timestamptz,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_flags_student_id ON payment_flags(student_id);
CREATE INDEX idx_payment_flags_agency_id ON payment_flags(agency_id);
CREATE INDEX idx_payment_flags_workflow_id ON payment_flags(workflow_id);
CREATE INDEX idx_payment_flags_step_id ON payment_flags(step_id);
CREATE INDEX idx_payment_flags_status ON payment_flags(status);
CREATE INDEX idx_payment_flags_student_agency ON payment_flags(student_id, agency_id);

-- RLS for payment_flags
ALTER TABLE payment_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_flags_agency_isolation ON payment_flags
    FOR ALL
    USING (agency_id = auth.uid() OR agency_id IN (
        SELECT agency_id FROM users WHERE id = auth.uid()
    ));


-- ============================================================================
-- Helper function: update_updated_at_column
-- Automatically updates the 'updated_at' timestamp on row modification
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
