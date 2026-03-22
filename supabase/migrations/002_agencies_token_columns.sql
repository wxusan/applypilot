-- ============================================================
--  Migration: 002_agencies_token_columns.sql
--
--  Adds AI token tracking columns to the agencies table.
--  Required by the billing dashboard and super-admin endpoints.
-- ============================================================

alter table agencies
  add column if not exists ai_tokens_used   int  not null default 0,
  add column if not exists ai_token_limit   int  not null default 500000;

-- Index for fast ordering by token usage in the billing dashboard
create index if not exists agencies_tokens_used_idx on agencies(ai_tokens_used desc);

-- ─────────────────────────────────────────────
--  ai_usage_logs  (immutable ledger for token billing)
-- ─────────────────────────────────────────────
create table if not exists ai_usage_logs (
  id            uuid        primary key default gen_random_uuid(),
  agency_id     uuid        not null references agencies(id) on delete cascade,
  student_id    uuid        references students(id) on delete set null,
  agent_type    text        not null,   -- writer | browser | email | coordinator
  tokens_spent  int         not null default 0,
  cost_usd      numeric(10,6) not null default 0,
  job_id        uuid,
  timestamp     timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists ai_usage_logs_agency_ts_idx on ai_usage_logs(agency_id, timestamp desc);

alter table ai_usage_logs enable row level security;

create policy "members read own usage logs"
  on ai_usage_logs for select to authenticated
  using (agency_id = auth_agency_id());
