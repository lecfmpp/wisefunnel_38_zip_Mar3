-- Migration: 003_add_updated_at
-- Date: 2026-03-17
-- Description: Add updated_at and created_at columns to leads table

-- Add updated_at column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE leads ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added column: updated_at';
    END IF;
END $$;

-- Ensure created_at exists (usually auto)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE leads ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added column: created_at';
    END IF;
END $$;
