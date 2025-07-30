-- Enable RLS and add policies for all user data tables

ALTER TABLE activity_objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own activity_objects" ON activity_objects
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE intake_objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own intake_objects" ON intake_objects
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE reading_objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own reading_objects" ON reading_objects
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own session_logs" ON session_logs
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE intake_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own intake_logs" ON intake_logs
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE reading_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own reading_logs" ON reading_logs
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE note_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own note_logs" ON note_logs
  FOR ALL USING (auth.uid() = user_id); 