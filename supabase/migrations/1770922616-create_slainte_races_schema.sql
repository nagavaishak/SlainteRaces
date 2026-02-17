/*
  # Sláinte Races - Database Schema
  
  ## Description
  Creates the complete database schema for the Irish horse racing prediction market.
  
  ## Tables
  1. races - Race information synced from on-chain
  2. bets - User betting records  
  3. user_profiles - User statistics
  
  ## Security
  - RLS enabled with public read access
*/

-- Create enum types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'race_status') THEN
    CREATE TYPE race_status AS ENUM ('upcoming', 'live', 'settled');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bet_status') THEN
    CREATE TYPE bet_status AS ENUM ('active', 'won', 'lost');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bet_prediction') THEN
    CREATE TYPE bet_prediction AS ENUM ('yes', 'no');
  END IF;
END $$;

-- Create races table
CREATE TABLE IF NOT EXISTS races (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onchain_race_id bigint UNIQUE NOT NULL,
  track_name text NOT NULL,
  horse_name text NOT NULL,
  question text NOT NULL,
  race_time timestamptz NOT NULL,
  yes_pool bigint DEFAULT 0,
  no_pool bigint DEFAULT 0,
  status race_status DEFAULT 'upcoming',
  result bet_prediction,
  program_id text NOT NULL,
  race_pda text NOT NULL,
  vault_pda text NOT NULL,
  blinks_url text,
  created_at timestamptz DEFAULT now(),
  settled_at timestamptz
);

-- Create bets table
CREATE TABLE IF NOT EXISTS bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet text NOT NULL,
  race_uuid uuid REFERENCES races(id) ON DELETE CASCADE,
  onchain_race_id bigint NOT NULL,
  prediction bet_prediction NOT NULL,
  amount bigint NOT NULL,
  status bet_status DEFAULT 'active',
  payout bigint,
  tx_signature text,
  claim_signature text,
  claimed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  wallet_address text PRIMARY KEY,
  display_name text,
  total_bets integer DEFAULT 0,
  total_winnings bigint DEFAULT 0,
  total_wagered bigint DEFAULT 0,
  win_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Races are publicly readable') THEN
    CREATE POLICY "Races are publicly readable" ON races FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Bets are publicly readable') THEN
    CREATE POLICY "Bets are publicly readable" ON bets FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'User profiles are publicly readable') THEN
    CREATE POLICY "User profiles are publicly readable" ON user_profiles FOR SELECT USING (true);
  END IF;
END $$;