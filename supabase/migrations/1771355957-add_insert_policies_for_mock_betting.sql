/*
  # Enable Mock Betting - Add Insert/Update Policies
  
  ## Description
  Allows anonymous users to place bets and create/update profiles for devnet testing.
  
  ## Changes
  1. Add INSERT policy for bets table - anyone can place bets
  2. Add INSERT/UPDATE policy for user_profiles - anyone can create/update profiles
  3. Add UPDATE policy for races - to update pool amounts
  4. Update races with mock onchain_race_id for testing
  
  ## Security Note
  These are permissive policies for devnet testing only.
*/

-- Add INSERT policy for bets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bets'
      AND policyname = 'Anyone can place bets'
  ) THEN
    CREATE POLICY "Anyone can place bets"
      ON bets
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Add INSERT policy for user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      AND policyname = 'Anyone can create profiles'
  ) THEN
    CREATE POLICY "Anyone can create profiles"
      ON user_profiles
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Add UPDATE policy for user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      AND policyname = 'Anyone can update profiles'
  ) THEN
    CREATE POLICY "Anyone can update profiles"
      ON user_profiles
      FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Add UPDATE policy for races (to update pools)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'races'
      AND policyname = 'Anyone can update race pools'
  ) THEN
    CREATE POLICY "Anyone can update race pools"
      ON races
      FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Update races with mock onchain_race_id for testing
UPDATE races SET onchain_race_id = 1, status = 'live' WHERE horse_name = 'Fastnet Rock' AND onchain_race_id IS NULL;
UPDATE races SET onchain_race_id = 2, status = 'live' WHERE horse_name = 'Tiger Roll' AND onchain_race_id IS NULL;
UPDATE races SET onchain_race_id = 3, status = 'upcoming' WHERE horse_name = 'Ruby Walsh' AND onchain_race_id IS NULL;