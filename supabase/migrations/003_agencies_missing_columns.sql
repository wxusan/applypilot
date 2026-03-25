-- ============================================================
--  ApplyPilot — Add missing columns to agencies table
--  Migration: 003_agencies_missing_columns.sql
-- ============================================================

alter table agencies
  add column if not exists subscription_expires_at  timestamptz,
  add column if not exists ai_tokens_used           bigint      not null default 0,
  add column if not exists ai_token_limit           bigint      not null default 50000,
  add column if not exists max_students             int,
  add column if not exists unlocked_features        jsonb       not null default '[]';

-- contacts table (from 002 — run this if 002 wasn't applied yet)
create table if not exists contacts (
  id          uuid        primary key default gen_random_uuid(),
  name        text,
  phone       text,
  email       text,
  source      text        not null,
  role        text,
  note        text,
  agency_id   uuid        references agencies(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists contacts_source_idx    on contacts(source);
create index if not exists contacts_created_at_idx on contacts(created_at desc);
