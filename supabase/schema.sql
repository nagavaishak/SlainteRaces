-- ============================================================
-- Slainte Races — Full Schema Migration
-- Run this in the Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- Enums
CREATE TYPE bet_prediction AS ENUM ('yes', 'no');
CREATE TYPE bet_status     AS ENUM ('active', 'won', 'lost');
CREATE TYPE race_status    AS ENUM ('upcoming', 'live', 'settled');

-- Races table
CREATE TABLE races (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  horse_name      TEXT        NOT NULL,
  track_name      TEXT        NOT NULL,
  question        TEXT        NOT NULL,
  race_time       TIMESTAMPTZ NOT NULL,
  status          TEXT        DEFAULT 'upcoming',
  yes_pool        BIGINT      DEFAULT 0,
  no_pool         BIGINT      DEFAULT 0,
  result          TEXT,
  onchain_race_id INTEGER,
  program_id      TEXT,
  race_pda        TEXT,
  vault_pda       TEXT,
  blinks_url      TEXT,
  settled_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Bets table
CREATE TABLE bets (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_wallet     TEXT        NOT NULL,
  race_id         UUID        REFERENCES races(id),
  onchain_race_id INTEGER,
  prediction      TEXT        NOT NULL,
  amount          BIGINT      NOT NULL,
  status          TEXT        DEFAULT 'active',
  payout          BIGINT,
  tx_signature    TEXT,
  claim_signature TEXT,
  claimed         BOOLEAN     DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE user_profiles (
  wallet_address  TEXT PRIMARY KEY,
  display_name    TEXT,
  total_bets      INTEGER DEFAULT 0,
  total_wagered   BIGINT  DEFAULT 0,
  total_winnings  BIGINT  DEFAULT 0,
  win_count       INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard view
CREATE VIEW leaderboard AS
SELECT
  wallet_address,
  display_name,
  total_bets,
  win_count,
  total_winnings,
  CASE
    WHEN total_bets > 0 THEN ROUND((win_count::NUMERIC / total_bets::NUMERIC) * 100, 2)
    ELSE 0
  END AS win_rate,
  ROW_NUMBER() OVER (ORDER BY total_winnings DESC, win_count DESC) AS rank
FROM user_profiles;

-- Row Level Security
ALTER TABLE races         ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Public policies (wallet-auth; no traditional login)
CREATE POLICY "public_read_races"    ON races         FOR SELECT USING (true);
CREATE POLICY "public_insert_races"  ON races         FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_races"  ON races         FOR UPDATE USING (true);

CREATE POLICY "public_read_bets"     ON bets          FOR SELECT USING (true);
CREATE POLICY "public_insert_bets"   ON bets          FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_bets"   ON bets          FOR UPDATE USING (true);

CREATE POLICY "public_read_profiles"   ON user_profiles FOR SELECT USING (true);
CREATE POLICY "public_insert_profiles" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_profiles" ON user_profiles FOR UPDATE USING (true);

-- Enable Realtime on races and bets
ALTER PUBLICATION supabase_realtime ADD TABLE races;
ALTER PUBLICATION supabase_realtime ADD TABLE bets;
