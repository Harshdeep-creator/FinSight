
-- Workspaces (chat sessions / analysis sessions)
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'New Workspace',
  mode text NOT NULL DEFAULT 'assistant' CHECK (mode IN ('assistant', 'analysis')),
  is_demo boolean NOT NULL DEFAULT false,
  dataset_name text,
  dataset_rows integer,
  last_analysis_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_all_workspaces" ON workspaces FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_all_workspaces" ON workspaces FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_all_workspaces" ON workspaces FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_all_workspaces" ON workspaces FOR DELETE TO anon, authenticated USING (true);

-- Messages per workspace
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_all_messages" ON messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_all_messages" ON messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_all_messages" ON messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_all_messages" ON messages FOR DELETE TO anon, authenticated USING (true);

-- Analysis results stored per workspace
CREATE TABLE IF NOT EXISTS analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  health_score jsonb NOT NULL DEFAULT '{}',
  key_findings jsonb NOT NULL DEFAULT '[]',
  metrics jsonb NOT NULL DEFAULT '{}',
  forecasts jsonb NOT NULL DEFAULT '{}',
  anomalies jsonb NOT NULL DEFAULT '[]',
  audit_trail jsonb NOT NULL DEFAULT '[]',
  report_summary text,
  raw_stats jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_all_analysis" ON analysis_results FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_all_analysis" ON analysis_results FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_all_analysis" ON analysis_results FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_all_analysis" ON analysis_results FOR DELETE TO anon, authenticated USING (true);

-- Scenarios per workspace
CREATE TABLE IF NOT EXISTS scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  base_analysis_id uuid REFERENCES analysis_results(id),
  variables jsonb NOT NULL DEFAULT '{}',
  result jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_all_scenarios" ON scenarios FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_all_scenarios" ON scenarios FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_all_scenarios" ON scenarios FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_all_scenarios" ON scenarios FOR DELETE TO anon, authenticated USING (true);
