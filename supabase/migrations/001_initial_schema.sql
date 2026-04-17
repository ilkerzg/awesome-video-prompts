-- ============================================================
-- Video Prompt Library — Initial Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- Prompt likes (anonymous, fingerprint-based dedup)
CREATE TABLE IF NOT EXISTS prompt_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id text NOT NULL,
  fingerprint text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_likes_unique
  ON prompt_likes (prompt_id, fingerprint);
CREATE INDEX IF NOT EXISTS idx_prompt_likes_prompt
  ON prompt_likes (prompt_id);

-- Prompt views (simple counter)
CREATE TABLE IF NOT EXISTS prompt_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompt_views_prompt
  ON prompt_views (prompt_id);

-- Community prompt submissions
CREATE TABLE IF NOT EXISTS prompt_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt text NOT NULL,
  author_name text NOT NULL,
  author_twitter text,
  video_url text,
  category text NOT NULL DEFAULT 'cinematic',
  model text NOT NULL DEFAULT 'Seedance 2.0',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_submissions_status
  ON prompt_submissions (status);

-- Enable Row Level Security
ALTER TABLE prompt_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: allow anonymous insert + select
CREATE POLICY "Anyone can like" ON prompt_likes
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read likes" ON prompt_likes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view" ON prompt_views
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read views" ON prompt_views
  FOR SELECT USING (true);

CREATE POLICY "Anyone can submit" ON prompt_submissions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read approved" ON prompt_submissions
  FOR SELECT USING (status = 'approved' OR status = 'pending');
