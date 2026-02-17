/*
  # Add missing columns and update schema
  
  ## Changes
  1. Add missing columns to tables
  2. Drop and recreate leaderboard view
  3. Add indexes
*/

-- Add missing columns to races table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'races' AND column_name = 'onchain_race_id') THEN
    ALTER TABLE races ADD COLUMN onchain_race_id bigint;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'races' AND column_name = 'program_id') THEN
    ALTER TABLE races ADD COLUMN program_id text DEFAULT 'E4tZ3LdiNWq2cNfA4z5o9AYLSFMNtnmVgDD1GLCdMY7d';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'races' AND column_name = 'vault_pda') THEN
    ALTER TABLE races ADD COLUMN vault_pda text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'races' AND column_name = 'settled_at') THEN
    ALTER TABLE races ADD COLUMN settled_at timestamptz;
  END IF;
END $$;

-- Add missing columns to user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'win_count') THEN
    ALTER TABLE user_profiles ADD COLUMN win_count integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE user_profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add missing columns to bets table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bets' AND column_name = 'onchain_race_id') THEN
    ALTER TABLE bets ADD COLUMN onchain_race_id bigint;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bets' AND column_name = 'claimed') THEN
    ALTER TABLE bets ADD COLUMN claimed boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bets' AND column_name = 'claim_signature') THEN
    ALTER TABLE bets ADD COLUMN claim_signature text;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_races_status ON races(status);
CREATE INDEX IF NOT EXISTS idx_bets_user_wallet ON bets(user_wallet);
CREATE INDEX IF NOT EXISTS idx_bets_race_id ON bets(race_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_winnings ON user_profiles(total_winnings DESC);

-- Drop and recreate leaderboard view
DROP VIEW IF EXISTS leaderboard;

CREATE VIEW leaderboard AS
SELECT 
  wallet_address,
  COALESCE(display_name, CONCAT(LEFT(wallet_address, 4), '...', RIGHT(wallet_address, 4))) as display_name,
  total_winnings,
  total_bets,
  COALESCE(win_count, 0) as win_count,
  CASE 
    WHEN total_bets > 0 THEN ROUND((COALESCE(win_count, 0)::decimal / total_bets) * 100)
    ELSE 0
  END as win_rate,
  ROW_NUMBER() OVER (ORDER BY total_winnings DESC) as rank
FROM user_profiles
WHERE total_bets > 0
ORDER BY total_winnings DESC
LIMIT 100;