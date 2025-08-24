-- Part 2: Flexible, User-Defined Object Model Schema (Version 2)
-- Updates:
-- 1. Added 'isMandatory' flag to the structure of object_definitions.
-- 2. Added a 'structure' field to log_definitions for complex trackers.

-- Table to define the base "System Functions"
CREATE TABLE system_functions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- e.g., 'Short Text Input'
    description TEXT,
    data_type TEXT NOT NULL, -- e.g., 'TEXT', 'NUMERIC', 'BOOLEAN', 'TIMESTAMPTZ'
    component_key TEXT NOT NULL UNIQUE -- e.g., 'ShortText', used by the UI to render the correct component
);

-- Table for User-Defined Object Definitions (e.g., a "Book" or "Movie" template)
CREATE TABLE object_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "Book", "Movie", "Workout"
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- The structure now includes an 'isMandatory' flag.
    -- e.g., [{"fieldName": "Title", "systemFunctionId": "...", "isMandatory": true}]
    structure JSONB NOT NULL
);
CREATE INDEX idx_object_definitions_user_id ON object_definitions(user_id);

-- Table for instances of User-Defined Objects (e.g., the book "Dune")
CREATE TABLE objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    definition_id UUID NOT NULL REFERENCES object_definitions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB NOT NULL
);
CREATE INDEX idx_objects_user_id ON objects(user_id);
CREATE INDEX idx_objects_definition_id ON objects(definition_id);

-- Table for User-Defined Log Definitions (e.g., a "Reading Session" or a "Mood Tracker")
CREATE TABLE log_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "Reading Session", "Daily Mood Check"
    description TEXT,
    object_definition_id UUID NOT NULL REFERENCES object_definitions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Structure for complex logs/trackers, e.g., [{"fieldName": "Mood", "systemFunctionId": "..."}]
    structure JSONB -- Can be NULL for simple timestamp logs
);
CREATE INDEX idx_log_definitions_user_id ON log_definitions(user_id);

-- Table for instances of Logs
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_definition_id UUID NOT NULL REFERENCES log_definitions(id) ON DELETE CASCADE,
    object_id UUID NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
    timestamp_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    timestamp_end TIMESTAMPTZ,
    -- Data for the log itself, conforming to the log_definition's structure
    log_data JSONB
);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_object_id ON logs(object_id);


-- RLS Policies and initial data remain the same.
-- Enable RLS for all new tables
ALTER TABLE system_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE object_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access to all authenticated users" ON system_functions
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own object definitions" ON object_definitions
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own objects" ON objects
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own log definitions" ON log_definitions
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own logs" ON logs
FOR ALL USING (auth.uid() = user_id);

-- Insert default system functions
INSERT INTO system_functions (name, description, data_type, component_key) VALUES
('Short Text', 'For single-line text input, like a title or name.', 'TEXT', 'ShortText'),
('Long Text', 'For multi-line text input, like a description or notes.', 'TEXT', 'LongText'),
('Number', 'For numerical input, like a quantity or rating.', 'NUMERIC', 'Number'),
('Date', 'For a date or timestamp.', 'TIMESTAMPTZ', 'Date'),
('Boolean', 'For a simple yes/no or true/false value.', 'BOOLEAN', 'Boolean'),
('Select', 'For choosing one option from a list.', 'TEXT', 'Select'),
('Multi-Select', 'For choosing multiple options from a list.', 'ARRAY', 'MultiSelect');
