-- ============================================================
-- ApplyPilot — Initial Database Schema
-- Migration 001: Full schema with RLS
-- Run in Supabase SQL Editor
-- ============================================================

-- ============================================
-- AGENCIES
-- ============================================

CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1D9E75',
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'Asia/Tashkent',
  subscription_status TEXT DEFAULT 'active',
  subscription_plan TEXT DEFAULT 'starter',
  max_staff INTEGER DEFAULT 2,
  terms_accepted_at TIMESTAMPTZ,
  terms_accepted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  telegram_chat_id TEXT,
  phone TEXT,
  language TEXT DEFAULT 'en',
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff',
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, user_id)
);

-- ============================================
-- STUDENTS
-- ============================================

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  assigned_staff_id UUID REFERENCES users(id),
  full_name TEXT NOT NULL,
  preferred_name TEXT,
  date_of_birth DATE,
  nationality TEXT,
  passport_number TEXT,
  passport_expiry DATE,
  photo_url TEXT,
  email TEXT,
  phone TEXT,
  telegram_username TEXT,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  high_school_name TEXT,
  high_school_country TEXT,
  graduation_year INTEGER,
  gpa DECIMAL(4,2),
  gpa_scale DECIMAL(4,2) DEFAULT 4.0,
  class_rank TEXT,
  sat_total INTEGER,
  sat_math INTEGER,
  sat_reading INTEGER,
  act_score INTEGER,
  toefl_score INTEGER,
  ielts_score DECIMAL(3,1),
  duolingo_score INTEGER,
  activities JSONB DEFAULT '[]',
  awards JSONB DEFAULT '[]',
  work_experience JSONB DEFAULT '[]',
  languages JSONB DEFAULT '[]',
  intended_major TEXT,
  application_type TEXT DEFAULT 'freshman',
  notes TEXT,
  status TEXT DEFAULT 'intake',
  season TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- UNIVERSITIES
-- ============================================

CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  common_app_id TEXT,
  website TEXT,
  location_city TEXT,
  location_state TEXT,
  location_country TEXT DEFAULT 'USA',
  acceptance_rate DECIMAL(5,2),
  ranking_us_news INTEGER,
  common_app_required_sections JSONB,
  application_fee INTEGER,
  fee_waiver_available BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APPLICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id),
  university_name TEXT NOT NULL,
  application_type TEXT DEFAULT 'regular',
  deadline_regular DATE,
  deadline_financial_aid DATE,
  deadline_scholarship DATE,
  common_app_status JSONB DEFAULT '{
    "personal_info": "not_started",
    "family": "not_started",
    "education": "not_started",
    "test_scores": "not_started",
    "activities": "not_started",
    "writing": "not_started",
    "additional_info": "not_started",
    "school_report": "not_started",
    "recommendations": "not_started",
    "payment": "not_started"
  }',
  portal_url TEXT,
  portal_username TEXT,
  portal_password_encrypted TEXT,
  status TEXT DEFAULT 'not_started',
  submitted_at TIMESTAMPTZ,
  decision_received_at TIMESTAMPTZ,
  decision TEXT,
  scholarship_amount DECIMAL(10,2),
  financial_aid_amount DECIMAL(10,2),
  notes TEXT,
  application_fee_paid BOOLEAN DEFAULT false,
  fee_waiver_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ESSAYS
-- ============================================

CREATE TABLE IF NOT EXISTS essay_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES universities(id),
  university_name TEXT,
  prompt_type TEXT,
  prompt_text TEXT NOT NULL,
  word_limit_min INTEGER,
  word_limit_max INTEGER,
  season TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id),
  prompt_id UUID REFERENCES essay_prompts(id),
  prompt_text TEXT,
  content TEXT,
  word_count INTEGER,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',
  ai_score INTEGER,
  ai_feedback TEXT,
  plagiarism_score DECIMAL(5,2),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RECOMMENDATION LETTERS
-- ============================================

CREATE TABLE IF NOT EXISTS recommenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  subject TEXT,
  school TEXT,
  email TEXT,
  relationship TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS recommendation_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  recommender_id UUID REFERENCES recommenders(id),
  application_id UUID REFERENCES applications(id),
  content TEXT,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',
  word_count INTEGER,
  ai_generated BOOLEAN DEFAULT true,
  ai_score INTEGER,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  file_size_bytes INTEGER,
  mime_type TEXT,
  version INTEGER DEFAULT 1,
  ocr_text TEXT,
  ocr_processed BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'uploaded',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEADLINES
-- ============================================

CREATE TABLE IF NOT EXISTS deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id),
  title TEXT NOT NULL,
  type TEXT,
  due_date DATE NOT NULL,
  due_time TIME,
  timezone TEXT DEFAULT 'Asia/Tashkent',
  alert_days_before JSONB DEFAULT '[30, 14, 7, 3, 1]',
  alerts_sent JSONB DEFAULT '[]',
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  google_calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMAIL ACCOUNTS
-- ============================================

CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  provider TEXT,
  imap_host TEXT,
  imap_port INTEGER,
  password_encrypted TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  email_account_id UUID REFERENCES email_accounts(id),
  direction TEXT NOT NULL,
  message_id TEXT,
  from_address TEXT,
  to_address TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  received_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  category TEXT,
  university_name TEXT,
  importance TEXT DEFAULT 'normal',
  ai_draft TEXT,
  draft_status TEXT DEFAULT 'none',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AGENT JOBS
-- ============================================

CREATE TABLE IF NOT EXISTS agent_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id),
  application_id UUID REFERENCES applications(id),
  agent_type TEXT NOT NULL,
  job_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  requires_approval BOOLEAN DEFAULT false,
  approval_message TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  screenshot_urls JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id),
  user_id UUID REFERENCES users(id),
  student_id UUID REFERENCES students(id),
  application_id UUID REFERENCES applications(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_students_agency_id ON students(agency_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_agency_id ON applications(agency_id);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_essays_agency_id ON essays(agency_id);
CREATE INDEX IF NOT EXISTS idx_essays_student_id ON essays(student_id);
CREATE INDEX IF NOT EXISTS idx_documents_agency_id ON documents(agency_id);
CREATE INDEX IF NOT EXISTS idx_documents_student_id ON documents(student_id);
CREATE INDEX IF NOT EXISTS idx_emails_agency_id ON emails(agency_id);
CREATE INDEX IF NOT EXISTS idx_emails_student_id ON emails(student_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_agency_id ON deadlines(agency_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_date ON deadlines(agency_id, due_date, is_complete);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_agency_id ON agent_jobs(agency_id);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_status ON agent_jobs(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_agency_id ON audit_logs(agency_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE essays ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES — Agency Isolation
-- ============================================

-- agency_members: users can only see their own membership
CREATE POLICY "agency_members_isolation" ON agency_members
  USING (user_id = auth.uid());

-- students
CREATE POLICY "agency_isolation_students" ON students
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));

-- applications
CREATE POLICY "agency_isolation_applications" ON applications
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));

-- documents
CREATE POLICY "agency_isolation_documents" ON documents
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));

-- emails
CREATE POLICY "agency_isolation_emails" ON emails
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));

-- email_accounts
CREATE POLICY "agency_isolation_email_accounts" ON email_accounts
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));

-- essays
CREATE POLICY "agency_isolation_essays" ON essays
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));

-- recommendation_letters
CREATE POLICY "agency_isolation_rec_letters" ON recommendation_letters
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));

-- recommenders
CREATE POLICY "agency_isolation_recommenders" ON recommenders
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));

-- deadlines
CREATE POLICY "agency_isolation_deadlines" ON deadlines
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));

-- agent_jobs
CREATE POLICY "agency_isolation_agent_jobs" ON agent_jobs
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));

-- audit_logs
CREATE POLICY "agency_isolation_audit_logs" ON audit_logs
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));
