-- ============================================================
--  ApplyPilot — Contacts (People Database)
--  Migration: 002_contacts.sql
--
--  Automatically populated whenever anyone fills a form
--  on the platform: landing CTA, request-access, new student,
--  staff invite, agency creation.
-- ============================================================

create table if not exists contacts (
  id          uuid        primary key default gen_random_uuid(),
  name        text,
  phone       text,
  email       text,
  source      text        not null,
  -- 'waitlist'        — landing page CTA
  -- 'access_request'  — /request-access page
  -- 'student'         — new student created by staff
  -- 'staff_invite'    — staff member invited
  -- 'agency_created'  — agency owner added by super admin
  role        text,
  -- 'prospect' | 'student' | 'staff' | 'agency_owner'
  note        text,
  agency_id   uuid        references agencies(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Index for fast lookup by source and created_at
create index if not exists contacts_source_idx on contacts(source);
create index if not exists contacts_created_at_idx on contacts(created_at desc);

-- RLS: only service role can insert/select (super admin panel uses service key)
alter table contacts enable row level security;

create policy "service role full access"
  on contacts
  using (true)
  with check (true);
