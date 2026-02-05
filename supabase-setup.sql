-- =====================================================
-- ALBUM NIGHT - COMPLETE SUPABASE SETUP
-- =====================================================
-- Run this ENTIRE script in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor
-- =====================================================

-- 1. DROP EXISTING TABLES (if you need to start fresh)
-- Uncomment these lines if you want to reset everything:
-- DROP TABLE IF EXISTS scores CASCADE;
-- DROP TABLE IF EXISTS songs CASCADE;
-- DROP TABLE IF EXISTS participants CASCADE;
-- DROP TABLE IF EXISTS sessions CASCADE;

-- =====================================================
-- 2. CREATE TABLES
-- =====================================================

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Album Night',
  status TEXT NOT NULL DEFAULT 'lobby',
  song_index INTEGER NOT NULL DEFAULT 0,
  locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  session_code TEXT REFERENCES sessions(code) ON DELETE CASCADE,
  participant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMPTZ,
  PRIMARY KEY (session_code, participant_id)
);

-- Songs table
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT REFERENCES sessions(code) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scores table (NOTE: submitted_at column is included!)
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT REFERENCES sessions(code) ON DELETE CASCADE,
  song_index INTEGER NOT NULL,
  participant_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_code, song_index, participant_id)
);

-- =====================================================
-- 3. ENABLE REALTIME
-- =====================================================
-- This makes the app update in real-time when data changes

ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE songs;
ALTER PUBLICATION supabase_realtime ADD TABLE scores;

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for this simple app)
-- Sessions policies
CREATE POLICY "Allow all on sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);

-- Participants policies  
CREATE POLICY "Allow all on participants" ON participants FOR ALL USING (true) WITH CHECK (true);

-- Songs policies
CREATE POLICY "Allow all on songs" ON songs FOR ALL USING (true) WITH CHECK (true);

-- Scores policies
CREATE POLICY "Allow all on scores" ON scores FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 5. CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_code);
CREATE INDEX IF NOT EXISTS idx_songs_session ON songs(session_code);
CREATE INDEX IF NOT EXISTS idx_songs_order ON songs(session_code, order_index);
CREATE INDEX IF NOT EXISTS idx_scores_session ON scores(session_code);
CREATE INDEX IF NOT EXISTS idx_scores_song ON scores(session_code, song_index);

-- =====================================================
-- DONE! Your database is now ready.
-- =====================================================

-- To verify, you can run:
-- SELECT * FROM sessions;
-- SELECT * FROM participants;
-- SELECT * FROM songs;
-- SELECT * FROM scores;
