-- Migration 011: Drop dead/unused tables
-- Fixes: H10 — Remove 4 tables that exist in the schema but are never
-- referenced by any application code. They add confusion and waste storage.
--
-- SAFETY: Before running, verify no code references these tables:
--   grep -r "old_notifications\|temp_imports\|legacy_scores\|draft_applications" backend/
-- Expected output: (empty)

-- Drop in dependency order (children before parents)

-- 1. draft_applications — replaced by 'applications' table with status='draft'
DROP TABLE IF EXISTS draft_applications CASCADE;

-- 2. legacy_scores — replaced by per-type columns on students table
DROP TABLE IF EXISTS legacy_scores CASCADE;

-- 3. temp_imports — replaced by bulk_import logic in students API
DROP TABLE IF EXISTS temp_imports CASCADE;

-- 4. old_notifications — replaced by notifications table
DROP TABLE IF EXISTS old_notifications CASCADE;
