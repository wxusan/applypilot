-- Migration 009: Unified English proficiency test scores
-- Replaces the separate toefl_score / ielts_score columns with a structured
-- approach: test type selector + full sub-score JSONB (extracted by AI Vision).

alter table students
  add column if not exists english_test_type   text,          -- 'toefl_ibt' | 'ielts' | 'duolingo' | 'pte' | 'cambridge'
  add column if not exists english_test_scores jsonb default '{}';  -- all sub-scores, keyed by field name

-- Keep legacy toefl_score / ielts_score / duolingo_score for backward compat.
-- New code writes to english_test_scores; legacy columns are synced by the API.
