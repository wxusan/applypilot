-- Migration 009: Credentials — Common App account flag + role field
-- ============================================================================
-- has_common_app: for student credentials — does the student already have a
--   Common App account? false = platform will create one, true = platform logs in.
--
-- role: for teacher/counsellor credentials — the subject they teach or their
--   title (e.g. "Physics Teacher", "School Counselor"). Used by the browser
--   agent to fill in their recommender profile correctly on Common App.
-- ============================================================================

ALTER TABLE student_credentials
  ADD COLUMN IF NOT EXISTS has_common_app boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS role text;

COMMENT ON COLUMN student_credentials.has_common_app IS
  'Student only. true = existing Common App account (log in), false = create new account.';

COMMENT ON COLUMN student_credentials.role IS
  'Teacher/counsellor only. Subject or title, e.g. "Physics Teacher", "School Counselor".';
