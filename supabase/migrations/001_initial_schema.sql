-- ============================================================
--  ApplyPilot — Initial Database Schema
--  Migration: 001_initial_schema.sql
--
--  Schema is the authoritative source of truth, derived from
--  frontend/lib/database.types.ts.
--
--  Run with:
--    supabase db push              (Supabase CLI)
--    psql $DATABASE_URL -f 001_initial_schema.sql
-- ============================================================

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
--  agencies
-- ─────────────────────────────────────────────
create table if not exists agencies (
  id                   uuid        primary key default gen_random_uuid(),
  name                 text        not null,
  slug                 text        unique not null,          -- URL-safe identifier
  logo_url             text,
  primary_color        text        not null default '#1D9E75',
  language             text        not null default 'en',
  timezone             text        not null default 'Asia/Tashkent',
  subscription_status  text        not null default 'active',  -- active | past_due | cancelled
  subscription_plan    text        not null default 'starter', -- starter | pro | enterprise
  max_staff            int         not null default 2,
  terms_accepted_at    timestamptz,
  terms_accepted_by    uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ─────────────────────────────────────────────
--  users  (mirrors auth.users — kept in sync via trigger or webhook)
-- ─────────────────────────────────────────────
create table if not exists users (
  id               uuid        primary key,   -- must equal auth.users.id
  email            text        unique not null,
  full_name        text        not null default '',
  role             text        not null default 'staff',  -- admin | staff (agency-level role)
  telegram_chat_id text,
  phone            text,
  language         text        not null default 'en',
  last_active_at   timestamptz,
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────
--  agency_members
-- ─────────────────────────────────────────────
create table if not exists agency_members (
  id          uuid        primary key default gen_random_uuid(),
  agency_id   uuid        not null references agencies(id) on delete cascade,
  user_id     uuid        not null references users(id)    on delete cascade,
  role        text        not null default 'staff',  -- admin | staff
  is_active   bool        not null default true,
  joined_at   timestamptz not null default now()
);

create unique index if not exists agency_members_agency_user_uidx
  on agency_members(agency_id, user_id);

-- ─────────────────────────────────────────────
--  students
-- ─────────────────────────────────────────────
create table if not exists students (
  id                   uuid        primary key default gen_random_uuid(),
  agency_id            uuid        not null references agencies(id) on delete cascade,
  assigned_staff_id    uuid        references users(id) on delete set null,
  full_name            text        not null,
  preferred_name       text,
  date_of_birth        date,
  nationality          text,
  passport_number      text,
  passport_expiry      date,
  photo_url            text,
  email                text,
  phone                text,
  telegram_username    text,
  parent_name          text,
  parent_email         text,
  parent_phone         text,
  high_school_name     text,
  high_school_country  text,
  graduation_year      int,
  gpa                  numeric(4,2),
  gpa_scale            numeric(4,2) not null default 4.0,
  class_rank           text,
  sat_total            int,
  sat_math             int,
  sat_reading          int,
  act_score            int,
  toefl_score          int,
  ielts_score          numeric(3,1),
  duolingo_score       int,
  activities           jsonb       not null default '[]',
  awards               jsonb       not null default '[]',
  work_experience      jsonb       not null default '[]',
  languages            jsonb       not null default '[]',
  intended_major       text,
  application_type     text        not null default 'freshman',  -- freshman | transfer | graduate
  notes                text,
  status               text        not null default 'intake',
  season               text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists students_agency_idx   on students(agency_id);
create index if not exists students_status_idx   on students(agency_id, status);

-- ─────────────────────────────────────────────
--  applications
-- ─────────────────────────────────────────────
create table if not exists applications (
  id                        uuid        primary key default gen_random_uuid(),
  agency_id                 uuid        not null references agencies(id)  on delete cascade,
  student_id                uuid        not null references students(id)  on delete cascade,
  university_id             text,                                        -- optional external ID
  university_name           text        not null,
  application_type          text        not null default 'regular',      -- regular | early_decision | early_action | rolling
  deadline_regular          date,
  deadline_financial_aid    date,
  deadline_scholarship      date,
  common_app_status         jsonb       not null default '{}',           -- section completion map
  portal_url                text,
  portal_username           text,
  portal_password_encrypted text,                                        -- Fernet-encrypted
  status                    text        not null default 'active',       -- active | submitted | accepted | rejected | deferred | waitlisted | withdrawn
  submitted_at              timestamptz,
  decision_received_at      timestamptz,
  decision                  text,                                        -- accepted | rejected | waitlisted | deferred
  scholarship_amount        numeric(10,2),
  financial_aid_amount      numeric(10,2),
  notes                     text,
  application_fee_paid      bool        not null default false,
  fee_waiver_used           bool        not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists applications_student_idx on applications(student_id);
create index if not exists applications_agency_idx  on applications(agency_id);

-- ─────────────────────────────────────────────
--  essays
-- ─────────────────────────────────────────────
create table if not exists essays (
  id               uuid        primary key default gen_random_uuid(),
  agency_id        uuid        not null references agencies(id)      on delete cascade,
  student_id       uuid        not null references students(id)      on delete cascade,
  application_id   uuid                    references applications(id) on delete set null,
  prompt_id        text,
  prompt_text      text,
  content          text,
  word_count       int,
  version          int         not null default 1,
  status           text        not null default 'draft',  -- draft | review | approved | rejected
  ai_score         int,
  ai_feedback      text,
  plagiarism_score numeric(5,2),
  approved_by      uuid        references users(id) on delete set null,
  approved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists essays_student_idx on essays(student_id);

-- ─────────────────────────────────────────────
--  documents
-- ─────────────────────────────────────────────
create table if not exists documents (
  id                uuid        primary key default gen_random_uuid(),
  agency_id         uuid        not null references agencies(id)  on delete cascade,
  student_id        uuid        not null references students(id)  on delete cascade,
  application_id    uuid                    references applications(id) on delete set null,
  type              text        not null,                         -- transcript | passport | test_score | essay | other
  name              text        not null,
  storage_path      text        not null,                         -- R2 object key
  storage_url       text,                                         -- public URL or presigned URL
  file_size_bytes   bigint,
  mime_type         text,
  version           int         not null default 1,
  ocr_text          text,
  ocr_processed     bool        not null default false,
  status            text        not null default 'pending',       -- pending | approved | rejected
  reviewed_by       uuid        references users(id) on delete set null,
  reviewed_at       timestamptz,
  rejection_reason  text,
  uploaded_by       uuid        references users(id) on delete set null,
  uploaded_at       timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists documents_student_idx on documents(student_id);

-- ─────────────────────────────────────────────
--  deadlines
-- ─────────────────────────────────────────────
create table if not exists deadlines (
  id                        uuid        primary key default gen_random_uuid(),
  agency_id                 uuid        not null references agencies(id)      on delete cascade,
  student_id                uuid        not null references students(id)      on delete cascade,
  application_id            uuid                    references applications(id) on delete set null,
  title                     text        not null,
  type                      text,                                              -- application | financial_aid | scholarship | test | other
  due_date                  date        not null,
  due_time                  time,
  timezone                  text        not null default 'Asia/Tashkent',
  alert_days_before         jsonb       not null default '[3,1]',
  alerts_sent               jsonb       not null default '[]',
  is_complete               bool        not null default false,
  completed_at              timestamptz,
  completed_by              uuid        references users(id) on delete set null,
  google_calendar_event_id  text,
  created_at                timestamptz not null default now()
);

create index if not exists deadlines_agency_due_idx on deadlines(agency_id, due_date);

-- ─────────────────────────────────────────────
--  recommenders
-- ─────────────────────────────────────────────
create table if not exists recommenders (
  id          uuid        primary key default gen_random_uuid(),
  agency_id   uuid        not null references agencies(id)  on delete cascade,
  student_id  uuid        not null references students(id)  on delete cascade,
  name        text        not null,
  email       text,
  role        text,
  status      text        not null default 'pending',  -- pending | requested | submitted
  notes       text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
--  email_accounts
-- ─────────────────────────────────────────────
create table if not exists email_accounts (
  id                  uuid        primary key default gen_random_uuid(),
  agency_id           uuid        not null references agencies(id)  on delete cascade,
  student_id          uuid        not null references students(id)  on delete cascade,
  email_address       text        not null,
  provider            text        not null,   -- gmail | outlook | yahoo
  imap_host           text        not null,
  imap_port           int         not null,
  password_encrypted  text        not null,   -- Fernet-encrypted
  last_synced_at      timestamptz,
  sync_enabled        bool        not null default true,
  created_at          timestamptz not null default now()
);

-- ─────────────────────────────────────────────
--  emails
-- ─────────────────────────────────────────────
create table if not exists emails (
  id                uuid        primary key default gen_random_uuid(),
  agency_id         uuid        not null references agencies(id)  on delete cascade,
  student_id        uuid        not null references students(id)  on delete cascade,
  email_account_id  uuid                    references email_accounts(id) on delete set null,
  direction         text        not null default 'inbound',        -- inbound | outbound
  from_address      text,
  to_address        text,
  subject           text,
  body_text         text,
  body_html         text,
  received_at       timestamptz not null default now(),
  category          text,
  university_name   text,
  importance        text        not null default 'normal',
  is_read           bool        not null default false,
  draft_reply       text,
  draft_status      text,
  message_id        text,
  created_at        timestamptz not null default now()
);

create index if not exists emails_student_idx    on emails(student_id);
create index if not exists emails_agency_idx     on emails(agency_id, received_at desc);
create unique index if not exists emails_message_id_uidx on emails(message_id) where message_id is not null;

-- ─────────────────────────────────────────────
--  agent_jobs
-- ─────────────────────────────────────────────
create table if not exists agent_jobs (
  id                uuid        primary key default gen_random_uuid(),
  agency_id         uuid        not null references agencies(id)  on delete cascade,
  student_id        uuid                    references students(id)      on delete set null,
  application_id    uuid                    references applications(id)  on delete set null,
  agent_type        text        not null,    -- writer | browser | email | coordinator
  job_type          text        not null,
  status            text        not null default 'pending',
  input_data        jsonb,
  output_data       jsonb,
  error_message     text,
  requires_approval bool        not null default false,
  approval_message  text,
  approved_by       uuid        references users(id) on delete set null,
  approved_at       timestamptz,
  rejected_reason   text,
  started_at        timestamptz,
  completed_at      timestamptz,
  duration_seconds  int,
  screenshot_urls   jsonb       not null default '[]',
  created_at        timestamptz not null default now()
);

create index if not exists agent_jobs_agency_status_idx on agent_jobs(agency_id, status);
create index if not exists agent_jobs_student_idx       on agent_jobs(student_id);

-- ─────────────────────────────────────────────
--  audit_logs
-- ─────────────────────────────────────────────
create table if not exists audit_logs (
  id             uuid        primary key default gen_random_uuid(),
  agency_id      uuid                    references agencies(id)      on delete set null,
  user_id        uuid                    references users(id)          on delete set null,
  student_id     uuid                    references students(id)       on delete set null,
  application_id uuid                    references applications(id)   on delete set null,
  action         text        not null,
  entity_type    text,
  entity_id      text,
  old_value      jsonb,
  new_value      jsonb,
  ip_address     text,
  user_agent     text,
  created_at     timestamptz not null default now()
);

create index if not exists audit_logs_agency_idx  on audit_logs(agency_id, created_at desc);
create index if not exists audit_logs_student_idx on audit_logs(student_id);

-- ─────────────────────────────────────────────
--  updated_at auto-trigger
-- ─────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'agencies','students','applications','essays'
  ]
  loop
    execute format(
      'create trigger trg_%s_updated_at
       before update on %s
       for each row execute procedure set_updated_at()',
      t, t
    );
  end loop;
exception when duplicate_object then null;
end;
$$;

-- ─────────────────────────────────────────────
--  Row-Level Security
-- ─────────────────────────────────────────────
alter table agencies        enable row level security;
alter table users           enable row level security;
alter table agency_members  enable row level security;
alter table students        enable row level security;
alter table applications    enable row level security;
alter table deadlines       enable row level security;
alter table essays          enable row level security;
alter table recommenders    enable row level security;
alter table documents       enable row level security;
alter table email_accounts  enable row level security;
alter table emails          enable row level security;
alter table agent_jobs      enable row level security;
alter table audit_logs      enable row level security;

-- Helper: returns the agency_id of the currently authenticated user
create or replace function auth_agency_id()
returns uuid language sql security definer stable as $$
  select agency_id
  from   agency_members
  where  user_id   = auth.uid()
    and  is_active = true
  limit  1;
$$;

-- ── agencies ──
create policy "members read own agency"
  on agencies for select to authenticated
  using (id = auth_agency_id());

create policy "admins update own agency"
  on agencies for update to authenticated
  using (id = auth_agency_id());

-- ── users ──
create policy "members read users in same agency"
  on users for select to authenticated
  using (
    id in (
      select user_id from agency_members where agency_id = auth_agency_id()
    )
  );

create policy "users update own profile"
  on users for update to authenticated
  using (id = auth.uid());

-- ── agency_members ──
create policy "members read own agency members"
  on agency_members for select to authenticated
  using (agency_id = auth_agency_id());

-- ── students ──
create policy "members read own agency students"
  on students for select to authenticated
  using (agency_id = auth_agency_id());

create policy "members insert students"
  on students for insert to authenticated
  with check (agency_id = auth_agency_id());

create policy "members update students"
  on students for update to authenticated
  using (agency_id = auth_agency_id());

create policy "members delete students"
  on students for delete to authenticated
  using (agency_id = auth_agency_id());

-- ── applications ──
create policy "members read own applications"
  on applications for select to authenticated
  using (agency_id = auth_agency_id());

create policy "members insert applications"
  on applications for insert to authenticated
  with check (agency_id = auth_agency_id());

create policy "members update applications"
  on applications for update to authenticated
  using (agency_id = auth_agency_id());

create policy "members delete applications"
  on applications for delete to authenticated
  using (agency_id = auth_agency_id());

-- ── deadlines ──
create policy "members read own deadlines"
  on deadlines for select to authenticated
  using (agency_id = auth_agency_id());

create policy "members write deadlines"
  on deadlines for all to authenticated
  using (agency_id = auth_agency_id())
  with check (agency_id = auth_agency_id());

-- ── essays ──
create policy "members read own essays"
  on essays for select to authenticated
  using (agency_id = auth_agency_id());

create policy "members write essays"
  on essays for all to authenticated
  using (agency_id = auth_agency_id())
  with check (agency_id = auth_agency_id());

-- ── recommenders ──
create policy "members manage recommenders"
  on recommenders for all to authenticated
  using (agency_id = auth_agency_id())
  with check (agency_id = auth_agency_id());

-- ── documents ──
create policy "members read own documents"
  on documents for select to authenticated
  using (agency_id = auth_agency_id());

create policy "members write documents"
  on documents for all to authenticated
  using (agency_id = auth_agency_id())
  with check (agency_id = auth_agency_id());

-- ── email_accounts ──
create policy "members manage email accounts"
  on email_accounts for all to authenticated
  using (agency_id = auth_agency_id())
  with check (agency_id = auth_agency_id());

-- ── emails ──
create policy "members read own emails"
  on emails for select to authenticated
  using (agency_id = auth_agency_id());

create policy "members write emails"
  on emails for all to authenticated
  using (agency_id = auth_agency_id())
  with check (agency_id = auth_agency_id());

-- ── agent_jobs ──
create policy "members read own jobs"
  on agent_jobs for select to authenticated
  using (agency_id = auth_agency_id());

create policy "members write jobs"
  on agent_jobs for all to authenticated
  using (agency_id = auth_agency_id())
  with check (agency_id = auth_agency_id());

-- ── audit_logs ──
create policy "members read own audit logs"
  on audit_logs for select to authenticated
  using (agency_id = auth_agency_id());

-- service_role bypasses RLS by default — backend always uses service_role key
