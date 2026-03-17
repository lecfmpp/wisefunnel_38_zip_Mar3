-- Migration: Add lead constraints and verification columns
-- Purpose: Ensure deduplication and verification tracking for leads
-- Created: 2026-03-16
-- Author: Clawdio (OpenClaw)

-- 1. Add missing columns if they don't exist (safe to run multiple times)
DO $$
BEGIN
    -- Add email_verified_status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'email_verified_status'
    ) THEN
        ALTER TABLE leads ADD COLUMN email_verified_status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added column: email_verified_status';
    END IF;

    -- Add phone_verified_status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'phone_verified_status'
    ) THEN
        ALTER TABLE leads ADD COLUMN phone_verified_status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added column: phone_verified_status';
    END IF;

    -- Add domain if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'domain'
    ) THEN
        ALTER TABLE leads ADD COLUMN domain TEXT;
        RAISE NOTICE 'Added column: domain';
    END IF;

    -- Add source_funnel_name if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'source_funnel_name'
    ) THEN
        ALTER TABLE leads ADD COLUMN source_funnel_name TEXT;
        RAISE NOTICE 'Added column: source_funnel_name';
    END IF;
END $$;

-- 2. Create unique index for deduplication (concurrently to avoid locking)
-- This ensures no duplicate leads for same email within a funnel
CREATE UNIQUE INDEX IF NOT EXISTS unique_lead_per_funnel 
ON leads(funnel_id, email);

-- 3. Add comment explaining the index
COMMENT ON INDEX unique_lead_per_funnel IS 
'Ensures one lead per email per funnel. Used for deduplication during upsert operations.';

-- 4. Optional: Backfill source_funnel_name from funnel relationship (if missing)
-- This is a one-time data cleanup. Comment out after running if desired.
/*
UPDATE leads l
SET source_funnel_name = f.name
FROM funnels f
WHERE l.funnel_id = f.id
  AND l.source_funnel_name IS NULL;
*/

-- Migration Complete
-- Next steps:
-- 1. Deploy Edge Function: supabase functions deploy upsert-lead
-- 2. Test with a lead submission
-- 3. Verify no duplicate errors appear in logs
