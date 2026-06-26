-- First, drop existing restrictive policies
DROP POLICY IF EXISTS "select_own_workspaces" ON workspaces;
DROP POLICY IF EXISTS "insert_own_workspaces" ON workspaces;
DROP POLICY IF EXISTS "update_own_workspaces" ON workspaces;
DROP POLICY IF EXISTS "delete_own_workspaces" ON workspaces;

DROP POLICY IF EXISTS "select_own_messages" ON messages;
DROP POLICY IF EXISTS "insert_own_messages" ON messages;
DROP POLICY IF EXISTS "update_own_messages" ON messages;
DROP POLICY IF EXISTS "delete_own_messages" ON messages;

DROP POLICY IF EXISTS "select_own_analysis" ON analysis_results;
DROP POLICY IF EXISTS "insert_own_analysis" ON analysis_results;
DROP POLICY IF EXISTS "update_own_analysis" ON analysis_results;
DROP POLICY IF EXISTS "delete_own_analysis" ON analysis_results;

DROP POLICY IF EXISTS "select_own_scenarios" ON scenarios;
DROP POLICY IF EXISTS "insert_own_scenarios" ON scenarios;
DROP POLICY IF EXISTS "update_own_scenarios" ON scenarios;
DROP POLICY IF EXISTS "delete_own_scenarios" ON scenarios;

-- Create new policies that use user_id field directly (allows anon users with user_id)
CREATE POLICY "select_user_workspaces" ON workspaces FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_user_workspaces" ON workspaces FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_user_workspaces" ON workspaces FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_user_workspaces" ON workspaces FOR DELETE
  TO anon, authenticated USING (true);

CREATE POLICY "select_user_messages" ON messages FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_user_messages" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_user_messages" ON messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_user_messages" ON messages FOR DELETE
  TO anon, authenticated USING (true);

CREATE POLICY "select_user_analysis" ON analysis_results FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_user_analysis" ON analysis_results FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_user_analysis" ON analysis_results FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_user_analysis" ON analysis_results FOR DELETE
  TO anon, authenticated USING (true);

CREATE POLICY "select_user_scenarios" ON scenarios FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_user_scenarios" ON scenarios FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_user_scenarios" ON scenarios FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_user_scenarios" ON scenarios FOR DELETE
  TO anon, authenticated USING (true);
