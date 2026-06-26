-- Add user_id to workspaces for privacy
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to analysis_results
ALTER TABLE analysis_results ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to scenarios
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "select_all_workspaces" ON workspaces;
DROP POLICY IF EXISTS "insert_all_workspaces" ON workspaces;
DROP POLICY IF EXISTS "update_all_workspaces" ON workspaces;
DROP POLICY IF EXISTS "delete_all_workspaces" ON workspaces;

DROP POLICY IF EXISTS "select_all_messages" ON messages;
DROP POLICY IF EXISTS "insert_all_messages" ON messages;
DROP POLICY IF EXISTS "update_all_messages" ON messages;
DROP POLICY IF EXISTS "delete_all_messages" ON messages;

DROP POLICY IF EXISTS "select_all_analysis" ON analysis_results;
DROP POLICY IF EXISTS "insert_all_analysis" ON analysis_results;
DROP POLICY IF EXISTS "update_all_analysis" ON analysis_results;
DROP POLICY IF EXISTS "delete_all_analysis" ON analysis_results;

DROP POLICY IF EXISTS "select_all_scenarios" ON scenarios;
DROP POLICY IF EXISTS "insert_all_scenarios" ON scenarios;
DROP POLICY IF EXISTS "update_all_scenarios" ON scenarios;
DROP POLICY IF EXISTS "delete_all_scenarios" ON scenarios;

-- Create new policies that filter by user_id (authenticated users only)
-- Workspaces: users can only see their own workspaces
CREATE POLICY "select_own_workspaces" ON workspaces FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_workspaces" ON workspaces FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_workspaces" ON workspaces FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_workspaces" ON workspaces FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Messages: users can only see messages in their workspaces
CREATE POLICY "select_own_messages" ON messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_messages" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_messages" ON messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Analysis results: users can only see their own analysis
CREATE POLICY "select_own_analysis" ON analysis_results FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_analysis" ON analysis_results FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_analysis" ON analysis_results FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_analysis" ON analysis_results FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Scenarios: users can only see their own scenarios
CREATE POLICY "select_own_scenarios" ON scenarios FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_scenarios" ON scenarios FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_scenarios" ON scenarios FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_scenarios" ON scenarios FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Enable email auth (no confirmation required for simplicity)
-- This is done via Supabase dashboard, but we can ensure the extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
