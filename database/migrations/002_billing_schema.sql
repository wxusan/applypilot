-- Part 1: Alter existing agencies table to support token tracking
ALTER TABLE agencies ADD COLUMN ai_tokens_used INTEGER DEFAULT 0;
ALTER TABLE agencies ADD COLUMN ai_token_limit INTEGER DEFAULT 500000;

-- Part 2: Create immutable tracking ledger for every LLM interaction
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  tokens_spent INTEGER NOT NULL,
  cost_usd DECIMAL(10,5) NOT NULL,
  model_name TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Part 3: Lock down the new ledger with strict Row Level Security
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_isolation_ai_usage" ON ai_usage_logs
  USING (agency_id = (
    SELECT agency_id FROM agency_members
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  ));
