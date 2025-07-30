-- Flexible schema for user-defined objects and metrics
-- Users can create objects like "BJJ", "Museum Visit", "Coffee" etc.

-- User-defined object types (like "BJJ", "Museum Visit", "Coffee")
CREATE TABLE user_object_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, -- "BJJ", "Museum Visit", "Coffee"
  category text NOT NULL, -- "Sports", "Leisure", "Health"
  description text,
  is_active boolean DEFAULT true, -- Can disable without deleting
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique names per user
  UNIQUE(user_id, name)
);

-- Custom metrics for each object type (like "Technique Quality", "Energy Level" for BJJ)
CREATE TABLE user_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  object_type_id uuid NOT NULL REFERENCES user_object_types(id) ON DELETE CASCADE,
  name text NOT NULL, -- "Technique Quality", "Energy Level", "Caffeine Level"
  min_value numeric DEFAULT 0,
  max_value numeric DEFAULT 10,
  unit text, -- "stars", "mg", "level"
  display_order integer DEFAULT 0, -- For UI ordering
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure unique metric names per object type
  UNIQUE(object_type_id, name)
);

-- Logs for user-defined objects (actual tracking data)
CREATE TABLE user_object_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  object_type_id uuid NOT NULL REFERENCES user_object_types(id) ON DELETE CASCADE,
  time_start timestamptz,
  time_end timestamptz,
  metrics jsonb, -- {"technique_quality": 8, "energy_level": 7}
  notes jsonb, -- [{"timestamp": "...", "note": "..."}]
  custom_fields jsonb, -- {"gym": "BJJ Academy", "partner": "John"}
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_user_object_types_user_id ON user_object_types(user_id);
CREATE INDEX idx_user_metrics_user_id ON user_metrics(user_id);
CREATE INDEX idx_user_metrics_object_type_id ON user_metrics(object_type_id);
CREATE INDEX idx_user_object_logs_user_id ON user_object_logs(user_id);
CREATE INDEX idx_user_object_logs_object_type_id ON user_object_logs(object_type_id);
CREATE INDEX idx_user_object_logs_time_start ON user_object_logs(time_start);

-- Enable RLS
ALTER TABLE user_object_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_object_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access their own object types" ON user_object_types
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own metrics" ON user_metrics
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own object logs" ON user_object_logs
  FOR ALL USING (auth.uid() = user_id); 