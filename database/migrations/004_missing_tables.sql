-- ============================================================
-- Migration 004: Missing tables from Architecture Roadmap
-- Tables: chat_messages, notifications, essay_versions,
--         college_profiles, recommendation_letters (full)
-- Run this in Supabase SQL Editor after migrations 001–003.
-- ============================================================

-- ── 1. chat_messages ─────────────────────────────────────────────────────────
-- Stores conversation history for the in-app AI chatbot (Section 10.3).
-- Each conversation is scoped to an agency and optionally a student.

CREATE TABLE IF NOT EXISTS chat_conversations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id       uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id      uuid REFERENCES students(id) ON DELETE SET NULL,
    title           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    agency_id       uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    role            text NOT NULL CHECK (role IN ('user', 'assistant')),
    content         text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 2. notifications ─────────────────────────────────────────────────────────
-- Persistent in-app notifications (deadline alerts, approvals, etc.)
-- Section 14.4 of architecture.

CREATE TABLE IF NOT EXISTS notifications (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id       uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id         uuid REFERENCES users(id) ON DELETE CASCADE,  -- NULL = broadcast to all agency members
    title           text NOT NULL,
    body            text NOT NULL,
    type            text NOT NULL DEFAULT 'info',   -- info | warning | error | success | deadline | approval
    is_read         boolean NOT NULL DEFAULT false,
    metadata        jsonb,                          -- e.g. {student_id, application_id, deadline_id}
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 3. essay_versions ────────────────────────────────────────────────────────
-- Append-only version history for essays (Section 13.3).
-- The essays table keeps current_version; this table keeps all history.

CREATE TABLE IF NOT EXISTS essay_versions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    essay_id        uuid NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
    agency_id       uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    version_number  integer NOT NULL,
    content         text NOT NULL,
    word_count      integer NOT NULL DEFAULT 0,
    change_summary  text,
    created_by      uuid REFERENCES users(id) ON DELETE SET NULL,
    is_ai_generated boolean NOT NULL DEFAULT false,
    ai_score        numeric(4,2),
    ai_feedback     text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (essay_id, version_number)
);

-- ── 4. college_profiles ──────────────────────────────────────────────────────
-- Reference table for US colleges (Section 18.3, Common Data Set data).

CREATE TABLE IF NOT EXISTS college_profiles (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                text NOT NULL,
    slug                text UNIQUE,
    location_city       text,
    location_state      text,
    us_news_rank        integer,
    acceptance_rate     numeric(5,4),   -- e.g. 0.0425 = 4.25%
    avg_gpa             numeric(4,2),
    avg_sat             integer,
    avg_act             integer,
    tuition_in_state    integer,
    tuition_out_state   integer,
    total_enrollment    integer,
    common_app          boolean NOT NULL DEFAULT true,
    coalition_app       boolean NOT NULL DEFAULT false,
    application_fee     integer,
    fee_waiver_available boolean NOT NULL DEFAULT false,
    early_decision_deadline  date,
    early_action_deadline    date,
    regular_decision_deadline date,
    website_url         text,
    common_app_id       text,           -- Common App school ID for browser automation
    logo_url            text,
    cds_year            integer,        -- which year's Common Data Set
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ── 5. recommendation_letter_requests ────────────────────────────────────────
-- Tracks each recommender request per student application (Section 15.2).
-- Note: The existing `recommendation_letters` table stores the letter content.
-- This table tracks the workflow (requested → submitted → approved).

CREATE TABLE IF NOT EXISTS recommendation_letter_requests (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id           uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    student_id          uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    recommender_name    text NOT NULL,
    recommender_email   text,
    recommender_title   text,
    recommender_school  text,
    relationship        text,            -- teacher | counselor | employer | mentor | other
    deadline            date,
    status              text NOT NULL DEFAULT 'not_requested'
                            CHECK (status IN ('not_requested','requested','in_progress','submitted','approved','declined')),
    waiver_signed       boolean NOT NULL DEFAULT false,
    notes               text,
    application_id      uuid REFERENCES applications(id) ON DELETE SET NULL,
    letter_content      text,           -- the actual letter once submitted
    submitted_at        timestamptz,
    approved_at         timestamptz,
    approved_by         uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chat_conversations_agency ON chat_conversations(agency_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_student ON chat_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_agency ON notifications(agency_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_essay_versions_essay ON essay_versions(essay_id);
CREATE INDEX IF NOT EXISTS idx_college_profiles_name ON college_profiles USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_lor_requests_student ON recommendation_letter_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_lor_requests_agency ON recommendation_letter_requests(agency_id);

-- ── updated_at triggers ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

DO $$
DECLARE t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'chat_conversations', 'college_profiles', 'recommendation_letter_requests'
    ]) LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS set_updated_at ON %I;
             CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();',
            t, t
        );
    END LOOP;
END $$;

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_letter_requests ENABLE ROW LEVEL SECURITY;

-- chat_conversations: agency members only
CREATE POLICY IF NOT EXISTS "agency_chat_conversations" ON chat_conversations
    USING (agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid() AND is_active = true));

-- chat_messages: same via conversation
CREATE POLICY IF NOT EXISTS "agency_chat_messages" ON chat_messages
    USING (agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid() AND is_active = true));

-- notifications: own user or broadcast (user_id IS NULL means all agency members see it)
CREATE POLICY IF NOT EXISTS "user_notifications" ON notifications
    USING (
        agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid() AND is_active = true)
        AND (user_id IS NULL OR user_id = auth.uid())
    );

-- essay_versions: agency members
CREATE POLICY IF NOT EXISTS "agency_essay_versions" ON essay_versions
    USING (agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid() AND is_active = true));

-- college_profiles: read-only for everyone (reference table)
CREATE POLICY IF NOT EXISTS "public_college_profiles_read" ON college_profiles
    FOR SELECT USING (true);

-- recommendation_letter_requests: agency members
CREATE POLICY IF NOT EXISTS "agency_lor_requests" ON recommendation_letter_requests
    USING (agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid() AND is_active = true));
