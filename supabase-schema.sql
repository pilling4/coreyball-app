-- ============================================================
-- COREYBALL Golf 2026 - Supabase Schema
-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- ============================================================

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_major BOOLEAN DEFAULT FALSE,
  multiplier DECIMAL(4,2) DEFAULT 1.0,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed')),
  current_round INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entries table (one row per player per tournament)
CREATE TABLE IF NOT EXISTS entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  entry_id TEXT NOT NULL,
  entry_name TEXT NOT NULL,
  rank INTEGER NOT NULL,
  points DECIMAL(8,2) DEFAULT 0,
  time_remaining INTEGER DEFAULT 0,
  lineup TEXT[] NOT NULL DEFAULT '{}',
  payout DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, entry_id)
);

-- Golfer ownership data (per tournament)
CREATE TABLE IF NOT EXISTS golfer_ownership (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  golfer_name TEXT NOT NULL,
  roster_position TEXT DEFAULT 'G',
  pct_drafted DECIMAL(6,2) DEFAULT 0,
  fpts DECIMAL(8,2) DEFAULT 0,
  UNIQUE(tournament_id, golfer_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entries_tournament ON entries(tournament_id);
CREATE INDEX IF NOT EXISTS idx_entries_entry_name ON entries(entry_name);
CREATE INDEX IF NOT EXISTS idx_entries_rank ON entries(tournament_id, rank);
CREATE INDEX IF NOT EXISTS idx_ownership_tournament ON golfer_ownership(tournament_id);
CREATE INDEX IF NOT EXISTS idx_ownership_drafted ON golfer_ownership(tournament_id, pct_drafted DESC);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE golfer_ownership ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone with anon key can read)
CREATE POLICY "Public read tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public read entries" ON entries FOR SELECT USING (true);
CREATE POLICY "Public read ownership" ON golfer_ownership FOR SELECT USING (true);

-- Write access using anon key (for admin uploads)
-- In production, you'd use a service_role key or auth
CREATE POLICY "Admin write tournaments" ON tournaments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin write entries" ON entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin write ownership" ON golfer_ownership FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Seed tournament schedule
-- ============================================================

INSERT INTO tournaments (id, name, short_name, slug, start_date, end_date, is_major, multiplier, status, current_round, updated_at)
VALUES
  ('masters-2026', 'The Masters', 'Masters', 'masters-2026', '2026-04-09', '2026-04-12', true, 1.25, 'in_progress', 1, NOW()),
  ('rbc-heritage-2026', 'RBC Heritage', 'Heritage', 'rbc-heritage-2026', '2026-04-16', '2026-04-19', false, 1.0, 'upcoming', 0, NULL),
  ('truist-2026', 'Truist Championship', 'Truist', 'truist-2026', '2026-05-07', '2026-05-10', false, 1.0, 'upcoming', 0, NULL),
  ('pga-championship-2026', 'PGA Championship', 'PGA', 'pga-championship-2026', '2026-05-14', '2026-05-17', true, 1.25, 'upcoming', 0, NULL),
  ('charles-schwab-2026', 'Charles Schwab Challenge', 'Schwab', 'charles-schwab-2026', '2026-05-28', '2026-05-31', false, 1.0, 'upcoming', 0, NULL),
  ('rbc-canadian-2026', 'RBC Canadian Open', 'Canadian', 'rbc-canadian-2026', '2026-06-11', '2026-06-14', false, 1.0, 'upcoming', 0, NULL),
  ('us-open-2026', 'U.S. Open', 'US Open', 'us-open-2026', '2026-06-18', '2026-06-21', true, 1.25, 'upcoming', 0, NULL),
  ('travelers-2026', 'Travelers Championship', 'Travelers', 'travelers-2026', '2026-06-25', '2026-06-28', false, 1.0, 'upcoming', 0, NULL),
  ('scottish-open-2026', 'Genesis Scottish Open', 'Scottish', 'scottish-open-2026', '2026-07-09', '2026-07-12', false, 1.0, 'upcoming', 0, NULL),
  ('the-open-2026', 'The Open Championship', 'The Open', 'the-open-2026', '2026-07-16', '2026-07-19', true, 1.25, 'upcoming', 0, NULL)
ON CONFLICT (id) DO NOTHING;
