-- Users table is managed by Supabase (auth.users)

CREATE TABLE activity_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  sub_activity text,
  sub_sub_activity text,
  info text
);
CREATE INDEX idx_activity_objects_user_id ON activity_objects(user_id);

CREATE TABLE intake_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  default_quantity numeric NOT NULL,
  default_unit text NOT NULL,
  info text
);
CREATE INDEX idx_intake_objects_user_id ON intake_objects(user_id);

CREATE TABLE reading_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_name text NOT NULL,
  author text NOT NULL,
  year integer,
  info text
);
CREATE INDEX idx_reading_objects_user_id ON reading_objects(user_id);

CREATE TABLE session_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  time_start timestamptz NOT NULL,
  time_end timestamptz NOT NULL,
  activity_object_id uuid REFERENCES activity_objects(id),
  tracker_and_metric jsonb,
  notes jsonb
);
CREATE INDEX idx_session_logs_user_id ON session_logs(user_id);

CREATE TABLE intake_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL,
  intake_object_id uuid REFERENCES intake_objects(id),
  quantity numeric NOT NULL,
  unit text NOT NULL
);
CREATE INDEX idx_intake_logs_user_id ON intake_logs(user_id);

CREATE TABLE reading_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  time_start timestamptz NOT NULL,
  time_end timestamptz NOT NULL,
  reading_object_id uuid REFERENCES reading_objects(id),
  tracker_and_metric jsonb,
  notes jsonb
);
CREATE INDEX idx_reading_logs_user_id ON reading_logs(user_id);

CREATE TABLE note_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL,
  title text,
  content text NOT NULL,
  tracker_and_metric jsonb,
  related_activities jsonb
);
CREATE INDEX idx_note_logs_user_id ON note_logs(user_id); 