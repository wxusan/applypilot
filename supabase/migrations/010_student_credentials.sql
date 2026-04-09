-- Migration 010: student_credentials table + access log
-- Ported from database/migrations/006, 009, and 012
-- Run in Supabase SQL Editor (or via supabase db push)

-- ============================================================================
-- Table: student_credentials
-- Encrypted storage of Gmail and Common App credentials
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    credential_type text NOT NULL CHECK (credential_type IN ('student', 'teacher', 'counsellor')),
    label text NOT NULL,
    gmail_email text NOT NULL,
    gmail_password text NOT NULL,  -- Encrypted with credential_vault (Fernet/AES-256)
    common_app_email text,
    common_app_password text,      -- Encrypted with credential_vault
    -- From migration 009: Common App account flag + recommender role
    has_common_app boolean NOT NULL DEFAULT false,
    role text,
    notes text,
    is_active boolean NOT NULL DEFAULT true,
    last_tested_at timestamptz,
    last_test_result text,
    -- From migration 012: track when credentials were last modified
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN student_credentials.has_common_app IS
  'Student only. true = existing Common App account (log in), false = create new account.';
COMMENT ON COLUMN student_credentials.role IS
  'Teacher/counsellor only. Subject or title, e.g. "Physics Teacher", "School Counselor".';

CREATE INDEX IF NOT EXISTS idx_student_credentials_student_id   ON student_credentials(student_id);
CREATE INDEX IF NOT EXISTS idx_student_credentials_agency_id    ON student_credentials(agency_id);
CREATE INDEX IF NOT EXISTS idx_student_credentials_student_agency ON student_credentials(student_id, agency_id);
CREATE INDEX IF NOT EXISTS idx_student_credentials_is_active    ON student_credentials(is_active);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_student_credentials_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_student_credentials_updated_at ON student_credentials;
CREATE TRIGGER trg_student_credentials_updated_at
  BEFORE UPDATE ON student_credentials
  FOR EACH ROW EXECUTE FUNCTION update_student_credentials_updated_at();

-- RLS: each agency only sees its own credentials
ALTER TABLE student_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY student_credentials_agency_isolation ON student_credentials
    FOR ALL
    USING (agency_id IN (
        SELECT agency_id FROM users WHERE id = auth.uid()
    ));


-- ============================================================================
-- Table: credential_access_log
-- Audit trail for every read/write on credentials
-- ============================================================================

CREATE TABLE IF NOT EXISTS credential_access_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  credential_id uuid NOT NULL,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action        text NOT NULL CHECK (action IN ('read', 'create', 'update', 'delete', 'test')),
  ip_address    text,
  user_agent    text,
  accessed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credential_access_log_agency
  ON credential_access_log (agency_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_credential_access_log_credential
  ON credential_access_log (credential_id, accessed_at DESC);
