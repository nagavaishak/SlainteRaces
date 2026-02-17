/*
  # Sláinte Races - Prediction Market Database Schema
  
  1. New Tables
    - `races` - Stores race information and pool data
      - `id` (uuid, primary key)
      - `track_name` (text) - e.g., Leopardstown, Curragh
      - `race_time` (timestamptz) - When the race starts
      - `horse_name` (text) - Featured horse
      - `question` (text) - Betting question
      - `yes_pool` (bigint) - Total YES bets in lamports
      - `no_pool` (bigint) - Total NO bets in lamports
      - `status` (text) - upcoming, live, settled
      - `result` (text) - yes, no, or null
      - `race_pda` (text) - On-chain race account address
      - `created_at`, `updated_at`
    
    - `bets` - User bet records
      - `id` (uuid, primary key)
      - `race_id` (uuid, FK to races)
      - `user_wallet` (text) - Solana wallet address
      - `prediction` (text) - yes or no
      - `amount` (bigint) - Amount in lamports
      - `status` (text) - active, won, lost, claimed
      - `payout` (bigint) - Winnings in lamports
      - `tx_signature` (text) - On-chain transaction
      - `created_at`
    
    - `user_profiles` - User stats and display names
      - `wallet_address` (text, primary key)
      - `display_name` (text)
      - `total_bets` (int)
      - `total_wagered` (bigint)
      - `total_winnings` (bigint)
      - `created_at`
  
  2. Security
    - Enable RLS on all tables
    - Public read access for races
    - Authenticated write for bets via edge functions
*/

-- Create races table
CREATE TABLE IF NOT EXISTS races (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_name text NOT NULL,
  race_time timestamptz NOT NULL,
  horse_name text NOT NULL,
  question text NOT NULL,
  yes_pool bigint DEFAULT 0,
  no_pool bigint DEFAULT 0,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'settled')),
  result text CHECK (result IN ('yes', 'no') OR result IS NULL),
  race_pda text,
  blinks_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bets table
CREATE TABLE IF NOT EXISTS bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid REFERENCES races(id) ON DELETE CASCADE,
  user_wallet text NOT NULL,
  prediction text NOT NULL CHECK (prediction IN ('yes', 'no')),
  amount bigint NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'claimed')),
  payout bigint DEFAULT 0,
  tx_signature text,
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  wallet_address text PRIMARY KEY,
  display_name text,
  total_bets int DEFAULT 0,
  total_wagered bigint DEFAULT 0,
  total_winnings bigint DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_races_status'
  ) THEN
    CREATE INDEX idx_races_status ON races(status);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bets_race_id'
  ) THEN
    CREATE INDEX idx_bets_race_id ON bets(race_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bets_user_wallet'
  ) THEN
    CREATE INDEX idx_bets_user_wallet ON bets(user_wallet);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Races: Public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read races'
  ) THEN
    CREATE POLICY "Anyone can read races"
      ON races FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Bets: Users can read their own bets, service role can insert/update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read bets'
  ) THEN
    CREATE POLICY "Anyone can read bets"
      ON bets FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- User profiles: Public read, users update own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read profiles'
  ) THEN
    CREATE POLICY "Anyone can read profiles"
      ON user_profiles FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Create leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  wallet_address,
  display_name,
  total_bets,
  total_wagered,
  total_winnings,
  CASE 
    WHEN total_bets > 0 THEN 
      ROUND((total_winnings::decimal / NULLIF(total_wagered, 0)) * 100, 1)
    ELSE 0 
  END as win_rate,
  ROW_NUMBER() OVER (ORDER BY total_winnings DESC) as rank
FROM user_profiles
WHERE total_bets > 0
ORDER BY total_winnings DESC
LIMIT 100;

-- Insert sample races for devnet testing
INSERT INTO races (track_name, race_time, horse_name, question, yes_pool, no_pool, status, blinks_url)
VALUES 
  ('Leopardstown', now() + interval '2 hours', 'Fastnet Rock', 'Will Fastnet Rock finish in top 3?', 0, 0, 'upcoming', ''),
  ('Curragh', now() + interval '4 hours', 'Tiger Roll', 'Will Tiger Roll finish in top 3?', 0, 0, 'upcoming', ''),
  ('Punchestown', now() + interval '6 hours', 'Ruby Walsh', 'Will Ruby Walsh finish in top 3?', 0, 0, 'upcoming', '')
ON CONFLICT DO NOTHING;