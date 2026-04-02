-- Migration 008: Chat tables for Pilot AI chatbot
-- Creates chat_conversations and chat_messages tables

create table if not exists chat_conversations (
  id          uuid        primary key default gen_random_uuid(),
  agency_id   uuid        not null references agencies(id)  on delete cascade,
  user_id     uuid        not null references users(id)     on delete cascade,
  student_id  uuid                    references students(id) on delete set null,
  title       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists chat_messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references chat_conversations(id) on delete cascade,
  agency_id       uuid        not null references agencies(id) on delete cascade,
  role            text        not null check (role in ('user', 'assistant')),
  content         text        not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_chat_conversations_agency   on chat_conversations(agency_id);
create index if not exists idx_chat_conversations_student  on chat_conversations(student_id);
create index if not exists idx_chat_messages_conversation  on chat_messages(conversation_id);

-- Row Level Security
alter table chat_conversations enable row level security;
alter table chat_messages       enable row level security;

create policy "agency_chat_conversations" on chat_conversations
  using (agency_id in (
    select agency_id from agency_members
    where user_id = auth.uid() and is_active = true
  ));

create policy "agency_chat_messages" on chat_messages
  using (agency_id in (
    select agency_id from agency_members
    where user_id = auth.uid() and is_active = true
  ));
