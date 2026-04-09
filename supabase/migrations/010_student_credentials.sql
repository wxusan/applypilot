-- Migration 010: Add missing columns to existing student_credentials table
-- + create credential_access_log if it doesn't exist yet
-- The student_credentials table already exists; this adds the columns
-- that were never applied to Supabase from database/migrations/009 and 012.

-- From migration 009: Common App account flag + recommender role
ALTER TABLE student_credentials
  ADD COLUMN IF NOT EXISTS has_common_app boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS role text;

COMMENT ON COLUMN student_credentials.has_common_app IS
  'Student only. true = existing Common App account (log in), false = create new account.';
COMMENT ON COLUMN student_credentials.role IS
  'Teacher/counsellor only. Subject or title, e.g. "Physics Teacher", "School Counselor".';

-- From migration 012: updated_at column + trigger
ALTER TABLE student_credentials
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

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

-- From migration 012: credential access log table
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
