-- Migration 012: student pre_archive_status + credential updated_at
-- Run in Supabase SQL Editor

-- M2: store pre-archive status so restore returns to the right state
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS pre_archive_status TEXT DEFAULT NULL;

-- M12: updated_at on student_credentials so we know when creds were last modified
ALTER TABLE student_credentials
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Auto-update updated_at on every change
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

-- M8: credential access log table
CREATE TABLE IF NOT EXISTS credential_access_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  credential_id UUID NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL CHECK (action IN ('read', 'create', 'update', 'delete', 'test')),
  ip_address  TEXT,
  user_agent  TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credential_access_log_agency
  ON credential_access_log (agency_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_credential_access_log_credential
  ON credential_access_log (credential_id, accessed_at DESC);
