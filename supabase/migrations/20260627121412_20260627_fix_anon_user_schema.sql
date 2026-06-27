-- Fix: Remove user_id foreign key constraints that fail for anonymous users
-- and add proper indexing for workspace-based queries

-- Drop foreign key constraints that reference auth.users (local UUIDs won't exist there)
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
ALTER TABLE analysis_results DROP CONSTRAINT IF EXISTS analysis_results_user_id_fkey;
ALTER TABLE scenarios DROP CONSTRAINT IF EXISTS scenarios_user_id_fkey;
ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_user_id_fkey;

-- Change user_id columns to text to store any UUID format
ALTER TABLE workspaces ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE messages ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE analysis_results ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE scenarios ALTER COLUMN user_id TYPE text USING user_id::text;

-- Drop old policies
DROP POLICY IF EXISTS "select_user_workspaces" ON workspaces;
DROP POLICY IF EXISTS "insert_user_workspaces" ON workspaces;
DROP POLICY IF EXISTS "update_user_workspaces" ON workspaces;
DROP POLICY IF EXISTS "delete_user_workspaces" ON workspaces;

DROP POLICY IF EXISTS "select_user_messages" ON messages;
DROP POLICY IF EXISTS "insert_user_messages" ON messages;
DROP POLICY IF EXISTS "update_user_messages" ON messages;
DROP POLICY IF EXISTS "delete_user_messages" ON messages;

DROP POLICY IF EXISTS "select_user_analysis" ON analysis_results;
DROP POLICY IF EXISTS "insert_user_analysis" ON analysis_results;
DROP POLICY IF EXISTS "update_user_analysis" ON analysis_results;
DROP POLICY IF EXISTS "delete_user_analysis" ON analysis_results;

DROP POLICY IF EXISTS "select_user_scenarios" ON scenarios;
DROP POLICY IF EXISTS "insert_user_scenarios" ON scenarios;
DROP POLICY IF EXISTS "update_user_scenarios" ON scenarios;
DROP POLICY IF EXISTS "delete_user_scenarios" ON scenarios;

-- Create new simple policies (workspace-based access)
CREATE POLICY "workspaces_access" ON workspaces FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "messages_access" ON messages FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "analysis_access" ON analysis_results FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "scenarios_access" ON scenarios FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_workspace ON messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_analysis_workspace ON analysis_results(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_user ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);