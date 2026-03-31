-- Migration 008: Extended student dossier fields
-- Adds all fields needed for Common App auto-fill, teacher rec, and counselor rec generation

ALTER TABLE students
  -- Personal background (Common App: Personal Info)
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS pronouns TEXT,
  ADD COLUMN IF NOT EXISTS city_of_birth TEXT,
  ADD COLUMN IF NOT EXISTS country_of_birth TEXT,
  ADD COLUMN IF NOT EXISTS visa_status TEXT,          -- e.g. "F-1", "B-2", "None"
  ADD COLUMN IF NOT EXISTS languages_at_home TEXT,    -- primary language spoken at home

  -- Address (Common App: Personal Info)
  ADD COLUMN IF NOT EXISTS address_street TEXT,
  ADD COLUMN IF NOT EXISTS address_city TEXT,
  ADD COLUMN IF NOT EXISTS address_country TEXT,
  ADD COLUMN IF NOT EXISTS address_zip TEXT,

  -- Father info (Common App: Family)
  ADD COLUMN IF NOT EXISTS father_name TEXT,
  ADD COLUMN IF NOT EXISTS father_email TEXT,
  ADD COLUMN IF NOT EXISTS father_phone TEXT,
  ADD COLUMN IF NOT EXISTS father_education TEXT,     -- e.g. "Bachelor's", "Master's", "High School"
  ADD COLUMN IF NOT EXISTS father_occupation TEXT,
  ADD COLUMN IF NOT EXISTS father_employer TEXT,

  -- Mother info (Common App: Family)
  ADD COLUMN IF NOT EXISTS mother_name TEXT,
  ADD COLUMN IF NOT EXISTS mother_email TEXT,
  ADD COLUMN IF NOT EXISTS mother_phone TEXT,
  ADD COLUMN IF NOT EXISTS mother_education TEXT,
  ADD COLUMN IF NOT EXISTS mother_occupation TEXT,
  ADD COLUMN IF NOT EXISTS mother_employer TEXT,

  -- Family context
  ADD COLUMN IF NOT EXISTS parents_marital_status TEXT,  -- "Married", "Divorced", "Single Parent", etc.
  ADD COLUMN IF NOT EXISTS first_generation_student BOOLEAN DEFAULT FALSE,

  -- High school details (Common App: Education)
  ADD COLUMN IF NOT EXISTS school_ceeb_code TEXT,
  ADD COLUMN IF NOT EXISTS school_type TEXT,           -- "Public", "Private", "International", "Home"
  ADD COLUMN IF NOT EXISTS school_city TEXT,
  ADD COLUMN IF NOT EXISTS class_size INTEGER,

  -- Extended test scores (Common App: Testing)
  ADD COLUMN IF NOT EXISTS ap_scores JSONB DEFAULT '[]',       -- [{subject, score, year}]
  ADD COLUMN IF NOT EXISTS ib_scores JSONB DEFAULT '[]',       -- [{subject, predicted, final}]
  ADD COLUMN IF NOT EXISTS sat_essay INTEGER,
  ADD COLUMN IF NOT EXISTS act_english INTEGER,
  ADD COLUMN IF NOT EXISTS act_math INTEGER,
  ADD COLUMN IF NOT EXISTS act_reading INTEGER,
  ADD COLUMN IF NOT EXISTS act_science INTEGER,

  -- Teacher recommendation context (feeds AI rec generation)
  ADD COLUMN IF NOT EXISTS teacher_rec_info JSONB DEFAULT '[]',
  -- Structure: [{name, email, subject, class_year, relationship_notes, highlights}]

  -- Counselor context (feeds AI counselor rec generation)
  ADD COLUMN IF NOT EXISTS counselor_notes TEXT;      -- coordinator's notes about student for counselor rec
