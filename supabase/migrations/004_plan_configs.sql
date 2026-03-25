-- ============================================================
--  ApplyPilot — Plan Configuration Table
--  Migration: 004_plan_configs.sql
--
--  Stores the default limits for each subscription plan.
--  Super admin can edit these. New agencies inherit limits
--  from whichever plan they are created on.
-- ============================================================

create table if not exists plan_configs (
  plan             text        primary key,  -- 'starter' | 'pro' | 'enterprise'
  max_staff        int         not null default 0,
  max_students     int         not null default 0,
  ai_token_limit   bigint      not null default 0,
  updated_at       timestamptz not null default now()
);

-- Seed default values
insert into plan_configs (plan, max_staff, max_students, ai_token_limit) values
  ('starter',    5,   50,   50000),
  ('pro',        15,  200,  200000),
  ('enterprise', 0,   0,    0)       -- 0 = unlimited
on conflict (plan) do nothing;
