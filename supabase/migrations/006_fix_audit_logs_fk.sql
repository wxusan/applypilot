-- Migration 006: Fix audit_logs.agency_id FK constraint
--
-- The existing constraint is a plain REFERENCES (no CASCADE / SET NULL),
-- which blocks deleting an agency when audit log rows reference it.
-- Drop and recreate with ON DELETE SET NULL so agency deletions work cleanly
-- while preserving audit history (agency_id becomes NULL on the old rows).

alter table audit_logs
  drop constraint if exists audit_logs_agency_id_fkey;

alter table audit_logs
  add constraint audit_logs_agency_id_fkey
  foreign key (agency_id) references agencies(id) on delete set null;
