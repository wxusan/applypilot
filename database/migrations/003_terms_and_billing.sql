-- Migration 003: Terms acceptance + billing extensions
-- Run in Supabase SQL Editor

-- ============================================================
-- Users: Terms of Service acceptance
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- ============================================================
-- Agencies: Billing extensions
-- ============================================================
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 50;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS unlocked_features TEXT[] DEFAULT '{}';
