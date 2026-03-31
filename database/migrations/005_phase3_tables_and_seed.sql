-- ============================================================
-- Migration 005: Phase 3 — essay_versions + college_profiles seed
-- Run this in Supabase SQL Editor (safe to re-run, all idempotent)
-- ============================================================

-- ── 1. essay_versions ────────────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS idx_essay_versions_essay ON essay_versions(essay_id);
CREATE INDEX IF NOT EXISTS idx_essay_versions_agency ON essay_versions(agency_id);

ALTER TABLE essay_versions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'essay_versions' AND policyname = 'agency_essay_versions'
  ) THEN
    CREATE POLICY "agency_essay_versions" ON essay_versions
      USING (agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid() AND is_active = true
      ));
  END IF;
END $$;

-- ── 2. college_profiles ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS college_profiles (
    id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                      text NOT NULL,
    slug                      text UNIQUE,
    location_city             text,
    location_state            text,
    us_news_rank              integer,
    acceptance_rate           numeric(5,4),
    avg_gpa                   numeric(4,2),
    avg_sat                   integer,
    avg_act                   integer,
    tuition_in_state          integer,
    tuition_out_state         integer,
    total_enrollment          integer,
    common_app                boolean NOT NULL DEFAULT true,
    coalition_app             boolean NOT NULL DEFAULT false,
    application_fee           integer,
    fee_waiver_available      boolean NOT NULL DEFAULT false,
    early_decision_deadline   date,
    early_action_deadline     date,
    regular_decision_deadline date,
    website_url               text,
    common_app_id             text,
    logo_url                  text,
    cds_year                  integer,
    created_at                timestamptz NOT NULL DEFAULT now(),
    updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_college_profiles_rank ON college_profiles(us_news_rank);
CREATE INDEX IF NOT EXISTS idx_college_profiles_state ON college_profiles(location_state);

ALTER TABLE college_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'college_profiles' AND policyname = 'public_college_profiles_read'
  ) THEN
    CREATE POLICY "public_college_profiles_read" ON college_profiles
      FOR SELECT USING (true);
  END IF;
END $$;

-- ── 3. Seed college_profiles (top 50 US colleges) ────────────────────────────
-- Uses ON CONFLICT DO NOTHING so safe to re-run.
INSERT INTO college_profiles (name, slug, location_city, location_state, us_news_rank, acceptance_rate, avg_gpa, avg_sat, avg_act, tuition_out_state, application_fee, early_decision_deadline, regular_decision_deadline, website_url, cds_year)
VALUES
  ('Massachusetts Institute of Technology', 'mit', 'Cambridge', 'MA', 1, 0.0390, 4.17, 1545, 35, 59750, 75, '2024-11-01', '2025-01-01', 'https://mit.edu', 2024),
  ('Harvard University', 'harvard', 'Cambridge', 'MA', 3, 0.0318, 4.18, 1550, 36, 59076, 75, '2024-11-01', '2025-01-01', 'https://harvard.edu', 2024),
  ('Stanford University', 'stanford', 'Stanford', 'CA', 3, 0.0366, 4.18, 1530, 35, 62484, 90, '2024-11-01', '2025-01-02', 'https://stanford.edu', 2024),
  ('Yale University', 'yale', 'New Haven', 'CT', 5, 0.0455, 4.14, 1555, 35, 64700, 80, '2024-11-01', '2025-01-02', 'https://yale.edu', 2024),
  ('Princeton University', 'princeton', 'Princeton', 'NJ', 1, 0.0380, 3.90, 1520, 35, 59710, 0, '2024-11-01', '2025-01-01', 'https://princeton.edu', 2024),
  ('California Institute of Technology', 'caltech', 'Pasadena', 'CA', 6, 0.0260, 4.19, 1560, 36, 60864, 75, null, '2025-01-03', 'https://caltech.edu', 2024),
  ('Columbia University', 'columbia', 'New York', 'NY', 12, 0.0397, 4.14, 1530, 35, 67044, 85, '2024-11-01', '2025-01-01', 'https://columbia.edu', 2024),
  ('University of Chicago', 'uchicago', 'Chicago', 'IL', 12, 0.0535, 4.16, 1545, 35, 65619, 0, '2024-11-01', '2025-01-03', 'https://uchicago.edu', 2024),
  ('University of Pennsylvania', 'upenn', 'Philadelphia', 'PA', 12, 0.0713, 3.90, 1520, 35, 65668, 75, '2024-11-01', '2025-01-01', 'https://upenn.edu', 2024),
  ('Johns Hopkins University', 'jhu', 'Baltimore', 'MD', 9, 0.0750, 3.90, 1530, 35, 60480, 70, '2024-11-01', '2025-01-02', 'https://jhu.edu', 2024),
  ('Duke University', 'duke', 'Durham', 'NC', 7, 0.0634, 3.94, 1530, 35, 63054, 85, '2024-11-01', '2025-01-02', 'https://duke.edu', 2024),
  ('Northwestern University', 'northwestern', 'Evanston', 'IL', 9, 0.0690, 3.92, 1530, 35, 63468, 75, '2024-11-01', '2025-01-03', 'https://northwestern.edu', 2024),
  ('Dartmouth College', 'dartmouth', 'Hanover', 'NH', 12, 0.0629, 3.89, 1490, 34, 62430, 80, '2024-11-01', '2025-01-02', 'https://dartmouth.edu', 2024),
  ('Brown University', 'brown', 'Providence', 'RI', 9, 0.0516, 4.05, 1510, 35, 65146, 75, '2024-11-01', '2025-01-01', 'https://brown.edu', 2024),
  ('Vanderbilt University', 'vanderbilt', 'Nashville', 'TN', 17, 0.0690, 3.83, 1520, 35, 58994, 50, '2024-11-01', '2025-01-01', 'https://vanderbilt.edu', 2024),
  ('Rice University', 'rice', 'Houston', 'TX', 17, 0.0780, 3.96, 1530, 35, 56940, 0, '2024-11-01', '2025-01-01', 'https://rice.edu', 2024),
  ('Cornell University', 'cornell', 'Ithaca', 'NY', 12, 0.0861, 4.05, 1490, 34, 63200, 80, '2024-11-01', '2025-01-02', 'https://cornell.edu', 2024),
  ('Notre Dame University', 'notredame', 'Notre Dame', 'IN', 20, 0.1260, 4.01, 1470, 34, 59585, 75, '2024-11-01', '2025-01-01', 'https://nd.edu', 2024),
  ('Georgetown University', 'georgetown', 'Washington', 'DC', 22, 0.1150, 3.89, 1460, 33, 60336, 75, null, '2025-01-10', 'https://georgetown.edu', 2024),
  ('UCLA', 'ucla', 'Los Angeles', 'CA', 15, 0.0877, 4.18, 1405, 32, 43473, 70, null, '2024-11-30', 'https://ucla.edu', 2024),
  ('UC Berkeley', 'ucberkeley', 'Berkeley', 'CA', 15, 0.1120, 4.15, 1415, 32, 44066, 70, null, '2024-11-30', 'https://berkeley.edu', 2024),
  ('Carnegie Mellon University', 'cmu', 'Pittsburgh', 'PA', 22, 0.1100, 3.89, 1510, 35, 62428, 75, '2024-11-01', '2025-01-01', 'https://cmu.edu', 2024),
  ('University of Michigan', 'umich', 'Ann Arbor', 'MI', 27, 0.1760, 3.90, 1435, 33, 55334, 75, '2024-11-01', '2025-02-01', 'https://umich.edu', 2024),
  ('Emory University', 'emory', 'Atlanta', 'GA', 24, 0.1150, 3.83, 1465, 33, 57628, 75, '2024-11-01', '2025-01-01', 'https://emory.edu', 2024),
  ('Tufts University', 'tufts', 'Medford', 'MA', 32, 0.1040, 3.92, 1490, 34, 65222, 75, '2024-11-01', '2025-01-01', 'https://tufts.edu', 2024),
  ('University of Virginia', 'uva', 'Charlottesville', 'VA', 27, 0.1720, 4.14, 1410, 32, 54224, 60, '2024-11-01', '2025-01-01', 'https://virginia.edu', 2024),
  ('Wake Forest University', 'wakeforest', 'Winston-Salem', 'NC', 37, 0.2080, 3.83, 1420, 32, 62950, 0, '2024-11-01', '2025-01-01', 'https://wfu.edu', 2024),
  ('New York University', 'nyu', 'New York', 'NY', 38, 0.1200, 3.69, 1440, 33, 60438, 80, '2024-11-01', '2025-01-05', 'https://nyu.edu', 2024),
  ('University of Southern California', 'usc', 'Los Angeles', 'CA', 27, 0.1140, 3.79, 1445, 33, 67458, 85, '2024-11-01', '2025-01-15', 'https://usc.edu', 2024),
  ('Lehigh University', 'lehigh', 'Bethlehem', 'PA', 49, 0.3580, 3.73, 1370, 31, 58670, 70, '2024-11-01', '2025-01-15', 'https://lehigh.edu', 2024),
  ('Boston University', 'bu', 'Boston', 'MA', 65, 0.1880, 3.73, 1410, 32, 61050, 80, '2024-11-01', '2025-01-02', 'https://bu.edu', 2024),
  ('Boston College', 'bc', 'Chestnut Hill', 'MA', 38, 0.1710, 3.91, 1425, 33, 63790, 0, '2024-11-01', '2025-01-01', 'https://bc.edu', 2024),
  ('George Washington University', 'gwu', 'Washington', 'DC', 67, 0.4040, 3.83, 1385, 31, 61070, 80, '2024-11-01', '2025-01-05', 'https://gwu.edu', 2024),
  ('Tulane University', 'tulane', 'New Orleans', 'LA', 59, 0.1010, 3.71, 1415, 32, 62076, 0, '2024-11-01', '2025-01-15', 'https://tulane.edu', 2024),
  ('Case Western Reserve University', 'cwru', 'Cleveland', 'OH', 49, 0.2600, 3.96, 1490, 34, 58768, 0, '2024-11-01', '2025-01-15', 'https://case.edu', 2024),
  ('University of Rochester', 'rochester', 'Rochester', 'NY', 49, 0.3140, 3.86, 1470, 33, 62520, 50, '2024-11-01', '2025-01-05', 'https://rochester.edu', 2024),
  ('Rensselaer Polytechnic Institute', 'rpi', 'Troy', 'NY', 57, 0.5680, 3.82, 1390, 32, 60669, 70, '2024-11-01', '2025-01-15', 'https://rpi.edu', 2024),
  ('University of Wisconsin-Madison', 'wisc', 'Madison', 'WI', 35, 0.4850, 3.88, 1360, 29, 38904, 60, null, '2025-02-01', 'https://wisc.edu', 2024),
  ('Georgia Institute of Technology', 'gatech', 'Atlanta', 'GA', 35, 0.1640, 4.07, 1480, 34, 33794, 75, '2024-10-15', '2025-01-01', 'https://gatech.edu', 2024),
  ('University of Texas at Austin', 'utaustin', 'Austin', 'TX', 38, 0.3100, 3.84, 1310, 29, 40996, 75, null, '2024-12-01', 'https://utexas.edu', 2024),
  ('University of North Carolina', 'unc', 'Chapel Hill', 'NC', 29, 0.1820, 4.39, 1370, 31, 37420, 85, '2024-10-15', '2025-01-15', 'https://unc.edu', 2024),
  ('Ohio State University', 'osu', 'Columbus', 'OH', 49, 0.5270, 3.83, 1300, 28, 35019, 60, null, '2025-02-01', 'https://osu.edu', 2024),
  ('Penn State University', 'pennstate', 'University Park', 'PA', 75, 0.5470, 3.59, 1255, 28, 39996, 65, null, '2025-02-01', 'https://psu.edu', 2024),
  ('University of Illinois Urbana-Champaign', 'uiuc', 'Champaign', 'IL', 47, 0.4390, 3.83, 1405, 32, 36068, 50, null, '2024-11-01', 'https://illinois.edu', 2024),
  ('Purdue University', 'purdue', 'West Lafayette', 'IN', 54, 0.5490, 3.72, 1330, 29, 28794, 60, null, '2025-02-01', 'https://purdue.edu', 2024),
  ('University of Washington', 'uw', 'Seattle', 'WA', 59, 0.4840, 3.83, 1340, 30, 40740, 80, null, '2024-11-30', 'https://uw.edu', 2024),
  ('University of Florida', 'uf', 'Gainesville', 'FL', 32, 0.2380, 4.37, 1370, 31, 28659, 30, null, '2024-11-01', 'https://ufl.edu', 2024),
  ('University of Connecticut', 'uconn', 'Storrs', 'CT', 67, 0.5550, 3.80, 1270, 28, 40994, 80, null, '2025-01-15', 'https://uconn.edu', 2024),
  ('Syracuse University', 'syracuse', 'Syracuse', 'NY', 67, 0.5930, 3.73, 1270, 28, 57698, 75, '2024-11-15', '2025-01-15', 'https://syracuse.edu', 2024),
  ('American University', 'american', 'Washington', 'DC', 75, 0.3540, 3.69, 1270, 29, 56994, 70, '2024-11-15', '2025-01-15', 'https://american.edu', 2024)
ON CONFLICT (slug) DO NOTHING;
