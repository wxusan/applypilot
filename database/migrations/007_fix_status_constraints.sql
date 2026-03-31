-- Migration 007: Fix status CHECK constraints for Phase 4 tables
-- The original migration had missing status values that the application code uses.

-- ============================================================================
-- Fix 1: automation_workflows — add 'running' status
-- The API uses 'running' for an active workflow.
-- ============================================================================
ALTER TABLE automation_workflows
    DROP CONSTRAINT IF EXISTS automation_workflows_status_check;

ALTER TABLE automation_workflows
    ADD CONSTRAINT automation_workflows_status_check
    CHECK (status IN ('draft', 'running', 'in_progress', 'paused', 'completed', 'failed'));


-- ============================================================================
-- Fix 2: automation_steps — add 'queued' and 'awaiting_approval' statuses
-- 'queued'            = ready for the agent to pick up and execute
-- 'awaiting_approval' = agent has completed the step, coordinator must review
-- ============================================================================
ALTER TABLE automation_steps
    DROP CONSTRAINT IF EXISTS automation_steps_status_check;

ALTER TABLE automation_steps
    ADD CONSTRAINT automation_steps_status_check
    CHECK (status IN (
        'pending',
        'queued',
        'in_progress',
        'awaiting_approval',
        'approved',
        'completed',
        'rejected',
        'skipped',
        'failed'
    ));


-- ============================================================================
-- Fix 3: portal_sessions — add 'failed' activation_status
-- The portals page shows 'failed' + retry button, but DB constraint was missing it.
-- ============================================================================
ALTER TABLE portal_sessions
    DROP CONSTRAINT IF EXISTS portal_sessions_activation_status_check;

ALTER TABLE portal_sessions
    ADD CONSTRAINT portal_sessions_activation_status_check
    CHECK (activation_status IN ('not_started', 'activated', 'failed', 'locked', 'expired'));


-- ============================================================================
-- Fix 4: portal_sessions decision_status — add 'deferred'
-- Frontend shows deferred badge but original constraint didn't include it.
-- ============================================================================
ALTER TABLE portal_sessions
    DROP CONSTRAINT IF EXISTS portal_sessions_decision_status_check;

ALTER TABLE portal_sessions
    ADD CONSTRAINT portal_sessions_decision_status_check
    CHECK (decision_status IN ('pending', 'accepted', 'rejected', 'waitlisted', 'deferred'));
