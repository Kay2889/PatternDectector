/*
# Dark Pattern Detection Database Schema

1. New Tables
- `profiles` - User profiles extending auth.users
  - id (uuid, primary key, references auth.users)
  - full_name (text)
  - avatar_url (text)
  - created_at, updated_at (timestamps)
  
- `websites` - Analyzed websites
  - id (uuid, primary key)
  - user_id (uuid, not null, defaults to auth.uid())
  - url (text, not null)
  - title (text)
  - created_at (timestamp)
  
- `scans` - Individual scan records
  - id (uuid, primary key)
  - user_id (uuid, not null, defaults to auth.uid())
  - website_id (uuid, references websites)
  - scan_type (text) - 'website' or 'screenshot'
  - url (text) - original URL or image filename
  - html_content (text) - extracted HTML for website scans
  - ocr_text (text) - extracted text for screenshot scans
  - status (text) - 'pending', 'processing', 'completed', 'failed'
  - created_at (timestamp)
  
- `dark_patterns` - Detected dark patterns
  - id (uuid, primary key)
  - scan_id (uuid, references scans)
  - user_id (uuid, not null, defaults to auth.uid())
  - pattern_type (text, not null) - e.g., 'confirmshaming', 'hidden_costs', 'fake_timer'
  - confidence (integer) - 0-100 confidence score
  - severity (text) - 'low', 'medium', 'high'
  - description (text)
  - element_text (text) - the actual text found
  - element_selector (text) - CSS selector for the element
  - recommendation (text) - how to fix
  - location_x, location_y (integer) - position in screenshot
  - width, height (integer) - size of detected area
  - created_at (timestamp)

- `detection_stats` - Aggregate statistics per user
  - id (uuid, primary key)
  - user_id (uuid, unique, not null, defaults to auth.uid())
  - total_websites_analyzed (integer, default 0)
  - total_patterns_detected (integer, default 0)
  - last_scan_at (timestamp)
  - created_at, updated_at (timestamps)

2. Security
- Enable RLS on all tables
- Owner-scoped CRUD policies for authenticated users
- User can only access their own data

3. Indexes
- Index on user_id for all tables
- Index on scan_id for dark_patterns
- Index on pattern_type for analytics
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Websites table
CREATE TABLE IF NOT EXISTS websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_websites" ON websites;
CREATE POLICY "select_own_websites" ON websites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_websites" ON websites;
CREATE POLICY "insert_own_websites" ON websites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_websites" ON websites;
CREATE POLICY "update_own_websites" ON websites FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_websites" ON websites;
CREATE POLICY "delete_own_websites" ON websites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Scans table
CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  website_id uuid REFERENCES websites(id) ON DELETE SET NULL,
  scan_type text NOT NULL DEFAULT 'website',
  url text,
  html_content text,
  ocr_text text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_scans" ON scans;
CREATE POLICY "select_own_scans" ON scans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_scans" ON scans;
CREATE POLICY "insert_own_scans" ON scans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_scans" ON scans;
CREATE POLICY "update_own_scans" ON scans FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_scans" ON scans;
CREATE POLICY "delete_own_scans" ON scans FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Dark patterns table
CREATE TABLE IF NOT EXISTS dark_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid REFERENCES scans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type text NOT NULL,
  confidence integer DEFAULT 0,
  severity text DEFAULT 'medium',
  description text,
  element_text text,
  element_selector text,
  recommendation text,
  location_x integer,
  location_y integer,
  width integer,
  height integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dark_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_patterns" ON dark_patterns;
CREATE POLICY "select_own_patterns" ON dark_patterns FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_patterns" ON dark_patterns;
CREATE POLICY "insert_own_patterns" ON dark_patterns FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_patterns" ON dark_patterns;
CREATE POLICY "update_own_patterns" ON dark_patterns FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_patterns" ON dark_patterns;
CREATE POLICY "delete_own_patterns" ON dark_patterns FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Detection stats table
CREATE TABLE IF NOT EXISTS detection_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  total_websites_analyzed integer DEFAULT 0,
  total_patterns_detected integer DEFAULT 0,
  last_scan_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE detection_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_stats" ON detection_stats;
CREATE POLICY "select_own_stats" ON detection_stats FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_stats" ON detection_stats;
CREATE POLICY "insert_own_stats" ON detection_stats FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_stats" ON detection_stats;
CREATE POLICY "update_own_stats" ON detection_stats FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON websites(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_website_id ON scans(website_id);
CREATE INDEX IF NOT EXISTS idx_dark_patterns_user_id ON dark_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_dark_patterns_scan_id ON dark_patterns(scan_id);
CREATE INDEX IF NOT EXISTS idx_dark_patterns_type ON dark_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_detection_stats_user_id ON detection_stats(user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS detection_stats_updated_at ON detection_stats;
CREATE TRIGGER detection_stats_updated_at
  BEFORE UPDATE ON detection_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
