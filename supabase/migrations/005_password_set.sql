-- Migration 005: Track whether each user has set a password.
--
-- New invited agency owners are created WITHOUT a password (email-invite flow).
-- This flag is set to true once they complete the set-password page.
-- The auth/callback route checks this flag and forces the password-setup
-- screen if it's still false (prevents Google-only login before setup).

alter table users
  add column if not exists password_set boolean not null default false;

-- Existing users (who already have passwords) should default to true.
-- Run this only ONCE after applying the migration if you have existing users:
-- update users set password_set = true where password_set = false;
