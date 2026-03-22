-- Migration 003: Reports system
-- Stores generated weekly/monthly/yearly reports per agency and platform-wide

CREATE TABLE reports (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       UUID        REFERENCES agencies(id) ON DELETE CASCADE,  -- NULL = super admin / platform report
  scope           TEXT        NOT NULL DEFAULT 'agency',  -- 'agency' | 'platform'
  report_type     TEXT        NOT NULL,                   -- 'weekly' | 'monthly' | 'yearly'
  period_label    TEXT        NOT NULL,                   -- "Week 12, 2026" | "March 2026" | "2026"
  period_start    DATE        NOT NULL,
  period_end      DATE        NOT NULL,
  summary_json    JSONB,                                  -- key metrics snapshot
  pdf_storage_path TEXT,                                  -- R2 path to PDF blob
  pdf_url         TEXT,                                   -- presigned/public URL (refreshed on download)
  telegram_sent   BOOLEAN     NOT NULL DEFAULT FALSE,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_agency_id  ON reports (agency_id);
CREATE INDEX idx_reports_scope      ON reports (scope);
CREATE INDEX idx_reports_type       ON reports (report_type);
CREATE INDEX idx_reports_period     ON reports (period_start DESC);

-- RLS: agency members see their own reports; super admins see platform reports separately
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_reports_isolation" ON reports
  USING (
    agency_id = (
      SELECT agency_id FROM agency_members
      WHERE user_id = auth.uid() AND is_active = true
      LIMIT 1
    )
  );
