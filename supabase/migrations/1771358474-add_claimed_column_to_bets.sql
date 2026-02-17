/*
  # Add claimed column to bets table
  
  1. Changes
    - Add `claimed` boolean column (default false) to track if winnings were claimed
    - Add `claim_tx_signature` text column to store the claim transaction signature
  
  2. Purpose
    - Allows users to claim their winnings after a race is settled
    - Prevents double-claiming by tracking claim status
*/

-- Add claimed column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bets'
      AND column_name = 'claimed'
  ) THEN
    ALTER TABLE bets ADD COLUMN claimed boolean DEFAULT false;
  END IF;
END $$;

-- Add claim_tx_signature column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bets'
      AND column_name = 'claim_tx_signature'
  ) THEN
    ALTER TABLE bets ADD COLUMN claim_tx_signature text;
  END IF;
END $$;